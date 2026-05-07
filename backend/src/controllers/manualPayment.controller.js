import crypto from "crypto";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import ManualPaymentMethod from "../models/manualPaymentMethod.model.js";
import ManualPaymentOrder from "../models/manualPaymentOrder.model.js";
import { uploadManualReceipt } from "../lib/cloudinaryupload.js";
import { computeEffectivePrice, MIN_CHECKOUT_PRICE_USD } from "../lib/coursePricing.js";
import { finalizeManualPaymentEnrollment } from "./payment.controller.js";
import { onManualPaymentRejected } from "../services/notification.service.js";

function courseIsOpenForEnrollment(course) {
  return (
    course &&
    course.isDeleted !== true &&
    course.isPublished === true &&
    course.status === "published"
  );
}

function normalizeTxRef(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function buildOrderNumber() {
  const y = new Date().getFullYear();
  const r = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MP-${y}-${r}`;
}

function serializeMethod(m) {
  if (!m) return null;
  return {
    _id: m._id,
    name: m.name,
    accountNumber: m.accountNumber,
    accountHolder: m.accountHolder,
    instructions: m.instructions || "",
    active: m.active,
    sortOrder: m.sortOrder ?? 0,
  };
}

export const getPublicManualPaymentMethods = async (req, res) => {
  try {
    const methods = await ManualPaymentMethod.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return res.json({ methods: methods.map(serializeMethod) });
  } catch (e) {
    console.error("getPublicManualPaymentMethods:", e);
    return res.status(500).json({ message: e.message || "Failed to load methods" });
  }
};

export const getAdminManualPaymentMethods = async (req, res) => {
  try {
    const methods = await ManualPaymentMethod.find().sort({ sortOrder: 1, name: 1 }).lean();
    return res.json({ methods: methods.map(serializeMethod) });
  } catch (e) {
    console.error("getAdminManualPaymentMethods:", e);
    return res.status(500).json({ message: e.message || "Failed to load methods" });
  }
};

export const createManualPaymentMethod = async (req, res) => {
  try {
    const { name, accountNumber, accountHolder, instructions, active, sortOrder } = req.body || {};
    if (!name || !accountNumber || !accountHolder) {
      return res.status(400).json({ message: "name, accountNumber, and accountHolder are required" });
    }
    const doc = await ManualPaymentMethod.create({
      name: String(name).trim(),
      accountNumber: String(accountNumber).trim(),
      accountHolder: String(accountHolder).trim(),
      instructions: instructions != null ? String(instructions) : "",
      active: active !== false,
      sortOrder: Number(sortOrder) || 0,
    });
    return res.status(201).json({ method: serializeMethod(doc.toObject()) });
  } catch (e) {
    console.error("createManualPaymentMethod:", e);
    return res.status(500).json({ message: e.message || "Failed to create method" });
  }
};

export const patchManualPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, accountNumber, accountHolder, instructions, active, sortOrder } = req.body || {};
    const patch = {};
    if (name !== undefined) patch.name = String(name).trim();
    if (accountNumber !== undefined) patch.accountNumber = String(accountNumber).trim();
    if (accountHolder !== undefined) patch.accountHolder = String(accountHolder).trim();
    if (instructions !== undefined) patch.instructions = String(instructions);
    if (active !== undefined) patch.active = Boolean(active);
    if (sortOrder !== undefined) patch.sortOrder = Number(sortOrder) || 0;

    const doc = await ManualPaymentMethod.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: "Method not found" });
    return res.json({ method: serializeMethod(doc) });
  } catch (e) {
    console.error("patchManualPaymentMethod:", e);
    return res.status(500).json({ message: e.message || "Failed to update method" });
  }
};

async function populateOrder(order) {
  const id = order?._id || order;
  if (!id) return null;
  const o = await ManualPaymentOrder.findById(id)
    .populate("student", "name email")
    .populate("course", "title price")
    .populate("paymentMethod");
  if (!o) return null;
  const plain = o.toObject();
  return {
    ...plain,
    paymentMethod: serializeMethod(plain.paymentMethod),
  };
}

export const createManualPaymentOrder = async (req, res) => {
  try {
    const studentId = req.user._id;
    if (req.user?.role !== "student") {
      return res.status(403).json({
        message: "Only student accounts can enroll in courses",
      });
    }
    const { courseId, paymentMethodId } = req.body || {};
    if (!courseId || !paymentMethodId) {
      return res.status(400).json({ message: "courseId and paymentMethodId are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!courseIsOpenForEnrollment(course)) {
      return res.status(400).json({ message: "This course is not available for enrollment" });
    }

    const method = await ManualPaymentMethod.findOne({ _id: paymentMethodId, active: true }).lean();
    if (!method) {
      return res.status(400).json({ message: "Payment method not found or inactive" });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: "active",
    });
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }

    const coursePlain = course.toObject ? course.toObject() : course;
    const { effectivePrice } = computeEffectivePrice(coursePlain);
    if (!Number.isFinite(effectivePrice) || effectivePrice < MIN_CHECKOUT_PRICE_USD) {
      return res.status(400).json({
        message: `Manual checkout requires a price of at least $${MIN_CHECKOUT_PRICE_USD.toFixed(2)}.`,
      });
    }

    const existingOpen = await ManualPaymentOrder.findOne({
      student: studentId,
      course: courseId,
      status: { $in: ["awaiting_proof", "awaiting_verification"] },
    })
      .sort({ createdAt: -1 })
      .exec();

    if (existingOpen) {
      if (String(existingOpen.paymentMethod) !== String(paymentMethodId)) {
        existingOpen.paymentMethod = paymentMethodId;
        existingOpen.amount = effectivePrice;
        await existingOpen.save();
      }
      const populated = await populateOrder(existingOpen);
      return res.status(200).json({ order: populated, reused: true });
    }

    let orderNumber = buildOrderNumber();
    for (let i = 0; i < 5; i++) {
      try {
        const created = await ManualPaymentOrder.create({
          orderNumber,
          student: studentId,
          course: courseId,
          paymentMethod: paymentMethodId,
          amount: effectivePrice,
          currency: "usd",
          status: "awaiting_proof",
          auditLog: [
            {
              at: new Date(),
              actor: studentId,
              action: "create_order",
              details: "Manual payment order created.",
            },
          ],
        });
        const populated = await populateOrder(created);
        return res.status(201).json({ order: populated });
      } catch (err) {
        if (err?.code === 11000) {
          orderNumber = buildOrderNumber();
          continue;
        }
        throw err;
      }
    }
    return res.status(500).json({ message: "Could not allocate order number" });
  } catch (e) {
    console.error("createManualPaymentOrder:", e);
    return res.status(500).json({ message: e.message || "Failed to create order" });
  }
};

export const listMyManualPaymentOrders = async (req, res) => {
  try {
    const studentId = req.user._id;
    const rows = await ManualPaymentOrder.find({ student: studentId })
      .sort({ updatedAt: -1 })
      .populate("course", "title")
      .populate("paymentMethod")
      .lean();

    const orders = rows.map((r) => ({
      ...r,
      paymentMethod: serializeMethod(r.paymentMethod),
    }));

    return res.json({ orders });
  } catch (e) {
    console.error("listMyManualPaymentOrders:", e);
    return res.status(500).json({ message: e.message || "Failed to list orders" });
  }
};

export const getMyManualPaymentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await ManualPaymentOrder.findOne({
      _id: id,
      student: req.user._id,
    }).exec();

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ order: await populateOrder(order) });
  } catch (e) {
    console.error("getMyManualPaymentOrder:", e);
    return res.status(500).json({ message: e.message || "Failed to load order" });
  }
};

export const submitManualPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await ManualPaymentOrder.findOne({
      _id: id,
      student: req.user._id,
    }).exec();

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["awaiting_proof", "rejected"].includes(order.status)) {
      return res.status(400).json({ message: "This order cannot accept proof right now." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Receipt file is required (image or PDF)." });
    }

    const transactionRef = req.body?.transactionRef ?? req.body?.transactionReference;
    const senderName = req.body?.senderName;
    const paymentDate = req.body?.paymentDate;

    const norm = normalizeTxRef(transactionRef);
    if (!norm) {
      return res.status(400).json({ message: "Transaction reference is required." });
    }

    const clash = await ManualPaymentOrder.findOne({
      _id: { $ne: order._id },
      paymentMethod: order.paymentMethod,
      transactionRefNormalized: norm,
      status: { $in: ["awaiting_verification", "approved"] },
    }).lean();

    if (clash) {
      return res.status(409).json({
        message: "This transaction reference is already used for this payment method.",
      });
    }

    if (order.status === "rejected") {
      order.submissionHistory.push({
        transactionRef: order.transactionRef,
        transactionRefNormalized: order.transactionRefNormalized,
        senderName: order.senderName,
        paymentDate: order.paymentDate,
        receiptUrl: order.receiptUrl,
        receiptMimeType: order.receiptMimeType,
        submittedAt: order.submittedAt,
        outcome: "superseded",
        note: order.rejectionReason || "",
      });
    }

    const { url } = await uploadManualReceipt(req.file.path, req.file.mimetype);

    order.transactionRef = String(transactionRef).trim();
    order.transactionRefNormalized = norm;
    order.senderName = String(senderName || "").trim();
    order.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    if (Number.isNaN(order.paymentDate.getTime())) {
      order.paymentDate = new Date();
    }
    order.receiptUrl = url;
    order.receiptMimeType = req.file.mimetype;
    order.submittedAt = new Date();
    order.status = "awaiting_verification";
    order.rejectionReason = "";
    order.rejectedAt = null;
    order.rejectedBy = null;

    order.auditLog.push({
      at: new Date(),
      actor: req.user._id,
      action: "submit_proof",
      details: "Student submitted payment proof for verification.",
    });

    await order.save();
    return res.json({ order: await populateOrder(order) });
  } catch (e) {
    console.error("submitManualPaymentProof:", e);
    return res.status(500).json({ message: e.message || "Failed to submit proof" });
  }
};

export const listAdminManualPaymentOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") {
      if (status === "pending") {
        filter.status = "awaiting_verification";
      } else {
        filter.status = status;
      }
    }

    const rows = await ManualPaymentOrder.find(filter)
      .sort({ submittedAt: -1, updatedAt: -1 })
      .populate("student", "name email")
      .populate("course", "title price")
      .populate("paymentMethod")
      .limit(300)
      .lean();

    const orders = rows.map((r) => ({
      ...r,
      paymentMethod: serializeMethod(r.paymentMethod),
    }));

    return res.json({ orders });
  } catch (e) {
    console.error("listAdminManualPaymentOrders:", e);
    return res.status(500).json({ message: e.message || "Failed to list orders" });
  }
};

export const getAdminManualPaymentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await ManualPaymentOrder.findById(id).exec();
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ order: await populateOrder(order) });
  } catch (e) {
    console.error("getAdminManualPaymentOrder:", e);
    return res.status(500).json({ message: e.message || "Failed to load order" });
  }
};

export const approveManualPaymentOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const pending = await ManualPaymentOrder.findOne({
      _id: id,
      status: "awaiting_verification",
    })
      .populate("student", "name email")
      .populate("course", "title")
      .populate("paymentMethod");

    if (!pending) {
      const existing = await ManualPaymentOrder.findById(id)
        .populate("student", "name email")
        .populate("course", "title price")
        .populate("paymentMethod");
      if (existing?.status === "approved") {
        return res.json({
          order: await populateOrder(existing),
          idempotent: true,
        });
      }
      return res.status(400).json({ message: "Order is not awaiting verification." });
    }

    const fin = await finalizeManualPaymentEnrollment(pending);
    if (!fin.ok) {
      return res.status(400).json({
        message:
          fin.reason === "course_not_available"
            ? "Course is not available for enrollment."
            : fin.reason || "Could not grant access.",
      });
    }

    const updated = await ManualPaymentOrder.findOneAndUpdate(
      { _id: id, status: "awaiting_verification" },
      {
        $set: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: req.user._id,
        },
        $push: {
          auditLog: {
            at: new Date(),
            actor: req.user._id,
            action: "approve",
            details: "Payment verified; enrollment granted.",
          },
        },
      },
      { new: true },
    )
      .populate("student", "name email")
      .populate("course", "title price")
      .populate("paymentMethod");

    if (!updated) {
      const existing = await ManualPaymentOrder.findById(id)
        .populate("student", "name email")
        .populate("course", "title price")
        .populate("paymentMethod");
      return res.json({
        order: await populateOrder(existing),
        idempotent: true,
      });
    }

    return res.json({ order: await populateOrder(updated) });
  } catch (e) {
    console.error("approveManualPaymentOrder:", e);
    return res.status(500).json({ message: e.message || "Approval failed" });
  }
};

export const rejectManualPaymentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const note = reason != null ? String(reason).trim().slice(0, 2000) : "";

    const order = await ManualPaymentOrder.findOneAndUpdate(
      { _id: id, status: "awaiting_verification" },
      {
        $set: {
          status: "rejected",
          rejectionReason: note,
          rejectedAt: new Date(),
          rejectedBy: req.user._id,
        },
        $push: {
          auditLog: {
            at: new Date(),
            actor: req.user._id,
            action: "reject",
            details: note || "Payment proof rejected.",
          },
        },
      },
      { new: true },
    )
      .populate("course", "title")
      .exec();

    if (!order) {
      return res.status(400).json({ message: "Order is not awaiting verification." });
    }

    await onManualPaymentRejected({
      studentId: order.student,
      courseId: order.course,
      orderNumber: order.orderNumber,
      reason: note,
    });

    const full = await ManualPaymentOrder.findById(order._id)
      .populate("student", "name email")
      .populate("course", "title price")
      .populate("paymentMethod");

    return res.json({ order: await populateOrder(full) });
  } catch (e) {
    console.error("rejectManualPaymentOrder:", e);
    return res.status(500).json({ message: e.message || "Rejection failed" });
  }
};

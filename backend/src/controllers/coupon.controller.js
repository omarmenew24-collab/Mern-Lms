import Coupon from "../models/coupon.model.js";
import mongoose from "mongoose";
import {
  normalizeCouponCode,
  validateCouponForCheckout,
} from "../lib/couponCheckout.js";

/** Student: preview pricing for checkout (card or manual). */
export const validateCheckoutCoupon = async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Only student accounts can use checkout coupons." });
    }
    const { courseId, couponCode } = req.body || {};
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }
    const norm = normalizeCouponCode(couponCode);
    if (!norm) {
      return res.status(400).json({ message: "couponCode is required" });
    }
    const v = await validateCouponForCheckout({
      code: norm,
      courseId,
      studentId: req.user._id,
    });
    if (!v.ok) {
      return res.status(400).json({ message: v.message });
    }
    return res.json({
      ok: true,
      code: v.coupon.code,
      listPrice: v.listPrice,
      effectiveAfterPromotion: v.effectiveAfterPromotion,
      promotionActive: v.promotionActive,
      finalPrice: v.finalPrice,
      discountAmount: v.discountAmount,
    });
  } catch (e) {
    console.error("validateCheckoutCoupon:", e);
    return res.status(500).json({ message: e.message || "Validation failed" });
  }
};

export const listAdminCoupons = async (req, res) => {
  try {
    const rows = await Coupon.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ coupons: rows });
  } catch (e) {
    console.error("listAdminCoupons:", e);
    return res.status(500).json({ message: e.message || "Failed to list coupons" });
  }
};

export const createAdminCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      value,
      active,
      maxRedemptions,
      validFrom,
      validUntil,
      courseIds,
      oncePerUser,
    } = req.body || {};

    const norm = normalizeCouponCode(code);
    if (!norm || norm.length < 3) {
      return res.status(400).json({ message: "code must be at least 3 characters" });
    }
    const dt = discountType === "fixed" ? "fixed" : "percent";
    const val = Number(value);
    if (!Number.isFinite(val) || val < 0) {
      return res.status(400).json({ message: "value must be a non-negative number" });
    }
    if (dt === "percent" && val > 100) {
      return res.status(400).json({ message: "percent value cannot exceed 100" });
    }

    let maxRed = null;
    if (maxRedemptions !== null && maxRedemptions !== undefined && maxRedemptions !== "") {
      const n = Math.floor(Number(maxRedemptions));
      if (Number.isFinite(n) && n >= 1) maxRed = n;
    }

    const courses = [];
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      for (const id of courseIds) {
        if (mongoose.isValidObjectId(id)) {
          courses.push(new mongoose.Types.ObjectId(id));
        }
      }
    }

    const doc = await Coupon.create({
      code: norm,
      description: description != null ? String(description).slice(0, 500) : "",
      discountType: dt,
      value: val,
      active: active !== false,
      maxRedemptions: maxRed,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      courseIds: courses,
      oncePerUser: oncePerUser !== false,
    });
    return res.status(201).json({ coupon: doc.toObject() });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(400).json({ message: "A coupon with this code already exists." });
    }
    console.error("createAdminCoupon:", e);
    return res.status(500).json({ message: e.message || "Failed to create coupon" });
  }
};

export const patchAdminCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      discountType,
      value,
      active,
      maxRedemptions,
      validFrom,
      validUntil,
      courseIds,
      oncePerUser,
    } = req.body || {};

    const patch = {};
    if (description !== undefined) patch.description = String(description).slice(0, 500);
    if (discountType !== undefined) {
      patch.discountType = discountType === "fixed" ? "fixed" : "percent";
    }
    if (value !== undefined) {
      const val = Number(value);
      if (!Number.isFinite(val) || val < 0) {
        return res.status(400).json({ message: "Invalid value" });
      }
      patch.value = val;
    }
    if (active !== undefined) patch.active = Boolean(active);
    if (maxRedemptions !== undefined) {
      if (maxRedemptions === null || maxRedemptions === "") {
        patch.maxRedemptions = null;
      } else {
        const n = Math.floor(Number(maxRedemptions));
        patch.maxRedemptions = Number.isFinite(n) && n >= 1 ? n : null;
      }
    }
    if (validFrom !== undefined) {
      patch.validFrom = validFrom ? new Date(validFrom) : null;
    }
    if (validUntil !== undefined) {
      patch.validUntil = validUntil ? new Date(validUntil) : null;
    }
    if (courseIds !== undefined) {
      const arr = Array.isArray(courseIds) ? courseIds : [];
      const courses = [];
      for (const id of arr) {
        if (mongoose.isValidObjectId(id)) {
          courses.push(new mongoose.Types.ObjectId(id));
        }
      }
      patch.courseIds = courses;
    }
    if (oncePerUser !== undefined) patch.oncePerUser = Boolean(oncePerUser);

    const doc = await Coupon.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: "Coupon not found" });
    return res.json({ coupon: doc });
  } catch (e) {
    console.error("patchAdminCoupon:", e);
    return res.status(500).json({ message: e.message || "Failed to update coupon" });
  }
};

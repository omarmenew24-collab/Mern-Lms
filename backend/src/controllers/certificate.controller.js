import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import SiteSettings from "../models/siteSettings.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { uploadCertificatePdfBuffer } from "../lib/cloudinaryupload.js";
import {
  buildCompletionCertificatePdf,
  fetchImageBufferIfUrl,
  allocateUniqueCertificateCode,
} from "../services/certificatePdf.service.js";

const requireCourseTeacherOrAdmin = async (req, courseId, res) => {
  const course = await Course.findById(courseId).select("teacher");
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return null;
  }
  if (req.user?.role === "admin") return course;
  if (
    req.user?.role === "teacher" &&
    course.teacher.toString() === req.user._id.toString()
  ) {
    return course;
  }
  res.status(403).json({ message: "Access denied" });
  return null;
};

function publicAppBaseUrl() {
  const raw =
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173";
  return String(raw).replace(/\/+$/, "");
}

function issuerPayloadFromSite(doc) {
  const d = doc || {};
  const legal =
    typeof d.certificateIssuerLegalName === "string" && d.certificateIssuerLegalName.trim()
      ? d.certificateIssuerLegalName.trim().slice(0, 160)
      : typeof d.siteDisplayName === "string" && d.siteDisplayName.trim()
        ? d.siteDisplayName.trim().slice(0, 48)
        : "CourseAcademy";
  const tagline =
    typeof d.certificateIssuerTagline === "string" ? d.certificateIssuerTagline.trim().slice(0, 240) : "";
  const logoUrl = typeof d.certificateLogoUrl === "string" ? d.certificateLogoUrl.trim() : "";
  const sigUrl = typeof d.certificateSignatureImageUrl === "string" ? d.certificateSignatureImageUrl.trim() : "";
  const signatoryName =
    typeof d.certificateSignatoryName === "string" ? d.certificateSignatoryName.trim().slice(0, 120) : "";
  const signatoryTitle =
    typeof d.certificateSignatoryTitle === "string" ? d.certificateSignatoryTitle.trim().slice(0, 160) : "";
  return { legal, tagline, logoUrl, sigUrl, signatoryName, signatoryTitle };
}

/**
 * GET /api/courses/:courseId/certificate/pdf?studentId=
 * Student: no query (always self). Teacher/admin: studentId required.
 */
export const downloadCourseCertificatePdf = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { courseId } = req.params;
    let targetStudentId;

    if (req.user.role === "student") {
      targetStudentId = req.user._id.toString();
      const enrolled = await Enrollment.exists({
        student: req.user._id,
        course: courseId,
        status: "active",
      });
      if (!enrolled) {
        return res.status(403).json({ message: "Not enrolled in this course" });
      }
    } else if (req.user.role === "teacher" || req.user.role === "admin") {
      const sid = req.query.studentId;
      if (!sid) {
        return res.status(400).json({ message: "studentId query parameter is required" });
      }
      const course = await requireCourseTeacherOrAdmin(req, courseId, res);
      if (!course) return;
      targetStudentId = String(sid);
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const progress = await CourseCompletion.findOne({
      course: courseId,
      student: targetStudentId,
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    if (!progress.certificateApproved) {
      return res.status(403).json({ message: "Certificate is not approved yet" });
    }

    const pct = Math.round(Number(progress.progress) || 0);
    if (pct < 100) {
      return res.status(403).json({ message: "Course must be fully completed (100%) before downloading the certificate" });
    }

    if (progress.certificateRevoked) {
      return res.status(403).json({ message: "This certificate has been revoked" });
    }

    const [student, courseDoc, siteDoc] = await Promise.all([
      User.findById(targetStudentId).select("name").lean(),
      Course.findById(courseId).select("title").lean(),
      SiteSettings.findById("global").lean(),
    ]);

    const studentName = student?.name || "Student";
    const courseTitle = courseDoc?.title || "Course";
    const issueDate = progress.certificateIssuedAt || new Date();
    const issueDateStr = issueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const issuer = issuerPayloadFromSite(siteDoc);

    if (!progress.certificateCode) {
      progress.certificateCode = await allocateUniqueCertificateCode();
      progress.certificateIssuedAt = issueDate;
    }

    const verifyUrl = `${publicAppBaseUrl()}/certificate/verify/${encodeURIComponent(progress.certificateCode)}`;

    const [logoBuffer, signatureBuffer] = await Promise.all([
      issuer.logoUrl ? fetchImageBufferIfUrl(issuer.logoUrl) : Promise.resolve(null),
      issuer.sigUrl ? fetchImageBufferIfUrl(issuer.sigUrl) : Promise.resolve(null),
    ]);

    const pdfBuffer = await buildCompletionCertificatePdf({
      studentName,
      courseTitle,
      issueDateStr,
      certificateCode: progress.certificateCode,
      verifyUrl,
      issuerLegalName: issuer.legal,
      issuerTagline: issuer.tagline,
      signatoryName: issuer.signatoryName,
      signatoryTitle: issuer.signatoryTitle,
      logoBuffer,
      signatureBuffer,
    });

    if (!progress.certificateUrl) {
      try {
        const url = await uploadCertificatePdfBuffer(pdfBuffer);
        progress.certificateUrl = url;
        progress.certificateIssued = true;
        await progress.save();
      } catch (e) {
        console.error("Certificate Cloudinary upload failed:", e?.message || e);
        progress.certificateIssued = true;
        await progress.save();
      }
    } else {
      progress.certificateIssued = true;
      await progress.save();
    }

    const filename = `Certificate-${progress.certificateCode}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadCourseCertificatePdf:", error);
    return res.status(500).json({ message: error.message || "Failed to generate certificate" });
  }
};

const CODE_RE = /^CERT-[A-F0-9]{20}$/i;

/**
 * GET /api/public/certificate-verify/:code
 */
export const verifyCertificatePublic = async (req, res) => {
  try {
    const code = String(req.params.code || "")
      .trim()
      .slice(0, 64);
    if (!CODE_RE.test(code)) {
      return res.status(200).json({ valid: false });
    }

    const completion = await CourseCompletion.findOne({ certificateCode: code })
      .populate("student", "name")
      .populate("course", "title")
      .lean();

    if (!completion) {
      return res.status(200).json({ valid: false });
    }

    const siteDoc = await SiteSettings.findById("global").lean();
    const issuer = issuerPayloadFromSite(siteDoc);

    const issuedAt = completion.certificateIssuedAt || completion.updatedAt || completion.createdAt;
    return res.status(200).json({
      valid: true,
      revoked: Boolean(completion.certificateRevoked),
      certificateCode: completion.certificateCode,
      studentName: completion.student?.name || "—",
      courseTitle: completion.course?.title || "—",
      issuedAt: issuedAt ? new Date(issuedAt).toISOString() : null,
      issuerLegalName: issuer.legal,
    });
  } catch (error) {
    console.error("verifyCertificatePublic:", error);
    return res.status(500).json({ message: error.message || "Verification failed" });
  }
};

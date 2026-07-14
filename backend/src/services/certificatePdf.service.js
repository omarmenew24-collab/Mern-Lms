import PDFDocument from "pdfkit";
import axios from "axios";
import crypto from "crypto";
import CourseCompletion from "../models/courseCompletion.model.js";

/**
 * @param {string} url
 * @returns {Promise<Buffer | null>}
 */
export async function fetchImageBufferIfUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const res = await axios.get(trimmed, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxContentLength: 4 * 1024 * 1024,
      validateStatus: (s) => s === 200,
    });
    const ct = String(res.headers["content-type"] || "").toLowerCase();
    if (!ct.startsWith("image/")) return null;
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

export function newCertificateCode() {
  return `CERT-${crypto.randomBytes(10).toString("hex").toUpperCase()}`;
}

/**
 * @param {import('mongoose').ClientSession} [session]
 */
export async function allocateUniqueCertificateCode(session) {
  for (let i = 0; i < 8; i++) {
    const code = newCertificateCode();
    let q = CourseCompletion.findOne({ certificateCode: code }).select("_id");
    if (session) q = q.session(session);
    const exists = await q.lean();
    if (!exists) return code;
  }
  throw new Error("Could not allocate certificate code");
}

/**
 * @param {{
 *   studentName: string,
 *   courseTitle: string,
 *   issueDateStr: string,
 *   certificateCode: string,
 *   verifyUrl: string,
 *   issuerLegalName: string,
 *   issuerTagline: string,
 *   signatoryName: string,
 *   signatoryTitle: string,
 *   logoBuffer: Buffer | null,
 *   signatureBuffer: Buffer | null,
 * }} opts
 * @returns {Promise<Buffer>}
 */
export function buildCompletionCertificatePdf(opts) {
  const {
    studentName,
    courseTitle,
    issueDateStr,
    certificateCode,
    verifyUrl,
    issuerLegalName,
    issuerTagline,
    signatoryName,
    signatoryTitle,
    logoBuffer,
    signatureBuffer,
  } = opts;

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 44, bottom: 44, left: 48, right: 48 },
      info: {
        Title: "Certificate of completion",
        Author: issuerLegalName || "CourseAcademy",
      },
    });

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const centerX = pageW / 2;
    let y = 36;

    if (logoBuffer) {
      try {
        const lw = 120;
        const lh = 48;
        doc.image(logoBuffer, centerX - lw / 2, y, { width: lw, height: lh, fit: [lw, lh] });
        y += lh + 14;
      } catch {
        y += 8;
      }
    } else {
      doc
        .fontSize(11)
        .fillColor("#6b21a8")
        .font("Helvetica-Bold")
        .text((issuerLegalName || "CourseAcademy").toUpperCase(), 48, y, {
          align: "center",
          width: pageW - 96,
        });
      y += 22;
    }

    doc.fontSize(28).fillColor("#1f2937").font("Helvetica-Bold").text("CERTIFICATE OF COMPLETION", 48, y, {
      align: "center",
      width: pageW - 96,
    });
    y += 36;

    if (issuerTagline) {
      doc.fontSize(10).fillColor("#6b7280").font("Helvetica-Oblique").text(issuerTagline, 48, y, {
        align: "center",
        width: pageW - 96,
      });
      y += 22;
    }

    doc.fontSize(12).fillColor("#4b5563").font("Helvetica").text("This is to certify that", 48, y, {
      align: "center",
      width: pageW - 96,
    });
    y += 22;

    doc.fontSize(22).fillColor("#111827").font("Helvetica-Bold").text(String(studentName || "Student"), 48, y, {
      align: "center",
      width: pageW - 96,
    });
    y += 32;

    doc
      .fontSize(11)
      .fillColor("#4b5563")
      .font("Helvetica")
      .text("has successfully completed the course", 48, y, { align: "center", width: pageW - 96 });
    y += 18;

    doc.fontSize(14).fillColor("#111827").font("Helvetica-Bold").text(`"${String(courseTitle || "").slice(0, 180)}"`, 80, y, {
      align: "center",
      width: pageW - 160,
    });
    y += 52;

    const colGap = 80;
    const leftCol = 72;
    const rightCol = pageW / 2 + colGap / 2;

    doc.fontSize(10).fillColor("#111827").font("Helvetica-Bold").text("Issue date", leftCol, y);
    doc.fontSize(11).font("Helvetica").text(issueDateStr, leftCol, y + 14);

    doc.fontSize(10).font("Helvetica-Bold").text("Issued by", rightCol, y);
    y += 14;
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text(issuerLegalName || "CourseAcademy", rightCol, y, {
      width: pageW / 2 - colGap,
    });
    y += 18;

    const sigY = y;
    if (signatureBuffer) {
      try {
        doc.image(signatureBuffer, rightCol, sigY, { width: 140, height: 48, fit: [140, 48] });
        y = sigY + 52;
      } catch {
        y = sigY;
      }
    } else {
      y = sigY + 8;
    }

    if (signatoryName) {
      doc.fontSize(10).fillColor("#111827").font("Helvetica-Bold").text(signatoryName, rightCol, y);
      y += 14;
    }
    if (signatoryTitle) {
      doc.fontSize(9).fillColor("#6b7280").font("Helvetica").text(signatoryTitle, rightCol, y);
      y += 20;
    }

    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .font("Helvetica")
      .text(`Credential ID: ${certificateCode}`, 48, doc.page.height - 72, { width: pageW - 96, align: "center" });
    doc.fontSize(8).text(`Verify: ${verifyUrl}`, 48, doc.page.height - 58, { width: pageW - 96, align: "center" });

    doc.end();
  });
}

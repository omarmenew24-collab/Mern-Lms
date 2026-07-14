import Coupon from "../models/coupon.model.js";
import CouponRedemption from "../models/couponRedemption.model.js";
import Course from "../models/course.model.js";
import { computeEffectivePrice, MIN_CHECKOUT_PRICE_USD } from "./coursePricing.js";

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function normalizeCouponCode(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Apply coupon discount on top of the course's effective (post-promotion) price.
 */
export function applyCouponToEffectivePrice(effectivePriceMajor, coupon) {
  const base = round2(Number(effectivePriceMajor));
  if (!Number.isFinite(base) || base < 0) {
    return { finalPrice: Number.NaN, discountAmount: 0 };
  }
  if (!coupon || coupon.active === false) {
    return { finalPrice: base, discountAmount: 0 };
  }

  const discountType = coupon.discountType === "fixed" ? "fixed" : "percent";
  const val = Number(coupon.value);
  if (!Number.isFinite(val) || val < 0) {
    return { finalPrice: base, discountAmount: 0 };
  }

  let after = base;
  if (discountType === "percent") {
    const pct = Math.min(100, Math.max(0, val));
    after = round2(base * (1 - pct / 100));
  } else {
    after = round2(Math.max(0, base - val));
  }

  const discountAmount = round2(Math.max(0, base - after));
  return { finalPrice: after, discountAmount };
}

/**
 * @param {object} params
 * @param {string} params.code
 * @param {string} params.courseId
 * @param {string} params.studentId
 * @returns {Promise<{ ok: true, coupon: object, listPrice: number, effectiveAfterPromotion: number, finalPrice: number, discountAmount: number } | { ok: false, message: string }>}
 */
export async function validateCouponForCheckout({ code, courseId, studentId }) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { ok: false, message: "Coupon code is required." };
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return { ok: false, message: "Course not found." };
  }

  const coupon = await Coupon.findOne({ code: normalized, active: true }).lean();
  if (!coupon) {
    return { ok: false, message: "Invalid or inactive coupon." };
  }

  const now = Date.now();
  if (coupon.validFrom) {
    const t = new Date(coupon.validFrom).getTime();
    if (Number.isFinite(t) && t > now) {
      return { ok: false, message: "This coupon is not active yet." };
    }
  }
  if (coupon.validUntil) {
    const t = new Date(coupon.validUntil).getTime();
    if (Number.isFinite(t) && t < now) {
      return { ok: false, message: "This coupon has expired." };
    }
  }

  if (coupon.maxRedemptions != null && Number(coupon.maxRedemptions) > 0) {
    if (Number(coupon.redeemedCount || 0) >= Number(coupon.maxRedemptions)) {
      return { ok: false, message: "This coupon has reached its maximum number of uses." };
    }
  }

  const ids = Array.isArray(coupon.courseIds) ? coupon.courseIds : [];
  if (ids.length > 0) {
    const allowed = ids.some((id) => String(id) === String(courseId));
    if (!allowed) {
      return { ok: false, message: "This coupon does not apply to this course." };
    }
  }

  if (coupon.oncePerUser !== false) {
    const prior = await CouponRedemption.exists({
      coupon: coupon._id,
      student: studentId,
    });
    if (prior) {
      return { ok: false, message: "You have already used this coupon." };
    }
  }

  const { listPrice, effectivePrice, promotionActive } = computeEffectivePrice(course);
  if (!Number.isFinite(effectivePrice)) {
    return { ok: false, message: "This course does not have a valid price for checkout." };
  }

  const { finalPrice, discountAmount } = applyCouponToEffectivePrice(effectivePrice, coupon);
  if (!Number.isFinite(finalPrice)) {
    return { ok: false, message: "Invalid price after coupon." };
  }
  if (course.isFree === true && effectivePrice === 0) {
    return {
      ok: true,
      coupon,
      listPrice,
      effectiveAfterPromotion: effectivePrice,
      promotionActive,
      finalPrice: 0,
      discountAmount: 0,
    };
  }
  if (finalPrice < MIN_CHECKOUT_PRICE_USD) {
    return {
      ok: false,
      message: `The discounted price would be below the minimum checkout amount ($${MIN_CHECKOUT_PRICE_USD.toFixed(2)}).`,
    };
  }

  return {
    ok: true,
    coupon,
    listPrice,
    effectiveAfterPromotion: effectivePrice,
    promotionActive,
    finalPrice,
    discountAmount,
  };
}

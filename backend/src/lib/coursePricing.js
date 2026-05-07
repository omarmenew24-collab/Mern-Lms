/**
 * `price` = list/regular. Optional `promotion` applies a discount (admin-only in API).
 * Card checkout uses effective price; amount is always computed server-side.
 */

export const MIN_CHECKOUT_PRICE_USD = 0.5;

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * @param {object} course - plain object with `price` and optional `promotion`
 */
export function computeEffectivePrice(course) {
  const listPrice = round2(Number(course?.price));
  if (!Number.isFinite(listPrice) || listPrice < 0) {
    return { listPrice: Number.NaN, effectivePrice: Number.NaN, promotionActive: false };
  }

  const p = course?.promotion;
  if (!p || p.enabled !== true) {
    return { listPrice, effectivePrice: listPrice, promotionActive: false };
  }

  const now = Date.now();
  if (p.startsAt) {
    const t = new Date(p.startsAt).getTime();
    if (Number.isFinite(t) && t > now) {
      return { listPrice, effectivePrice: listPrice, promotionActive: false };
    }
  }
  if (p.endsAt) {
    const t = new Date(p.endsAt).getTime();
    if (Number.isFinite(t) && t < now) {
      return { listPrice, effectivePrice: listPrice, promotionActive: false };
    }
  }

  const discountType = p.discountType === "fixed" ? "fixed" : "percent";
  const val = Number(p.value);
  if (!Number.isFinite(val) || val < 0) {
    return { listPrice, effectivePrice: listPrice, promotionActive: false };
  }

  let effective;
  if (discountType === "percent") {
    const pct = Math.min(100, Math.max(0, val));
    effective = listPrice * (1 - pct / 100);
  } else {
    effective = Math.max(0, listPrice - val);
  }
  effective = round2(effective);
  const promotionActive = effective < listPrice - 1e-9;
  return {
    listPrice,
    effectivePrice: promotionActive ? effective : listPrice,
    promotionActive,
  };
}

/**
 * @returns {{ promotion: object } | { error: string }}
 */
export function parsePromotionInput(body) {
  const raw = body?.promotionEnabled;
  const enabled = raw === true || raw === "true" || raw === "1";

  const discountType = body?.promotionType === "fixed" ? "fixed" : "percent";
  const valueRaw = body?.promotionValue;
  const value =
    valueRaw === undefined || valueRaw === null || valueRaw === ""
      ? 0
      : Number(valueRaw);
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Invalid promotion value" };
  }

  let startsAt = null;
  const s = body?.promotionStartsAt;
  if (s != null && String(s).trim() !== "") {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return { error: "Invalid promotion start date" };
    startsAt = d;
  }

  let endsAt = null;
  const e = body?.promotionEndsAt;
  if (e != null && String(e).trim() !== "") {
    const d = new Date(e);
    if (Number.isNaN(d.getTime())) return { error: "Invalid promotion end date" };
    endsAt = d;
  }

  if (startsAt && endsAt && startsAt.getTime() >= endsAt.getTime()) {
    return { error: "Promotion end must be after start" };
  }

  return {
    promotion: {
      enabled,
      discountType,
      value,
      startsAt,
      endsAt,
    },
  };
}

/**
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateCheckoutPrice(listPrice, promotion) {
  const { effectivePrice } = computeEffectivePrice({ price: listPrice, promotion });
  if (!Number.isFinite(effectivePrice)) {
    return { ok: false, message: "Invalid price" };
  }
  if (effectivePrice < MIN_CHECKOUT_PRICE_USD) {
    return {
      ok: false,
      message: `Card checkout requires an effective price of at least $${MIN_CHECKOUT_PRICE_USD.toFixed(2)}. Turn off the promotion or set a lower discount.`,
    };
  }
  return { ok: true };
}

export function attachPricingToCourseDoc(course) {
  const plain =
    course && typeof course.toObject === "function" ? course.toObject() : { ...course };
  const { listPrice, effectivePrice, promotionActive } = computeEffectivePrice(plain);
  return { ...plain, listPrice, effectivePrice, promotionActive };
}

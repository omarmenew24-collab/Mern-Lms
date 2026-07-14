import mongoose from "mongoose";

const aboutPageBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["heading", "paragraph", "bullets", "image", "split"],
      required: true,
    },
    heading: { type: String, default: "" },
    text: { type: String, default: "" },
    title: { type: String, default: "" },
    items: { type: [String], default: undefined },
    imageUrl: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { _id: false },
);

const whyLearnCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    desc: { type: String, default: "", maxlength: 2000 },
    icon: { type: String, default: "sparkles" },
    color: { type: String, default: "brand" },
  },
  { _id: false },
);

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },
    /** When true, only admins and the course’s instructor can post or reply. */
    commentsGloballyDisabled: { type: Boolean, default: false },
    /** When true, learners cannot submit/update star ratings on any course. */
    ratingsGloballyDisabled: { type: Boolean, default: false },
    /** Header logo text & browser title base (single-tenant branding). */
    siteDisplayName: { type: String, default: "", maxlength: 48 },
    /** Home hero — editable marketing strip */
    heroBadgeText: { type: String, default: "", maxlength: 120 },
    heroTitleLine1: { type: String, default: "", maxlength: 120 },
    heroTitleHighlight: { type: String, default: "", maxlength: 80 },
    heroSubtitle: { type: String, default: "", maxlength: 600 },
    heroImageUrl: { type: String, default: "", maxlength: 500 },
    heroPrimaryCtaLabel: { type: String, default: "", maxlength: 40 },
    heroSecondaryCtaLabel: { type: String, default: "", maxlength: 40 },
    heroTrustLine1: { type: String, default: "", maxlength: 80 },
    heroTrustLine2: { type: String, default: "", maxlength: 80 },
    heroTrustLine3: { type: String, default: "", maxlength: 80 },
    /** Home stats strip (students, courses, etc.) under the hero. */
    homePlatformStatsEnabled: { type: Boolean, default: true },
    /** Certificate PDF — issuer & signatory (URLs validated like hero image). */
    certificateIssuerLegalName: { type: String, default: "", maxlength: 160 },
    certificateIssuerTagline: { type: String, default: "", maxlength: 240 },
    certificateLogoUrl: { type: String, default: "", maxlength: 500 },
    certificateSignatureImageUrl: { type: String, default: "", maxlength: 500 },
    certificateSignatoryName: { type: String, default: "", maxlength: 120 },
    certificateSignatoryTitle: { type: String, default: "", maxlength: 160 },
    /** Shown to everyone on the home page (empty = off). */
    homeAnnouncement: { type: String, default: "", maxlength: 400 },
    /** Public About page — heading (admin-editable). */
    aboutPageTitle: { type: String, default: "", maxlength: 200 },
    /** Public About page — main copy; used when aboutPageBlocks is empty. */
    aboutPageBody: { type: String, default: "", maxlength: 20000 },
    /** Public About page — structured sections (admin only). */
    aboutPageBlocks: {
      type: [aboutPageBlockSchema],
      default: undefined,
      validate: {
        validator: (a) => !a || a.length <= 40,
        message: "At most 40 About blocks",
      },
    },
    /** Home "Why learn" — heading, subtitle, feature cards. */
    whyLearnTitle: { type: String, default: "", maxlength: 200 },
    whyLearnTitleHighlight: { type: String, default: "", maxlength: 120 },
    whyLearnSubtitle: { type: String, default: "", maxlength: 500 },
    whyLearnCards: {
      type: [whyLearnCardSchema],
      default: undefined,
      validate: {
        validator: (a) => !a || a.length <= 20,
        message: "At most 20 Why learn cards",
      },
    },
    /** Edited by admins; merged into course category pickers site-wide. */
    platformCourseCategories: {
      type: [String],
      default: undefined,
      validate: {
        validator: (a) => !a || a.length <= 100,
        message: "At most 100 global categories",
      },
    },
    /** Platform-wide refund policy (admin). */
    refundsEnabled: { type: Boolean, default: false },
    refundWindowDays: { type: Number, default: 14, min: 1, max: 365 },
    maxCompletionPercentForRefund: { type: Number, default: 20, min: 0, max: 100 },
    /** Max % of the purchase price that a single refund can return (1–100). */
    refundPercent: { type: Number, default: 100, min: 1, max: 100 },
    refundAutoApprove: { type: Boolean, default: false },
    refundReasonRequired: { type: Boolean, default: true },
    /** Optional marketing copy: money-back guarantee (separate from refund automation). */
    moneyBackGuaranteeEnabled: { type: Boolean, default: false },
    moneyBackGuaranteeTitle: { type: String, default: "", maxlength: 120 },
    moneyBackGuaranteeBody: { type: String, default: "", maxlength: 600 },
    moneyBackGuaranteeLinkUrl: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true, collection: "sitesettings" },
);

export default mongoose.model("SiteSettings", siteSettingsSchema);

import mongoose from "mongoose";

const manualPaymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountHolder: { type: String, required: true, trim: true },
    instructions: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("ManualPaymentMethod", manualPaymentMethodSchema);

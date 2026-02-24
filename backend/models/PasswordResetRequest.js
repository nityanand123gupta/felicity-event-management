const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    adminComment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    generatedPassword: {
      type: String,
    },

    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PasswordResetRequest",
  passwordResetSchema
);
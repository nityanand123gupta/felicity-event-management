const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Normal event form responses
    formResponses: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Merchandise variant details
    variant: {
      size: { type: String, trim: true },
      color: { type: String, trim: true },
    },

    // Payment information
    paymentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "not_required",
      index: true,
    },

    paymentProofUrl: {
      type: String,
      trim: true,
    },

    // Ticket information
    ticketId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    qrCode: {
      type: String,
    },

    // Attendance tracking
    attendanceStatus: {
      type: Boolean,
      default: false,
      index: true,
    },

    attendanceTimestamp: {
      type: Date,
    },

    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    attendanceMethod: {
      type: String,
      enum: ["scan", "manual"],
    },

    attendanceAuditNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Registration state
    status: {
      type: String,
      enum: ["registered", "cancelled", "rejected"],
      default: "registered",
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate registration per event per participant
registrationSchema.index(
  { eventId: 1, participantId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
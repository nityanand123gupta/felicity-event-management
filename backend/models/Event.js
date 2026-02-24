const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    fieldType: {
      type: String,
      enum: ["text", "number", "dropdown", "checkbox", "file"],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    options: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const merchandiseVariantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    type: {
      type: String,
      enum: ["normal", "merchandise"],
      required: true,
      index: true,
    },

    eligibility: {
      type: String,
      required: true,
      trim: true,
    },

    registrationDeadline: {
      type: Date,
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    registrationLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? tags.map((tag) => tag.trim().toLowerCase())
          : [],
    },

    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed"],
      default: "draft",
      index: true,
    },

    formFields: {
      type: [formFieldSchema],
      default: [],
    },

    formLocked: {
      type: Boolean,
      default: false,
    },

    merchandiseDetails: {
      purchaseLimitPerUser: {
        type: Number,
        default: 1,
        min: 1,
      },

      variants: {
        type: [merchandiseVariantSchema],
        default: [],
      },
    },

    totalRegistrations: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
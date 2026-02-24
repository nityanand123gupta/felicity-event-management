const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic fields

    firstName: {
      type: String,
      required: function () {
        return this.role === "participant";
      },
      trim: true,
      maxlength: 100,
    },

    lastName: {
      type: String,
      required: function () {
        return this.role === "participant";
      },
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["participant", "organizer", "admin"],
      required: true,
      index: true,
    },

    // Participant fields

    participantType: {
      type: String,
      enum: ["IIIT", "Non-IIIT"],
      required: function () {
        return this.role === "participant";
      },
    },

    collegeOrOrg: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    contactNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    interests: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? arr.map((i) => i.trim().toLowerCase())
          : [],
    },

    followedOrganizers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    // Organizer fields

    organizerName: {
      type: String,
      required: function () {
        return this.role === "organizer";
      },
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      required: function () {
        return this.role === "organizer";
      },
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: function () {
        return this.role === "organizer";
      },
      trim: true,
      maxlength: 5000,
    },

    contactEmail: {
      type: String,
      required: function () {
        return this.role === "organizer";
      },
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid contact email"],
    },

    discordWebhook: {
      type: String,
      default: "",
      trim: true,
    },

    // System fields

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
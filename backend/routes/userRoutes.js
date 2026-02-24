const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
  changePassword,
  createOrganizer,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  getAllOrganizers,
  followOrganizer,
  unfollowOrganizer,
  getOrganizerDetail,
  requestPasswordReset,
  getAllPasswordResetRequests,
  handlePasswordReset,
  getOrganizerResetHistory,
} = require("../controllers/userController");

/* ================= PROFILE ================= */

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

/* ================= ADMIN ================= */

// Create organizer
router.post(
  "/create-organizer",
  protect,
  authorizeRoles("admin"),
  createOrganizer
);

// Disable organizer
router.put(
  "/disable-organizer/:organizerId",
  protect,
  authorizeRoles("admin"),
  disableOrganizer
);

// Enable organizer
router.put(
  "/enable-organizer/:organizerId",
  protect,
  authorizeRoles("admin"),
  enableOrganizer
);

// Permanently delete organizer
router.delete(
  "/delete-organizer/:organizerId",
  protect,
  authorizeRoles("admin"),
  deleteOrganizer
);

// Get all organizers (admin view)
router.get(
  "/admin/organizers",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    const User = require("../models/User");

    const organizers = await User.find({ role: "organizer" })
      .select("organizerName contactEmail isActive category");

    res.json(organizers);
  }
);

/* ================= PASSWORD RESET ================= */

// Organizer reset history
router.get(
  "/password-reset-history",
  protect,
  authorizeRoles("organizer"),
  getOrganizerResetHistory
);

// Organizer submits reset request
router.post(
  "/password-reset-request",
  protect,
  authorizeRoles("organizer"),
  requestPasswordReset
);

// Admin view all reset requests
router.get(
  "/password-reset-requests",
  protect,
  authorizeRoles("admin"),
  getAllPasswordResetRequests
);

// Admin approve/reject reset
router.put(
  "/password-reset/:id",
  protect,
  authorizeRoles("admin"),
  handlePasswordReset
);

/* ================= ORGANIZER LISTING ================= */

// Participant view active organizers
router.get(
  "/organizers",
  protect,
  authorizeRoles("participant"),
  getAllOrganizers
);

// Organizer detail view
router.get(
  "/organizer/:id",
  protect,
  getOrganizerDetail
);

/* ================= FOLLOW SYSTEM ================= */

router.put(
  "/follow/:organizerId",
  protect,
  authorizeRoles("participant"),
  followOrganizer
);

router.put(
  "/unfollow/:organizerId",
  protect,
  authorizeRoles("participant"),
  unfollowOrganizer
);

module.exports = router;
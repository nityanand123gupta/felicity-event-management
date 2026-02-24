const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markAsRead,
} = require("../controllers/notificationController");

// Get logged-in user's notifications
router.get("/", protect, getMyNotifications);

// Mark notification as read
router.put("/:id/read", protect, markAsRead);

module.exports = router;
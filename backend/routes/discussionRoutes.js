const express = require("express");
const router = express.Router();

const {
  postMessage,
  postAnnouncement,
  getMessages,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
} = require("../controllers/discussionController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

/*
Important:
Specific routes must be defined before dynamic routes.
*/

// Organizer announcement
router.post(
  "/announcement/:eventId",
  protect,
  authorizeRoles("organizer"),
  postAnnouncement
);

// Pin / Unpin message
router.put(
  "/pin/:messageId",
  protect,
  authorizeRoles("organizer"),
  togglePinMessage
);

// Delete message
router.delete(
  "/:messageId",
  protect,
  authorizeRoles("organizer"),
  deleteMessage
);

// Toggle reaction
router.put(
  "/reaction/:messageId",
  protect,
  authorizeRoles("participant", "organizer"),
  toggleReaction
);

// Get messages for an event
router.get(
  "/:eventId",
  protect,
  getMessages
);

// Post message to event discussion
router.post(
  "/:eventId",
  protect,
  authorizeRoles("participant", "organizer"),
  postMessage
);

module.exports = router;
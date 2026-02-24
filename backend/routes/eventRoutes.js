const express = require("express");
const router = express.Router();

const {
  getEvents,
  createEvent,
  publishEvent,
  registerForEvent,
  getMyRegistrations,
  placeMerchandiseOrder,
  updateMerchandiseOrderStatus,
  manualAttendanceOverride,
  markAttendance,
  getOrganizerDashboard,
  exportAttendanceCSV,
  exportEventToCalendar,
  getEventById,
  getMyEvents,
  editEvent,
  getEventAnalytics,
  cancelRegistration,
  getAdminAnalytics,
  deleteEvent
} = require("../controllers/eventController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


// ================= BASE ROUTE =================

// Browse events
router.get("/", protect, getEvents);



// ================= ADMIN ROUTES =================

// Platform analytics
router.get(
  "/admin/analytics",
  protect,
  authorizeRoles("admin"),
  getAdminAnalytics
);



// ================= PARTICIPANT ROUTES =================

// View registration history
router.get(
  "/my-registrations",
  protect,
  authorizeRoles("participant"),
  getMyRegistrations
);

// Register for normal event
router.post(
  "/register/:eventId",
  protect,
  authorizeRoles("participant"),
  registerForEvent
);

// Merchandise purchase
router.post(
  "/merchandise/:eventId",
  protect,
  authorizeRoles("participant"),
  upload.single("paymentProof"),
  placeMerchandiseOrder
);

// Cancel registration
router.put(
  "/cancel/:registrationId",
  protect,
  authorizeRoles("participant"),
  cancelRegistration
);

// Add to calendar
router.get(
  "/calendar/:eventId",
  protect,
  authorizeRoles("participant"),
  exportEventToCalendar
);



// ================= ORGANIZER ROUTES =================

// Organizer dashboard
router.get(
  "/organizer/dashboard",
  protect,
  authorizeRoles("organizer"),
  getOrganizerDashboard
);

// Organizer's events
router.get(
  "/organizer/my-events",
  protect,
  authorizeRoles("organizer"),
  getMyEvents
);

// Create draft
router.post(
  "/",
  protect,
  authorizeRoles("organizer"),
  createEvent
);

// Publish event
router.put(
  "/publish/:eventId",
  protect,
  authorizeRoles("organizer"),
  publishEvent
);

// Approve/reject merchandise order
router.put(
  "/merchandise/order/:registrationId",
  protect,
  authorizeRoles("organizer"),
  updateMerchandiseOrderStatus
);

// QR attendance scan
router.post(
  "/attendance/scan",
  protect,
  authorizeRoles("organizer"),
  markAttendance
);

// Event analytics
router.get(
  "/analytics/:eventId",
  protect,
  authorizeRoles("organizer"),
  getEventAnalytics
);

// Export attendance CSV
router.get(
  "/attendance/export/:eventId",
  protect,
  authorizeRoles("organizer"),
  exportAttendanceCSV
);

// Edit event
router.put(
  "/edit/:eventId",
  protect,
  authorizeRoles("organizer"),
  editEvent
);

// Manual attendance override
router.put(
  "/attendance/manual/:registrationId",
  protect,
  authorizeRoles("organizer"),
  manualAttendanceOverride
);

// ================= SHARED ROUTES =================

// Get event details
router.get(
  "/details/:eventId",
  protect,
  getEventById
);

// Delete draft event
router.delete(
  "/:eventId",
  protect,
  authorizeRoles("organizer"),
  deleteEvent
);

module.exports = router;
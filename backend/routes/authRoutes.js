const express = require("express");
const router = express.Router();

const {
  registerParticipant,
  loginUser,
} = require("../controllers/authController");

// Participant registration
router.post("/register", registerParticipant);

// Login (all roles)
router.post("/login", loginUser);

module.exports = router;
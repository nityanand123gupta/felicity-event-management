const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Create default admin if not exists
const createAdminIfNotExists = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (!existingAdmin) {
      if (!process.env.ADMIN_PASSWORD) {
        throw new Error("ADMIN_PASSWORD not set");
      }

      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      await User.create({
        email: "admin@felicity.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("Admin account created");
    }
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exit(1);
  }
};

// Register participant
const registerParticipant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeOrOrg,
      contactNumber,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !participantType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Validate IIIT email
  if (participantType === "IIIT") {
  const allowedDomains = [
    "@iiit.ac.in",
    "@students.iiit.ac.in",
    "@research.iiit.ac.in"
  ];

  const isValidDomain = allowedDomains.some(domain =>
    email.endsWith(domain)
  );

  if (!isValidDomain) {
    return res.status(400).json({
      message:
        "IIIT participants must use an official IIIT email ID"
    });
  }
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "participant",
      participantType,
      collegeOrOrg,
      contactNumber,
      isActive: true,
    });

    return res.status(201).json({
      message: "Participant registered successfully",
      userId: newUser._id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Login (all roles)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is disabled. Contact admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAdminIfNotExists,
  registerParticipant,
  loginUser,
};
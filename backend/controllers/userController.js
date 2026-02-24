const User = require("../models/User");
const Event = require("../models/Event");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/emailService");


// ====================== GET PROFILE ======================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== UPDATE PROFILE ======================
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // -------- PARTICIPANT --------
    if (user.role === "participant") {
      const {
        firstName,
        lastName,
        contactNumber,
        collegeOrOrg,
        interests,
        followedOrganizers,
      } = req.body;

      user.firstName = firstName ?? user.firstName;
      user.lastName = lastName ?? user.lastName;
      user.contactNumber = contactNumber ?? user.contactNumber;
      user.collegeOrOrg = collegeOrOrg ?? user.collegeOrOrg;

      if (interests) user.interests = interests;
      if (followedOrganizers) user.followedOrganizers = followedOrganizers;
    }

    // -------- ORGANIZER --------
    if (user.role === "organizer") {
      const {
        organizerName,
        category,
        description,
        contactEmail,
        contactNumber,
        discordWebhook,
      } = req.body;

      user.organizerName = organizerName ?? user.organizerName;
      user.category = category ?? user.category;
      user.description = description ?? user.description;
      user.contactEmail = contactEmail ?? user.contactEmail;
      user.contactNumber = contactNumber ?? user.contactNumber;

      if (typeof discordWebhook === "string") {
        user.discordWebhook = discordWebhook.trim();
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select("-password");

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== CHANGE PASSWORD ======================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields required" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};


// ====================== ADMIN CREATE ORGANIZER ======================
const createOrganizer = async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail } = req.body;

    const generatedEmail =
      organizerName.toLowerCase().replace(/\s+/g, "") + "@felicity.com";

    const existing = await User.findOne({ email: generatedEmail });
    if (existing)
      return res.status(400).json({ message: "Organizer already exists" });

    const generatedPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const organizer = await User.create({
      email: generatedEmail,
      password: hashedPassword,
      role: "organizer",
      organizerName,
      category,
      description,
      contactEmail,
      isActive: true,
    });

    return res.status(201).json({
      message: "Organizer created successfully",
      organizerId: organizer._id,
      generatedEmail,
      generatedPassword,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== ENABLE / DISABLE ORGANIZER ======================
const disableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.organizerId);
    if (!organizer || organizer.role !== "organizer")
      return res.status(404).json({ message: "Organizer not found" });

    organizer.isActive = false;
    await organizer.save();

    return res.json({ message: "Organizer disabled successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const enableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.organizerId);
    if (!organizer || organizer.role !== "organizer")
      return res.status(404).json({ message: "Organizer not found" });

    organizer.isActive = true;
    await organizer.save();

    return res.json({ message: "Organizer enabled successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== DELETE ORGANIZER ======================
const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.organizerId);
    if (!organizer || organizer.role !== "organizer")
      return res.status(404).json({ message: "Organizer not found" });

    await organizer.deleteOne();
    return res.json({ message: "Organizer permanently deleted" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== FOLLOW / UNFOLLOW ======================
const followOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.organizerId);
    if (!organizer || organizer.role !== "organizer" || !organizer.isActive)
      return res.status(404).json({ message: "Organizer not found" });

    const user = await User.findById(req.user._id);

    const alreadyFollowing = user.followedOrganizers.some(
      id => id.toString() === organizer._id.toString()
    );

    if (alreadyFollowing)
      return res.status(400).json({ message: "Already following" });

    user.followedOrganizers.push(organizer._id);
    await user.save();

    return res.json({ message: "Organizer followed successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const unfollowOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.followedOrganizers = user.followedOrganizers.filter(
      id => id.toString() !== req.params.organizerId
    );

    await user.save();
    return res.json({ message: "Organizer unfollowed successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ====================== GET ALL ORGANIZERS ======================
const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({
      role: "organizer",
      isActive: true,
    }).select("organizerName category description contactEmail");

    const user = await User.findById(req.user._id);

    const result = organizers.map(org => ({
      ...org._doc,
      isFollowed: user.followedOrganizers.some(
        id => id.toString() === org._id.toString()
      ),
    }));

    return res.json(result);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== ORGANIZER DETAIL ======================
const getOrganizerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id).select(
      "organizerName category description contactEmail"
    );

    if (!organizer)
      return res.status(404).json({ message: "Organizer not found" });

    const now = new Date();

    const upcomingEvents = await Event.find({
      organizerId: id,
      startDate: { $gte: now },
      status: { $in: ["published", "ongoing"] },
    });

    const pastEvents = await Event.find({
      organizerId: id,
      endDate: { $lt: now },
    });

    return res.json({ organizer, upcomingEvents, pastEvents });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};


// ====================== PASSWORD RESET REQUEST ======================
const requestPasswordReset = async (req, res) => {
  try {
    if (req.user.role !== "organizer")
      return res.status(403).json({ message: "Unauthorized" });

    const { reason } = req.body;
    if (!reason)
      return res.status(400).json({ message: "Reason is required" });

    const existing = await PasswordResetRequest.findOne({
      organizerId: req.user._id,
      status: "pending",
    });

    if (existing)
      return res.status(400).json({ message: "Pending request already exists" });

    const request = await PasswordResetRequest.create({
      organizerId: req.user._id,
      reason,
    });

    return res.json({ message: "Password reset request submitted", request });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};


// ====================== ORGANIZER RESET HISTORY ======================
const getOrganizerResetHistory = async (req, res) => {
  try {
    if (req.user.role !== "organizer")
      return res.status(403).json({ message: "Unauthorized" });

    const history = await PasswordResetRequest.find({
      organizerId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json(history);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ====================== ADMIN GET RESET REQUESTS ======================
const getAllPasswordResetRequests = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized" });

    const filter = req.query.status ? { status: req.query.status } : {};

    const requests = await PasswordResetRequest.find(filter)
      .populate("organizerId", "organizerName email")
      .sort({ createdAt: -1 });

    return res.json(requests);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};


// ====================== ADMIN HANDLE RESET ======================
const handlePasswordReset = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized" });

    const { action, adminComment } = req.body;
    const { id } = req.params;

    const request = await PasswordResetRequest.findById(id)
      .populate("organizerId");

    if (!request)
      return res.status(404).json({ message: "Request not found" });

    if (request.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    // -------- APPROVE --------
    if (action === "approve") {
      const newPassword = Math.random().toString(36).slice(-10);
      request.organizerId.password = await bcrypt.hash(newPassword, 10);
      await request.organizerId.save();

      request.status = "approved";
      request.generatedPassword = newPassword;
      request.adminComment = adminComment || "Approved";
      request.processedAt = new Date();
      await request.save();

      await sendEmail({
        to: request.organizerId.email,
        subject: "Password Reset Approved - Felicity",
        html: `
          <h2>Password Reset Approved</h2>
          <p>Your new password:</p>
          <h3>${newPassword}</h3>
          <p>Please login and change it immediately.</p>
        `,
      });

      return res.json({ message: "Password reset approved" });
    }

    // -------- REJECT --------
    if (action === "reject") {
      request.status = "rejected";
      request.adminComment = adminComment || "Rejected";
      request.processedAt = new Date();
      await request.save();

      return res.json({ message: "Request rejected" });
    }

    return res.status(400).json({ message: "Invalid action" });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};


// ====================== EXPORTS ======================
module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  createOrganizer,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  followOrganizer,
  unfollowOrganizer,
  getAllOrganizers,
  getOrganizerDetail,
  requestPasswordReset,
  getAllPasswordResetRequests,
  handlePasswordReset,
  getOrganizerResetHistory,
};
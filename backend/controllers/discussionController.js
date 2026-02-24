const DiscussionMessage = require("../models/DiscussionMessage");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");

// Post message (threaded + real-time + notifications)
const postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, parentMessageId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Participant must be registered
    if (req.user.role === "participant") {
      const isRegistered = await Registration.findOne({
        eventId,
        participantId: req.user._id,
        status: "registered",
      });

      if (!isRegistered) {
        return res.status(403).json({
          message: "Only registered participants can post",
        });
      }
    }

    // Validate parent message
    if (parentMessageId) {
      const parent = await DiscussionMessage.findById(parentMessageId);

      if (!parent || parent.eventId.toString() !== eventId.toString()) {
        return res.status(400).json({
          message: "Invalid parent message",
        });
      }
    }

    const newMessage = await DiscussionMessage.create({
      eventId,
      userId: req.user._id,
      message,
      parentMessageId: parentMessageId || null,
    });

    const populatedMessage = await newMessage.populate(
      "userId",
      "firstName lastName organizerName role"
    );

    // Notify other registered participants
    const registrations = await Registration.find({
      eventId,
      status: "registered",
    }).select("participantId");

    const recipients = registrations
      .map((r) => r.participantId.toString())
      .filter((id) => id !== req.user._id.toString());

    if (recipients.length > 0) {
      const notifications = recipients.map((userId) => ({
        userId,
        eventId,
        messageId: newMessage._id,
        type: "new_message",
        content: "New message in event discussion",
      }));

      await Notification.insertMany(notifications);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(eventId.toString()).emit("newMessage", populatedMessage);
    }

    res.status(201).json({
      message: "Message posted successfully",
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Post organizer announcement
const postAnnouncement = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const announcement = await DiscussionMessage.create({
      eventId,
      userId: req.user._id,
      message,
      isAnnouncement: true,
    });

    const populated = await announcement.populate(
      "userId",
      "organizerName role"
    );

    const registrations = await Registration.find({
      eventId,
      status: "registered",
    }).select("participantId");

    if (registrations.length > 0) {
      const notifications = registrations.map((r) => ({
        userId: r.participantId,
        eventId,
        messageId: announcement._id,
        type: "announcement",
        content: "New announcement posted",
      }));

      await Notification.insertMany(notifications);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(eventId.toString()).emit("newAnnouncement", populated);
    }

    res.status(201).json({
      message: "Announcement posted",
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages (pinned first)
const getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;

    const messages = await DiscussionMessage.find({ eventId })
      .populate("userId", "firstName lastName organizerName role")
      .sort({ isPinned: -1, createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete message (organizer only, cascade replies)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await DiscussionMessage.findById(messageId).populate(
      "eventId"
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await DiscussionMessage.deleteMany({
      $or: [{ _id: messageId }, { parentMessageId: messageId }],
    });

    res.json({ message: "Message and replies deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pin / unpin message
const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await DiscussionMessage.findById(messageId).populate(
      "eventId"
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.json({
      message: message.isPinned ? "Message pinned" : "Message unpinned",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle reaction (with notification + real-time update)
const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
      return res.status(400).json({ message: "Invalid emoji" });
    }

    const message = await DiscussionMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existing = message.reactions.find(
      (r) =>
        r.userId.toString() === req.user._id.toString() &&
        r.emoji === emoji
    );

    if (existing) {
      message.reactions = message.reactions.filter(
        (r) =>
          !(
            r.userId.toString() === req.user._id.toString() &&
            r.emoji === emoji
          )
      );
    } else {
      message.reactions.push({
        userId: req.user._id,
        emoji,
      });
    }

    await message.save();

    if (message.userId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: message.userId,
        eventId: message.eventId,
        messageId: message._id,
        type: "reaction",
        content: "Someone reacted to your message",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(message.eventId.toString()).emit("reactionUpdate", {
        messageId,
        reactions: message.reactions,
      });
    }

    res.json({ message: "Reaction updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  postMessage,
  postAnnouncement,
  getMessages,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
};
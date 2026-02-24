const Event = require("../models/Event");
const User = require("../models/User");
const QRCode = require("qrcode");
const Registration = require("../models/Registration");
const sendEmail = require("../utils/emailService");
const fetch = global.fetch || require("node-fetch");

// Auto state engine
// Updates event status automatically based on time
// published -> ongoing -> completed
// Delete event
// Only draft events can be deleted
// Only event creator can delete

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Authorization check
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Business rule: only draft events allowed
    if (event.status !== "draft") {
      return res.status(400).json({
        message: "Only draft events can be deleted"
      });
    }

    await event.deleteOne();

    res.json({ message: "Event deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Updates event status depending on current date

const updateEventStatus = async (event) => {
    const now = new Date();
    let changed = false;

    if (event.status === "published" && new Date(event.startDate) <= now) {
        event.status = "ongoing";
        changed = true;
    }

    if (
        (event.status === "published" || event.status === "ongoing") &&
        new Date(event.endDate) < now
    ) {
        event.status = "completed";
        changed = true;
    }

    if (changed) {
        await event.save();
    }
};
// Publish event
// Only draft events can be published
// Only event creator can publish

const publishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Authorization check
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only draft events can be published
    if (event.status !== "draft") {
      return res.status(400).json({
        message: "Only draft events can be published",
      });
    }

    event.status = "published";
    await event.save();

    // Discord webhook integration
    try {
      const organizer = await User.findById(event.organizerId);

      if (
        organizer.discordWebhook &&
        organizer.discordWebhook.trim() !== ""
      ) {
        await fetch(organizer.discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `New Event Published

${event.name}

${event.description}

Start: ${new Date(event.startDate).toLocaleString()}
Registration Deadline: ${new Date(event.registrationDeadline).toLocaleString()}
Fee: ₹ ${event.registrationFee || 0}`
          }),
        });
      }
    } catch (err) {
      console.error("Discord webhook failed:", err.message);
    }

    await updateEventStatus(event);

    res.json({
      message: "Event published successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};// Get all events
// Supports filtering, search, trending, followed clubs, and recommendations

const getEvents = async (req, res) => {
  try {
    const {
      search,
      type,
      eligibility,
      startDate,
      endDate,
      followedOnly,
      trending,
    } = req.query;

    // Only visible events
    let baseQuery = {
      status: { $in: ["published", "ongoing", "completed"] },
    };

    if (type) baseQuery.type = type;
    if (eligibility) baseQuery.eligibility = eligibility;

    if (startDate && endDate) {
      baseQuery.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let events = await Event.find(baseQuery).populate(
      "organizerId",
      "organizerName category"
    );

    // Sync state
    await Promise.all(events.map((e) => updateEventStatus(e)));

    // Search by event name or organizer name
    if (search) {
      const lowerSearch = search.toLowerCase();

      events = events.filter((event) => {
        const eventName = event.name?.toLowerCase() || "";
        const organizerName =
          event.organizerId?.organizerName?.toLowerCase() || "";

        return (
          eventName.includes(lowerSearch) ||
          organizerName.includes(lowerSearch)
        );
      });
    }

    // Filter by followed organizers
    if (followedOnly === "true" && req.user) {
      const user = await User.findById(req.user._id);

      if (user && user.followedOrganizers) {
        events = events.filter((event) => {
          if (!event.organizerId || !event.organizerId._id) return false;

          return user.followedOrganizers.some(
            (id) => id.toString() === event.organizerId._id.toString()
          );
        });
      } else {
        events = [];
      }
    }

    // Trending events based on registrations in last 24 hours
    if (trending === "true") {
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentRegistrations = await Registration.aggregate([
        {
          $match: {
            createdAt: { $gte: last24Hours },
            status: "registered",
          },
        },
        {
          $group: {
            _id: "$eventId",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const trendingEventIds = recentRegistrations.map((r) =>
        r._id.toString()
      );

      events = events
        .filter((event) =>
          trendingEventIds.includes(event._id.toString())
        )
        .sort(
          (a, b) =>
            trendingEventIds.indexOf(a._id.toString()) -
            trendingEventIds.indexOf(b._id.toString())
        );
    }

    // Recommendation scoring for participants
    if (req.user && req.user.role === "participant") {
      const user = await User.findById(req.user._id);

      events = events.map((event) => {
        let score = 0;

        if (
          user.followedOrganizers &&
          event.organizerId &&
          event.organizerId._id &&
          user.followedOrganizers.some(
            (id) => id.toString() === event.organizerId._id.toString()
          )
        ){
          score += 3;
        }

        if (
          event.tags &&
          user.interests &&
          event.tags.some((tag) =>
            user.interests.includes(tag)
          )
        ) {
          score += 2;
        }

        if (event.totalRegistrations > 10) {
          score += 1;
        }

        return { ...event.toObject(), score };
      });

      events.sort((a, b) => b.score - a.score);
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Create event
// Event is created in draft state
// Includes validation for type, dates, limits and type-specific rules

const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      tags,
      formFields,
      merchandiseDetails,
    } = req.body;

    // Validate event type
    if (!["normal", "merchandise"].includes(type)) {
      return res.status(400).json({
        message: "Invalid event type",
      });
    }

    // Validate registration limit
    if (!registrationLimit || registrationLimit < 1) {
      return res.status(400).json({
        message: "Registration limit must be at least 1",
      });
    }

    // Validate fee
    if (registrationFee && registrationFee < 0) {
      return res.status(400).json({
        message: "Registration fee cannot be negative",
      });
    }

    // Validate date logic
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    if (new Date(registrationDeadline) > new Date(startDate)) {
      return res.status(400).json({
        message: "Deadline must be before event start",
      });
    }

    // Normal event must have form fields
    if (type === "normal") {
      if (!formFields || formFields.length === 0) {
        return res.status(400).json({
          message: "Normal events must define custom form fields",
        });
      }
    }

    // Merchandise event must define variants
    if (type === "merchandise") {
      if (
        !merchandiseDetails ||
        !merchandiseDetails.variants ||
        merchandiseDetails.variants.length === 0
      ) {
        return res.status(400).json({
          message: "Merchandise events must define item variants",
        });
      }
    }

    const event = await Event.create({
      name,
      description,
      type,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      organizerId: req.user._id,
      tags,
      formFields: type === "normal" ? formFields : [],
      merchandiseDetails:
        type === "merchandise" ? merchandiseDetails : {},
      status: "draft",
    });

    res.status(201).json({
      message: "Event created successfully (Draft)",
      event,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Register for normal event
// Generates ticket and QR code
// Sends confirmation email

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { formResponses } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await updateEventStatus(event);

    if (event.status !== "published") {
      return res.status(400).json({ message: "Event is not open for registration" });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline passed" });
    }

    if (event.totalRegistrations >= event.registrationLimit) {
      return res.status(400).json({ message: "Registration limit reached" });
    }

    // Prevent duplicate registration
    const existing = await Registration.findOne({
      eventId,
      participantId: req.user._id,
      status: { $ne: "cancelled" }
    });

    if (existing) {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    const ticketId = "TICKET-" + Date.now();

    const user = await User.findById(req.user._id);

    // Generate QR data
    const qrData = JSON.stringify({
      ticketId,
      eventId: event._id,
      eventName: event.name,
      participantId: req.user._id,
      participantName: `${user.firstName} ${user.lastName}`
    });

    const qrCodeImage = await QRCode.toDataURL(qrData);

    const registration = await Registration.create({
      eventId,
      participantId: req.user._id,
      formResponses,
      ticketId,
      qrCode: qrCodeImage,
      status: "registered",
    });

    event.totalRegistrations += 1;
    await event.save();

    await sendEmail({
      to: user.email,
      subject: "Felicity Event Registration Confirmed",
      html: `
        <h2>Registration Successful</h2>
        <p><strong>Event:</strong> ${event.name}</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Start Date:</strong> ${new Date(event.startDate).toLocaleString()}</p>
        <p>Show this QR code at entry:</p>
        <img src="${qrCodeImage}" width="200"/>
      `,
    });

    res.status(201).json({
      message: "Registration successful",
      ticketId,
      registration,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Get participant dashboard data
// Categorizes registrations into upcoming, completed, cancelled
// Separates normal and merchandise events

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participantId: req.user._id,
    }).populate({
      path: "eventId",
      populate: {
        path: "organizerId",
        select: "organizerName category",
      },
    });

    const now = new Date();
    const upcoming = [];
    const completed = [];
    const cancelled = [];
    const normal = [];
    const merchandise = [];

    for (let reg of registrations) {
      const event = reg.eventId;
      if (!event) continue;

      await updateEventStatus(event);

      if (event.type === "normal") normal.push(reg);
      if (event.type === "merchandise") merchandise.push(reg);

      if (reg.status === "cancelled" || reg.status === "rejected") {
        cancelled.push(reg);
      } else if (new Date(event.endDate) < now) {
        completed.push(reg);
      } else {
        upcoming.push(reg);
      }
    }

    res.json({ upcoming, completed, cancelled, normal, merchandise });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Place merchandise order
// Upload payment proof
// Order goes into pending approval state

const placeMerchandiseOrder = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "Payment proof image is required",
      });
    }

    let variant;
    try {
      variant = JSON.parse(req.body.variant);
    } catch (err) {
      return res.status(400).json({
        message: "Invalid variant format",
      });
    }

    const paymentProofUrl = `/uploads/${req.file.filename}`;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.type !== "merchandise") {
      return res.status(400).json({ message: "Not a merchandise event" });
    }

    await updateEventStatus(event);

    if (event.status !== "published") {
      return res.status(400).json({ message: "Event not open" });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: "Deadline passed" });
    }

    if (!variant || !variant.size || !variant.color) {
      return res.status(400).json({
        message: "Variant information required",
      });
    }

    const variantIndex = event.merchandiseDetails.variants.findIndex(
      (v) => v.size === variant.size && v.color === variant.color
    );

    if (variantIndex === -1) {
      return res.status(400).json({ message: "Invalid variant selected" });
    }

    if (event.merchandiseDetails.variants[variantIndex].stock <= 0) {
      return res.status(400).json({
        message: "Selected variant is out of stock",
      });
    }

    const previousOrders = await Registration.countDocuments({
      eventId,
      participantId: req.user._id,
      status: "registered",
    });

    if (
      previousOrders >=
      (event.merchandiseDetails.purchaseLimitPerUser || 1)
    ) {
      return res.status(400).json({ message: "Purchase limit reached" });
    }

    const registration = await Registration.create({
      eventId,
      participantId: req.user._id,
      variant,
      paymentStatus: "pending",
      paymentProofUrl,
      status: "registered",
    });

    res.status(201).json({
      message: "Order placed. Awaiting payment approval.",
      registration,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject merchandise order
// Approval generates QR code, updates stock, sends email
// Rejection updates status only

const updateMerchandiseOrderStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { action } = req.body;

        const registration = await Registration
            .findById(registrationId)
            .populate("eventId");

        if (!registration) {
            return res.status(404).json({ message: "Order not found" });
        }

        const event = registration.eventId;

        await updateEventStatus(event);

        // Authorization check
        if (event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Order must be pending
        if (registration.paymentStatus !== "pending") {
            return res.status(400).json({ message: "Order already processed" });
        }

        // Event must be active
        if (event.status !== "published" && event.status !== "ongoing") {
            return res.status(400).json({ message: "Event is not active" });
        }

        const variantIndex = event.merchandiseDetails.variants.findIndex(
            (v) =>
                v.size === registration.variant.size &&
                v.color === registration.variant.color
        );

        if (variantIndex === -1) {
            return res.status(400).json({ message: "Variant not found" });
        }

        if (action === "approve") {

            if (
                event.registrationLimit &&
                event.totalRegistrations >= event.registrationLimit
            ) {
                return res.status(400).json({ message: "Registration limit reached" });
            }

            if (event.merchandiseDetails.variants[variantIndex].stock <= 0) {
                return res.status(400).json({ message: "Stock exhausted" });
            }

            // Reduce stock
            event.merchandiseDetails.variants[variantIndex].stock -= 1;

            const ticketId = "TICKET-" + Date.now();

            const qrData = JSON.stringify({
                ticketId,
                eventId: event._id,
                participantId: registration.participantId,
            });

            const qrCodeImage = await QRCode.toDataURL(qrData);

            registration.qrCode = qrCodeImage;
            registration.paymentStatus = "approved";
            registration.ticketId = ticketId;

            event.totalRegistrations += 1;

            await registration.save();
            await event.save();

            // Send approval email
            try {
                const user = await User.findById(registration.participantId);

                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: "Merchandise Order Approved",
                        html: `
                            <h2>Order Approved</h2>
                            <p><strong>Event:</strong> ${event.name}</p>
                            <p><strong>Ticket ID:</strong> ${ticketId}</p>
                            <p>Show this QR code during collection:</p>
                            <img src="${qrCodeImage}" width="200"/>
                        `,
                    });
                }
            } catch (emailError) {
                console.error("Email sending failed:", emailError.message);
            }

            return res.json({
                message: "Order approved successfully",
                registration,
            });

        } else if (action === "reject") {

            registration.paymentStatus = "rejected";
            registration.status = "rejected";

            await registration.save();

            return res.json({
                message: "Order rejected",
                registration,
            });

        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark attendance using QR scan
// Prevent duplicate scans
// Only allowed during ongoing events

const markAttendance = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID required" });
    }

    const registration = await Registration
      .findOne({ ticketId })
      .populate("eventId");

    if (!registration) {
      return res.status(404).json({ message: "Invalid ticket" });
    }

    const event = registration.eventId;

    await updateEventStatus(event);

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (event.status !== "ongoing") {
      return res.status(400).json({
        message: "Attendance allowed only during ongoing events",
      });
    }

    if (registration.status !== "registered") {
      return res.status(400).json({
        message: "Invalid registration status",
      });
    }

    if (registration.attendanceStatus === true) {
      return res.status(400).json({
        message: "Duplicate scan detected",
      });
    }

    registration.attendanceStatus = true;
    registration.attendanceTimestamp = new Date();
    registration.attendanceMarkedBy = req.user._id;
    registration.attendanceMethod = "scan";
    registration.attendanceAuditNote = "Marked via QR scan";

    await registration.save();

    res.json({
      message: "Attendance marked successfully",
      registration,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manual attendance override
// Organizer can manually mark attendance during ongoing event

const manualAttendanceOverride = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { note } = req.body;

    const registration = await Registration
      .findById(registrationId)
      .populate("eventId");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const event = registration.eventId;

    await updateEventStatus(event);

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (event.status !== "ongoing") {
      return res.status(400).json({
        message: "Manual override allowed only during ongoing events",
      });
    }

    registration.attendanceStatus = true;
    registration.attendanceTimestamp = new Date();
    registration.attendanceMarkedBy = req.user._id;
    registration.attendanceMethod = "manual";
    registration.attendanceAuditNote =
      note || "Manual attendance override";

    await registration.save();

    res.json({
      message: "Attendance manually marked",
      registration,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Organizer dashboard
// Shows total events, registrations, revenue and top event

const getOrganizerDashboard = async (req, res) => {
    try {
        const organizerId = req.user._id;
        const events = await Event.find({ organizerId });
        const eventIds = events.map(e => e._id);

        for (let event of events) {
            await updateEventStatus(event);
        }

        const totalRegistrations = await Registration.countDocuments({
            eventId: { $in: eventIds },
            status: "registered"
        });

        const approvedRegistrations = await Registration.find({
            eventId: { $in: eventIds },
            paymentStatus: "approved"
        }).populate("eventId");

        let totalRevenue = 0;
        approvedRegistrations.forEach(reg => {
            if (reg.eventId.registrationFee) {
                totalRevenue += reg.eventId.registrationFee;
            }
        });

        const now = new Date();
        const upcomingEvents = events.filter(e => new Date(e.startDate) > now).length;
        const completedEvents = events.filter(e => new Date(e.endDate) < now).length;

        let topEvent = null;
        if (events.length > 0) {
            const sorted = events.sort((a, b) => b.totalRegistrations - a.totalRegistrations)[0];
            topEvent = { name: sorted.name, totalRegistrations: sorted.totalRegistrations };
        }

        res.json({
            totalEvents: events.length,
            totalRegistrations,
            totalRevenue,
            upcomingEvents,
            completedEvents,
            topEvent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Event analytics for organizer
// Returns payment stats, attendance stats and participant list

const getEventAnalytics = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await updateEventStatus(event);

        const registrations = await Registration.find({ eventId })
            .populate("participantId", "firstName lastName email");

        const totalRegistrations = registrations.filter(
            r => r.status === "registered"
        ).length;

        const approvedPayments = registrations.filter(
            r => r.paymentStatus === "approved"
        ).length;

        const rejectedPayments = registrations.filter(
            r => r.paymentStatus === "rejected"
        ).length;

        const pendingPayments = registrations.filter(
            r => r.paymentStatus === "pending"
        ).length;

        const attendanceCount = registrations.filter(
            r => r.attendanceStatus === true
        ).length;

        const totalRevenue =
            approvedPayments * (event.registrationFee || 0);

        const attendanceRate =
            totalRegistrations === 0
                ? 0
                : ((attendanceCount / totalRegistrations) * 100).toFixed(2);

        res.json({
            eventName: event.name,
            status: event.status,
            totalRegistrations,
            approvedPayments,
            rejectedPayments,
            pendingPayments,
            totalRevenue,
            attendanceCount,
            attendanceRate: attendanceRate + "%",
            participants: registrations,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Cancel registration
// Participant can cancel before event starts
// Adjusts total registrations count

const cancelRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const registration = await Registration.findById(registrationId).populate("eventId");

        if (!registration) return res.status(404).json({ message: "Registration not found" });

        if (registration.participantId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const event = registration.eventId;

        if (new Date(event.startDate) <= new Date()) {
            return res.status(400).json({ message: "Cannot cancel after event has started" });
        }

        if (registration.paymentStatus === "approved") {
            return res.status(400).json({ message: "Approved merchandise/paid tickets cannot be cancelled via app. Contact support." });
        }

        if (registration.status === "cancelled") {
            return res.status(400).json({ message: "Already cancelled" });
        }

        if (
            event.totalRegistrations > 0 &&
            registration.status === "registered" &&
            registration.paymentStatus !== "rejected"
        ) {
            event.totalRegistrations -= 1;
            await event.save();
        }

        registration.status = "cancelled";
        await registration.save();

        res.json({ message: "Registration cancelled successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin global analytics
// Returns platform-wide statistics

const getAdminAnalytics = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const totalUsers = await User.countDocuments({ role: "participant" });
        const totalRegistrations = await Registration.countDocuments({ status: "registered" });

        const revenueData = await Registration.aggregate([
            { $match: { paymentStatus: "approved" } },
            {
                $lookup: {
                    from: "events",
                    localField: "eventId",
                    foreignField: "_id",
                    as: "eventDetails"
                }
            },
            { $unwind: "$eventDetails" },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$eventDetails.registrationFee" }
                }
            }
        ]);

        res.json({
            totalEvents,
            totalUsers,
            totalRegistrations,
            totalRevenue: revenueData[0]?.totalRevenue || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export attendance CSV
// Organizer can export registered participants list

const { Parser } = require("json2csv");

const exportAttendanceCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await updateEventStatus(event);

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const registrations = await Registration.find({
      eventId,
      status: "registered",
    }).populate("participantId", "firstName lastName email");

    const data = registrations.map((reg) => ({
      Name: `${reg.participantId?.firstName || ""} ${reg.participantId?.lastName || ""}`,
      Email: reg.participantId?.email || "",
      RegistrationDate: reg.createdAt,
      PaymentStatus: reg.paymentStatus,
      AttendanceStatus: reg.attendanceStatus ? "Present" : "Absent",
      AttendanceTimestamp: reg.attendanceTimestamp || "",
      TicketID: reg.ticketId || "",
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment(`${event.name}-attendance.csv`);
    return res.send(csv);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export event as calendar file (.ics)
// Only registered participants can export

const { createEvent: createICS } = require("ics");

const exportEventToCalendar = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("organizerId");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await updateEventStatus(event);

    const registration = await Registration.findOne({
      eventId,
      participantId: req.user._id,
      status: "registered",
    });

    if (!registration) {
      return res.status(403).json({
        message: "You must be registered for this event to add to calendar",
      });
    }

    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const eventData = {
      title: event.name,
      description: event.description,
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ],
      end: [
        end.getFullYear(),
        end.getMonth() + 1,
        end.getDate(),
        end.getHours(),
        end.getMinutes(),
      ],
      organizer: {
        name: event.organizerId.organizerName || "Organizer",
        email: event.organizerId.contactEmail || "noreply@felicity.com",
      },
      uid: `felicity-${event._id}-${req.user._id}`,
    };

    createICS(eventData, (error, value) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${event.name}.ics`
      );

      res.send(value);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Edit event with restrictions based on status
// Draft: free edit
// Published: limited edit
// Ongoing: only status change
// Completed: no edits

const editEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await updateEventStatus(event);

    if (event.status === "draft") {

      if (updates.formFields && event.totalRegistrations > 0) {
        return res.status(400).json({
          message: "Form fields are locked after first registration"
        });
      }

      Object.assign(event, updates);
      await event.save();

      return res.json({
        message: "Draft updated successfully",
        event
      });
    }

    if (event.status === "published") {

      if (updates.description) {
        event.description = updates.description;
      }

      if (updates.registrationDeadline) {
        if (new Date(updates.registrationDeadline) > new Date(event.registrationDeadline)) {
          event.registrationDeadline = updates.registrationDeadline;
        } else {
          return res.status(400).json({ message: "Deadline can only be extended" });
        }
      }

      if (updates.registrationLimit) {
        if (updates.registrationLimit > event.registrationLimit) {
          event.registrationLimit = updates.registrationLimit;
        } else {
          return res.status(400).json({ message: "Registration limit can only be increased" });
        }
      }

      if (updates.status === "completed") {
        event.status = "completed";
      }

      await event.save();
      return res.json({ message: "Published event updated with restrictions", event });
    }

    if (event.status === "ongoing") {

      if (updates.status === "completed") {
        event.status = "completed";
        await event.save();
        return res.json({ message: "Event marked as completed", event });
      }

      return res.status(400).json({
        message: "Ongoing events cannot be edited except status change"
      });
    }

    if (event.status === "completed") {
      return res.status(400).json({
        message: "Completed events cannot be edited"
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single event by ID

const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("organizerId", "organizerName category");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await updateEventStatus(event);

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all events created by organizer

const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organizerId: req.user._id
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all controller functions

module.exports = {
    getEvents,
    createEvent,
    editEvent,
    publishEvent,
    registerForEvent,
    getMyRegistrations,
    placeMerchandiseOrder,
    updateMerchandiseOrderStatus,
    markAttendance,
    manualAttendanceOverride,
    getOrganizerDashboard,
    exportAttendanceCSV,  
    getEventAnalytics,
    cancelRegistration,
    getAdminAnalytics,
    exportEventToCalendar, 
    getEventById,
    getMyEvents,
    deleteEvent 
};
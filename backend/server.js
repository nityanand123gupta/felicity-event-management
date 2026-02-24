const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { createAdminIfNotExists } = require("./controllers/authController");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // ✅ NEW

const { protect, authorizeRoles } = require("./middleware/authMiddleware");

dotenv.config();
connectDB();
createAdminIfNotExists();

const app = express();

// 🔥 Create HTTP server (IMPORTANT for socket.io)
const server = http.createServer(app);

// 🔥 Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Restrict in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// 🔥 Make io accessible in controllers
app.set("io", io);

// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join event discussion room
  socket.on("joinEventRoom", (eventId) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event room ${eventId}`);
  });

  // Optional: Typing indicator
  socket.on("typing", (eventId) => {
    socket.to(eventId).emit("userTyping");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/notifications", notificationRoutes); // ✅ NEW ROUTE

// ================= TEST ROUTES =================
app.get("/", (req, res) => {
  res.send("Felicity Event Management API Running");
});

app.get("/api/test-protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route",
    user: req.user,
  });
});

app.get(
  "/api/admin-only",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const corsOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Always allow these origins
const defaultOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const allowedOrigins = [...new Set([...defaultOrigins, ...corsOrigins])];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (server-to-server, Postman, health checks)
      if (!origin) return callback(null, true);

      // Allow if origin is in the explicit list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow any Vercel preview/deployment URL for this project
      if (origin.match(/^https:\/\/prime-fit-fitness-center.*\.vercel\.app$/)) {
        return callback(null, true);
      }

      // Block everything else
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/coaches", require("./routes/coachRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

console.log(`CORS enabled for origins: ${corsOrigins.length > 0 ? corsOrigins.join(", ") : "localhost:3000 (default)"}`);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "PrimeFit backend is healthy", timestamp: new Date().toISOString() });
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Fitness Center API is running",
  });
});

app.use(errorHandler);

module.exports = app;

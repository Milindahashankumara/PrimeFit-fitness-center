const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const corsOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      corsOrigins.length > 0
        ? corsOrigins
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
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

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Fitness Center API is running",
  });
});

app.use(errorHandler);

module.exports = app;

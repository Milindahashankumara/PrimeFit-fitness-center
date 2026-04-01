const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/coaches', require('./routes/coachRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fitness Center API is running'
  });
});

// Error handler middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;


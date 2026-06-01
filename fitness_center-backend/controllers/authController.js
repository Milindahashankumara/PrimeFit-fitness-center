const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ...otherFields } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user object based on role
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || "customer",
    };

    // Add role-specific fields
    if (role === "coach") {
      userData.experience = otherFields.experience;
      userData.specializations = otherFields.specializations || [];
      userData.certifications = otherFields.certifications || [];
      userData.bio = otherFields.bio;
      userData.hourlyRate = otherFields.hourlyRate;
      userData.coachStatus = "pending";
      userData.appliedDate = new Date();
      userData.documents = otherFields.documents || [];
    }

    const user = await User.create(userData);

    if (user) {
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isAuthenticated: true,
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : email;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if role matches (if role is specified)
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials for ${role} login`,
      });
    }

    // Check if coach is approved (if user is coach)
    if (user.role === "coach" && user.coachStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your coach application is still pending approval",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAuthenticated: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "city",
      "zipCode",
      "emergencyContact",
      "emergencyPhone",
      "fitnessGoals",
      "medicalConditions",
      "preferences",
      "bio",
      "specializations",
      "certifications",
      "hourlyRate",
      "availability",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

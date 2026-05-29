const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log("Registering new user...");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { name, email, password, phone, role, ...otherFields } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists:", email);
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

    console.log("Saving user to MongoDB:", JSON.stringify(userData, null, 2));

    // Create user
    const user = await User.create(userData);

    console.log("User saved to MongoDB successfully!");
    console.log("User ID:", user._id);

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
    console.error("Error registering user:", error.message);
    console.error("Stack:", error.stack);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log("Login attempt...");
    console.log("Email:", req.body.email, "Role:", req.body.role);

    const { email, password, role } = req.body;

    // Validate email & password
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User found:", user.name, "- Role:", user.role);

    // Check if role matches (if role is specified)
    if (role && user.role !== role) {
      console.log("Role mismatch. Expected:", role, "Got:", user.role);
      return res.status(401).json({
        success: false,
        message: `Invalid credentials for ${role} login`,
      });
    }

    // Check if coach is approved (if user is coach)
    if (user.role === "coach" && user.coachStatus !== "approved") {
      console.log("Coach not approved. Status:", user.coachStatus);
      return res.status(403).json({
        success: false,
        message: "Your coach application is still pending approval",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    console.log("Login successful! Token generated for user:", user._id);

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
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
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

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
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

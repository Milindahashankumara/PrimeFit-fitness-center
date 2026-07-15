const crypto = require("crypto");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/emailService");

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

      // Email verification token - generate raw random token, store its SHA-256 hash in the DB
      const rawVerifyToken = crypto.randomBytes(32).toString("hex");
      const hashedVerifyToken = crypto
        .createHash("sha256")
        .update(rawVerifyToken)
        .digest("hex");

      user.emailVerificationToken = hashedVerifyToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save({ validateBeforeSave: false });

      // Send verification email (non-blocking — don't fail registration if email fails)
      sendVerificationEmail(user, rawVerifyToken).catch((err) =>
        console.error("Verification email failed to send:", err.message)
      );


      res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isAuthenticated: true,
        },
        message: "Registration successful! Please check your email to verify your account.",
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
      "blockedDates",
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


// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    // Hash the raw token from the URL to compare with the stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token that has not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email verification link is invalid or has expired. Please request a new one.",
      });
    }

    // Mark email as verified and clear the token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Resend Verification Email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select("+emailVerificationToken +emailVerificationExpires");

    // Always respond success — don't reveal if email exists (security)
    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered and unverified, a new verification link has been sent.",
      });
    }

    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");

    user.emailVerificationToken = hashedVerifyToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save({ validateBeforeSave: false });

    sendVerificationEmail(user, rawVerifyToken).catch((err) =>
      console.error("Resend verification email failed:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "If that email is registered and unverified, a new verification link has been sent.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select("+passwordResetToken +passwordResetExpires");

    // Always respond success — do NOT reveal whether the email exists (security)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, you will receive a password reset link shortly.",
      });
    }

    // Generate raw token, store hashed version
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send reset email (non-blocking)
    sendPasswordResetEmail(user, rawResetToken).catch((err) =>
      console.error("Password reset email failed to send:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "If that email is registered, you will receive a password reset link shortly.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required" });
    }

    // Hash the token from the URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token that has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Set new password (the pre-save hook in User.js will hash it automatically)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

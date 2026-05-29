const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      console.log("Verifying JWT token...");

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        console.log("User not found in database for ID:", decoded.id);
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found",
        });
      }

      console.log("User authenticated:", req.user.email, "-", req.user.role);
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } else {
    console.log("No authorization header or invalid format");
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Optional authentication - sets req.user if token exists, but doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (req.user) {
        console.log(
          "Optional auth: User authenticated:",
          req.user.email,
          "-",
          req.user.role,
        );
      }
    } catch (error) {
      console.log(
        "Optional auth: Token verification failed, continuing without auth",
      );
      // Don't fail, just continue without user
    }
  }

  next();
};

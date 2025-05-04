const User = require("../models/User");
const Voter = require("../models/Voter");
const AuditLog = require("../models/AuditLog");
const {
  successResponse,
  errorResponse,
} = require("../utils/responseFormatter");
const logger = require("../utils/logger");

/**
 * @desc    Register organizer
 * @route   POST /api/auth/signup
 * @access  Public
 */
const registerOrganizer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists - use special method for encrypted field
    const existingUser = await User.findOneByEncryptedField("email", email);
    if (existingUser) {
      return res.status(400).json(errorResponse("Email already in use", 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Log the action
    await AuditLog.create({
      action: "user_signup",
      user: {
        id: user._id,
        role: "organizer",
        name: user.name,
      },
      resource: {
        type: "user",
        id: user._id,
      },
      detail: `Organizer ${name} (${email}) registered`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Send token response
    sendTokenResponse(user, 201, res, "Organizer registered successfully");
  } catch (error) {
    logger.error(`Error registering organizer: ${error.message}`);
    res.status(500).json(errorResponse("Server error", 500));
  }
};

/**
 * @desc    Login organizer
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists - use special method for encrypted field
    const user = await User.findOneByEncryptedField("email", email);
    if (!user) {
      return res.status(401).json(errorResponse("Invalid credentials", 401));
    }

    // Need to fetch password for comparison
    const userWithPassword = await User.findById(user._id).select("+password");

    // Check if password matches
    const isMatch = await userWithPassword.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json(errorResponse("Invalid credentials", 401));
    }

    // Update last login
    userWithPassword.lastLogin = Date.now();
    await userWithPassword.save({ validateBeforeSave: false });

    // Log the action
    await AuditLog.create({
      action: "user_login",
      user: {
        id: user._id,
        role: "organizer",
        name: user.name,
      },
      resource: {
        type: "user",
        id: user._id,
      },
      detail: `Organizer ${user.name} (${user.email}) logged in`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Send token response
    sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    logger.error(`Error logging in organizer: ${error.message}`);
    res.status(500).json(errorResponse("Server error", 500));
  }
};

/**
 * @desc    Login voter
 * @route   POST /api/auth/voter-login
 * @access  Public
 */
const loginVoter = async (req, res) => {
  try {
    const { cnic, password } = req.body;

    // Check if voter exists - use special method for encrypted field
    const voter = await Voter.findOneByEncryptedField("cnic", cnic);
    if (!voter) {
      return res.status(401).json(errorResponse("Invalid credentials", 401));
    }

    // Check if voter is active
    if (!voter.isActive) {
      return res
        .status(401)
        .json(errorResponse("Your account has been deactivated", 401));
    }

    // Need to fetch password for comparison
    const voterWithPassword = await Voter.findById(voter._id).select(
      "+password"
    );

    // Check if password matches
    const isMatch = await voterWithPassword.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json(errorResponse("Invalid credentials", 401));
    }

    // Update last login
    voterWithPassword.lastLogin = Date.now();
    await voterWithPassword.save({ validateBeforeSave: false });

    // Log the action
    await AuditLog.create({
      action: "voter_login",
      user: {
        id: voter._id,
        role: "voter",
        name: voter.name,
      },
      resource: {
        type: "voter",
        id: voter._id,
      },
      detail: `Voter ${voter.name} (${voter.cnic}) logged in`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Send token response
    sendTokenResponse(voter, 200, res, "Login successful");
  } catch (error) {
    logger.error(`Error logging in voter: ${error.message}`);
    res.status(500).json(errorResponse("Server error", 500));
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    let userData;

    if (req.user.role === "organizer") {
      userData = await User.findById(req.user.id);
    } else if (req.user.role === "voter") {
      userData = await Voter.findById(req.user.id);
    } else {
      return res.status(400).json(errorResponse("Invalid user role", 400));
    }

    if (!userData) {
      return res.status(404).json(errorResponse("User not found", 404));
    }

    res.status(200).json(
      successResponse("User retrieved successfully", {
        user: userData,
        role: req.user.role,
      })
    );
  } catch (error) {
    logger.error(`Error getting user profile: ${error.message}`);
    res.status(500).json(errorResponse("Server error", 500));
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  res.status(200).json(successResponse("Successfully logged out"));
};

/**
 * Get token from model, create cookie and send response
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Create user object without sensitive data
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email || null,
    cnic: user.cnic || null,
    role: user instanceof User ? "organizer" : "voter",
  };

  res.status(statusCode).json(
    successResponse(message, {
      token,
      user: userData,
    })
  );
};

module.exports = {
  registerOrganizer,
  loginOrganizer,
  loginVoter,
  getMe,
  logout,
};

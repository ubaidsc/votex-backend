const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const encryptionPlugin = require("../utils/encryptionPlugin");

const VoterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    cnic: {
      type: String,
      required: [true, "Please provide a CNIC number"],
      unique: true,
      trim: true,
      match: [
        /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/,
        "CNIC must be in the format 00000-0000000-0",
      ],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please specify the organizer"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for votes cast by this voter
VoterSchema.virtual("votes", {
  ref: "Vote",
  localField: "_id",
  foreignField: "voter",
  justOne: false,
});

// Hash password before saving
VoterSchema.pre("save", async function (next) {
  // Only hash the password if it's modified or new
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
VoterSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT
VoterSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: "voter", organizer: this.organizer },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "30d" }
  );
};

// Create indexes for faster queries
VoterSchema.index({ cnic: 1 });
VoterSchema.index({ organizer: 1 });

// Apply encryption plugin
VoterSchema.plugin(encryptionPlugin, {
  fields: ["name", "email", "cnic"],
});

module.exports = mongoose.model("Voter", VoterSchema);

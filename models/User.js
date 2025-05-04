const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const encryptionPlugin = require("../utils/encryptionPlugin");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
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
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for voters
UserSchema.virtual("voters", {
  ref: "Voter",
  localField: "_id",
  foreignField: "organizer",
  justOne: false,
});

// Virtual field for polls
UserSchema.virtual("polls", {
  ref: "Poll",
  localField: "_id",
  foreignField: "organizer",
  justOne: false,
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Only hash the password if it's modified or new
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: "organizer" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Create index for faster queries
UserSchema.index({ email: 1 });

// Apply encryption plugin
UserSchema.plugin(encryptionPlugin, {
  fields: ["name", "email"],
});

module.exports = mongoose.model("User", UserSchema);

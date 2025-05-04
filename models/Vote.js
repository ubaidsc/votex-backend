const mongoose = require("mongoose");
const encryptionPlugin = require("../utils/encryptionPlugin");

const VoteSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: [true, "Please specify the poll"],
    },
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voter",
      required: [true, "Please specify the voter"],
    },
    option: {
      type: String,
      required: [true, "Please specify the selected option"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent double voting
VoteSchema.index({ poll: 1, voter: 1 }, { unique: true });

// Indexes for faster queries
VoteSchema.index({ poll: 1 });
VoteSchema.index({ voter: 1 });

// Pre-save middleware to validate vote
VoteSchema.pre("save", async function (next) {
  try {
    // Ensure poll exists and is active
    const Poll = mongoose.model("Poll");
    const poll = await Poll.findById(this.poll);

    if (!poll) {
      throw new Error("Poll not found");
    }

    if (poll.status !== "active") {
      throw new Error("This poll is not active");
    }

    if (poll.deadline < new Date()) {
      throw new Error("Voting deadline has passed");
    }

    // Validate option exists in poll
    const optionExists = poll.options.some(
      (option) => option._id === this.option
    );
    if (!optionExists) {
      throw new Error("Selected option does not exist in this poll");
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Apply encryption plugin
VoteSchema.plugin(encryptionPlugin, {
  fields: ["ipAddress", "userAgent"],
});

module.exports = mongoose.model("Vote", VoteSchema);

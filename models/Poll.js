const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters']
    },
    options: [
      {
        text: {
          type: String,
          required: [true, 'Option text is required'],
          trim: true
        },
        _id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString()
        }
      }
    ],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the organizer']
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'active'
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide a deadline'],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'Deadline must be in the future'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for votes on this poll
PollSchema.virtual('votes', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'poll',
  justOne: false
});

// Pre-save middleware to check if deadline is in the future
PollSchema.pre('save', function(next) {
  if (this.isModified('deadline')) {
    const now = new Date();
    if (this.deadline <= now) {
      const error = new Error('Deadline must be in the future');
      return next(error);
    }
  }
  next();
});

// Method to check if poll is editable
PollSchema.methods.isEditable = function() {
  // Check if any votes have been cast
  return this.votes && this.votes.length === 0;
};

// Method to get poll results
PollSchema.methods.getResults = async function() {
  const Vote = mongoose.model('Vote');
  const results = await Vote.aggregate([
    { $match: { poll: this._id } },
    { $group: { _id: '$option', count: { $sum: 1 } } }
  ]);
  
  // Format results to include options with zero votes
  const formattedResults = this.options.map(option => {
    const voteResult = results.find(r => r._id === option._id);
    return {
      option: option.text,
      optionId: option._id,
      votes: voteResult ? voteResult.count : 0
    };
  });
  
  // Calculate total votes
  const totalVotes = formattedResults.reduce((sum, item) => sum + item.votes, 0);
  
  return {
    pollId: this._id,
    title: this.title,
    totalVotes,
    options: formattedResults
  };
};

// Create indexes for faster queries
PollSchema.index({ organizer: 1 });
PollSchema.index({ deadline: 1 });
PollSchema.index({ status: 1 });

module.exports = mongoose.model('Poll', PollSchema);
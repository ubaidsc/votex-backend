const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Please specify the action'],
      enum: [
        'user_signup',
        'user_login',
        'voter_login',
        'voter_created',
        'voter_updated',
        'voter_deleted',
        'poll_created',
        'poll_updated',
        'poll_deleted',
        'vote_cast'
      ]
    },
    user: {
      id: mongoose.Schema.Types.ObjectId,
      role: {
        type: String,
        enum: ['organizer', 'voter', 'system'],
        default: 'system'
      },
      name: String
    },
    resource: {
      type: {
        type: String,
        enum: ['user', 'voter', 'poll', 'vote']
      },
      id: mongoose.Schema.Types.ObjectId
    },
    detail: {
      type: String,
      required: [true, 'Please provide details of the action']
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ 'user.id': 1 });
AuditLogSchema.index({ 'resource.id': 1 });
AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * @desc    Create a new poll
 * @route   POST /api/polls
 * @access  Private (Organizer only)
 */
const createPoll = async (req, res) => {
  try {
    const { title, description, options, deadline } = req.body;
    
    // Create poll
    const poll = await Poll.create({
      title,
      description,
      options: options.map(opt => ({ text: opt })),
      deadline,
      organizer: req.user.id
    });
    
    // Log the action
    await AuditLog.create({
      action: 'poll_created',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'poll',
        id: poll._id
      },
      detail: `Poll "${title}" created by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json(successResponse('Poll created successfully', { poll }));
  } catch (error) {
    logger.error(`Error creating poll: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Get all polls for the organizer
 * @route   GET /api/polls
 * @access  Private (Organizer only)
 */
const getPolls = async (req, res) => {
  try {
    // Get all polls for this organizer
    const polls = await Poll.find({ 
      organizer: req.user.id,
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    res.status(200).json(
      successResponse('Polls retrieved successfully', { polls, count: polls.length })
    );
  } catch (error) {
    logger.error(`Error getting polls: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Get single poll
 * @route   GET /api/polls/:id
 * @access  Private
 */
const getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json(errorResponse('Poll not found', 404));
    }
    
    // If voter, check if the poll is from their organizer
    if (req.user.role === 'voter') {
      const Voter = require('../models/Voter');
      const voter = await Voter.findById(req.user.id);
      
      if (!voter || voter.organizer.toString() !== poll.organizer.toString()) {
        return res.status(403).json(errorResponse('Not authorized to access this poll', 403));
      }
    } 
    // If organizer, check if they own the poll
    else if (req.user.role === 'organizer' && poll.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to access this poll', 403));
    }
    
    res.status(200).json(successResponse('Poll retrieved successfully', { poll }));
  } catch (error) {
    logger.error(`Error getting poll: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Update poll
 * @route   PUT /api/polls/:id
 * @access  Private (Organizer only)
 */
const updatePoll = async (req, res) => {
  try {
    let poll = await Poll.findById(req.params.id).populate('votes');
    
    if (!poll) {
      return res.status(404).json(errorResponse('Poll not found', 404));
    }
    
    // Ensure organizer can only update their own polls
    if (poll.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to update this poll', 403));
    }
    
    // Check if poll has votes
    const voteCount = await Vote.countDocuments({ poll: poll._id });
    if (voteCount > 0) {
      return res.status(400).json(
        errorResponse('Cannot update poll after voting has started', 400)
      );
    }
    
    const { title, description, options, deadline, status } = req.body;
    
    // Fields to update
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (options) updateFields.options = options.map(opt => ({ text: opt }));
    if (deadline) updateFields.deadline = deadline;
    if (status) updateFields.status = status;
    
    // Update poll
    poll = await Poll.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.create({
      action: 'poll_updated',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'poll',
        id: poll._id
      },
      detail: `Poll "${poll.title}" updated by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json(successResponse('Poll updated successfully', { poll }));
  } catch (error) {
    logger.error(`Error updating poll: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Delete poll
 * @route   DELETE /api/polls/:id
 * @access  Private (Organizer only)
 */
const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json(errorResponse('Poll not found', 404));
    }
    
    // Ensure organizer can only delete their own polls
    if (poll.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to delete this poll', 403));
    }
    
    // Soft delete - mark as deleted but keep for records
    poll.isDeleted = true;
    poll.status = 'closed';
    await poll.save();
    
    // Log the action
    await AuditLog.create({
      action: 'poll_deleted',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'poll',
        id: poll._id
      },
      detail: `Poll "${poll.title}" deleted by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json(successResponse('Poll deleted successfully'));
  } catch (error) {
    logger.error(`Error deleting poll: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Get poll results
 * @route   GET /api/polls/:id/results
 * @access  Private
 */
const getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json(errorResponse('Poll not found', 404));
    }
    
    // If voter, check if the poll is from their organizer
    if (req.user.role === 'voter') {
      const Voter = require('../models/Voter');
      const voter = await Voter.findById(req.user.id);
      
      if (!voter || voter.organizer.toString() !== poll.organizer.toString()) {
        return res.status(403).json(errorResponse('Not authorized to access this poll', 403));
      }
    } 
    // If organizer, check if they own the poll
    else if (req.user.role === 'organizer' && poll.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to access this poll', 403));
    }
    
    // Get results
    const results = await poll.getResults();
    
    res.status(200).json(successResponse('Poll results retrieved successfully', { results }));
  } catch (error) {
    logger.error(`Error getting poll results: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Get available polls for a voter
 * @route   GET /api/polls/available
 * @access  Private (Voter only)
 */
const getAvailablePolls = async (req, res) => {
  try {
    // Only voters can access this endpoint
    if (req.user.role !== 'voter') {
      return res.status(403).json(errorResponse('Only voters can access available polls', 403));
    }
    
    // Get the voter's organizer
    const Voter = require('../models/Voter');
    const voter = await Voter.findById(req.user.id);
    
    if (!voter) {
      return res.status(404).json(errorResponse('Voter not found', 404));
    }
    
    // Get active polls from this voter's organizer
    const now = new Date();
    const polls = await Poll.find({
      organizer: voter.organizer,
      status: 'active',
      deadline: { $gt: now },
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    // Check which polls the voter has already voted on
    const votedPolls = await Vote.find({ voter: req.user.id }).distinct('poll');
    
    // Filter out polls that the voter has already voted on
    const availablePolls = polls.filter(poll => !votedPolls.includes(poll._id));
    
    res.status(200).json(
      successResponse('Available polls retrieved successfully', { 
        polls: availablePolls, 
        count: availablePolls.length 
      })
    );
  } catch (error) {
    logger.error(`Error getting available polls: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

module.exports = {
  createPoll,
  getPolls,
  getPoll,
  updatePoll,
  deletePoll,
  getPollResults,
  getAvailablePolls
};
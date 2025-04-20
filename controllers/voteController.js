const Vote = require('../models/Vote');
const Poll = require('../models/Poll');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * @desc    Cast a vote
 * @route   POST /api/vote/:pollId
 * @access  Private (Voter only)
 */
const castVote = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    
    // Only voters can cast votes
    if (req.user.role !== 'voter') {
      return res.status(403).json(errorResponse('Only voters can cast votes', 403));
    }
    
    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json(errorResponse('Poll not found', 404));
    }
    
    // Check if poll is active
    if (poll.status !== 'active') {
      return res.status(400).json(errorResponse('This poll is not active', 400));
    }
    
    // Check if deadline has passed
    if (poll.deadline < new Date()) {
      return res.status(400).json(errorResponse('Voting deadline has passed', 400));
    }
    
    // Check if the voter belongs to the poll's organizer
    const Voter = require('../models/Voter');
    const voter = await Voter.findById(req.user.id);
    
    if (!voter || voter.organizer.toString() !== poll.organizer.toString()) {
      return res.status(403).json(errorResponse('Not authorized to vote in this poll', 403));
    }
    
    // Check if option exists in poll
    const optionExists = poll.options.some(option => option._id === optionId);
    if (!optionExists) {
      return res.status(400).json(errorResponse('Invalid option selected', 400));
    }
    
    // Check if voter has already voted in this poll
    const existingVote = await Vote.findOne({ poll: pollId, voter: req.user.id });
    if (existingVote) {
      return res.status(400).json(errorResponse('You have already voted in this poll', 400));
    }
    
    // Create vote
    const vote = await Vote.create({
      poll: pollId,
      voter: req.user.id,
      option: optionId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Log the action
    await AuditLog.create({
      action: 'vote_cast',
      user: {
        id: req.user.id,
        role: 'voter',
        name: voter.name
      },
      resource: {
        type: 'poll',
        id: poll._id
      },
      detail: `Vote cast by ${voter.name} in poll "${poll.title}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json(successResponse('Vote cast successfully', { voteId: vote._id }));
  } catch (error) {
    // Check for duplicate key error (voter already voted)
    if (error.code === 11000) {
      return res.status(400).json(errorResponse('You have already voted in this poll', 400));
    }
    
    logger.error(`Error casting vote: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Check vote status
 * @route   GET /api/vote/status/:pollId
 * @access  Private (Voter only)
 */
const checkVoteStatus = async (req, res) => {
  try {
    const { pollId } = req.params;
    
    // Only voters can check vote status
    if (req.user.role !== 'voter') {
      return res.status(403).json(errorResponse('Only voters can check vote status', 403));
    }
    
    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json(errorResponse('Poll not found', 404));
    }
    
    // Check if the voter belongs to the poll's organizer
    const Voter = require('../models/Voter');
    const voter = await Voter.findById(req.user.id);
    
    if (!voter || voter.organizer.toString() !== poll.organizer.toString()) {
      return res.status(403).json(errorResponse('Not authorized to check status for this poll', 403));
    }
    
    // Check if voter has already voted in this poll
    const vote = await Vote.findOne({ poll: pollId, voter: req.user.id });
    
    const status = {
      pollId,
      hasVoted: !!vote,
      voteTime: vote ? vote.timestamp : null,
      optionId: vote ? vote.option : null
    };
    
    res.status(200).json(successResponse('Vote status retrieved successfully', { status }));
  } catch (error) {
    logger.error(`Error checking vote status: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

module.exports = {
  castVote,
  checkVoteStatus
};
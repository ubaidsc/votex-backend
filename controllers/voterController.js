const Voter = require('../models/Voter');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');
const { generatePassword } = require('../utils/passwordGenerator');

/**
 * @desc    Create a new voter
 * @route   POST /api/voters
 * @access  Private (Organizer only)
 */
const createVoter = async (req, res) => {
  try {
    const { name, cnic, email } = req.body;
    
    // Check if voter already exists
    const existingVoter = await Voter.findOne({ cnic });
    if (existingVoter) {
      return res.status(400).json(errorResponse('Voter with this CNIC already exists', 400));
    }
    
    // Generate random password
    const password = generatePassword();
    
    // Create voter
    const voter = await Voter.create({
      name,
      cnic,
      email,
      password,
      organizer: req.user.id
    });
    
    // Log the action
    await AuditLog.create({
      action: 'voter_created',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'voter',
        id: voter._id
      },
      detail: `Voter ${name} (${cnic}) created by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Send email with credentials
    try {
      await emailService.sendVoterCredentials(email, name, cnic, password);
    } catch (emailError) {
      logger.error(`Failed to send voter credentials email: ${emailError.message}`);
      // Continue without failing the request, but let the client know
      return res.status(201).json(
        successResponse('Voter created successfully, but failed to send email notification', 
          { voter: { id: voter._id, name, cnic, email } }
        )
      );
    }
    
    res.status(201).json(
      successResponse('Voter created successfully and credentials sent via email', 
        { voter: { id: voter._id, name, cnic, email } }
      )
    );
  } catch (error) {
    logger.error(`Error creating voter: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Get all voters for the organizer
 * @route   GET /api/voters
 * @access  Private (Organizer only)
 */
const getVoters = async (req, res) => {
  try {
    const voters = await Voter.find({ organizer: req.user.id })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json(
      successResponse('Voters retrieved successfully', { voters, count: voters.length })
    );
  } catch (error) {
    logger.error(`Error getting voters: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Get single voter
 * @route   GET /api/voters/:id
 * @access  Private (Organizer only)
 */
const getVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id).select('-password');
    
    if (!voter) {
      return res.status(404).json(errorResponse('Voter not found', 404));
    }
    
    // Ensure organizer can only access their own voters
    if (voter.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to access this voter', 403));
    }
    
    res.status(200).json(successResponse('Voter retrieved successfully', { voter }));
  } catch (error) {
    logger.error(`Error getting voter: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Update voter information
 * @route   PUT /api/voters/:id
 * @access  Private (Organizer only)
 */
const updateVoter = async (req, res) => {
  try {
    let voter = await Voter.findById(req.params.id);
    
    if (!voter) {
      return res.status(404).json(errorResponse('Voter not found', 404));
    }
    
    // Ensure organizer can only update their own voters
    if (voter.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to update this voter', 403));
    }
    
    const { name, email, isActive } = req.body;
    
    // Fields to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // Update voter
    voter = await Voter.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');
    
    // Log the action
    await AuditLog.create({
      action: 'voter_updated',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'voter',
        id: voter._id
      },
      detail: `Voter ${voter.name} (${voter.cnic}) updated by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json(successResponse('Voter updated successfully', { voter }));
  } catch (error) {
    logger.error(`Error updating voter: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Delete voter
 * @route   DELETE /api/voters/:id
 * @access  Private (Organizer only)
 */
const deleteVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    
    if (!voter) {
      return res.status(404).json(errorResponse('Voter not found', 404));
    }
    
    // Ensure organizer can only delete their own voters
    if (voter.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to delete this voter', 403));
    }
    
    // Instead of hard delete, just set inactive - for audit purposes
    voter.isActive = false;
    await voter.save();
    
    // Log the action
    await AuditLog.create({
      action: 'voter_deleted',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'voter',
        id: voter._id
      },
      detail: `Voter ${voter.name} (${voter.cnic}) deactivated by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json(successResponse('Voter deactivated successfully'));
  } catch (error) {
    logger.error(`Error deleting voter: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

/**
 * @desc    Reset voter password
 * @route   POST /api/voters/:id/reset-password
 * @access  Private (Organizer only)
 */
const resetVoterPassword = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    
    if (!voter) {
      return res.status(404).json(errorResponse('Voter not found', 404));
    }
    
    // Ensure organizer can only reset passwords for their own voters
    if (voter.organizer.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to reset password for this voter', 403));
    }
    
    // Generate new password
    const newPassword = generatePassword();
    
    // Update voter password
    voter.password = newPassword;
    await voter.save();
    
    // Send email with new credentials
    try {
      await emailService.sendVoterCredentials(voter.email, voter.name, voter.cnic, newPassword);
    } catch (emailError) {
      logger.error(`Failed to send voter credentials email: ${emailError.message}`);
      return res.status(200).json(
        successResponse('Voter password reset successfully, but failed to send email notification')
      );
    }
    
    // Log the action
    await AuditLog.create({
      action: 'voter_updated',
      user: {
        id: req.user.id,
        role: 'organizer',
        name: req.user.name
      },
      resource: {
        type: 'voter',
        id: voter._id
      },
      detail: `Password reset for voter ${voter.name} (${voter.cnic}) by organizer ${req.user.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json(
      successResponse('Voter password reset successfully and new credentials sent via email')
    );
  } catch (error) {
    logger.error(`Error resetting voter password: ${error.message}`);
    res.status(500).json(errorResponse('Server error', 500));
  }
};

module.exports = {
  createVoter,
  getVoters,
  getVoter,
  updateVoter,
  deleteVoter,
  resetVoterPassword
};
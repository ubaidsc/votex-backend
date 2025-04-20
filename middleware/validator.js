const { body, param, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseFormatter');

// Validation result middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      errorResponse('Validation error', 400, errors.array())
    );
  }
  next();
};

// Organizer signup validation
const validateOrganizerSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  validate
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  
  validate
];

// Voter login validation
const validateVoterLogin = [
  body('cnic')
    .trim()
    .notEmpty().withMessage('CNIC is required')
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/).withMessage('CNIC must be in the format 00000-0000000-0'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  
  validate
];

// Voter creation validation
const validateVoterCreation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  
  body('cnic')
    .trim()
    .notEmpty().withMessage('CNIC is required')
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/).withMessage('CNIC must be in the format 00000-0000000-0'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  validate
];

// Poll creation validation
const validatePollCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  
  body('options')
    .isArray({ min: 2 }).withMessage('At least 2 options are required'),
  
  body('options.*')
    .trim()
    .notEmpty().withMessage('Option value cannot be empty')
    .isLength({ min: 1, max: 100 }).withMessage('Option must be between 1 and 100 characters'),
  
  body('deadline')
    .notEmpty().withMessage('Deadline is required')
    .isISO8601().withMessage('Deadline must be a valid date')
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      if (deadline <= now) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  validate
];

// Vote casting validation
const validateVoteCasting = [
  param('pollId')
    .isMongoId().withMessage('Invalid poll ID format'),
  
  body('optionId')
    .trim()
    .notEmpty().withMessage('Option ID is required'),
  
  validate
];

module.exports = {
  validateOrganizerSignup,
  validateLogin,
  validateVoterLogin,
  validateVoterCreation,
  validatePollCreation,
  validateVoteCasting
};
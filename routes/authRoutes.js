const express = require('express');
const { 
  registerOrganizer, 
  loginOrganizer, 
  loginVoter, 
  getMe, 
  logout 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  validateOrganizerSignup, 
  validateLogin, 
  validateVoterLogin 
} = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register as an organizer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Organizer registered successfully
 *       400:
 *         description: Validation error or email already in use
 */
router.post('/signup', authLimiter, validateOrganizerSignup, registerOrganizer);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login as an organizer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validateLogin, loginOrganizer);

/**
 * @swagger
 * /api/auth/voter-login:
 *   post:
 *     summary: Login as a voter using CNIC and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cnic
 *               - password
 *             properties:
 *               cnic:
 *                 type: string
 *                 pattern: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$'
 *                 example: '12345-1234567-1'
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/voter-login', authLimiter, validateVoterLogin, loginVoter);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       401:
 *         description: Not authorized, no token provided
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.get('/logout', protect, logout);

module.exports = router;
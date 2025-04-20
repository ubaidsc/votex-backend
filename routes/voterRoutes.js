const express = require('express');
const { 
  createVoter, 
  getVoters, 
  getVoter, 
  updateVoter, 
  deleteVoter, 
  resetVoterPassword 
} = require('../controllers/voterController');
const { protect, authorize } = require('../middleware/auth');
const { validateVoterCreation } = require('../middleware/validator');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('organizer'));
router.use(apiLimiter);

/**
 * @swagger
 * /api/voters:
 *   post:
 *     summary: Create a new voter
 *     tags: [Voters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cnic
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               cnic:
 *                 type: string
 *                 pattern: '^[0-9]{5}-[0-9]{7}-[0-9]{1}$'
 *                 example: '12345-1234567-1'
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Voter created successfully
 *       400:
 *         description: Validation error or voter already exists
 *       401:
 *         description: Not authorized
 */
router.post('/', validateVoterCreation, createVoter);

/**
 * @swagger
 * /api/voters:
 *   get:
 *     summary: Get all voters for the organizer
 *     tags: [Voters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Voters retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/', getVoters);

/**
 * @swagger
 * /api/voters/{id}:
 *   get:
 *     summary: Get a single voter
 *     tags: [Voters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Voter ID
 *     responses:
 *       200:
 *         description: Voter retrieved successfully
 *       404:
 *         description: Voter not found
 *       401:
 *         description: Not authorized
 */
router.get('/:id', getVoter);

/**
 * @swagger
 * /api/voters/{id}:
 *   put:
 *     summary: Update voter information
 *     tags: [Voters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Voter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Voter updated successfully
 *       404:
 *         description: Voter not found
 *       401:
 *         description: Not authorized
 */
router.put('/:id', updateVoter);

/**
 * @swagger
 * /api/voters/{id}:
 *   delete:
 *     summary: Delete a voter (soft delete)
 *     tags: [Voters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Voter ID
 *     responses:
 *       200:
 *         description: Voter deactivated successfully
 *       404:
 *         description: Voter not found
 *       401:
 *         description: Not authorized
 */
router.delete('/:id', deleteVoter);

/**
 * @swagger
 * /api/voters/{id}/reset-password:
 *   post:
 *     summary: Reset voter password
 *     tags: [Voters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Voter ID
 *     responses:
 *       200:
 *         description: Voter password reset successfully
 *       404:
 *         description: Voter not found
 *       401:
 *         description: Not authorized
 */
router.post('/:id/reset-password', resetVoterPassword);

module.exports = router;
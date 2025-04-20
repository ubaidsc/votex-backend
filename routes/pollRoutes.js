const express = require('express');
const { 
  createPoll, 
  getPolls, 
  getPoll, 
  updatePoll, 
  deletePoll, 
  getPollResults,
  getAvailablePolls 
} = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');
const { validatePollCreation } = require('../middleware/validator');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(apiLimiter);

/**
 * @swagger
 * /api/polls/available:
 *   get:
 *     summary: Get available polls for a voter
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available polls retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Only voters can access available polls
 */
router.get('/available', authorize('voter'), getAvailablePolls);

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - options
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Poll created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 */
router.post('/', authorize('organizer'), validatePollCreation, createPoll);

/**
 * @swagger
 * /api/polls:
 *   get:
 *     summary: Get all polls for the organizer
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Polls retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/', authorize('organizer'), getPolls);

/**
 * @swagger
 * /api/polls/{id}:
 *   get:
 *     summary: Get a single poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll retrieved successfully
 *       404:
 *         description: Poll not found
 *       401:
 *         description: Not authorized
 */
router.get('/:id', getPoll);

/**
 * @swagger
 * /api/polls/{id}:
 *   put:
 *     summary: Update a poll (only before voting starts)
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, active, closed]
 *     responses:
 *       200:
 *         description: Poll updated successfully
 *       400:
 *         description: Cannot update poll after voting has started
 *       404:
 *         description: Poll not found
 *       401:
 *         description: Not authorized
 */
router.put('/:id', authorize('organizer'), updatePoll);

/**
 * @swagger
 * /api/polls/{id}:
 *   delete:
 *     summary: Delete a poll (soft delete)
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll deleted successfully
 *       404:
 *         description: Poll not found
 *       401:
 *         description: Not authorized
 */
router.delete('/:id', authorize('organizer'), deletePoll);

/**
 * @swagger
 * /api/polls/{id}/results:
 *   get:
 *     summary: Get poll results
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll results retrieved successfully
 *       404:
 *         description: Poll not found
 *       401:
 *         description: Not authorized
 */
router.get('/:id/results', getPollResults);

module.exports = router;
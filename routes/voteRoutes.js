const express = require('express');
const { 
  castVote, 
  checkVoteStatus 
} = require('../controllers/voteController');
const { protect, authorize } = require('../middleware/auth');
const { validateVoteCasting } = require('../middleware/validator');
const { voteLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('voter'));

/**
 * @swagger
 * /api/vote/{pollId}:
 *   post:
 *     summary: Cast a vote
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
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
 *             required:
 *               - optionId
 *             properties:
 *               optionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vote cast successfully
 *       400:
 *         description: Invalid option, voter already voted, or poll inactive
 *       404:
 *         description: Poll not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Only voters can cast votes
 */
router.post('/:pollId', voteLimiter, validateVoteCasting, castVote);

/**
 * @swagger
 * /api/vote/status/{pollId}:
 *   get:
 *     summary: Check if voter has already voted in a poll
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Vote status retrieved successfully
 *       404:
 *         description: Poll not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Only voters can check vote status
 */
router.get('/status/:pollId', checkVoteStatus);

module.exports = router;
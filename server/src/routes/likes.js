const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Toggle like on a session
router.post('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    // Check if session exists
    const sessionCheck = await pool.query(
      'SELECT id FROM surf_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user already liked this session
    const existingLike = await pool.query(
      'SELECT id FROM session_likes WHERE user_id = $1 AND session_id = $2',
      [userId, sessionId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike - remove the like
      await pool.query(
        'DELETE FROM session_likes WHERE user_id = $1 AND session_id = $2',
        [userId, sessionId]
      );

      // Get updated like count
      const likeCount = await pool.query(
        'SELECT COUNT(*) FROM session_likes WHERE session_id = $1',
        [sessionId]
      );

      res.json({
        message: 'Session unliked',
        liked: false,
        likeCount: parseInt(likeCount.rows[0].count)
      });
    } else {
      // Like - add the like
      await pool.query(
        'INSERT INTO session_likes (user_id, session_id) VALUES ($1, $2)',
        [userId, sessionId]
      );

      // Get updated like count
      const likeCount = await pool.query(
        'SELECT COUNT(*) FROM session_likes WHERE session_id = $1',
        [sessionId]
      );

      res.json({
        message: 'Session liked',
        liked: true,
        likeCount: parseInt(likeCount.rows[0].count)
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get likes for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    // Get like count and check if current user liked
    const result = await pool.query(`
      SELECT 
        COUNT(*) as like_count,
        BOOL_OR(user_id = $1) as user_liked
      FROM session_likes 
      WHERE session_id = $2
    `, [userId, sessionId]);

    const data = result.rows[0];

    res.json({
      likeCount: parseInt(data.like_count),
      userLiked: data.user_liked || false
    });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comments for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.username, u.id as user_id, u.avatar_url
      FROM session_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.session_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [sessionId, limit, offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM session_comments WHERE session_id = $1',
      [sessionId]
    );

    const totalComments = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalComments / limit);

    res.json({
      comments: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalComments,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to a session
router.post('/session/:sessionId', authenticateToken, [
  body('content').isLength({ min: 1, max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sessionId = req.params.sessionId;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if session exists
    const sessionCheck = await pool.query(
      'SELECT id FROM surf_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Insert comment
    const result = await pool.query(`
      INSERT INTO session_comments (user_id, session_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, sessionId, content]);

    // Get user info for the response (including avatar)
    const userResult = await pool.query(
      'SELECT username, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    const comment = {
      ...result.rows[0],
      username: userResult.rows[0].username,
      avatar_url: userResult.rows[0].avatar_url,
      user_id: userId
    };

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update comment
router.put('/:commentId', authenticateToken, [
  body('content').isLength({ min: 1, max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const commentId = req.params.commentId;
    const { content } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE session_comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [content, commentId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.json({
      message: 'Comment updated successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM session_comments WHERE id = $1 AND user_id = $2 RETURNING *',
      [commentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
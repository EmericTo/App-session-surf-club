const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's session count
    const sessionCount = await pool.query(
      'SELECT COUNT(*) FROM surf_sessions WHERE user_id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    user.session_count = parseInt(sessionCount.rows[0].count);

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user avatar
router.put('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, avatar_url',
      [avatarUrl, req.user.id]
    );

    res.json({
      message: 'Avatar updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const result = await pool.query(
      'SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 ORDER BY username LIMIT 10',
      [`%${q}%`]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (public profile)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's session count
    const sessionCount = await pool.query(
      'SELECT COUNT(*) FROM surf_sessions WHERE user_id = $1',
      [req.params.id]
    );

    // Get user's public sessions
    const sessionsResult = await pool.query(`
      SELECT 
        s.id, s.title, s.description, s.image_url, s.location,
        s.wave_height, s.wave_period, s.wind_speed, s.wind_direction,
        s.tide_type, s.rating, s.created_at,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as user_liked
      FROM surf_sessions s
      LEFT JOIN (
        SELECT session_id, COUNT(*) as like_count
        FROM session_likes
        GROUP BY session_id
      ) l ON s.id = l.session_id
      LEFT JOIN (
        SELECT session_id, COUNT(*) as comment_count
        FROM session_comments
        GROUP BY session_id
      ) c ON s.id = c.session_id
      LEFT JOIN session_likes ul ON s.id = ul.session_id AND ul.user_id = $2
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `, [req.params.id, req.user.id]);

    const user = result.rows[0];
    user.session_count = parseInt(sessionCount.rows[0].count);

    res.json({ 
      user,
      sessions: sessionsResult.rows
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
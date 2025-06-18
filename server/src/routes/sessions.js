const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all sessions (feed) with likes and comments count
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT 
        s.id, s.title, s.description, s.image_url, s.location,
        s.wave_height, s.wave_period, s.wind_speed, s.wind_direction,
        s.tide_type, s.rating, s.created_at,
        u.username, u.id as user_id, u.avatar_url,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as user_liked
      FROM surf_sessions s
      JOIN users u ON s.user_id = u.id
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
      LEFT JOIN session_likes ul ON s.id = ul.session_id AND ul.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM surf_sessions');
    const totalSessions = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalSessions / limit);

    res.json({
      sessions: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalSessions,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's sessions
router.get('/my-sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.title, s.description, s.image_url, s.location,
        s.wave_height, s.wave_period, s.wind_speed, s.wind_direction,
        s.tide_type, s.rating, s.created_at,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count
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
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create session
router.post('/', authenticateToken, upload.single('image'), [
  body('title').isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }).trim(),
  body('location').isLength({ min: 1, max: 100 }).trim(),
  body('wave_height').isFloat({ min: 0, max: 30 }),
  body('wave_period').isFloat({ min: 0, max: 30 }),
  body('wind_speed').isFloat({ min: 0, max: 100 }),
  body('wind_direction').isIn(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
  body('tide_type').isIn(['low', 'rising', 'high', 'falling']),
  body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, location, wave_height, wave_period,
      wind_speed, wind_direction, tide_type, rating
    } = req.body;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(`
      INSERT INTO surf_sessions (
        user_id, title, description, image_url, location,
        wave_height, wave_period, wind_speed, wind_direction,
        tide_type, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      req.user.id, title, description, imageUrl, location,
      wave_height, wave_period, wind_speed, wind_direction,
      tide_type, rating
    ]);

    res.status(201).json({
      message: 'Session created successfully',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single session with likes and comments
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*, u.username, u.avatar_url,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as user_liked
      FROM surf_sessions s
      JOIN users u ON s.user_id = u.id
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
      WHERE s.id = $1
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ session: result.rows[0] });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update session
router.put('/:id', authenticateToken, upload.single('image'), [
  body('title').isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }).trim(),
  body('location').isLength({ min: 1, max: 100 }).trim(),
  body('wave_height').isFloat({ min: 0, max: 30 }),
  body('wave_period').isFloat({ min: 0, max: 30 }),
  body('wind_speed').isFloat({ min: 0, max: 100 }),
  body('wind_direction').isIn(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
  body('tide_type').isIn(['low', 'rising', 'high', 'falling']),
  body('rating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sessionId = req.params.id;
    const {
      title, description, location, wave_height, wave_period,
      wind_speed, wind_direction, tide_type, rating, keep_current_image
    } = req.body;

    // Check if session exists and belongs to user
    const sessionCheck = await pool.query(
      'SELECT id, image_url FROM surf_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found or unauthorized' });
    }

    const currentSession = sessionCheck.rows[0];
    let imageUrl = currentSession.image_url;

    // Handle image update
    if (req.file) {
      // New image uploaded
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (keep_current_image === 'false') {
      // User wants to remove the image
      imageUrl = null;
    }
    // If keep_current_image is 'true' or undefined, keep the current image

    const result = await pool.query(`
      UPDATE surf_sessions 
      SET title = $1, description = $2, image_url = $3, location = $4,
          wave_height = $5, wave_period = $6, wind_speed = $7, wind_direction = $8,
          tide_type = $9, rating = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND user_id = $12
      RETURNING *
    `, [
      title, description, imageUrl, location,
      wave_height, wave_period, wind_speed, wind_direction,
      tide_type, rating, sessionId, req.user.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found or unauthorized' });
    }

    res.json({
      message: 'Session updated successfully',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete session
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM surf_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found or unauthorized' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
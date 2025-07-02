const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get unread messages count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read_at IS NULL',
      [req.user.id]
    );

    const unreadCount = parseInt(result.rows[0].count);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id < receiver_id THEN CONCAT(sender_id, '-', receiver_id)
            ELSE CONCAT(receiver_id, '-', sender_id)
          END
        )
        CASE 
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        content as last_message,
        created_at as last_message_time
        FROM messages 
        WHERE sender_id = $1 OR receiver_id = $1
        ORDER BY 
          CASE 
            WHEN sender_id < receiver_id THEN CONCAT(sender_id, '-', receiver_id)
            ELSE CONCAT(receiver_id, '-', sender_id)
          END,
          created_at DESC
      )
      SELECT 
        lm.other_user_id,
        u.username as other_username,
        u.avatar_url as other_avatar_url,
        lm.last_message,
        lm.last_message_time,
        COALESCE(unread.unread_count, 0) as unread_count
      FROM latest_messages lm
      JOIN users u ON u.id = lm.other_user_id
      LEFT JOIN (
        SELECT sender_id, COUNT(*) as unread_count
        FROM messages 
        WHERE receiver_id = $1 AND read_at IS NULL
        GROUP BY sender_id
      ) unread ON unread.sender_id = lm.other_user_id
      ORDER BY lm.last_message_time DESC
    `, [req.user.id]);

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    const result = await pool.query(`
      SELECT 
        m.id, m.content, m.created_at, m.read_at,
        m.sender_id, m.receiver_id,
        s.username as sender_username,
        r.username as receiver_username
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `, [req.user.id, otherUserId]);

    // Mark messages as read
    await pool.query(`
      UPDATE messages 
      SET read_at = NOW() 
      WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL
    `, [otherUserId, req.user.id]);

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/send', authenticateToken, [
  body('receiver_id').isUUID(),
  body('content').isLength({ min: 1, max: 1000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiver_id, content } = req.body;

    // Check if receiver exists
    const receiverCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [receiver_id]
    );

    if (receiverCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Insert message
    const result = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.user.id, receiver_id, content]);

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: result.rows[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
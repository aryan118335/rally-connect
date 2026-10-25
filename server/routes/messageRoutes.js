import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// 1. GET /api/messages/conversations — Get list of recent conversations
// ============================================================
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Fetch the most recent message with every distinct conversation partner
    const sql = `
      WITH conversation_partners AS (
        SELECT DISTINCT
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END AS partner_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      )
      SELECT 
        cp.partner_id,
        u.username AS partner_username,
        u.avatar_url AS partner_avatar,
        last_msg.id AS last_message_id,
        last_msg.content AS last_message,
        last_msg.created_at AS last_message_time,
        last_msg.sender_id AS last_message_sender_id,
        (
          SELECT COUNT(*)::int 
          FROM messages 
          WHERE sender_id = cp.partner_id AND receiver_id = $1 AND is_read = FALSE
        ) AS unread_count
      FROM conversation_partners cp
      JOIN users u ON cp.partner_id = u.id
      JOIN LATERAL (
        SELECT id, content, created_at, sender_id
        FROM messages
        WHERE (sender_id = $1 AND receiver_id = cp.partner_id)
           OR (sender_id = cp.partner_id AND receiver_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON true
      ORDER BY last_msg.created_at DESC;
    `;

    const result = await query(sql, [currentUserId]);
    return res.json({ conversations: result.rows });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// ============================================================
// 2. GET /api/messages/:userId — Get chat history with a user
// ============================================================
router.get('/:userId', requireAuth, async (req, res) => {
  const partnerId = parseInt(req.params.userId, 10);
  if (isNaN(partnerId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    // Mark received messages as read
    await query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [partnerId, req.user.id]
    );

    // Fetch conversation thread
    const sql = `
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.is_read,
        m.created_at,
        u_sender.username AS sender_username,
        u_receiver.username AS receiver_username
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC;
    `;

    const result = await query(sql, [req.user.id, partnerId]);
    return res.json({ messages: result.rows });
  } catch (err) {
    console.error('Error fetching chat history:', err);
    return res.status(500).json({ error: 'Failed to fetch message history.' });
  }
});

// ============================================================
// 3. POST /api/messages/:userId — Send a direct message
// ============================================================
router.post('/:userId', requireAuth, async (req, res) => {
  const receiverId = parseInt(req.params.userId, 10);
  const { content } = req.body;

  if (isNaN(receiverId)) {
    return res.status(400).json({ error: 'Invalid recipient ID.' });
  }

  if (receiverId === req.user.id) {
    return res.status(400).json({ error: 'You cannot send messages to yourself.' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    // Check recipient exists
    const userCheck = await query('SELECT id, username FROM users WHERE id = $1', [receiverId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient user not found.' });
    }

    const insertResult = await query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
      [req.user.id, receiverId, content.trim()]
    );

    const message = {
      ...insertResult.rows[0],
      sender_username: req.user.username,
      receiver_username: userCheck.rows[0].username,
    };

    return res.status(201).json({
      message: 'Message sent successfully.',
      chatMessage: message,
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;

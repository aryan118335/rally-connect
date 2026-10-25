import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// 1. GET /api/comments/post/:postId — Get comments for a post
// ============================================================
router.get('/post/:postId', async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID.' });
  }

  try {
    const sql = `
      SELECT 
        c.id,
        c.content,
        c.created_at,
        c.post_id,
        c.parent_id,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC;
    `;

    const result = await query(sql, [postId]);
    return res.json({ comments: result.rows });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// ============================================================
// 2. POST /api/comments/post/:postId — Add a new comment
// ============================================================
router.post('/post/:postId', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const { content, parent_id } = req.body;

  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID.' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    // Check post exists
    const postCheck = await query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const insertResult = await query(
      `INSERT INTO comments (post_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, created_at, post_id, parent_id`,
      [postId, req.user.id, content.trim(), parent_id || null]
    );

    const newComment = {
      ...insertResult.rows[0],
      author_id: req.user.id,
      author_username: req.user.username,
      author_avatar: '',
    };

    return res.status(201).json({
      message: 'Comment added successfully.',
      comment: newComment,
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// ============================================================
// 3. DELETE /api/comments/:id — Delete comment (author only)
// ============================================================
router.delete('/:id', requireAuth, async (req, res) => {
  const commentId = parseInt(req.params.id, 10);
  if (isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid comment ID.' });
  }

  try {
    const commentCheck = await query('SELECT user_id, post_id FROM comments WHERE id = $1', [commentId]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (commentCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment.' });
    }

    await query('DELETE FROM comments WHERE id = $1', [commentId]);
    return res.json({ message: 'Comment deleted successfully.', commentId });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

export default router;

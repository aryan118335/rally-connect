import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// GET /api/users — List other users to message
// ============================================================
router.get('/', requireAuth, async (req, res) => {
  const { search } = req.query;

  try {
    let sql = `
      SELECT id, username, email, avatar_url, bio, created_at
      FROM users
      WHERE id != $1
    `;
    const params = [req.user.id];

    if (search && search.trim()) {
      sql += ` AND LOWER(username) LIKE $2`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    sql += ` ORDER BY username ASC LIMIT 20;`;

    const result = await query(sql, params);
    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to search users.' });
  }
});

// ============================================================
// GET /api/users/profile/me — User stats and recent posts
// ============================================================
router.get('/profile/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [postCountRes, commCountRes, commentCountRes, postsRes] = await Promise.all([
      query('SELECT COUNT(*)::int as count FROM posts WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*)::int as count FROM community_members WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*)::int as count FROM comments WHERE user_id = $1', [userId]),
      query(
        `SELECT p.id, p.title, p.content, p.created_at, c.name as community_name,
                COALESCE(SUM(v.vote_type), 0)::int as vote_score,
                (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comment_count
         FROM posts p
         JOIN communities c ON p.community_id = c.id
         LEFT JOIN votes v ON p.id = v.post_id
         WHERE p.user_id = $1
         GROUP BY p.id, c.name
         ORDER BY p.created_at DESC`,
        [userId]
      ),
    ]);

    return res.json({
      stats: {
        posts: postCountRes.rows[0].count,
        communities: commCountRes.rows[0].count,
        comments: commentCountRes.rows[0].count,
      },
      posts: postsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching user profile stats:', err);
    return res.status(500).json({ error: 'Failed to fetch profile stats.' });
  }
});

export default router;

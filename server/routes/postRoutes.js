import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to seed initial posts if posts table is empty
async function ensureDefaultPosts() {
  try {
    const postCount = await query('SELECT COUNT(*) as count FROM posts');
    if (parseInt(postCount.rows[0].count, 10) === 0) {
      // Find a user and community
      const userRes = await query('SELECT id FROM users LIMIT 1');
      const commRes = await query('SELECT id, name FROM communities WHERE name = $1 LIMIT 1', ['technology']);
      const genCommRes = await query('SELECT id, name FROM communities WHERE name = $1 LIMIT 1', ['general']);

      if (userRes.rows.length > 0 && commRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        const techId = commRes.rows[0].id;
        const genId = genCommRes.rows.length > 0 ? genCommRes.rows[0].id : techId;

        const samplePosts = [
          {
            title: 'Welcome to Rally! A community-driven desktop social platform',
            content: 'Rally allows you to create topic-based communities, post discussions, upvote great content, and chat in real-time. Join communities to customize your home feed!',
            community_id: genId,
          },
          {
            title: 'The Future of AI and Local Desktop Applications',
            content: 'Building native desktop applications using Electron and modern web technologies gives developers the best of both worlds: local system security and rich, expressive UI components.',
            community_id: techId,
          },
          {
            title: 'What programming language did you learn first vs your favorite now?',
            content: 'Many of us started with C, C++, or Java in college and later fell in love with Python or JavaScript. What about you? Share your journey below!',
            community_id: genId,
          },
        ];

        for (const p of samplePosts) {
          const inserted = await query(
            `INSERT INTO posts (title, content, user_id, community_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [p.title, p.content, userId, p.community_id]
          );

          // Give it an initial upvote
          await query(
            `INSERT INTO votes (post_id, user_id, vote_type) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING`,
            [inserted.rows[0].id, userId]
          );
        }
        console.log('🌱 Seeded default sample posts.');
      }
    }
  } catch (err) {
    console.error('Error seeding default posts:', err);
  }
}

// Run seed check
ensureDefaultPosts();

// ============================================================
// 1. GET /api/posts — Feed / List posts
// ============================================================
router.get('/', async (req, res) => {
  let currentUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'rally_major_project_secret_key_2026_secure');
      currentUserId = decoded.id;
    } catch {
      // Unauthenticated
    }
  }

  const { community_id, filter } = req.query;

  try {
    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    // Filter by specific community
    if (community_id) {
      whereClause += ` AND p.community_id = $${paramIndex}`;
      params.push(parseInt(community_id, 10));
      paramIndex++;
    } else if (filter === 'feed' && currentUserId) {
      // If user has joined communities, filter to those; otherwise show all
      const userCommCheck = await query(
        'SELECT community_id FROM community_members WHERE user_id = $1',
        [currentUserId]
      );
      if (userCommCheck.rows.length > 0) {
        whereClause += ` AND p.community_id IN (SELECT community_id FROM community_members WHERE user_id = $${paramIndex})`;
        params.push(currentUserId);
        paramIndex++;
      }
    }

    params.push(currentUserId);
    const userParamIndex = paramIndex;

    const sql = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.image_url,
        p.created_at,
        p.updated_at,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar,
        c.id AS community_id,
        c.name AS community_name,
        c.display_name AS community_display_name,
        COALESCE(SUM(v.vote_type), 0)::int AS vote_score,
        COUNT(DISTINCT cm.id)::int AS comment_count,
        COALESCE((
          SELECT vote_type FROM votes 
          WHERE post_id = p.id AND user_id = $${userParamIndex}::int
        ), 0)::int AS user_vote
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      LEFT JOIN votes v ON p.id = v.post_id
      LEFT JOIN comments cm ON p.id = cm.post_id
      WHERE ${whereClause}
      GROUP BY p.id, u.id, c.id
      ORDER BY p.created_at DESC;
    `;

    const result = await query(sql, params);
    return res.json({ posts: result.rows });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// ============================================================
// 2. GET /api/posts/:id — Single post details
// ============================================================
router.get('/:id', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID.' });
  }

  let currentUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'rally_major_project_secret_key_2026_secure');
      currentUserId = decoded.id;
    } catch {
      // Unauthenticated
    }
  }

  try {
    const sql = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.image_url,
        p.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar,
        c.id AS community_id,
        c.name AS community_name,
        c.display_name AS community_display_name,
        COALESCE(SUM(v.vote_type), 0)::int AS vote_score,
        COUNT(DISTINCT cm.id)::int AS comment_count,
        COALESCE((
          SELECT vote_type FROM votes 
          WHERE post_id = p.id AND user_id = $2::int
        ), 0)::int AS user_vote
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      LEFT JOIN votes v ON p.id = v.post_id
      LEFT JOIN comments cm ON p.id = cm.post_id
      WHERE p.id = $1
      GROUP BY p.id, u.id, c.id;
    `;

    const result = await query(sql, [postId, currentUserId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    return res.json({ post: result.rows[0] });
  } catch (err) {
    console.error('Error fetching single post:', err);
    return res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// ============================================================
// 3. POST /api/posts — Create a new post
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  const { title, content, community_id, image_url } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Post title is required.' });
  }

  if (!community_id) {
    return res.status(400).json({ error: 'Please select a community for your post.' });
  }

  const cleanTitle = title.trim();
  const cleanContent = (content || '').trim();
  const parsedCommunityId = parseInt(community_id, 10);

  if (cleanTitle.length < 3) {
    return res.status(400).json({ error: 'Title must be at least 3 characters long.' });
  }

  try {
    // Verify community exists
    const commCheck = await query('SELECT id, name, display_name FROM communities WHERE id = $1', [parsedCommunityId]);
    if (commCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found.' });
    }
    const community = commCheck.rows[0];

    // Insert post
    const insertRes = await query(
      `INSERT INTO posts (title, content, image_url, user_id, community_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, content, image_url, created_at, user_id, community_id`,
      [cleanTitle, cleanContent, image_url || '', req.user.id, parsedCommunityId]
    );

    const post = insertRes.rows[0];

    // Creator automatically upvotes their own post
    await query(
      `INSERT INTO votes (post_id, user_id, vote_type) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING`,
      [post.id, req.user.id]
    );

    const fullPost = {
      ...post,
      author_id: req.user.id,
      author_username: req.user.username,
      author_avatar: '',
      community_id: community.id,
      community_name: community.name,
      community_display_name: community.display_name,
      vote_score: 1,
      comment_count: 0,
      user_vote: 1,
    };

    return res.status(201).json({
      message: 'Post published successfully.',
      post: fullPost,
    });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

// ============================================================
// 4. DELETE /api/posts/:id — Delete post (only author)
// ============================================================
router.delete('/:id', requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID.' });
  }

  try {
    const postCheck = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (postCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    await query('DELETE FROM posts WHERE id = $1', [postId]);
    return res.json({ message: 'Post deleted successfully.', postId });
  } catch (err) {
    console.error('Error deleting post:', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

export default router;

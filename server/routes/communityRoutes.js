import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to seed initial communities if none exist
async function ensureDefaultCommunities() {
  try {
    const check = await query('SELECT COUNT(*) as count FROM communities');
    if (parseInt(check.rows[0].count, 10) === 0) {
      const defaults = [
        { name: 'technology', display_name: 'Technology', description: 'Discussions on gadgets, AI, software, and tech news.' },
        { name: 'gaming', display_name: 'Gaming', description: 'Video games, esports, reviews, and gaming culture.' },
        { name: 'science', display_name: 'Science & Discovery', description: 'Explore the frontiers of astronomy, physics, and biology.' },
        { name: 'programming', display_name: 'Programming & Dev', description: 'Code snippets, architectures, languages, and tips.' },
        { name: 'general', display_name: 'General Discussion', description: 'A cozy corner for casual chats and general topics.' },
      ];

      for (const d of defaults) {
        await query(
          'INSERT INTO communities (name, display_name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [d.name, d.display_name, d.description]
        );
      }
      console.log('🌱 Seeded default communities.');
    }
  } catch (err) {
    console.error('Error seeding default communities:', err);
  }
}

// Run default check on load
ensureDefaultCommunities();

// ============================================================
// 1. GET /api/communities — List all communities with member counts
// ============================================================
router.get('/', async (req, res) => {
  // Optional auth header to check if caller is a member
  let currentUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'rally_major_project_secret_key_2026_secure');
      currentUserId = decoded.id;
    } catch {
      // Unauthenticated is fine
    }
  }

  try {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.display_name,
        c.description,
        c.avatar_url,
        c.created_at,
        COUNT(DISTINCT cm.user_id)::int AS member_count,
        CASE 
          WHEN $1::int IS NOT NULL AND EXISTS (
            SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1::int
          ) THEN true 
          ELSE false 
        END AS is_member
      FROM communities c
      LEFT JOIN community_members cm ON c.id = cm.community_id
      GROUP BY c.id
      ORDER BY member_count DESC, c.display_name ASC;
    `;

    const result = await query(sql, [currentUserId]);
    return res.json({ communities: result.rows });
  } catch (err) {
    console.error('Error fetching communities:', err);
    return res.status(500).json({ error: 'Failed to fetch communities.' });
  }
});

// ============================================================
// 2. GET /api/communities/my — Communities the user has joined
// ============================================================
router.get('/my', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.display_name,
        c.description,
        c.avatar_url,
        cm.joined_at,
        (SELECT COUNT(*)::int FROM community_members WHERE community_id = c.id) AS member_count,
        true AS is_member
      FROM communities c
      INNER JOIN community_members cm ON c.id = cm.community_id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC;
    `;

    const result = await query(sql, [req.user.id]);
    return res.json({ communities: result.rows });
  } catch (err) {
    console.error('Error fetching user communities:', err);
    return res.status(500).json({ error: 'Failed to fetch your communities.' });
  }
});

// ============================================================
// 3. POST /api/communities — Create a new community
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  const { name, display_name, description } = req.body;

  if (!name || !display_name) {
    return res.status(400).json({ error: 'Community identifier and display name are required.' });
  }

  // Clean identifier: lowercase, letters, numbers, and hyphens/underscores
  const cleanName = name.trim().toLowerCase().replace(/^r\//, '').replace(/[^a-z0-9_-]/g, '');

  if (cleanName.length < 2) {
    return res.status(400).json({ error: 'Community name must have at least 2 alphanumeric characters.' });
  }

  try {
    // Check if name already taken
    const existing = await query('SELECT id FROM communities WHERE LOWER(name) = $1', [cleanName]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Community 'r/${cleanName}' already exists.` });
    }

    // Insert new community
    const insertCommunity = await query(
      `INSERT INTO communities (name, display_name, description, creator_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, display_name, description, created_at`,
      [cleanName, display_name.trim(), (description || '').trim(), req.user.id]
    );

    const newCommunity = insertCommunity.rows[0];

    // Automatically make creator a member
    await query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [newCommunity.id, req.user.id]
    );

    return res.status(201).json({
      message: 'Community created successfully.',
      community: { ...newCommunity, member_count: 1, is_member: true }
    });
  } catch (err) {
    console.error('Error creating community:', err);
    return res.status(500).json({ error: 'Failed to create community.' });
  }
});

// ============================================================
// 4. POST /api/communities/:id/join — Join a community
// ============================================================
router.post('/:id/join', requireAuth, async (req, res) => {
  const communityId = parseInt(req.params.id, 10);

  if (isNaN(communityId)) {
    return res.status(400).json({ error: 'Invalid community ID.' });
  }

  try {
    // Check community exists
    const checkComm = await query('SELECT id FROM communities WHERE id = $1', [communityId]);
    if (checkComm.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    // Insert membership
    await query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [communityId, req.user.id]
    );

    return res.json({ message: 'Joined community successfully.', communityId, is_member: true });
  } catch (err) {
    console.error('Error joining community:', err);
    return res.status(500).json({ error: 'Failed to join community.' });
  }
});

// ============================================================
// 5. POST /api/communities/:id/leave — Leave a community
// ============================================================
router.post('/:id/leave', requireAuth, async (req, res) => {
  const communityId = parseInt(req.params.id, 10);

  if (isNaN(communityId)) {
    return res.status(400).json({ error: 'Invalid community ID.' });
  }

  try {
    await query(
      'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
      [communityId, req.user.id]
    );

    return res.json({ message: 'Left community successfully.', communityId, is_member: false });
  } catch (err) {
    console.error('Error leaving community:', err);
    return res.status(500).json({ error: 'Failed to leave community.' });
  }
});

export default router;

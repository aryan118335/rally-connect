import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// POST /api/votes — Cast, change, or remove a vote on a post
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  const { post_id, vote_type } = req.body;

  const postId = parseInt(post_id, 10);
  const voteType = parseInt(vote_type, 10); // 1 or -1

  if (isNaN(postId) || ![1, -1].includes(voteType)) {
    return res.status(400).json({ error: 'Valid post_id and vote_type (1 or -1) are required.' });
  }

  try {
    // Check post exists
    const postCheck = await query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Check existing vote
    const existing = await query(
      'SELECT vote_type FROM votes WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.id]
    );

    let newUserVote = voteType;

    if (existing.rows.length > 0) {
      const currentVote = existing.rows[0].vote_type;
      if (currentVote === voteType) {
        // Same vote clicked again -> cancel/remove the vote
        await query('DELETE FROM votes WHERE post_id = $1 AND user_id = $2', [postId, req.user.id]);
        newUserVote = 0;
      } else {
        // Change vote (e.g. from -1 to 1)
        await query(
          'UPDATE votes SET vote_type = $1 WHERE post_id = $2 AND user_id = $3',
          [voteType, postId, req.user.id]
        );
        newUserVote = voteType;
      }
    } else {
      // First time voting on this post
      await query(
        'INSERT INTO votes (post_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [postId, req.user.id, voteType]
      );
      newUserVote = voteType;
    }

    // Calculate new total score
    const scoreResult = await query(
      'SELECT COALESCE(SUM(vote_type), 0)::int as total_score FROM votes WHERE post_id = $1',
      [postId]
    );
    const totalScore = scoreResult.rows[0].total_score;

    return res.json({
      message: 'Vote recorded.',
      post_id: postId,
      vote_score: totalScore,
      user_vote: newUserVote,
    });
  } catch (err) {
    console.error('Error casting vote:', err);
    return res.status(500).json({ error: 'Failed to record vote.' });
  }
});

export default router;

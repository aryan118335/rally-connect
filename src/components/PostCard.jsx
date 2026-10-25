import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function PostCard({ post, onVote, onDelete }) {
  const { user } = useAuth();

  // Comments local state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

  // Voting state (optimistic)
  const [voteScore, setVoteScore] = useState(post.vote_score || 0);
  const [userVote, setUserVote] = useState(post.user_vote || 0);

  function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Toggle upvote / downvote
  async function handleVoteClick(direction) {
    const previousVote = userVote;
    const previousScore = voteScore;

    // Optimistic toggle
    const newVote = previousVote === direction ? 0 : direction;
    const scoreDiff = newVote - previousVote;
    setUserVote(newVote);
    setVoteScore(previousScore + scoreDiff);

    try {
      const data = await api.post('/votes', {
        post_id: post.id,
        vote_type: direction,
      });
      setUserVote(data.user_vote);
      setVoteScore(data.vote_score);
      if (onVote) onVote(post.id, data.user_vote, data.vote_score);
    } catch (err) {
      // Revert on error
      setUserVote(previousVote);
      setVoteScore(previousScore);
      alert(err.message || 'Failed to register vote.');
    }
  }

  // Toggle comments and fetch if expanding
  async function handleToggleComments() {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState) {
      try {
        setLoadingComments(true);
        const data = await api.get(`/comments/post/${post.id}`);
        setComments(data.comments || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
  }

  // Submit comment
  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const data = await api.post(`/comments/post/${post.id}`, {
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
      setCommentCount((prev) => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  }

  // Delete comment
  async function handleDeleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || 'Failed to delete comment.');
    }
  }

  async function handleDeletePost() {
    if (confirm('Are you sure you want to delete this post?')) {
      if (onDelete) onDelete(post.id);
    }
  }

  return (
    <article className="post-card">
      <header className="post-header">
        <span className="post-comm-badge">
          r/{post.community_name || 'general'}
        </span>
        <span className="post-meta">
          • Posted by <strong>u/{post.author_username}</strong> • {formatDate(post.created_at)}
        </span>
      </header>

      <h2 className="post-title">{post.title}</h2>

      {post.content && (
        <p className="post-content">{post.content}</p>
      )}

      {post.image_url && (
        <div style={{ marginBottom: 14 }}>
          <img
            src={post.image_url}
            alt={post.title}
            style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 400, objectFit: 'cover' }}
          />
        </div>
      )}

      <footer className="post-footer">
        {/* Vote pill */}
        <div className="vote-pill">
          <button
            className={`vote-btn ${userVote === 1 ? 'upvoted' : ''}`}
            onClick={() => handleVoteClick(1)}
            title="Upvote"
          >
            ▲
          </button>
          <span className="vote-score">{voteScore}</span>
          <button
            className={`vote-btn ${userVote === -1 ? 'downvoted' : ''}`}
            onClick={() => handleVoteClick(-1)}
            title="Downvote"
          >
            ▼
          </button>
        </div>

        {/* Comment toggle button */}
        <button className="post-action-btn" onClick={handleToggleComments}>
          💬 {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
        </button>

        {/* Delete post button */}
        {user && user.id === post.author_id && (
          <button className="post-delete-btn" onClick={handleDeletePost}>
            🗑 Delete
          </button>
        )}
      </footer>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <section className="comments-section">
          {/* Add comment input */}
          <form className="comment-input-form" onSubmit={handleAddComment}>
            <input
              className="comment-input"
              type="text"
              placeholder="Write a thoughtful comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={submittingComment}
            >
              {submittingComment ? 'Sending…' : 'Comment'}
            </button>
          </form>

          {/* Comments thread list */}
          {loadingComments ? (
            <p style={{ color: '#8b949e', fontSize: 13 }}>Loading comments…</p>
          ) : comments.length === 0 ? (
            <p style={{ color: '#8b949e', fontSize: 13 }}>No comments yet. Be the first to start the discussion!</p>
          ) : (
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">u/{c.author_username}</span>
                    <span className="comment-time">• {formatDate(c.created_at)}</span>
                    {user && user.id === c.author_id && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="comment-body">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </article>
  );
}

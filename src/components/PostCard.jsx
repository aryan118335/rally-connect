import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function PostCard({ post, onVote, onDelete, onCommentClick }) {
  const { user } = useAuth();

  // Helper to format timestamps nicely
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

  async function handleVoteClick(direction) {
    if (onVote) {
      onVote(post.id, direction);
    }
  }

  async function handleDeleteClick() {
    if (confirm('Are you sure you want to delete this post?')) {
      if (onDelete) {
        onDelete(post.id);
      }
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
            className={`vote-btn ${post.user_vote === 1 ? 'upvoted' : ''}`}
            onClick={() => handleVoteClick(1)}
            title="Upvote"
          >
            ▲
          </button>
          <span className="vote-score">{post.vote_score || 0}</span>
          <button
            className={`vote-btn ${post.user_vote === -1 ? 'downvoted' : ''}`}
            onClick={() => handleVoteClick(-1)}
            title="Downvote"
          >
            ▼
          </button>
        </div>

        {/* Comment button */}
        <button
          className="post-action-btn"
          onClick={() => onCommentClick && onCommentClick(post)}
        >
          💬 {post.comment_count || 0} {post.comment_count === 1 ? 'Comment' : 'Comments'}
        </button>

        {/* Delete button for author */}
        {user && user.id === post.author_id && (
          <button className="post-delete-btn" onClick={handleDeleteClick}>
            🗑 Delete
          </button>
        )}
      </footer>
    </article>
  );
}

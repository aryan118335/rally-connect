import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Pages.css';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ posts: 0, communities: 0, comments: 0 });
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/users/profile/me')
      .then((data) => {
        if (mounted) {
          if (data.stats) setStats(data.stats);
          if (data.posts) setUserPosts(data.posts);
        }
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="page">
      {/* Profile header card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user?.username}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-joined">
            Joined: {user?.created_at ? formatDate(user.created_at) : 'Today'}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-number">{stats.posts}</span>
          <span className="stat-label">Posts</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{stats.communities}</span>
          <span className="stat-label">Communities</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{stats.comments}</span>
          <span className="stat-label">Comments</span>
        </div>
      </div>

      {/* Post history */}
      <div className="page-section">
        <h2 className="section-title">Your Recent Posts</h2>
        {loading ? (
          <p style={{ color: '#8b949e', fontSize: 13 }}>Loading activity…</p>
        ) : userPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No posts yet</h3>
            <p>Publish posts from the Home Feed to see your history here.</p>
          </div>
        ) : (
          <div className="posts-feed">
            {userPosts.map((p) => (
              <div key={p.id} className="post-card">
                <div className="post-header">
                  <span className="post-comm-badge">r/{p.community_name}</span>
                  <span className="post-meta">• {formatDate(p.created_at)}</span>
                </div>
                <h3 className="post-title" style={{ fontSize: 16 }}>{p.title}</h3>
                {p.content && <p className="post-content">{p.content}</p>}
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#8b949e', marginTop: 10 }}>
                  <span>▲ {p.vote_score || 0} Points</span>
                  <span>💬 {p.comment_count || 0} Comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

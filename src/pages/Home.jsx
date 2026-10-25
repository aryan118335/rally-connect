import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import PostCard from '../components/PostCard';
import './Pages.css';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'feed'

  // Create post state
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [posting, setPosting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Load feed posts
  async function loadPosts(tab = activeTab) {
    try {
      setLoading(true);
      const endpoint = tab === 'feed' ? '/posts?filter=feed' : '/posts';
      const data = await api.get(endpoint);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }

  // Load communities for dropdown
  async function loadCommunities() {
    try {
      const data = await api.get('/communities');
      const commList = data.communities || [];
      setCommunities(commList);
      if (commList.length > 0 && !selectedCommunity) {
        setSelectedCommunity(commList[0].id);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadPosts(activeTab);
    loadCommunities();
  }, [activeTab]);

  // Handle post creation
  async function handleCreatePost(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setPosting(true);
    setCreateError('');

    try {
      const data = await api.post('/posts', {
        title,
        content,
        community_id: selectedCommunity,
      });

      // Add to front of posts list
      setPosts((prev) => [data.post, ...prev]);
      setTitle('');
      setContent('');
      setExpanded(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to publish post.');
    } finally {
      setPosting(false);
    }
  }

  // Handle post deletion
  async function handleDeletePost(postId) {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err.message || 'Failed to delete post.');
    }
  }

  // Vote placeholder (wired fully in Stage 6)
  async function handleVote(postId, direction) {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentVote = p.user_vote || 0;
        const newVote = currentVote === direction ? 0 : direction;
        const scoreDiff = newVote - currentVote;
        return {
          ...p,
          user_vote: newVote,
          vote_score: (p.vote_score || 0) + scoreDiff,
        };
      })
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Home Feed</h1>
        <p className="page-subtitle">Discussions and posts from Rally communities</p>
      </div>

      {/* Create Post Widget */}
      <div className="create-post-card">
        {!expanded ? (
          <div className="create-post-collapsed" onClick={() => setExpanded(true)}>
            <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="create-post-input-fake">
              Create a post in a community…
            </div>
            <button className="create-comm-btn" style={{ padding: '8px 16px' }}>
              Post
            </button>
          </div>
        ) : (
          <form className="create-post-form" onSubmit={handleCreatePost}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, color: '#e6edf3', margin: 0 }}>Create a new post</h3>
              <select
                className="create-post-select"
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                required
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    r/{c.name} ({c.display_name})
                  </option>
                ))}
              </select>
            </div>

            {createError && <div className="auth-error">{createError}</div>}

            <input
              className="create-post-title-input"
              type="text"
              placeholder="Title of your post…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <textarea
              className="create-post-textarea"
              placeholder="Share thoughts, questions, or details (optional)…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="create-post-actions">
              <button
                type="button"
                className="comm-cancel-btn"
                onClick={() => setExpanded(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-comm-btn"
                disabled={posting}
              >
                {posting ? 'Publishing…' : 'Publish Post'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Feed Filter Tabs */}
      <div className="feed-tabs">
        <button
          className={`feed-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          🌐 All Posts
        </button>
        <button
          className={`feed-tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          ⭐ Joined Communities
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="empty-state">
          <p>Loading posts…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#f85149' }}>{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No posts in this feed yet</h3>
          <p>
            {activeTab === 'feed'
              ? 'Join some communities or switch to All Posts to see discussions!'
              : 'Be the first to share something with the community!'}
          </p>
        </div>
      ) : (
        <div className="posts-feed">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={handleVote}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../api';
import './Pages.css';

export default function Explore() {
  const [communities, setCommunities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create community modal/form state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch communities from API
  async function loadCommunities() {
    try {
      setLoading(true);
      const data = await api.get('/communities');
      setCommunities(data.communities || []);
    } catch (err) {
      setError(err.message || 'Failed to load communities.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunities();
  }, []);

  // Handle Join / Leave toggle
  async function handleToggleMembership(comm) {
    try {
      if (comm.is_member) {
        await api.post(`/communities/${comm.id}/leave`);
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === comm.id
              ? { ...c, is_member: false, member_count: Math.max(0, c.member_count - 1) }
              : c
          )
        );
      } else {
        await api.post(`/communities/${comm.id}/join`);
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === comm.id
              ? { ...c, is_member: true, member_count: c.member_count + 1 }
              : c
          )
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update membership.');
    }
  }

  // Handle creating new community
  async function handleCreateCommunity(e) {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const data = await api.post('/communities', {
        name,
        display_name: displayName,
        description,
      });

      // Add to list and close form
      setCommunities((prev) => [data.community, ...prev]);
      setName('');
      setDisplayName('');
      setDescription('');
      setShowCreate(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create community.');
    } finally {
      setCreating(false);
    }
  }

  // Filter communities by search term
  const filteredCommunities = communities.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.display_name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Explore Communities</h1>
        <p className="page-subtitle">Discover, join, or start new topic-based communities</p>
      </div>

      {/* Action bar: Search + Create Button */}
      <div className="community-actions-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by community name or topic…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="create-comm-btn" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ Create Community'}
        </button>
      </div>

      {/* Create Community Form */}
      {showCreate && (
        <div className="create-comm-box">
          <h2 className="create-comm-title">Start a New Community</h2>
          {formError && <div className="auth-error" style={{ marginBottom: 12 }}>{formError}</div>}
          <form onSubmit={handleCreateCommunity}>
            <div className="comm-form-group">
              <label>Community URL Name (e.g. artificial-intelligence)</label>
              <input
                type="text"
                placeholder="tech-enthusiasts"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="comm-form-group">
              <label>Display Title</label>
              <input
                type="text"
                placeholder="Tech Enthusiasts"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="comm-form-group">
              <label>Description</label>
              <textarea
                rows="3"
                placeholder="What is this community about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="comm-form-actions">
              <button
                type="button"
                className="comm-cancel-btn"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button type="submit" className="comm-submit-btn" disabled={creating}>
                {creating ? 'Creating…' : 'Create r/' + (name || 'community')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Community List */}
      {loading ? (
        <div className="empty-state">
          <p>Loading communities…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#f85149' }}>{error}</p>
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No communities found</h3>
          <p>{search ? 'Try searching for something else.' : 'No communities exist yet. Be the first to create one!'}</p>
        </div>
      ) : (
        <div className="communities-list">
          {filteredCommunities.map((comm) => (
            <div key={comm.id} className="community-card">
              <div className="community-card-left">
                <div className="comm-avatar">
                  {comm.name[0].toUpperCase()}
                </div>
                <div className="comm-info">
                  <h3>{comm.display_name} <span style={{ color: '#8b949e', fontWeight: 400, fontSize: 13 }}>r/{comm.name}</span></h3>
                  <p>{comm.description || 'Welcome to this community!'}</p>
                  <span className="comm-meta">👥 {comm.member_count} {comm.member_count === 1 ? 'member' : 'members'}</span>
                </div>
              </div>

              <div className="community-card-right">
                {comm.is_member ? (
                  <button
                    className="comm-leave-btn"
                    onClick={() => handleToggleMembership(comm)}
                  >
                    Joined ✓
                  </button>
                ) : (
                  <button
                    className="comm-join-btn"
                    onClick={() => handleToggleMembership(comm)}
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './Pages.css';

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMyCommunities() {
    try {
      setLoading(true);
      const data = await api.get('/communities/my');
      setCommunities(data.communities || []);
    } catch (err) {
      setError(err.message || 'Failed to load your communities.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyCommunities();
  }, []);

  async function handleLeave(communityId) {
    try {
      await api.post(`/communities/${communityId}/leave`);
      setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    } catch (err) {
      alert(err.message || 'Failed to leave community.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Communities</h1>
        <p className="page-subtitle">Communities you have joined and actively participate in</p>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading your communities…</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#f85149' }}>{error}</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏘️</div>
          <h3>You haven't joined any communities yet</h3>
          <p>Join communities to see their posts on your home feed.</p>
          <Link to="/explore" className="create-comm-btn" style={{ marginTop: 16, textDecoration: 'none' }}>
            Explore Communities
          </Link>
        </div>
      ) : (
        <div className="communities-list">
          {communities.map((comm) => (
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
                <button
                  className="comm-leave-btn"
                  onClick={() => handleLeave(comm.id)}
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

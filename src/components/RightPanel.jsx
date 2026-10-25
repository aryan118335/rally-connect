import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './RightPanel.css';

export default function RightPanel() {
  const [popularCommunities, setPopularCommunities] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.get('/communities')
      .then((data) => {
        if (mounted && data.communities) {
          // Take top 5
          setPopularCommunities(data.communities.slice(0, 5));
        }
      })
      .catch(() => {
        // Fallback to static sample if server not reachable
        if (mounted) {
          setPopularCommunities([
            { id: 1, name: 'technology', member_count: 42 },
            { id: 2, name: 'gaming', member_count: 31 },
            { id: 3, name: 'science', member_count: 28 },
          ]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="right-panel">
      <div className="panel-card">
        <h3 className="panel-title">🔥 Popular Communities</h3>
        <ul className="community-list">
          {popularCommunities.map((c) => (
            <li key={c.id || c.name} className="community-item">
              <Link to="/explore" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="community-name">r/{c.name}</span>
              </Link>
              <span className="community-members">
                {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel-card">
        <h3 className="panel-title">📋 About Rally</h3>
        <p className="panel-text">
          Rally is a community-driven desktop social platform. Join communities, share posts,
          vote on content and chat with other members.
        </p>
      </div>
    </aside>
  );
}

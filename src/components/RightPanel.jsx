import './RightPanel.css';

// RightPanel shows popular communities and trending info.
// In later stages these will be populated from the API.
export default function RightPanel() {
  // Placeholder data — replaced with real data in Stage 4
  const popularCommunities = [
    { name: 'r/technology', members: 412 },
    { name: 'r/gaming', members: 308 },
    { name: 'r/science', members: 275 },
    { name: 'r/movies', members: 193 },
    { name: 'r/music', members: 144 },
  ];

  return (
    <aside className="right-panel">
      <div className="panel-card">
        <h3 className="panel-title">🔥 Popular Communities</h3>
        <ul className="community-list">
          {popularCommunities.map((c) => (
            <li key={c.name} className="community-item">
              <span className="community-name">{c.name}</span>
              <span className="community-members">{c.members} members</span>
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

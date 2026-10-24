import './Pages.css';

// Explore — shows all available communities (placeholder for Stage 4)
export default function Explore() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Explore Communities</h1>
        <p className="page-subtitle">Discover communities you'll love</p>
      </div>

      {/* Search input — wired up in Stage 4 */}
      <div className="search-bar-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="Search communities…"
          disabled
        />
      </div>

      <div className="empty-state">
        <div className="empty-icon">🌐</div>
        <h3>Communities coming soon</h3>
        <p>Community browsing will be available after the backend is connected.</p>
      </div>
    </div>
  );
}

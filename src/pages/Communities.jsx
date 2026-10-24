import './Pages.css';

// My Communities — shows communities the logged-in user has joined (Stage 4)
export default function Communities() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Communities</h1>
        <p className="page-subtitle">Communities you've joined</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">🏘️</div>
        <h3>No communities yet</h3>
        <p>Explore and join communities to see them here.</p>
      </div>
    </div>
  );
}

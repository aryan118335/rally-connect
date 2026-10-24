import { useAuth } from '../context/AuthContext';
import './Pages.css';

// Profile — shows the logged-in user's info and their posts (Stage 3)
export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page">
      {/* Profile header card */}
      <div className="profile-card">
        <div className="profile-avatar">{user?.username[0].toUpperCase()}</div>
        <div className="profile-info">
          <h1 className="profile-name">{user?.username}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-joined">Member since today</p>
        </div>
      </div>

      {/* Stats row — filled in Stage 3 */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-number">0</span>
          <span className="stat-label">Posts</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">0</span>
          <span className="stat-label">Communities</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">0</span>
          <span className="stat-label">Comments</span>
        </div>
      </div>

      {/* Post history — filled in Stage 5 */}
      <div className="page-section">
        <h2 className="section-title">Recent Posts</h2>
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No posts yet</h3>
          <p>Posts you create will appear here.</p>
        </div>
      </div>
    </div>
  );
}

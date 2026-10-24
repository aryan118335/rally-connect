import { useAuth } from '../context/AuthContext';
import './Pages.css';

// Home is the main feed page — will be filled with real posts in Stage 5
export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Home Feed</h1>
        <p className="page-subtitle">Posts from communities you follow</p>
      </div>

      {/* Welcome banner shown for new/logged in users */}
      <div className="welcome-banner">
        <div className="welcome-icon">👋</div>
        <div>
          <h2>Welcome to Rally, {user?.username}!</h2>
          <p>Join some communities to start seeing posts in your feed.</p>
        </div>
      </div>

      {/* Placeholder — replaced with PostList in Stage 5 */}
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>Your feed is empty</h3>
        <p>Explore communities and join the ones you like to see their posts here.</p>
      </div>
    </div>
  );
}

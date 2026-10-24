import './Pages.css';

// Messages — real-time chat interface (Stage 7)
export default function Messages() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Direct Messages</h1>
        <p className="page-subtitle">Private conversations with other users</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">💬</div>
        <h3>No conversations yet</h3>
        <p>Search for a user to start a private conversation.</p>
      </div>
    </div>
  );
}

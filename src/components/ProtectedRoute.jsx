import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ProtectedRoute wraps pages that require a logged-in user.
// If no user is in AuthContext, it redirects to /login automatically.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // replace: true replaces the current history entry so the back button works correctly
    return <Navigate to="/login" replace />;
  }

  return children;
}

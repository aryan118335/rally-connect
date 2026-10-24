import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Communities from './pages/Communities';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// App is the root of the React application.
// BrowserRouter provides the URL-based navigation.
// AuthProvider wraps everything so all components can access the current user.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — anyone can visit these */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — only accessible when logged in */}
          {/* Layout provides the sidebar + right panel shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* These are "nested" routes — they render inside Layout's <Outlet /> */}
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="communities" element={<Communities />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Any unknown URL redirects to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

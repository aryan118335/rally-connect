import { createContext, useContext, useState } from 'react';

// Create the context object — this is what other components will import
const AuthContext = createContext(null);

// AuthProvider wraps the entire app and makes auth state available everywhere
export function AuthProvider({ children }) {
  // Initialize state synchronously from localStorage so there's zero render flash
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rally_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('rally_token') || null;
    } catch {
      return null;
    }
  });

  // Called when the user successfully logs in
  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('rally_user', JSON.stringify(userData));
    localStorage.setItem('rally_token', jwtToken);
  }

  // Called when the user clicks Logout
  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rally_user');
    localStorage.removeItem('rally_token');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for components
export function useAuth() {
  return useContext(AuthContext);
}

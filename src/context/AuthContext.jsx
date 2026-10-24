import { createContext, useContext, useState, useEffect } from 'react';

// Create the context object — this is what other components will import
const AuthContext = createContext(null);

// AuthProvider wraps the entire app and makes auth state available everywhere
export function AuthProvider({ children }) {
  // user holds the currently logged-in user object, or null if no one is logged in
  const [user, setUser] = useState(null);
  // token holds the JWT string, or null
  const [token, setToken] = useState(null);

  // On app load, check if the user was previously logged in (stored in localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('rally_user');
    const savedToken = localStorage.getItem('rally_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // Called when the user successfully logs in
  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    // Save to localStorage so the session survives a page refresh
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

// Custom hook — instead of writing useContext(AuthContext) everywhere,
// components just call useAuth()
export function useAuth() {
  return useContext(AuthContext);
}

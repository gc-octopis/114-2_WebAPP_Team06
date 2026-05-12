import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({ user: null, setUser: () => {}, refresh: () => {} });
const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function refresh() {
    try {
      const res = await fetch(`${AUTH_API_BASE}/api/auth/me`, { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      setUser(data);
      return data;
    } catch (e) {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;

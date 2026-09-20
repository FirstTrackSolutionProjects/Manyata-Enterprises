import { createContext, useContext, useEffect, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const refresh = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
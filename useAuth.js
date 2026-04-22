/**
 * hooks/useAuth.js — Authentication Context + Hook
 */

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("cp_token"));
  const [loading, setLoading] = useState(true);

  // Axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Fetch current user on mount if token exists
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    axios.get(`${API}/auth/me`)
      .then(res => setUser(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { accessToken, user: u } = res.data;
    localStorage.setItem("cp_token", accessToken);
    setToken(accessToken);
    setUser(u);
    return u;
  }

  async function register(username, email, password) {
    const res = await axios.post(`${API}/auth/register`, { username, email, password });
    const { accessToken, user: u } = res.data;
    localStorage.setItem("cp_token", accessToken);
    setToken(accessToken);
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem("cp_token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

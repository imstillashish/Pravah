import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "../api";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "logistics_planner" | "port_operator";
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchRole: (targetRole: "logistics_planner" | "port_operator") => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: "logistics_planner" | "port_operator") => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/switch-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target_role: targetRole })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.access_token, data.user);
        return true;
      }
    } catch (err) {
      console.error("Role switch error:", err);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

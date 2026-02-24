import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on app start
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api
        .get("/users/profile")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // 🔹 NEW: Refresh user function
  const refreshUser = async () => {
    try {
      const res = await api.get("/users/profile");
      setUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  // Login function
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    const { token, role } = res.data;

    localStorage.setItem("token", token);

    // Fetch full profile after login
    await refreshUser();

    return role;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
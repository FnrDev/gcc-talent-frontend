import { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser, logout } from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();

        // An in-flight lookup must not restore a session after a password reset.
        if (localStorage.getItem("token") === token) {
          setUser(user);
        }
      } catch {
        if (localStorage.getItem("token") === token) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  function handleLogout() {
    logout();

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout: handleLogout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hooks and their provider intentionally share this small context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

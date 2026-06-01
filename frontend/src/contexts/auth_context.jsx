import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";
import { getToken, setToken, clearAuth } from "../utils/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: getToken(),
    userType: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = getToken();

    if (token && !auth.user) {
      // A token persisted from a previous session — validate it against the
      // backend before trusting it, so a stale/revoked token logs the user out.
      getCurrentUser(token)
        .then((data) => {
          setAuth({
            token,
            userType: data.user_type,
            user: data,
            isLoading: false,
          });
        })
        .catch((err) => {
          console.error("Failed to fetch user data", err);
          setAuth({ token: null, userType: null, user: null, isLoading: false });
          clearAuth();
        });
    } else if (!token) {
      setAuth({ token: null, userType: null, user: null, isLoading: false });
    }
  }, []);

  const login = (token, userType, user, { remember = true } = {}) => {
    setToken(token, { persist: remember });
    setAuth({ token, userType, user, isLoading: false });
  };

  const logout = () => {
    clearAuth();
    setAuth({ token: null, userType: null, user: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

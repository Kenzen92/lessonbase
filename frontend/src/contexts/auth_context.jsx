import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: window.sessionStorage.getItem("token"),
    userType: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = window.sessionStorage.getItem("token");

    if (token && !auth.user) {
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
          window.sessionStorage.removeItem("token");
        });
    } else if (!token) {
      setAuth({ token: null, userType: null, user: null, isLoading: false });
    }
  }, []);

  const login = (token, userType, user) => {
    window.sessionStorage.setItem("token", token);
    setAuth({ token, userType, user, isLoading: false });
  };

  const logout = () => {
    window.sessionStorage.removeItem("token");
    setAuth({ token: null, userType: null, user: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

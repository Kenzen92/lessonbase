import { createContext, useContext, useState, useEffect } from "react";
import { fetchCurrentUser } from "../utils/agent";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: window.sessionStorage.getItem("token"),
    userType: null,
  });

  useEffect(() => {
    const token = window.sessionStorage.getItem("token");

    if (token && !auth.userType) {
      fetchCurrentUser()
        .then((data) => {
          setAuth({
            token,
            userType: data.user_type, // adapt this to your actual key
          });
        })
        .catch((err) => {
          console.error("Failed to fetch user data", err);
          setAuth({ token: null, userType: null, user: null });
          window.sessionStorage.removeItem("token");
        });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

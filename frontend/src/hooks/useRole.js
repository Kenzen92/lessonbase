import { useContext } from "react";
import { AuthContext } from "../contexts/auth_context";

/**
 * Single accessor for the authenticated account's role. Tolerates a missing
 * AuthProvider (component tests render shells standalone) by reporting no
 * role, which consumers treat as "don't restrict yet".
 */
export default function useRole() {
  const ctx = useContext(AuthContext);
  const userType = ctx?.auth?.userType ?? null;
  return {
    userType,
    isTeacher: userType === "teacher",
    isStudent: userType === "student",
  };
}

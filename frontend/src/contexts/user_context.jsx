import { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthQuery from "../hooks/useAuthQuery.jsx";
import { fetchProfileData } from "../utils/agent";

// Create the context
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const queryClient = useQueryClient();

  // Fetch user profile via React Query (gated by auth token)
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useAuthQuery(["user"], fetchProfileData, {
    staleTime: 1000 * 60 * 5, // Cache valid for 5 minutes
    retry: 1, // Retry once on failure
  });

  // Manual setter — allows updating the cached user data locally
  const setUser = (updatedUser) => {
    if (!updatedUser) return;
    queryClient.setQueryData(["user"], (oldData) => ({
      ...oldData,
      ...updatedUser,
    }));
  };

  // Helper to safely access specific fields
  const value = useMemo(() => {
    return {
      user,
      isLoading,
      isError,
      error,
      refetch,
      setUser,
      // for convenience: expose individual fields with null defaults
      userId: user?.id ?? null,
      username: user?.username ?? null,
      firstName: user?.first_name ?? null,
      lastName: user?.last_name ?? null,
      enrollmentDate: user?.enrollment_date ?? null,
      profilePicture: user?.profile_picture ?? null,
      classGroups: user?.class_groups ?? [],
      subjects: user?.subjects ?? [],
    };
  }, [user, isLoading, isError, error, refetch]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};

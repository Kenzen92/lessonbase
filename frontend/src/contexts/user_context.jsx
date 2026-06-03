import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthQuery from "../hooks/useAuthQuery.jsx";
import { fetchProfileData } from "../utils/agent";

// Create the context
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const queryClient = useQueryClient();

  // Lazy gate: stay disabled until a component consumes this context (via
  // useUser), so routes that never read the profile don't fetch it.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

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
    enabled: active,
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
      // While inactive the query is disabled and react-query reports
      // isLoading=false with no data; surface it as loading so consumers that
      // gate rendering on isLoading don't read undefined data before activation.
      isLoading: !active || isLoading,
      isError,
      error,
      refetch,
      activate,
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
  }, [user, isLoading, isError, error, refetch, activate, active]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");

  // Activating on mount is what makes the underlying query fire.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

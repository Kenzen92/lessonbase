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
import {
  fetchTeacherStatistics,
  fetchStudentStatistics,
} from "../utils/agent.js";
import { useAuth } from "./auth_context.jsx";

export const StatisticsContext = createContext(null);

export const StatisticsProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { auth } = useAuth();

  // Lazy gate: stay disabled until a component consumes this context (via
  // useStatistics), so routes that never read statistics don't fetch them.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

  // Fetch statistics based on user type
  const fetchFunction =
    auth?.userType === "teacher"
      ? fetchTeacherStatistics
      : fetchStudentStatistics;

  const query = useAuthQuery(["statistics", auth?.userType], fetchFunction, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    // Only fetch once consumed, authenticated, and the user type is known.
    enabled: active && !!auth?.token && !!auth?.userType,
  });

  const setStatistics = (data) =>
    queryClient.setQueryData(["statistics", auth?.userType], data);

  const value = useMemo(
    () => ({
      ...query,
      // While inactive the query is disabled and react-query reports
      // isLoading=false with no data; surface it as loading so consumers that
      // gate rendering on isLoading don't read undefined data before activation.
      isLoading: !active || query.isLoading,
      setStatistics,
      activate,
      statistics: query.data?.data, // Extract the nested data property
    }),
    [query, activate, active]
  );

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const ctx = useContext(StatisticsContext);
  if (!ctx)
    throw new Error("useStatistics must be used within a StatisticsProvider");

  // Activating on mount is what makes the underlying query fire.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

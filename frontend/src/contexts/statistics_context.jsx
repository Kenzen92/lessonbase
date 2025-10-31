import { createContext, useContext, useMemo } from "react";
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

  // Fetch statistics based on user type
  const fetchFunction =
    auth?.userType === "teacher"
      ? fetchTeacherStatistics
      : fetchStudentStatistics;

  const query = useAuthQuery(["statistics", auth?.userType], fetchFunction, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !!auth?.token && !!auth?.userType, // Only fetch when authenticated
  });

  const setStatistics = (data) =>
    queryClient.setQueryData(["statistics", auth?.userType], data);

  const value = useMemo(
    () => ({
      ...query,
      setStatistics,
      statistics: query.data?.data, // Extract the nested data property
    }),
    [query]
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
  return ctx;
};

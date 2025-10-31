import { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthQuery from "../hooks/useAuthQuery.jsx";
import { fetchAllAssignments } from "../utils/agent.js";

export const AssignmentsContext = createContext(null);

export const AssignmentsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const query = useAuthQuery(["assignments"], fetchAllAssignments, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const setAssignments = (data) =>
    queryClient.setQueryData(["assignments"], data);

  const value = useMemo(() => ({ ...query, setAssignments }), [query]);

  return (
    <AssignmentsContext.Provider value={value}>
      {children}
    </AssignmentsContext.Provider>
  );
};

export const useAssignments = () => {
  const ctx = useContext(AssignmentsContext);
  if (!ctx)
    throw new Error(
      "useAssignments must be used within an AssignmentsProvider"
    );
  return ctx;
};

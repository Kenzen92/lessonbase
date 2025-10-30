import { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthQuery from "../hooks/useAuthQuery.jsx";
import { fetchClassGroups } from "../utils/agent.js";

export const ClassGroupsContext = createContext(null);

export const ClassGroupsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const query = useAuthQuery(["classGroups"], fetchClassGroups, {
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const setClassGroups = (data) =>
    queryClient.setQueryData(["classGroups"], data);

  const value = useMemo(() => ({ ...query, setClassGroups }), [query]);

  return (
    <ClassGroupsContext.Provider value={value}>
      {children}
    </ClassGroupsContext.Provider>
  );
};

export const useClassGroups = () => {
  const ctx = useContext(ClassGroupsContext);
  if (!ctx)
    throw new Error("useClassGroups must be used within a ClassGroupsProvider");
  return ctx;
};

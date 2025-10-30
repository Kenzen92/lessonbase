import { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthQuery from "../hooks/useAuthQuery.jsx";
import { fetchSubjects, fetchAllSubjects } from "../utils/agent.js";

export const SubjectsContext = createContext(null);

export const SubjectsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const query = useAuthQuery(["subjects"], fetchSubjects, {
    staleTime: 1000 * 60 * 10,
    // keep a small retry count for network flakiness
    retry: 1,
  });

  const allSubjectsData = useAuthQuery(["all-subjects"], fetchAllSubjects, {
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const setSubjects = (data) => queryClient.setQueryData(["subjects"], data);

  const setAllSubjects = (data) =>
    queryClient.setQueryData(["all-subjects"], data);

  // Keep the original query spread for backward compatibility
  // and add `allSubjects` plus a setter so consumers can read/write both caches.
  const value = useMemo(
    () => ({
      ...query,
      setSubjects,
      allSubjects: allSubjectsData,
      setAllSubjects,
    }),
    [query, allSubjectsData]
  );

  return (
    <SubjectsContext.Provider value={value}>
      {children}
    </SubjectsContext.Provider>
  );
};

export const useSubjects = () => {
  const ctx = useContext(SubjectsContext);
  if (!ctx)
    throw new Error("useSubjects must be used within a SubjectsProvider");
  return ctx;
};

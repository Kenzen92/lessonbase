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
import { fetchSubjects, fetchAllSubjects } from "../utils/agent.js";

export const SubjectsContext = createContext(null);

export const SubjectsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Lazy gate: stay disabled until a component consumes this context (via
  // useSubjects). Both the subjects and all-subjects queries share the gate.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

  const query = useAuthQuery(["subjects"], fetchSubjects, {
    staleTime: 1000 * 60 * 10,
    // keep a small retry count for network flakiness
    retry: 1,
    enabled: active,
  });

  const allSubjectsData = useAuthQuery(["all-subjects"], fetchAllSubjects, {
    staleTime: 1000 * 60 * 60,
    retry: 1,
    enabled: active,
  });

  const setSubjects = (data) => queryClient.setQueryData(["subjects"], data);

  const setAllSubjects = (data) =>
    queryClient.setQueryData(["all-subjects"], data);

  // Keep the original query spread for backward compatibility
  // and add `allSubjects` plus a setter so consumers can read/write both caches.
  const value = useMemo(
    () => ({
      ...query,
      // While inactive the queries are disabled and react-query reports
      // isLoading=false with no data; surface it as loading so consumers that
      // gate rendering on isLoading don't read undefined data before activation.
      isLoading: !active || query.isLoading,
      setSubjects,
      allSubjects: {
        ...allSubjectsData,
        isLoading: !active || allSubjectsData.isLoading,
      },
      setAllSubjects,
      activate,
    }),
    [query, allSubjectsData, activate, active]
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

  // Activating on mount is what makes the underlying queries fire.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

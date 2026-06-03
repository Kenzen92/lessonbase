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
import { fetchStudents } from "../utils/agent.js";

export const StudentsContext = createContext(null);

export const StudentsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Lazy gate: stay disabled until a component consumes this context (via
  // useStudents), so routes that never read students don't fetch them.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

  const query = useAuthQuery(["students"], fetchStudents, {
    staleTime: 1000 * 60 * 10,
    retry: 1,
    enabled: active,
  });

  const setStudents = (data) => queryClient.setQueryData(["students"], data);

  const value = useMemo(
    // While inactive the query is disabled and react-query reports
    // isLoading=false with no data; surface it as loading so consumers that
    // gate rendering on isLoading don't read undefined data before activation.
    () => ({ ...query, isLoading: !active || query.isLoading, setStudents, activate }),
    [query, activate, active]
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudents = () => {
  const ctx = useContext(StudentsContext);
  if (!ctx)
    throw new Error("useStudents must be used within a StudentsProvider");

  // Activating on mount is what makes the underlying query fire.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

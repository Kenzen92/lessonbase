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
import { fetchClassEvents } from "../utils/agent.js";

export const ClassEventsContext = createContext(null);

export const ClassEventsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Lazy gate: stay disabled until a component consumes this context (via
  // useClassEvents), so routes that never read class events don't fetch them.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

  const query = useAuthQuery(["classEvents"], fetchClassEvents, {
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: active,
  });

  const setClassEvents = (data) =>
    queryClient.setQueryData(["classEvents"], data);

  const value = useMemo(
    // While inactive the query is disabled and react-query reports
    // isLoading=false with no data; surface it as loading so consumers that
    // gate rendering on isLoading don't read undefined data before activation.
    () => ({ ...query, isLoading: !active || query.isLoading, setClassEvents, activate }),
    [query, activate, active]
  );

  return (
    <ClassEventsContext.Provider value={value}>
      {children}
    </ClassEventsContext.Provider>
  );
};

export const useClassEvents = () => {
  const ctx = useContext(ClassEventsContext);
  if (!ctx)
    throw new Error("useClassEvents must be used within a ClassEventsProvider");

  // Activating on mount is what makes the underlying query fire.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

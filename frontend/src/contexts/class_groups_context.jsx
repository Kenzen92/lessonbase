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
import { fetchClassGroups } from "../utils/agent.js";

export const ClassGroupsContext = createContext(null);

export const ClassGroupsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Lazy gate: stay disabled until a component consumes this context (via
  // useClassGroups), so routes that never read class groups don't fetch them.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

  const query = useAuthQuery(["classGroups"], fetchClassGroups, {
    staleTime: 1000 * 60 * 10,
    retry: 1,
    enabled: active,
  });

  const setClassGroups = (data) =>
    queryClient.setQueryData(["classGroups"], data);

  const value = useMemo(
    // While inactive the query is disabled and react-query reports
    // isLoading=false with no data; surface it as loading so consumers that
    // gate rendering on isLoading don't read undefined data before activation.
    () => ({ ...query, isLoading: !active || query.isLoading, setClassGroups, activate }),
    [query, activate, active]
  );

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

  // Activating on mount is what makes the underlying query fire.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

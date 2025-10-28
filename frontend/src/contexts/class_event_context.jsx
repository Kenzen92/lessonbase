import { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClassEvents } from "../utils/agent.js";

export const ClassEventsContext = createContext(null);

export const ClassEventsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["classEvents"],
    queryFn: fetchClassEvents,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const setClassEvents = (data) =>
    queryClient.setQueryData(["classEvents"], data);

  const value = useMemo(() => ({ ...query, setClassEvents }), [query]);

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
  return ctx;
};

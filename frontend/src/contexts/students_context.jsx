import { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStudents } from "../utils/agent.js";

export const StudentsContext = createContext(null);

export const StudentsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const setStudents = (data) => queryClient.setQueryData(["students"], data);

  const value = useMemo(() => ({ ...query, setStudents }), [query]);

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
  return ctx;
};

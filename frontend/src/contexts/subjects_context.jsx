import { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSubjects } from "../utils/agent.js";

export const SubjectsContext = createContext(null);

export const SubjectsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const setSubjects = (data) => queryClient.setQueryData(["subjects"], data);

  const value = useMemo(() => ({ ...query, setSubjects }), [query]);

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

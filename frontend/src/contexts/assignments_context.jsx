import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useAuthQuery from "../hooks/useAuthQuery.jsx";
import {
  fetchAllAssignments,
  handleCreateAssignment,
  fetchAssignment,
} from "../utils/agent.js";

export const AssignmentsContext = createContext(null);

export const AssignmentsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Lazy gate: the query stays disabled until a component actually consumes
  // this context (via useAssignments), so we don't fetch assignments on routes
  // that never read them.
  const [active, setActive] = useState(false);
  const activate = useCallback(() => setActive(true), []);

  const {
    data: assignments,
    isLoading,
    isError,
    error,
    refetch,
  } = useAuthQuery(["assignments"], fetchAllAssignments, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: active,
  });

  // Manual setter for updating cached assignments data
  const setAssignments = useCallback(
    (data) => {
      queryClient.setQueryData(["assignments"], data);
    },
    [queryClient]
  );

  // Update a specific assignment in the cache
  const updateAssignment = useCallback(
    (assignmentId, updatedData) => {
      queryClient.setQueryData(["assignments"], (oldData) => {
        if (!oldData) return oldData;

        const updated = { ...oldData };
        for (const category in updated) {
          updated[category] = updated[category].map((assignment) =>
            assignment.id === assignmentId
              ? { ...assignment, ...updatedData }
              : assignment
          );
        }
        return updated;
      });
    },
    [queryClient]
  );

  // Add a new assignment to the cache optimistically
  const addAssignment = useCallback(
    (newAssignment, category = "Set") => {
      queryClient.setQueryData(["assignments"], (oldData) => {
        if (!oldData) return { [category]: [newAssignment] };

        return {
          ...oldData,
          [category]: [newAssignment, ...(oldData[category] || [])],
        };
      });
    },
    [queryClient]
  );

  // Remove an assignment from the cache
  const removeAssignment = useCallback(
    (assignmentId) => {
      queryClient.setQueryData(["assignments"], (oldData) => {
        if (!oldData) return oldData;

        const updated = { ...oldData };
        for (const category in updated) {
          updated[category] = updated[category].filter(
            (assignment) => assignment.id !== assignmentId
          );
        }
        return updated;
      });
    },
    [queryClient]
  );

  // Move assignment between categories (e.g., from "Set" to "To Mark")
  const moveAssignment = useCallback(
    (assignmentId, fromCategory, toCategory) => {
      queryClient.setQueryData(["assignments"], (oldData) => {
        if (!oldData) return oldData;

        const assignment = oldData[fromCategory]?.find(
          (a) => a.id === assignmentId
        );
        if (!assignment) return oldData;

        return {
          ...oldData,
          [fromCategory]: oldData[fromCategory].filter(
            (a) => a.id !== assignmentId
          ),
          [toCategory]: [assignment, ...(oldData[toCategory] || [])],
        };
      });
    },
    [queryClient]
  );

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    // handleCreateAssignment resolves to an { ok, status, data, error } envelope
    // and never throws, so translate a non-ok result into a thrown error here to
    // drive React Query's onError path.
    mutationFn: async (data) => {
      const result = await handleCreateAssignment(data);
      if (!result.ok) {
        throw new Error(result.error || "Failed to create assignment");
      }
      return result.data;
    },
    onSuccess: (result, variables) => {
      // Refetch to get the updated data from the server
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create assignment:", error);
    },
  });

  // Fetch a single assignment (useful for details view)
  const getAssignment = useCallback(
    async (assignmentId) => {
      // Check cache first
      if (assignments) {
        for (const category in assignments) {
          const found = assignments[category].find(
            (a) => a.id === assignmentId
          );
          if (found) return found;
        }
      }
      // Fetch from server if not in cache
      return await fetchAssignment(assignmentId);
    },
    [assignments]
  );

  // Helper to get assignments by category
  const getAssignmentsByCategory = useCallback(
    (category) => {
      return assignments?.[category] || [];
    },
    [assignments]
  );

  // Helper to get total assignment count
  const getTotalCount = useCallback(() => {
    if (!assignments) return 0;
    return Object.values(assignments).reduce(
      (total, categoryAssignments) => total + categoryAssignments.length,
      0
    );
  }, [assignments]);

  // Helper to get count by category
  const getCategoryCount = useCallback(
    (category) => {
      return assignments?.[category]?.length || 0;
    },
    [assignments]
  );

  const value = useMemo(
    () => ({
      // Original query data
      data: assignments,
      assignments,
      // While inactive the query is disabled and react-query reports
      // isLoading=false with no data; surface it as loading so consumers that
      // gate rendering on isLoading don't read undefined data before activation.
      isLoading: !active || isLoading,
      isError,
      error,
      refetch,
      activate,

      // Cache manipulation methods
      setAssignments,
      updateAssignment,
      addAssignment,
      removeAssignment,
      moveAssignment,

      // Mutations
      createAssignment: createAssignmentMutation.mutate,
      createAssignmentAsync: createAssignmentMutation.mutateAsync,
      isCreating: createAssignmentMutation.isPending,
      createError: createAssignmentMutation.error,

      // Helper methods
      getAssignment,
      getAssignmentsByCategory,
      getTotalCount,
      getCategoryCount,
    }),
    [
      assignments,
      active,
      isLoading,
      isError,
      error,
      refetch,
      activate,
      setAssignments,
      updateAssignment,
      addAssignment,
      removeAssignment,
      moveAssignment,
      createAssignmentMutation.mutate,
      createAssignmentMutation.mutateAsync,
      createAssignmentMutation.isPending,
      createAssignmentMutation.error,
      getAssignment,
      getAssignmentsByCategory,
      getTotalCount,
      getCategoryCount,
    ]
  );

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

  // Activating on mount is what makes the underlying query fire. Because this
  // runs only when a component consumes the context, routes that never call
  // useAssignments never trigger the /assignment/ fetch.
  const { activate } = ctx;
  useEffect(() => {
    activate();
  }, [activate]);

  return ctx;
};

import { useAuth } from "../contexts/auth_context.jsx";
import { useQuery } from "@tanstack/react-query";

/**
 * Wrapper around react-query's useQuery that automatically gates queries
 * until an auth token is available.
 *
 * Signature mirrors the common (queryKey, queryFn, options) form.
 */
export default function useAuthQuery(queryKey, queryFn, options = {}) {
  const { auth } = useAuth();

  const enabled =
    options.enabled !== undefined
      ? Boolean(options.enabled) && !!auth?.token
      : !!auth?.token;

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    ...options,
  });
}

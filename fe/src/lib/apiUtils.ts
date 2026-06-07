import type { AuthHeaders } from "../types/api";

/**
 * Builds auth headers for API requests.
 * Includes x-user-id and optionally Authorization Bearer token.
 */
export const buildAuthHeaders = (
  auth: AuthHeaders,
  extra?: Record<string, string>,
): Record<string, string> => ({
  ...(extra ?? {}),
  "x-user-id": auth.userId,
  ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
});

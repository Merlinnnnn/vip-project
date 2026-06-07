export type AuthHeaders = {
  userId: string;
  token?: string | null;
};

// buildAuthHeaders has been moved to src/lib/apiUtils.ts
// Re-exported here for backward compatibility
export { buildAuthHeaders } from "../lib/apiUtils";

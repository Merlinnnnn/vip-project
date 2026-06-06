export type AuthHeaders = {
  userId: string;
  token?: string | null;
};

export const buildAuthHeaders = (
  auth: AuthHeaders,
  extra?: Record<string, string>,
): Record<string, string> => ({
  ...(extra ?? {}),
  "x-user-id": auth.userId,
  ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
});

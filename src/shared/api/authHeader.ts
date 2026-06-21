export const createAuthHeaders = (
  accessToken?: string | null
): Record<string, string> => {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`
  };
};

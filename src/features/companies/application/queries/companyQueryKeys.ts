export const companyQueryKeys = {
  all: ['companies'] as const,
  list: (userId: string) => [...companyQueryKeys.all, 'list', userId] as const
};

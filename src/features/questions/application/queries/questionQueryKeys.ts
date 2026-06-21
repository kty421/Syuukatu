export const questionQueryKeys = {
  all: ['questions'] as const,
  data: (userId: string) => [...questionQueryKeys.all, 'data', userId] as const
};

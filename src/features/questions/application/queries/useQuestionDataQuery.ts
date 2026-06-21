import { useQuery } from '@tanstack/react-query';

import { QuestionRepository } from '../../domain/repositories/QuestionRepository';
import { httpQuestionRepository } from '../../infrastructure/repositories/HttpQuestionRepository';
import { questionQueryKeys } from './questionQueryKeys';

type UseQuestionDataQueryParams = {
  getAccessToken: () => Promise<string | null>;
  repository?: QuestionRepository;
  userId: string;
};

export const useQuestionDataQuery = ({
  getAccessToken,
  repository = httpQuestionRepository,
  userId
}: UseQuestionDataQueryParams) =>
  useQuery({
    queryFn: async () => repository.listQuestionData(await getAccessToken()),
    queryKey: questionQueryKeys.data(userId)
  });

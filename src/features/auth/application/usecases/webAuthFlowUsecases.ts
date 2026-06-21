import {
  AuthConfirmState,
  INVALID_PASSWORD_RESET_LINK_MESSAGE
} from '../../domain/entities/authFlow';
import { AuthFlowRepository } from '../../domain/repositories/AuthFlowRepository';
import { webAuthFlowRepository } from '../../infrastructure/repositories/WebAuthFlowRepository';

export { INVALID_PASSWORD_RESET_LINK_MESSAGE };

export const getInitialConfirmState = (): AuthConfirmState => ({
  status: 'loading',
  message: '確認中'
});

export const verifyEmailConfirmationLink = (
  repository: AuthFlowRepository = webAuthFlowRepository
) => repository.verifyEmailConfirmationLink();

export const prepareWebPasswordReset = (
  repository: AuthFlowRepository = webAuthFlowRepository
) => repository.preparePasswordReset();

export const updateWebPassword = (
  newPassword: string,
  repository: AuthFlowRepository = webAuthFlowRepository
) => repository.updatePassword(newPassword);

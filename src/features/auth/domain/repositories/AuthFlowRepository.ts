import {
  AuthConfirmState,
  PasswordResetPreparation
} from '../entities/authFlow';

export type AuthFlowRepository = {
  preparePasswordReset: () => Promise<PasswordResetPreparation>;
  updatePassword: (newPassword: string) => Promise<string>;
  verifyEmailConfirmationLink: () => Promise<AuthConfirmState>;
};

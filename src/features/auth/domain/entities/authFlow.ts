export const INVALID_CONFIRM_LINK_MESSAGE =
  '確認リンクが無効です。最新のメールから再度お試しください。';

export const EXPIRED_CONFIRM_LINK_MESSAGE =
  'メールリンクが無効、または有効期限が切れています。最新のメールから再度お試しください。';

export const INVALID_PASSWORD_RESET_LINK_MESSAGE =
  'リンクが無効、または有効期限が切れています。再度パスワード再設定メールを送信してください。';

export type AuthConfirmState = {
  status: 'loading' | 'success' | 'error';
  message: string;
};

export type PasswordResetPreparation = {
  status: 'ready' | 'error';
  message?: string;
};

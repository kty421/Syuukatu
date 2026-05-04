const RATE_LIMIT_MESSAGE =
  '確認メールの送信回数が上限に達しました。時間をおいて再度お試しください。';

export const normalizeAuthErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('rate limit') ||
    normalized.includes('email rate limit') ||
    normalized.includes('over_email_send_rate_limit')
  ) {
    return RATE_LIMIT_MESSAGE;
  }

  return message;
};

export const normalizeAuthError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : '認証に失敗しました。';

  return new Error(normalizeAuthErrorMessage(message));
};

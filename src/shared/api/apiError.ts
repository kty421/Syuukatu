export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'TOO_MANY_REQUESTS'
  | 'SERVER_ERROR'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'NON_JSON_RESPONSE'
  | 'EMPTY_RESPONSE'
  | 'UNKNOWN_ERROR';

export type ApiFailurePayload = {
  error?: string | {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
  code?: string;
  details?: unknown;
};

const defaultMessageByStatus: Record<number, string> = {
  400: '入力内容を確認してください。',
  401: 'ログインが必要です。',
  403: 'この操作を行う権限がありません。',
  404: '対象のデータが見つかりません。',
  409: '同じ内容のデータが既に存在します。',
  415: 'リクエスト形式が正しくありません。',
  422: '入力内容を確認してください。',
  429: 'アクセスが集中しています。少し待ってからもう一度お試しください。',
  500: 'サーバーで問題が発生しました。しばらくしてからもう一度お試しください。'
};

const codeByStatus: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
  500: 'SERVER_ERROR'
};

export class ApiError extends Error {
  code: ApiErrorCode;
  details?: unknown;
  status: number;

  constructor(params: {
    code?: ApiErrorCode;
    details?: unknown;
    message?: string;
    status: number;
  }) {
    super(
      params.message ??
        defaultMessageByStatus[params.status] ??
        '通信に失敗しました。しばらくしてからもう一度お試しください。'
    );
    this.name = 'ApiError';
    this.code = params.code ?? codeByStatus[params.status] ?? 'UNKNOWN_ERROR';
    this.details = params.details;
    this.status = params.status;
  }
}

const asString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export const getApiErrorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : '通信に失敗しました。ネットワーク接続を確認してください。';

export const getFailureMessage = (payload: unknown, status: number) => {
  const failure =
    payload && typeof payload === 'object'
      ? (payload as ApiFailurePayload)
      : {};
  const nestedError =
    failure.error && typeof failure.error === 'object'
      ? failure.error
      : undefined;
  const message =
    asString(failure.message) ??
    asString(failure.error) ??
    asString(nestedError?.message);

  if (/invalid api key|invalid apikey/i.test(message ?? '')) {
    return 'SupabaseのAPIキーが正しくありません。VercelのSUPABASE_ANON_KEYとEXPO_PUBLIC_SUPABASE_ANON_KEYを確認してから再デプロイしてください。';
  }

  return message ?? defaultMessageByStatus[status];
};

export const getFailureCode = (
  payload: unknown,
  status: number
): ApiErrorCode => {
  const failure =
    payload && typeof payload === 'object'
      ? (payload as ApiFailurePayload)
      : {};
  const nestedError =
    failure.error && typeof failure.error === 'object'
      ? failure.error
      : undefined;
  const rawCode = asString(failure.code) ?? asString(nestedError?.code);

  return (rawCode as ApiErrorCode | undefined) ?? codeByStatus[status] ?? 'UNKNOWN_ERROR';
};

export const getFailureDetails = (payload: unknown) => {
  const failure =
    payload && typeof payload === 'object'
      ? (payload as ApiFailurePayload)
      : {};
  const nestedError =
    failure.error && typeof failure.error === 'object'
      ? failure.error
      : undefined;

  return failure.details ?? nestedError?.details;
};

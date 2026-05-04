import { Platform } from 'react-native';

import { getApiUrl } from '../config/env';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  timeoutMs?: number;
};

type ApiErrorPayload = {
  error?: string | { code?: string; message?: string };
  message?: string;
  code?: string;
};

type ParsedApiResponse = {
  payload: unknown;
  isJson: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const parseApiResponse = async (
  response: Response
): Promise<ParsedApiResponse> => {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson =
    contentType.includes('application/json') || contentType.includes('+json');
  const text = await response.text();

  if (!text) {
    return { payload: null, isJson };
  }

  if (!isJson) {
    return { payload: text, isJson: false };
  }

  try {
    return { payload: JSON.parse(text) as unknown, isJson };
  } catch {
    return { payload: null, isJson };
  }
};

const getNonJsonApiMessage = (
  payload: unknown,
  status: number,
  requestUrl: string
) => {
  const text = typeof payload === 'string' ? payload : '';
  const isVercelUrl = /^https:\/\/[^/]+\.vercel\.app/i.test(requestUrl);

  if (
    status === 404 &&
    isVercelUrl &&
    /page could not be found|not_found/i.test(text)
  ) {
    return 'VercelのProduction URLでアプリまたはAPIが見つかりません。Production Branch、Build Command、Output Directory、最新デプロイの状態を確認してください。';
  }

  if (
    status === 401 &&
    /authentication required|vercel/i.test(text)
  ) {
    return 'VercelのDeployment ProtectionによりAPIへ接続できません。EXPO_PUBLIC_API_BASE_URLには保護されていないProduction URLを設定するか、Vercel側で対象デプロイの保護を解除してください。';
  }

  if (/<!doctype html|<html/i.test(text)) {
    return 'APIからHTMLが返りました。Vercel APIのデプロイ、Deployment Protection、またはrewrite設定を確認してください。';
  }

  if (/^https?:\/\//i.test(requestUrl)) {
    return 'APIからJSONではない応答が返りました。Vercel APIのURLとデプロイ設定を確認してください。';
  }

  return 'APIからJSONではない応答が返りました。.env の EXPO_PUBLIC_API_BASE_URL にVercel URLを設定してください。';
};

const asString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const getJsonApiErrorMessage = (
  payload: unknown,
  status: number,
  requestUrl: string
) => {
  const errorPayload =
    payload && typeof payload === 'object'
      ? (payload as ApiErrorPayload)
      : {};
  const nestedError =
    errorPayload.error && typeof errorPayload.error === 'object'
      ? errorPayload.error
      : undefined;
  const code =
    asString(errorPayload.code) ??
    asString(nestedError?.code);
  const message =
    asString(errorPayload.message) ??
    asString(errorPayload.error) ??
    asString(nestedError?.message);
  const isVercelUrl = /^https:\/\/[^/]+\.vercel\.app/i.test(requestUrl);

  if (
    status === 404 &&
    isVercelUrl &&
    (code === 'NOT_FOUND' || /page could not be found|not_found/i.test(message ?? ''))
  ) {
    return 'VercelのProduction URLでアプリまたはAPIが見つかりません。Production Branch、Build Command、Output Directory、最新デプロイの状態を確認してください。';
  }

  if (/invalid api key|invalid apikey/i.test(message ?? '')) {
    return 'SupabaseのAPIキーが正しくありません。VercelのSUPABASE_ANON_KEYとEXPO_PUBLIC_SUPABASE_ANON_KEYを確認してから再デプロイしてください。';
  }

  return (
    message ??
    '通信に失敗しました。しばらくしてからもう一度お試しください。'
  );
};

const logApiRequest = (method: string, path: string, requestUrl: string) => {
  if (!__DEV__) {
    return;
  }

  console.log('[api request]', {
    platform: Platform.OS,
    method,
    path,
    requestUrl
  });
};

export const apiRequest = async <T>(
  path: string,
  {
    method = 'GET',
    body,
    accessToken,
    timeoutMs = 15000
  }: ApiRequestOptions = {}
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let requestUrl = '';
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    requestUrl = getApiUrl(path);
    logApiRequest(method, path, requestUrl);
    const response = await fetch(requestUrl, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: Platform.OS === 'web' ? 'include' : undefined,
      signal: controller.signal
    });
    const { payload, isJson } = await parseApiResponse(response);

    if (!isJson) {
      throw new ApiError(
        getNonJsonApiMessage(payload, response.status, requestUrl),
        response.status
      );
    }

    if (!response.ok) {
      throw new ApiError(
        getJsonApiErrorMessage(payload, response.status, requestUrl),
        response.status
      );
    }

    if (payload === null) {
      throw new ApiError(
        'APIから空の応答が返りました。.env の EXPO_PUBLIC_API_BASE_URL にVercel URLを設定してください。',
        response.status
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('通信がタイムアウトしました。', 408);
    }

    if (
      error instanceof Error &&
      error.message.includes('EXPO_PUBLIC_API_BASE_URL')
    ) {
      throw new ApiError(
        '企業データAPIのURLが未設定です。.env の EXPO_PUBLIC_API_BASE_URL にVercel URLを設定してください。',
        0
      );
    }

    if (Platform.OS === 'web' && /^https?:\/\//i.test(requestUrl)) {
      throw new ApiError(
        'APIへ接続できませんでした。ローカルWebから別ドメインのAPIを使う場合は、Vercel APIを最新デプロイしてCORS設定を反映してください。',
        0
      );
    }

    throw new ApiError(
      '通信に失敗しました。ネットワーク接続を確認してください。',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

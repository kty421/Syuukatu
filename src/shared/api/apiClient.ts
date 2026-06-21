import { Platform } from 'react-native';

import { getApiUrl } from '../../config/env';
import { ApiError, getFailureCode, getFailureDetails, getFailureMessage } from './apiError';
import { createAuthHeaders } from './authHeader';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  accessToken?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  method?: HttpMethod;
  signal?: AbortSignal;
  timeoutMs?: number;
  unwrapData?: boolean;
};

type ParsedApiResponse = {
  isJson: boolean;
  payload: unknown;
};

const parseApiResponse = async (
  response: Response
): Promise<ParsedApiResponse> => {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson =
    contentType.includes('application/json') || contentType.includes('+json');
  const text = await response.text();

  if (!text) {
    return { isJson, payload: null };
  }

  if (!isJson) {
    return { isJson: false, payload: text };
  }

  try {
    return { isJson, payload: JSON.parse(text) as unknown };
  } catch {
    return { isJson, payload: null };
  }
};

const getNonJsonMessage = (payload: unknown, status: number, requestUrl: string) => {
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

  return 'APIからJSONではない応答が返りました。Vercel APIのURLとデプロイ設定を確認してください。';
};

const isDataEnvelope = (payload: unknown): payload is { data: unknown } =>
  Boolean(
    payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      !('error' in payload)
  );

const resolvePayload = <T>(payload: unknown, unwrapData: boolean): T => {
  if (unwrapData && isDataEnvelope(payload)) {
    return payload.data as T;
  }

  return payload as T;
};

export const apiRequest = async <T>(
  path: string,
  {
    accessToken,
    body,
    headers,
    method = 'GET',
    signal,
    timeoutMs = 15000,
    unwrapData = true
  }: ApiRequestOptions = {}
): Promise<T> => {
  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => controller.abort();

  if (signal?.aborted) {
    clearTimeout(timeoutId);
    throw new ApiError({
      code: 'UNKNOWN_ERROR',
      message: '通信がキャンセルされました。',
      status: 0
    });
  }

  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const requestUrl = getApiUrl(path);
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...createAuthHeaders(accessToken),
      ...headers
    };

    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(requestUrl, {
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: Platform.OS === 'web' ? 'include' : undefined,
      headers: requestHeaders,
      method,
      signal: controller.signal
    });
    const { isJson, payload } = await parseApiResponse(response);

    if (!isJson) {
      throw new ApiError({
        code: 'NON_JSON_RESPONSE',
        message: getNonJsonMessage(payload, response.status, requestUrl),
        status: response.status
      });
    }

    if (!response.ok) {
      throw new ApiError({
        code: getFailureCode(payload, response.status),
        details: getFailureDetails(payload),
        message: getFailureMessage(payload, response.status),
        status: response.status
      });
    }

    if (payload === null) {
      throw new ApiError({
        code: 'EMPTY_RESPONSE',
        message: 'APIから空の応答が返りました。',
        status: response.status
      });
    }

    return resolvePayload<T>(payload, unwrapData);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        code: didTimeout ? 'TIMEOUT' : 'UNKNOWN_ERROR',
        message: didTimeout
          ? '通信がタイムアウトしました。'
          : '通信がキャンセルされました。',
        status: didTimeout ? 408 : 0
      });
    }

    if (
      error instanceof Error &&
      error.message.includes('EXPO_PUBLIC_API_BASE_URL')
    ) {
      throw new ApiError({
        code: 'NETWORK_ERROR',
        message: '企業データAPIのURLが未設定です。.env の EXPO_PUBLIC_API_BASE_URL にVercel URLを設定してください。',
        status: 0
      });
    }

    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: Platform.OS === 'web'
        ? 'APIへ接続できませんでした。CORS設定またはVercel APIのデプロイ状態を確認してください。'
        : '通信に失敗しました。ネットワーク接続を確認してください。',
      status: 0
    });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
};

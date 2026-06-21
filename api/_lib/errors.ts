export type ApiSuccess<T> = {
  data: T;
};

export type ApiFailure = {
  error: {
    code: string;
    details?: unknown;
    message: string;
  };
};

export const createApiSuccess = <T>(data: T): ApiSuccess<T> => ({ data });

export const createApiFailure = (
  code: string,
  message: string,
  details?: unknown
): ApiFailure => ({
  error: {
    code,
    details,
    message
  }
});

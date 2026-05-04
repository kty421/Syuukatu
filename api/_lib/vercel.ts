export type VercelRequest = {
  method?: string;
  body?: unknown;
  headers: {
    authorization?: string;
    cookie?: string;
    host?: string;
    'x-forwarded-host'?: string | string[];
    'x-forwarded-proto'?: string | string[];
  };
  query: Record<string, string | string[] | undefined>;
};

export type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  redirect: (statusOrUrl: number | string, url?: string) => void;
  getHeader: (name: string) => number | string | string[] | undefined;
  setHeader: (name: string, value: number | string | string[]) => void;
};

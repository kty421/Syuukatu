type PkceStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const isCodeVerifierKey = (key: string) => key.endsWith('-code-verifier');

export const createPkceStorage = (initialCodeVerifier?: string | null) => {
  let codeVerifier = initialCodeVerifier ?? null;

  const storage: PkceStorage = {
    getItem: async (key) => (isCodeVerifierKey(key) ? codeVerifier : null),
    setItem: async (key, value) => {
      if (isCodeVerifierKey(key)) {
        codeVerifier = value;
      }
    },
    removeItem: async (key) => {
      if (isCodeVerifierKey(key)) {
        codeVerifier = null;
      }
    }
  };

  return {
    storage,
    getCodeVerifier: () => codeVerifier
  };
};

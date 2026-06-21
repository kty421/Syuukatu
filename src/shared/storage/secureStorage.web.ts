export type SecureStorageAdapter = {
  deleteItem: (key: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  isAvailable: () => Promise<boolean>;
  setItem: (key: string, value: string) => Promise<void>;
};

export const secureStorage: SecureStorageAdapter = {
  deleteItem: async () => {},
  getItem: async () => null,
  isAvailable: async () => false,
  setItem: async () => {}
};

import * as SecureStore from 'expo-secure-store';

export type SecureStorageAdapter = {
  deleteItem: (key: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  isAvailable: () => Promise<boolean>;
  setItem: (key: string, value: string) => Promise<void>;
};

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

let availabilityPromise: Promise<boolean> | null = null;

const isAvailable = () => {
  availabilityPromise ??= SecureStore.isAvailableAsync().catch(() => false);
  return availabilityPromise;
};

export const secureStorage: SecureStorageAdapter = {
  deleteItem: async (key) => {
    if (!(await isAvailable())) {
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
  getItem: async (key) => {
    if (!(await isAvailable())) {
      return null;
    }

    return SecureStore.getItemAsync(key);
  },
  isAvailable,
  setItem: async (key, value) => {
    if (!(await isAvailable())) {
      return;
    }

    await SecureStore.setItemAsync(key, value, secureOptions);
  }
};

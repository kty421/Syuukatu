import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

import {
  hasNativeSupabaseConfig,
  supabaseAnonKey,
  supabaseUrl,
} from "../config/env";

const AUTH_STORAGE_PREFIX = "syuukatu_supabase-auth_";
const SECURE_STORE_CHUNK_SIZE = 1800;
const SECURE_STORE_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

type ChunkMetadata = {
  chunkCount: number;
};

const sanitizeSecureStoreKey = (value: string) => {
  const fallback = Array.from(value)
    .map((char) => char.charCodeAt(0).toString(16).padStart(4, "0"))
    .join("");

  if (value && SECURE_STORE_KEY_PATTERN.test(value)) {
    return value;
  }

  return fallback || "empty";
};

const getStorageKey = (key: string) =>
  `${AUTH_STORAGE_PREFIX}${sanitizeSecureStoreKey(key)}`;
const getMetadataKey = (key: string) => `${getStorageKey(key)}_metadata`;
const getChunkKey = (key: string, index: number) =>
  `${getStorageKey(key)}_chunk_${index}`;

const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const parseChunkMetadata = (value: string | null): ChunkMetadata | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ChunkMetadata>;

    if (
      typeof parsed.chunkCount === "number" &&
      Number.isInteger(parsed.chunkCount) &&
      parsed.chunkCount > 0
    ) {
      return { chunkCount: parsed.chunkCount };
    }
  } catch {}

  return null;
};

const removeChunkedItem = async (key: string) => {
  const metadataKey = getMetadataKey(key);
  const metadata = parseChunkMetadata(await SecureStore.getItemAsync(metadataKey));

  if (metadata) {
    await Promise.all(
      Array.from({ length: metadata.chunkCount }, (_value, index) =>
        SecureStore.deleteItemAsync(getChunkKey(key, index))
      )
    );
  }

  await Promise.all([
    SecureStore.deleteItemAsync(metadataKey),
    SecureStore.deleteItemAsync(getStorageKey(key)),
  ]);
};

const getChunkedItem = async (key: string) => {
  const metadata = parseChunkMetadata(
    await SecureStore.getItemAsync(getMetadataKey(key))
  );

  if (!metadata) {
    const value = await SecureStore.getItemAsync(getStorageKey(key));

    if (value && value.length > SECURE_STORE_CHUNK_SIZE) {
      await setChunkedItem(key, value);
    }

    return value;
  }

  const chunks = await Promise.all(
    Array.from({ length: metadata.chunkCount }, (_value, index) =>
      SecureStore.getItemAsync(getChunkKey(key, index))
    )
  );

  if (chunks.some((chunk) => chunk == null)) {
    await removeChunkedItem(key);
    return null;
  }

  return chunks.join("");
};

const setChunkedItem = async (key: string, value: string) => {
  await removeChunkedItem(key);

  if (value.length <= SECURE_STORE_CHUNK_SIZE) {
    await SecureStore.setItemAsync(getStorageKey(key), value, secureStoreOptions);
    return;
  }

  const chunks = value.match(
    new RegExp(`.{1,${SECURE_STORE_CHUNK_SIZE}}`, "g")
  );

  if (!chunks) {
    return;
  }

  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(getChunkKey(key, index), chunk, secureStoreOptions)
    )
  );
  await SecureStore.setItemAsync(
    getMetadataKey(key),
    JSON.stringify({ chunkCount: chunks.length }),
    secureStoreOptions
  );
};

const authStorage = {
  getItem: getChunkedItem,
  setItem: setChunkedItem,
  removeItem: removeChunkedItem,
};

export const nativeSupabase = hasNativeSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        persistSession: true,
        storage: authStorage,
      },
    })
  : null;

export const requireNativeSupabase = () => {
  if (!nativeSupabase) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return nativeSupabase;
};

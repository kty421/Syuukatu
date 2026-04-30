import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { mockCompanies } from '../data/mockCompanies';
import { Company } from '../features/home/types';
import { normalizeSelectionStatus } from '../features/home/utils/companyUtils';

type CompanyMetadata = Omit<Company, 'loginId' | 'password'>;
type SaveCompaniesResult = {
  credentialSaveFailed: boolean;
};
type CompanyCredential = Pick<Company, 'loginId' | 'password'>;
type CredentialOperation = 'read' | 'write' | 'delete';

const COMPANIES_KEY = 'syuukatu:companies:v1';
const SECURE_CREDENTIAL_PREFIX = 'syuukatu_credential_';
const WEB_PREVIEW_CREDENTIAL_PREFIX = 'syuukatu:web-preview-credential:';
const EMPTY_CREDENTIAL: CompanyCredential = {
  loginId: '',
  password: ''
};

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

const hasCredentialValue = ({
  loginId,
  password
}: CompanyCredential) =>
  loginId.trim().length > 0 || password.trim().length > 0;

const getSecureCredentialKey = (id: string) => `${SECURE_CREDENTIAL_PREFIX}${id}`;

const getWebPreviewCredentialKey = (id: string) =>
  `${WEB_PREVIEW_CREDENTIAL_PREFIX}${id}`;

const reportCredentialStorageIssue = (
  operation: CredentialOperation,
  id: string,
  error: unknown
) => {
  if (!__DEV__) {
    return;
  }

  const detail = error instanceof Error ? error.message : String(error);
  console.warn(
    `[secureCompanyStore] Failed to ${operation} credential for ${id}: ${detail}`
  );
};

const parseCredential = (id: string, raw: string): CompanyCredential => {
  try {
    return JSON.parse(raw) as CompanyCredential;
  } catch (error) {
    reportCredentialStorageIssue('read', id, error);
    return EMPTY_CREDENTIAL;
  }
};

const toMetadata = ({
  loginId: _loginId,
  password: _password,
  ...metadata
}: Company): Omit<Company, 'loginId' | 'password'> => metadata;

const normalizeCompany = (company: Company): Company =>
  ({
    ...company,
    status: normalizeSelectionStatus(String(company.status))
  });

const readCredential = async (id: string) => {
  const isSecureStoreAvailable = await SecureStore.isAvailableAsync().catch(
    () => false
  );

  if (isSecureStoreAvailable) {
    try {
      const raw = await SecureStore.getItemAsync(getSecureCredentialKey(id));
      return raw ? parseCredential(id, raw) : EMPTY_CREDENTIAL;
    } catch (error) {
      reportCredentialStorageIssue('read', id, error);
      return EMPTY_CREDENTIAL;
    }
  }

  // Expo Webのプレビュー用フォールバック。本番モバイルではSecureStoreを使う前提。
  try {
    const raw = await AsyncStorage.getItem(getWebPreviewCredentialKey(id));
    return raw ? parseCredential(id, raw) : EMPTY_CREDENTIAL;
  } catch (error) {
    reportCredentialStorageIssue('read', id, error);
    return EMPTY_CREDENTIAL;
  }
};

const removeCredential = async (id: string) => {
  const isSecureStoreAvailable = await SecureStore.isAvailableAsync().catch(
    () => false
  );

  if (isSecureStoreAvailable) {
    try {
      await SecureStore.deleteItemAsync(getSecureCredentialKey(id));
      return;
    } catch (error) {
      reportCredentialStorageIssue('delete', id, error);
      throw error;
    }
  }

  try {
    await AsyncStorage.removeItem(getWebPreviewCredentialKey(id));
  } catch (error) {
    reportCredentialStorageIssue('delete', id, error);
    throw error;
  }
};

const writeCredential = async (
  id: string,
  credential: CompanyCredential
) => {
  if (!hasCredentialValue(credential)) {
    await removeCredential(id);
    return;
  }

  const isSecureStoreAvailable = await SecureStore.isAvailableAsync().catch(
    () => false
  );
  const serialized = JSON.stringify(credential);

  if (isSecureStoreAvailable) {
    try {
      await SecureStore.setItemAsync(
        getSecureCredentialKey(id),
        serialized,
        secureOptions
      );
      return;
    } catch (error) {
      reportCredentialStorageIssue('write', id, error);
      throw error;
    }
  }

  try {
    await AsyncStorage.setItem(getWebPreviewCredentialKey(id), serialized);
  } catch (error) {
    reportCredentialStorageIssue('write', id, error);
    throw error;
  }
};

export const loadCompanies = async (): Promise<Company[]> => {
  const raw = await AsyncStorage.getItem(COMPANIES_KEY);

  if (!raw) {
    const seededCompanies = mockCompanies.map(normalizeCompany);
    await saveCompanies(seededCompanies);
    return seededCompanies;
  }

  const metadataList = JSON.parse(raw) as CompanyMetadata[];
  const companies = await Promise.all(
    metadataList.map(async (metadata) => {
      const credential = await readCredential(metadata.id);
      return {
        ...metadata,
        ...credential
      };
    })
  );

  const normalizedCompanies = companies.map(normalizeCompany);
  await saveCompanies(normalizedCompanies);
  return normalizedCompanies;
};

export const saveCompanies = async (
  companies: Company[]
): Promise<SaveCompaniesResult> => {
  await AsyncStorage.setItem(
    COMPANIES_KEY,
    JSON.stringify(companies.map(toMetadata))
  );

  let credentialSaveFailed = false;

  for (const company of companies) {
    try {
      await writeCredential(company.id, {
        loginId: company.loginId,
        password: company.password
      });
    } catch {
      credentialSaveFailed = true;
    }
  }

  return { credentialSaveFailed };
};

export const deleteCompanyCredential = removeCredential;

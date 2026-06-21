import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { Company } from '../features/home/types';
import { normalizeSelectionStatus } from '../features/home/utils/companyUtils';
import { secureStorage } from '../shared/storage/secureStorage';

type CompanyMetadata = Omit<Company, 'loginId' | 'password'>;
type CompanyCredential = Pick<Company, 'loginId' | 'password'>;
type CredentialOperation = 'read' | 'write' | 'delete';

const COMPANIES_KEY = 'syuukatu:companies:v1';
const MIGRATION_COMPLETE_PREFIX = 'syuukatu:local-migration-complete:';
const SECURE_CREDENTIAL_PREFIX = 'syuukatu_credential_';
const WEB_PREVIEW_CREDENTIAL_PREFIX = 'syuukatu:web-preview-credential:';
const SECURE_STORE_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;
const EMPTY_CREDENTIAL: CompanyCredential = {
  loginId: '',
  password: ''
};

const sanitizeSecureStoreKeyPart = (value: string) => {
  if (value && SECURE_STORE_KEY_PATTERN.test(value)) {
    return value;
  }

  const encoded = Array.from(value)
    .map((char) => char.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');

  return encoded || 'empty';
};

const getSecureCredentialKey = (id: string) =>
  `${SECURE_CREDENTIAL_PREFIX}${sanitizeSecureStoreKeyPart(id)}`;

const getWebPreviewCredentialKey = (id: string) =>
  `${WEB_PREVIEW_CREDENTIAL_PREFIX}${id}`;

const getMigrationCompleteKey = (userId: string) =>
  `${MIGRATION_COMPLETE_PREFIX}${userId}`;

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
    `[secureCompanyStore] Failed to ${operation} local credential for ${id}: ${detail}`
  );
};

const parseCredential = (id: string, raw: string): CompanyCredential => {
  try {
    const parsed = JSON.parse(raw) as Partial<CompanyCredential>;

    return {
      loginId: typeof parsed.loginId === 'string' ? parsed.loginId : '',
      password: typeof parsed.password === 'string' ? parsed.password : ''
    };
  } catch (error) {
    reportCredentialStorageIssue('read', id, error);
    return EMPTY_CREDENTIAL;
  }
};

const normalizeCompany = (company: Company): Company =>
  ({
    ...company,
    status: normalizeSelectionStatus(String(company.status))
  });

const readLegacyCredential = async (id: string) => {
  if (Platform.OS === 'web') {
    const raw = await AsyncStorage.getItem(getWebPreviewCredentialKey(id));
    return raw ? parseCredential(id, raw) : EMPTY_CREDENTIAL;
  }

  try {
    const raw = await secureStorage.getItem(getSecureCredentialKey(id));
    return raw ? parseCredential(id, raw) : EMPTY_CREDENTIAL;
  } catch (error) {
    reportCredentialStorageIssue('read', id, error);
    return EMPTY_CREDENTIAL;
  }
};

const writeNativePassword = async (id: string, password: string) => {
  if (Platform.OS === 'web') {
    return;
  }

  if (!password.trim()) {
    await secureStorage.deleteItem(getSecureCredentialKey(id));
    return;
  }

  await secureStorage.setItem(
    getSecureCredentialKey(id),
    JSON.stringify({ loginId: '', password })
  );
};

export const loadLocalCompaniesForMigration = async (): Promise<Company[]> => {
  const raw = await AsyncStorage.getItem(COMPANIES_KEY);

  if (!raw) {
    return [];
  }

  const metadataList = JSON.parse(raw) as CompanyMetadata[];
  const companies = await Promise.all(
    metadataList.map(async (metadata) => {
      const credential = await readLegacyCredential(metadata.id);

      return normalizeCompany({
        ...metadata,
        loginId: credential.loginId,
        password: Platform.OS === 'web' ? '' : credential.password
      });
    })
  );

  return companies;
};

export const saveNativeCompanyPassword = async (
  id: string,
  password: string
) => {
  try {
    await writeNativePassword(id, password);
  } catch (error) {
    reportCredentialStorageIssue('write', id, error);
    throw error;
  }
};

export const hydrateNativePasswords = async (companies: Company[]) => {
  if (Platform.OS === 'web') {
    return companies.map((company) => ({ ...company, password: '' }));
  }

  return Promise.all(
    companies.map(async (company) => {
      const credential = await readLegacyCredential(company.id);

      return {
        ...company,
        password: credential.password
      };
    })
  );
};

export const deleteCompanyCredential = async (id: string) => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(getWebPreviewCredentialKey(id));
      return;
    }

    await secureStorage.deleteItem(getSecureCredentialKey(id));
  } catch (error) {
    reportCredentialStorageIssue('delete', id, error);
    throw error;
  }
};

export const deleteCompanyCredentials = async (ids: string[]) => {
  await Promise.all(ids.map((id) => deleteCompanyCredential(id)));
};

export const purgeLegacyWebCredentials = async (companies: Company[]) => {
  if (Platform.OS !== 'web') {
    return;
  }

  await Promise.all(
    companies.map((company) =>
      AsyncStorage.removeItem(getWebPreviewCredentialKey(company.id))
    )
  );
};

export const clearAccountLocalData = async (
  userId: string,
  companies: Company[]
) => {
  await Promise.allSettled([
    deleteCompanyCredentials(companies.map((company) => company.id)),
    purgeLegacyWebCredentials(companies),
    AsyncStorage.removeItem(getMigrationCompleteKey(userId))
  ]);
};

export const hasCompletedLocalMigration = async (userId: string) => {
  const value = await AsyncStorage.getItem(getMigrationCompleteKey(userId));
  return value === 'true';
};

export const markLocalMigrationComplete = async (userId: string) => {
  await AsyncStorage.setItem(getMigrationCompleteKey(userId), 'true');
};

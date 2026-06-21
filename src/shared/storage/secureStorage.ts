import { Platform } from 'react-native';

import { secureStorage as nativeSecureStorage } from './secureStorage.native';
import { secureStorage as webSecureStorage } from './secureStorage.web';

export const secureStorage =
  Platform.OS === 'web' ? webSecureStorage : nativeSecureStorage;

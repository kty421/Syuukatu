import { describe, expect, it } from 'vitest';

import { secureStorage } from './secureStorage.web';

describe('secureStorage.web', () => {
  it('does not persist company site passwords on web', async () => {
    await secureStorage.setItem('company-password', 'secret-password');

    await expect(secureStorage.getItem('company-password')).resolves.toBeNull();
    await expect(secureStorage.isAvailable()).resolves.toBe(false);
    await expect(secureStorage.deleteItem('company-password')).resolves.toBeUndefined();
  });
});

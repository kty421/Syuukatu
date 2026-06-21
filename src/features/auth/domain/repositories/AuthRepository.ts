import { AuthUser } from '../entities/authUser';

export type AuthRepository = {
  deleteAccount: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getCurrentUser: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
};

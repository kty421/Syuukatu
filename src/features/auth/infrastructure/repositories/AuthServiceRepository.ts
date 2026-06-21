import {
  deleteAccount,
  getCurrentUser,
  getNativeAccessToken,
  signOut
} from '../../authService';
import { AuthRepository } from '../../domain/repositories/AuthRepository';

export const authServiceRepository: AuthRepository = {
  deleteAccount,
  getAccessToken: getNativeAccessToken,
  getCurrentUser,
  signOut
};

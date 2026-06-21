import { AuthRepository } from '../../domain/repositories/AuthRepository';

export const getCurrentAuthUser = (repository: AuthRepository) =>
  repository.getCurrentUser();

export const getAuthAccessToken = (repository: AuthRepository) =>
  repository.getAccessToken();

export const signOutAccount = (repository: AuthRepository) =>
  repository.signOut();

export const deleteCurrentAccount = (repository: AuthRepository) =>
  repository.deleteAccount();

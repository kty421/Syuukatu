import {
  AuthCallbackListener,
  AuthSessionRepository,
  AuthStateListener
} from '../../domain/repositories/AuthSessionRepository';
import { nativeAuthSessionRepository } from '../../infrastructure/repositories/NativeAuthSessionRepository';

export const subscribeToAuthState = (
  listener: AuthStateListener,
  repository: AuthSessionRepository = nativeAuthSessionRepository
) => repository.subscribeToAuthState(listener);

export const subscribeToAuthCallbacks = (
  listener: AuthCallbackListener,
  repository: AuthSessionRepository = nativeAuthSessionRepository
) => repository.subscribeToAuthCallbacks(listener);

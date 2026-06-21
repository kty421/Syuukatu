import { AuthUser } from '../entities/authUser';

export type AuthStateListener = (user: AuthUser | null) => void;

export type AuthCallbackListener = () => Promise<void> | void;

export type UnsubscribeAuthSession = () => void;

export type AuthSessionRepository = {
  subscribeToAuthCallbacks: (
    listener: AuthCallbackListener
  ) => UnsubscribeAuthSession;
  subscribeToAuthState: (
    listener: AuthStateListener
  ) => UnsubscribeAuthSession;
};

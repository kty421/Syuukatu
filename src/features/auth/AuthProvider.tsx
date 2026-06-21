import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import {
  deleteCurrentAccount,
  getAuthAccessToken,
  getCurrentAuthUser,
  signOutAccount
} from './application/usecases/accountUsecases';
import {
  subscribeToAuthCallbacks,
  subscribeToAuthState
} from './application/usecases/authSessionUsecases';
import { AuthUser } from './domain/entities/authUser';
import { authServiceRepository } from './infrastructure/repositories/AuthServiceRepository';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthLoading: boolean;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const nextUser = await getCurrentAuthUser(authServiceRepository);
    setUser(nextUser);
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const nextUser = await getCurrentAuthUser(authServiceRepository);
        if (mounted) {
          setUser(nextUser);
        }
      } finally {
        if (mounted) {
          setIsAuthLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToAuthState(setUser);
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToAuthCallbacks(async () => {
      if (mounted) {
        await refreshUser();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await signOutAccount(authServiceRepository);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteCurrentAccount(authServiceRepository);
    setUser(null);
  }, []);

  const getAccessToken = useCallback(
    () => getAuthAccessToken(authServiceRepository),
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthLoading,
      refreshUser,
      setAuthenticatedUser,
      signOut,
      deleteAccount,
      getAccessToken
    }),
    [
      deleteAccount,
      getAccessToken,
      isAuthLoading,
      refreshUser,
      setAuthenticatedUser,
      signOut,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return value;
};

export const useOptionalAuth = () => useContext(AuthContext);

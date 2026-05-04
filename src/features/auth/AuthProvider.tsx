import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { Linking, Platform } from 'react-native';

import { nativeSupabase } from '../../services/nativeSupabase';
import {
  completeNativeAuthCallback,
  getCurrentUser,
  getNativeAccessToken,
  signOut as requestSignOut
} from './authService';
import { AuthUser } from './types';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthLoading: boolean;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const nextUser = await getCurrentUser();
    setUser(nextUser);
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const nextUser = await getCurrentUser();
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
    if (Platform.OS === 'web' || !nativeSupabase) {
      return undefined;
    }

    const {
      data: { subscription }
    } = nativeSupabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? null
            }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !nativeSupabase) {
      return undefined;
    }

    let mounted = true;

    const handleUrl = async (url: string | null) => {
      if (!url) {
        return;
      }

      try {
        const handled = await completeNativeAuthCallback(url);

        if (handled && mounted) {
          await refreshUser();
        }
      } catch {}
    };

    Linking.getInitialURL()
      .then((url) => {
        void handleUrl(url);
      })
      .catch(() => {});

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await requestSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthLoading,
      refreshUser,
      setAuthenticatedUser,
      signOut,
      getAccessToken: getNativeAccessToken
    }),
    [isAuthLoading, refreshUser, setAuthenticatedUser, signOut, user]
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

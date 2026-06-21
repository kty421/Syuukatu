import { Linking, Platform } from 'react-native';

import { nativeSupabase } from '../../../../services/nativeSupabase';
import { completeNativeAuthCallback } from '../../authService';
import { AuthSessionRepository } from '../../domain/repositories/AuthSessionRepository';

export const nativeAuthSessionRepository: AuthSessionRepository = {
  subscribeToAuthCallbacks: (listener) => {
    if (Platform.OS === 'web' || !nativeSupabase) {
      return () => {};
    }

    let active = true;

    const handleUrl = async (url: string | null) => {
      if (!url) {
        return;
      }

      try {
        const handled = await completeNativeAuthCallback(url);

        if (handled && active) {
          await listener();
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
      active = false;
      subscription.remove();
    };
  },
  subscribeToAuthState: (listener) => {
    if (Platform.OS === 'web' || !nativeSupabase) {
      return () => {};
    }

    const {
      data: { subscription }
    } = nativeSupabase.auth.onAuthStateChange((_event, session) => {
      listener(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? null
            }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }
};

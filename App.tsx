import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Platform,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getTheme } from './src/constants/theme';
import { AuthConfirmScreen } from './src/features/auth/AuthConfirmScreen';
import { AuthProvider, useAuth } from './src/features/auth/AuthProvider';
import { AuthScreen } from './src/features/auth/AuthScreen';
import { ResetPasswordScreen } from './src/features/auth/ResetPasswordScreen';
import { HomeScreen } from './src/features/home/HomeScreen';

const getWebPathname = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return '/';
  }

  const pathname = new URL(window.location.href).pathname;

  return pathname.replace(/\/+$/, '') || '/';
};

const useWebPathname = () => {
  const [webPathname, setWebPathname] = useState(getWebPathname);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return undefined;
    }

    const updatePathname = () => {
      setWebPathname(getWebPathname());
    };

    window.addEventListener('popstate', updatePathname);

    return () => {
      window.removeEventListener('popstate', updatePathname);
    };
  }, []);

  return [webPathname, setWebPathname] as const;
};

const ProtectedAppBody = ({
  navigateToSignIn
}: {
  navigateToSignIn: () => void;
}) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const { user, isAuthLoading, signOut, getAccessToken } = useAuth();

  if (isAuthLoading) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          flex: 1,
          gap: 12,
          justifyContent: 'center'
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textMuted }}>読み込み中</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={navigateToSignIn} />;
  }

  return (
    <HomeScreen
      user={user}
      onSignOut={signOut}
      getAccessToken={getAccessToken}
    />
  );
};

const AppRoutes = () => {
  const [webPathname, setWebPathname] = useWebPathname();

  const navigateToSignIn = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
      setWebPathname('/');
    }
  }, [setWebPathname]);

  if (Platform.OS === 'web' && webPathname === '/auth/confirm') {
    return <AuthConfirmScreen onBackToSignIn={navigateToSignIn} />;
  }

  if (Platform.OS === 'web' && webPathname === '/auth/reset-password') {
    return <ResetPasswordScreen onBackToSignIn={navigateToSignIn} />;
  }

  if (Platform.OS === 'web' && webPathname === '/forgot-password') {
    return (
      <AuthScreen
        initialMode="forgotPassword"
        onAuthenticated={navigateToSignIn}
        onBackToSignIn={navigateToSignIn}
      />
    );
  }

  if (Platform.OS === 'web' && webPathname === '/login') {
    return <AuthScreen onAuthenticated={navigateToSignIn} />;
  }

  if (Platform.OS === 'web' && webPathname === '/register') {
    return (
      <AuthScreen
        initialMode="signUp"
        onAuthenticated={navigateToSignIn}
        onBackToSignIn={navigateToSignIn}
      />
    );
  }

  return (
    <AuthProvider>
      <ProtectedAppBody
        navigateToSignIn={navigateToSignIn}
      />
    </AuthProvider>
  );
};

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AppRoutes />
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

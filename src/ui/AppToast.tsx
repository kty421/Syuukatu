import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../constants/theme';

type AppToastProps = {
  message: string;
  theme: AppTheme;
  tone?: 'success' | 'error';
};

export const AppToast = ({
  message,
  theme,
  tone = 'success'
}: AppToastProps) => {
  const isError = tone === 'error';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        theme.shadows.floating,
        {
          backgroundColor: theme.colors.surfaceOverlay,
          borderColor: isError ? theme.colors.danger : theme.colors.outline
        }
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isError
              ? theme.colors.dangerSoft
              : theme.colors.primarySoft
          }
        ]}
      >
        <Ionicons
          name={isError ? 'alert-circle' : 'checkmark'}
          size={14}
          color={isError ? theme.colors.danger : theme.colors.primary}
        />
      </View>
      <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 28,
    flexDirection: 'row',
    gap: 10,
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: 'absolute'
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24
  },
  message: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18
  }
});

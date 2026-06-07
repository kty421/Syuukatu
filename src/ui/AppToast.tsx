import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../constants/theme';

type AppToastProps = {
  message: string;
  theme: AppTheme;
  tone?: 'success' | 'error' | 'warning';
  bottomOffset?: number;
};

export const AppToast = ({
  message,
  theme,
  tone = 'success',
  bottomOffset = 92
}: AppToastProps) => {
  const isError = tone === 'error';
  const isWarning = tone === 'warning';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        theme.shadows.floating,
        {
          backgroundColor: theme.colors.surfaceOverlay,
          borderRadius: theme.radii.md,
          bottom: bottomOffset,
          borderColor: isError
            ? theme.colors.danger
            : isWarning
              ? theme.colors.warning
              : theme.colors.primaryBorder
        }
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isError
              ? theme.colors.dangerSubtle
              : isWarning
                ? theme.colors.warningSubtle
              : theme.colors.primarySubtle
          }
        ]}
      >
        <Ionicons
          name={isError ? 'alert-circle' : isWarning ? 'warning' : 'checkmark'}
          size={14}
          color={
            isError
              ? theme.colors.danger
              : isWarning
                ? theme.colors.warning
                : theme.colors.primary
          }
        />
      </View>
      <Text
        numberOfLines={2}
        style={[
          theme.typography.label,
          styles.message,
          { color: theme.colors.textPrimary }
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
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
    minWidth: 0
  }
});

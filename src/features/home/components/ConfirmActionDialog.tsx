import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme } from '../../../constants/theme';
import { ConfirmActionRequest } from '../utils/confirmAction';

type ConfirmActionDialogProps = {
  request: ConfirmActionRequest | null;
  isRunning: boolean;
  theme: AppTheme;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmActionDialog = ({
  request,
  isRunning,
  theme,
  onCancel,
  onConfirm
}: ConfirmActionDialogProps) => {
  const insets = useSafeAreaInsets();

  if (!request) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        accessibilityViewIsModal
        style={[
          styles.root,
          {
            paddingBottom: Math.max(insets.bottom, 20),
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
            paddingTop: Math.max(insets.top, 20)
          }
        ]}
      >
        <Pressable
          accessibilityLabel="確認ダイアログを閉じる"
          disabled={isRunning}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.overlay }
          ]}
          onPress={onCancel}
        />

        <View
          style={[
            styles.card,
            theme.shadows.floating,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }
          ]}
        >
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {request.title}
            </Text>
            {request.message ? (
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {request.message}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isRunning}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary
                },
                pressed && !isRunning && styles.pressed,
                isRunning && styles.disabled
              ]}
            >
              <Text style={[styles.cancelLabel, { color: theme.colors.primary }]}>
                キャンセル
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isRunning}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary
                },
                pressed && !isRunning && styles.pressed
              ]}
            >
              {isRunning ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text
                  style={[
                    styles.confirmLabel,
                    { color: theme.colors.textOnPrimary }
                  ]}
                >
                  OK
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
    maxWidth: 420,
    padding: 20,
    width: '100%'
  },
  copy: {
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.52
  }
});

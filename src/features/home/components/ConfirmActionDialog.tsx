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

  const confirmColor = request.destructive
    ? theme.colors.danger
    : theme.colors.primary;
  const confirmTextColor = request.destructive
    ? theme.colors.textOnDanger
    : theme.colors.textOnPrimary;

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
              borderColor: theme.colors.border,
              borderRadius: theme.radii.lg,
              padding: theme.spacing.lg
            }
          ]}
        >
          <View style={styles.copy}>
            <Text
              style={[
                theme.typography.title3,
                styles.title,
                { color: theme.colors.textPrimary }
              ]}
            >
              {request.title}
            </Text>
            {request.message ? (
              <Text
                style={[
                  theme.typography.body,
                  styles.message,
                  { color: theme.colors.textSecondary }
                ]}
              >
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
                  borderColor: confirmColor,
                  borderRadius: theme.radii.md,
                  minHeight: theme.component.controlHeight
                },
                pressed && !isRunning && styles.pressed,
                isRunning && styles.disabled
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  theme.typography.label,
                  styles.cancelLabel,
                  { color: confirmColor }
                ]}
              >
                {request.cancelLabel ?? 'キャンセル'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isRunning}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: confirmColor,
                  borderColor: confirmColor,
                  borderRadius: theme.radii.md,
                  minHeight: theme.component.controlHeight
                },
                pressed && !isRunning && styles.pressed
              ]}
            >
              {isRunning ? (
                <ActivityIndicator color={confirmTextColor} />
              ) : (
                <Text
                  style={[
                    theme.typography.label,
                    styles.confirmLabel,
                    { color: confirmTextColor }
                  ]}
                >
                  {request.confirmLabel}
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
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
    maxWidth: 420,
    width: '100%'
  },
  copy: {
    gap: 8
  },
  title: {
  },
  message: {
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  cancelLabel: {
  },
  confirmLabel: {
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.52
  }
});

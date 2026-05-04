import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme } from '../../../constants/theme';
import { AppButton } from '../../../ui/AppButton';
import { IconButton } from '../../../ui/IconButton';

type HomeMenuModalProps = {
  visible: boolean;
  userEmail: string | null;
  showPasswordControls: boolean;
  passwordDefaultVisible: boolean;
  theme: AppTheme;
  onPasswordDefaultVisibleChange: (visible: boolean) => void;
  onSignOut: () => void;
  onClose: () => void;
};

const webCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer' } as unknown as object)
    : null;

export const HomeMenuModal = ({
  visible,
  userEmail,
  showPasswordControls,
  passwordDefaultVisible,
  theme,
  onPasswordDefaultVisibleChange,
  onSignOut,
  onClose
}: HomeMenuModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          accessibilityLabel="メニューを閉じる"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          style={[
            styles.drawer,
            theme.shadows.floating,
            {
              backgroundColor: theme.colors.surface,
              borderRightColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 14),
              paddingTop: insets.top + 12
            }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>
                Syuukatu
              </Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                メニュー
              </Text>
            </View>
            <IconButton
              icon="close"
              label="メニューを閉じる"
              onPress={onClose}
              theme={theme}
              tone="neutral"
              size="compact"
              variant="plain"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <View style={styles.menuSection}>
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.colors.primarySubtle }
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                  マイページ
                </Text>
                <Text
                  selectable
                  numberOfLines={1}
                  style={[styles.rowDetail, { color: theme.colors.textMuted }]}
                >
                  {userEmail ?? 'メールアドレス未設定'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.menuSection}>
            <View style={styles.rowHeader}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.colors.surfaceSubtle }
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={17}
                  color={theme.colors.textSecondary}
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                パスワード初期表示
              </Text>
            </View>
            {showPasswordControls ? (
              <View
                style={[
                  styles.segment,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border
                  }
                ]}
              >
                <PasswordSegmentButton
                  label="非表示"
                  selected={!passwordDefaultVisible}
                  theme={theme}
                  onPress={() => onPasswordDefaultVisibleChange(false)}
                />
                <PasswordSegmentButton
                  label="表示"
                  selected={passwordDefaultVisible}
                  theme={theme}
                  onPress={() => onPasswordDefaultVisibleChange(true)}
                />
              </View>
            ) : (
              <Text style={[styles.notice, { color: theme.colors.textMuted }]}>
                Webではパスワードを保存しません。スマホでは端末内にのみ保存できます。
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <AppButton
              label="ログアウト"
              icon="log-out-outline"
              onPress={onSignOut}
              theme={theme}
              variant="danger"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const PasswordSegmentButton = ({
  label,
  selected,
  theme,
  onPress
}: {
  label: string;
  selected: boolean;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={({ pressed }) => [
      styles.segmentButton,
      webCursor,
      {
        backgroundColor: selected ? theme.colors.primary : 'transparent'
      },
      pressed && styles.pressed
    ]}
  >
    <Text
      style={[
        styles.segmentText,
        {
          color: selected
            ? theme.colors.textOnPrimary
            : theme.colors.textSecondary
        }
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-start'
  },
  drawer: {
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: 18,
    height: '100%',
    maxWidth: 360,
    paddingHorizontal: 18,
    width: '86%'
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 48
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26
  },
  menuSection: {
    gap: 12
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  rowIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  rowTextBlock: {
    flex: 1,
    minWidth: 0
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19
  },
  rowDetail: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  segment: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    padding: 4
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  notice: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18
  },
  divider: {
    height: StyleSheet.hairlineWidth
  },
  footer: {
    gap: 18,
    marginTop: 'auto'
  },
  pressed: {
    opacity: 0.72
  }
});

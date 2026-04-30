import { memo, type ReactNode } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { IconButton } from '../../../ui/IconButton';
import { Company } from '../types';

type CompanyCardProps = {
  company: Company;
  theme: AppTheme;
  isPasswordVisible: boolean;
  onPress: () => void;
  onTogglePassword: () => void;
  onToggleFavorite: () => void;
  onCopy: (value: string, label: string) => void;
  onOpenUrl: () => void;
  onDelete: () => void;
};

const maskPassword = (password: string) => (password ? '••••••••' : '未登録');

export const CompanyCard = memo(
  ({
    company,
    theme,
    isPasswordVisible,
    onPress,
    onTogglePassword,
    onToggleFavorite,
    onCopy,
    onOpenUrl,
    onDelete
  }: CompanyCardProps) => {
    const aspiration = theme.aspirations[company.aspiration];
    const typeTheme = theme.applicationTypes[company.type];

    const runChildAction =
      (handler: () => void) => (event: GestureResponderEvent) => {
        event.stopPropagation();
        handler();
      };

    return (
      <Pressable
        accessibilityLabel={`${company.companyName}を編集`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { backgroundColor: theme.colors.surfaceMuted }
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.companyName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {company.companyName}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon={company.favorite ? 'star' : 'star-outline'}
              label={company.favorite ? 'お気に入りを解除' : 'お気に入りに追加'}
              onPress={runChildAction(onToggleFavorite)}
              theme={theme}
              tone="accent"
              variant="plain"
              accentColor={typeTheme.accent}
              size="compact"
              iconSize={17}
            />
            <IconButton
              icon="open-outline"
              label="企業ページを開く"
              onPress={runChildAction(onOpenUrl)}
              theme={theme}
              tone="neutral"
              variant="plain"
              disabled={!company.myPageUrl}
              size="compact"
              iconSize={17}
            />
            <IconButton
              icon="trash-outline"
              label={`${company.companyName}を削除`}
              onPress={runChildAction(onDelete)}
              theme={theme}
              tone="danger"
              variant="plain"
              size="compact"
              iconSize={17}
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: typeTheme.muted,
                borderColor: typeTheme.border
              }
            ]}
          >
            <Text style={[styles.statusText, { color: typeTheme.accent }]}>
              {company.status}
            </Text>
          </View>
          <View
            style={[
              styles.aspirationPill,
              { backgroundColor: aspiration.background }
            ]}
          >
            <Text
              style={[
                styles.aspirationText,
                { color: aspiration.foreground }
              ]}
            >
              志望度 {aspiration.label}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.credentialBlock,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.outline
            }
          ]}
        >
          <CredentialRow
            label="ID"
            value={company.loginId || '未登録'}
            isPlaceholder={!company.loginId}
            theme={theme}
            iconButtons={
              <View style={styles.credentialActionsSlot}>
                <View style={styles.singleActionWrap}>
                  <IconButton
                    icon="copy-outline"
                    label="ログインIDをコピー"
                    onPress={runChildAction(() => onCopy(company.loginId, 'ログインID'))}
                    theme={theme}
                    tone="accent"
                    size="compact"
                    variant="plain"
                    accentColor={typeTheme.accent}
                    disabled={!company.loginId}
                  />
                </View>
              </View>
            }
          />
          <View
            style={[
              styles.credentialDivider,
              { backgroundColor: theme.colors.divider }
            ]}
          />
          <CredentialRow
            label="PW"
            value={
              isPasswordVisible
                ? company.password || '未登録'
                : maskPassword(company.password)
            }
            isPlaceholder={!company.password}
            theme={theme}
            iconButtons={
              <View style={styles.credentialActionsSlot}>
                <View style={styles.passwordActions}>
                  <IconButton
                    icon={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    label={isPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
                    onPress={runChildAction(onTogglePassword)}
                    theme={theme}
                    tone="accent"
                    size="compact"
                    variant="plain"
                    accentColor={typeTheme.accent}
                    disabled={!company.password}
                  />
                  <IconButton
                    icon="copy-outline"
                    label="パスワードをコピー"
                    onPress={runChildAction(() => onCopy(company.password, 'パスワード'))}
                    theme={theme}
                    tone="accent"
                    size="compact"
                    variant="plain"
                    accentColor={typeTheme.accent}
                    disabled={!company.password}
                  />
                </View>
              </View>
            }
          />
        </View>
      </Pressable>
    );
  }
);

const CredentialRow = ({
  label,
  value,
  isPlaceholder,
  theme,
  iconButtons
}: {
  label: string;
  value: string;
  isPlaceholder?: boolean;
  theme: AppTheme;
  iconButtons: ReactNode;
}) => (
  <View style={styles.credentialRow}>
    <Text style={[styles.credentialLabel, { color: theme.colors.textSubtle }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.credentialValue,
        isPlaceholder ? styles.credentialValuePlaceholder : styles.credentialValueFilled,
        {
          color: isPlaceholder
            ? theme.colors.placeholder
            : theme.colors.text
        }
      ]}
      numberOfLines={1}
    >
      {value}
    </Text>
    {iconButtons}
  </View>
);

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  companyName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 0
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14
  },
  aspirationPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  aspirationText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
    marginRight: -2
  },
  credentialBlock: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    overflow: 'hidden'
  },
  credentialRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 40,
    paddingHorizontal: 12
  },
  credentialLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 13,
    width: 24
  },
  credentialValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17
  },
  credentialValueFilled: {
    fontWeight: '600'
  },
  credentialValuePlaceholder: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16
  },
  credentialActionsSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 72
  },
  singleActionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36
  },
  credentialDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 34
  },
  passwordActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
    justifyContent: 'flex-end',
    width: 72
  }
});

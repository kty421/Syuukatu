import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppTheme } from "../../../constants/theme";
import { FullScreenModalShell } from "../../../ui/FullScreenModalShell";
import { SearchField } from "../../../ui/SearchField";
import { applicationTypeLabels, Company } from "../types";

type CompanyInheritancePickerModalProps = {
  visible: boolean;
  companies: Company[];
  theme: AppTheme;
  onClose: () => void;
  onSelect: (company: Company) => void;
};

const getSearchText = (company: Company) =>
  [
    company.companyName,
    applicationTypeLabels[company.type],
    company.status,
    company.loginId,
    company.myPageUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const CompanyInheritancePickerModal = ({
  visible,
  companies,
  theme,
  onClose,
  onSelect,
}: CompanyInheritancePickerModalProps) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setQuery("");
    }
  }, [visible]);

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return companies;
    }

    return companies.filter((company) =>
      getSearchText(company).includes(normalizedQuery),
    );
  }, [companies, query]);

  return (
    <FullScreenModalShell
      visible={visible}
      title="引き継ぐ企業を選択"
      theme={theme}
      onClose={onClose}>
      <View style={styles.root}>
        <View style={styles.searchWrap}>
          <SearchField
            value={query}
            placeholder="企業名、選考状況、IDで検索"
            theme={theme}
            onChangeText={setQuery}
            onClear={() => setQuery("")}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.surface,
              theme.shadows.surface,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company, index) => (
                <View key={company.id}>
                  {index > 0 ? (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.colors.divider },
                      ]}
                    />
                  ) : null}
                  <CompanySourceRow
                    company={company}
                    theme={theme}
                    onPress={() => onSelect(company)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.colors.textPrimary },
                  ]}>
                  {companies.length === 0
                    ? "引き継げる企業がありません"
                    : "一致する企業がありません"}
                </Text>
                {query.trim() ? (
                  <Text
                    style={[
                      styles.emptyDescription,
                      { color: theme.colors.textMuted },
                    ]}>
                    検索条件を変えてください
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </FullScreenModalShell>
  );
};

const CompanySourceRow = ({
  company,
  theme,
  onPress,
}: {
  company: Company;
  theme: AppTheme;
  onPress: () => void;
}) => {
  const hasLoginId = Boolean(company.loginId);
  const hasUrl = Boolean(company.myPageUrl);
  const hasPassword = Boolean(company.password);
  const hasLoginInfo = hasLoginId || hasUrl || hasPassword;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${company.companyName}の情報を引き継いで追加`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.colors.surfaceSubtle },
      ]}>
      <View style={styles.rowIcon}>
        <Ionicons
          color={theme.colors.primary}
          name="business-outline"
          size={20}
        />
      </View>
      <View style={styles.rowBody}>
        <Text
          numberOfLines={1}
          style={[styles.companyName, { color: theme.colors.textPrimary }]}>
          {company.companyName}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.metaText, { color: theme.colors.textMuted }]}>
          {applicationTypeLabels[company.type]} / {company.status}
        </Text>
        <View style={styles.loginInfoRow}>
          {hasLoginInfo ? (
            <>
              {hasLoginId ? <InfoPill label="ID" theme={theme} /> : null}
              {hasUrl ? <InfoPill label="URL" theme={theme} /> : null}
              {hasPassword ? <InfoPill label="PW" theme={theme} /> : null}
            </>
          ) : (
            <Text
              style={[
                styles.noLoginInfoText,
                { color: theme.colors.textDisabled },
              ]}>
              ログイン情報なし
            </Text>
          )}
        </View>
      </View>
      <Ionicons color={theme.colors.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
};

const InfoPill = ({ label, theme }: { label: string; theme: AppTheme }) => (
  <View
    style={[
      styles.infoPill,
      {
        backgroundColor: theme.colors.primarySubtle,
        borderColor: theme.colors.primaryBorder,
      },
    ]}>
    <Text style={[styles.infoPillText, { color: theme.colors.primary }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchWrap: {
    alignSelf: "center",
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: "100%",
  },
  body: {
    alignSelf: "center",
    maxWidth: 760,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
  },
  surface: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 28,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 3,
  },
  loginInfoRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 7,
    minHeight: 20,
  },
  infoPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  infoPillText: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },
  noLoginInfoText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  emptyState: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    minHeight: 160,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    textAlign: "center",
  },
});

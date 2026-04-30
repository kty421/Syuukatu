import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getContentMetrics, getTheme } from '../../constants/theme';
import { AppToast } from '../../ui/AppToast';
import { DismissKeyboardView } from '../../ui/DismissKeyboardView';
import { FloatingActionButton } from '../../ui/FloatingActionButton';
import { SearchField } from '../../ui/SearchField';
import { ApplicationTypeSegment } from './components/ApplicationTypeSegment';
import { CompanyEditorModal } from './components/CompanyEditorModal';
import { CompanySection } from './components/CompanySection';
import { useCompanies } from './hooks/useCompanies';
import {
  ApplicationType,
  applicationTypeLabels,
  Company,
  CompanyDraft
} from './types';
import {
  filterAndSortCompanies,
  groupCompaniesByStatus
} from './utils/companyUtils';

const transitionValueByType: Record<ApplicationType, number> = {
  internship: 0,
  fullTime: 1
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const runHapticsSafely = async (task: () => Promise<void>) => {
  try {
    await task();
  } catch {}
};

export const HomeScreen = () => {
  const {
    companies,
    isLoading,
    storageError,
    upsertCompany,
    deleteCompany
  } = useCompanies();

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const metrics = getContentMetrics(width);
  const containerStyle: ViewStyle = {
    alignSelf: 'center' as const,
    maxWidth: theme.layout.maxContentWidth,
    width: '100%'
  };

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<ApplicationType>('internship');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorType, setEditorType] = useState<ApplicationType>('internship');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string>>(
    new Set()
  );
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const typeTransition = useRef(new Animated.Value(0)).current;
  const edgePullX = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTypeTheme = theme.applicationTypes[activeType];
  const animatedThemeStyle = useMemo(
    () => ({
      backgroundColor: typeTransition.interpolate({
        inputRange: [0, 1],
        outputRange: [
          theme.applicationTypes.internship.soft,
          theme.applicationTypes.fullTime.soft
        ]
      })
    }),
    [theme, typeTransition]
  );
  const edgePullStyle = useMemo(
    () => ({
      transform: [{ translateX: edgePullX }]
    }),
    [edgePullX]
  );
  const bottomPadding = Math.max(insets.bottom, 8) + 96;
  const activeCompanies = useMemo(
    () => filterAndSortCompanies(companies, activeType, query),
    [activeType, companies, query]
  );
  const groups = useMemo(
    () => groupCompaniesByStatus(activeCompanies, activeType),
    [activeCompanies, activeType]
  );

  const internshipCount = companies.filter(
    (company) => !company.archived && company.type === 'internship'
  ).length;
  const fullTimeCount = companies.filter(
    (company) => !company.archived && company.type === 'fullTime'
  ).length;
  const activeTypeCount =
    activeType === 'internship' ? internshipCount : fullTimeCount;

  const showToast = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setToast({ message, tone });
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, 1800);
    },
    []
  );

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!storageError) {
      return;
    }

    showToast(storageError, 'error');
  }, [showToast, storageError]);

  const openCreateModal = async (type: ApplicationType) => {
    Keyboard.dismiss();
    await runHapticsSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
    setEditorType(type);
    setEditingCompany(null);
    setEditorVisible(true);
  };

  const openEditModal = async (company: Company) => {
    Keyboard.dismiss();
    await runHapticsSafely(() => Haptics.selectionAsync());
    setEditorType(company.type);
    setEditingCompany(company);
    setEditorVisible(true);
  };

  const animateTypeTransition = useCallback(
    (type: ApplicationType) => {
      Animated.spring(typeTransition, {
        toValue: transitionValueByType[type],
        useNativeDriver: false,
        speed: 20,
        bounciness: 0
      }).start();
    },
    [typeTransition]
  );

  const resetEdgePull = useCallback(() => {
    Animated.spring(edgePullX, {
      toValue: 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4
    }).start();
  }, [edgePullX]);

  const changeApplicationType = useCallback(
    async (type: ApplicationType) => {
      if (type === activeType) {
        animateTypeTransition(type);
        return;
      }

      Keyboard.dismiss();
      setActiveType(type);
      animateTypeTransition(type);
      await runHapticsSafely(() => Haptics.selectionAsync());
    },
    [activeType, animateTypeTransition]
  );

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => {
          const absX = Math.abs(gesture.dx);
          const absY = Math.abs(gesture.dy);
          return absX > 24 && absX > absY * 1.18;
        },
        onPanResponderGrant: () => {
          typeTransition.stopAnimation();
          edgePullX.stopAnimation();
          edgePullX.setValue(0);
          Keyboard.dismiss();
        },
        onPanResponderMove: (_event, gesture) => {
          const base = transitionValueByType[activeType];
          const nextProgress = clamp(base + gesture.dx / (width * 0.72), 0, 1);
          const isPullingPastInternship =
            activeType === 'internship' && gesture.dx < 0;
          const isPullingPastFullTime =
            activeType === 'fullTime' && gesture.dx > 0;

          typeTransition.setValue(nextProgress);
          edgePullX.setValue(
            isPullingPastInternship || isPullingPastFullTime
              ? clamp(gesture.dx * 0.16, -18, 18)
              : 0
          );
        },
        onPanResponderTerminationRequest: () => true,
        onPanResponderRelease: (_event, gesture) => {
          const distanceThreshold = Math.max(44, width * 0.11);
          const velocityThreshold = 0.28;
          const shouldGoFullTime =
            activeType === 'internship' &&
            (gesture.dx > distanceThreshold || gesture.vx > velocityThreshold);
          const shouldGoInternship =
            activeType === 'fullTime' &&
            (gesture.dx < -distanceThreshold || gesture.vx < -velocityThreshold);

          if (shouldGoFullTime) {
            resetEdgePull();
            void changeApplicationType('fullTime');
            return;
          }

          if (shouldGoInternship) {
            resetEdgePull();
            void changeApplicationType('internship');
            return;
          }

          resetEdgePull();
          animateTypeTransition(activeType);
        },
        onPanResponderTerminate: () => {
          resetEdgePull();
          animateTypeTransition(activeType);
        }
      }),
    [
      activeType,
      animateTypeTransition,
      changeApplicationType,
      edgePullX,
      resetEdgePull,
      typeTransition,
      width
    ]
  );

  const togglePassword = (id: string) => {
    setVisiblePasswordIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) {
      Alert.alert(`${label}が未設定です`, '編集画面から登録してください。');
      return;
    }

    try {
      await Clipboard.setStringAsync(value);
      showToast(`${label}をコピーしました`);
    } catch {
      showToast(`${label}のコピーに失敗しました`, 'error');
    }
  };

  const openUrl = async (company: Company) => {
    if (!company.myPageUrl) {
      Alert.alert('マイページURLが未設定です', '編集画面から登録してください。');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(company.myPageUrl);
      if (!canOpen) {
        Alert.alert('URLを開けませんでした', 'URLの形式を確認してください。');
        return;
      }

      await Linking.openURL(company.myPageUrl);
    } catch {
      Alert.alert('URLを開けませんでした', 'しばらくしてからもう一度お試しください。');
    }
  };

  const handleSave = async (draft: CompanyDraft) => {
    await upsertCompany(draft);
    await runHapticsSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
    showToast(draft.id ? '変更を保存しました' : '登録しました');
  };

  const handleDeleteCompany = (company: Company) => {
    Alert.alert(
      '企業を削除しますか？',
      `${company.companyName}のIDとパスワードも削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCompany(company.id);
              await runHapticsSafely(() =>
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                )
              );
              showToast('削除しました');
            } catch {}
          }
        }
      ]
    );
  };

  const handleToggleFavorite = async (company: Company) => {
    Keyboard.dismiss();
    try {
      await upsertCompany({
        ...company,
        favorite: !company.favorite
      });
      await runHapticsSafely(() => Haptics.selectionAsync());
      showToast(
        company.favorite
          ? 'お気に入りを解除しました'
          : 'お気に入りに追加しました'
      );
    } catch {}
  };

  const renderEmptyCompanies = () => {
    if (isLoading) {
      return (
        <View style={[containerStyle, styles.centerState]}>
          <ActivityIndicator color={activeTypeTheme.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            読み込み中
          </Text>
        </View>
      );
    }

    if (query.trim()) {
      return (
        <View style={[containerStyle, styles.plainEmptyState]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            一致する企業がありません
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="検索をクリア"
            onPress={() => setQuery('')}
            style={({ pressed }) => [
              styles.clearSearchButton,
              pressed && styles.pressed
            ]}
          >
            <Text
              style={[
                styles.clearSearchText,
                { color: activeTypeTheme.accent }
              ]}
            >
              検索をクリア
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeTypeCount === 0) {
      return (
        <View style={[containerStyle, styles.plainEmptyState]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            登録済みの企業はありません
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <AnimatedSafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, animatedThemeStyle]}
    >
      <Animated.View
        style={[
          styles.topArea,
          animatedThemeStyle,
          edgePullStyle
        ]}
      >
        <View
          style={[
            containerStyle,
            styles.titleArea,
            { paddingHorizontal: metrics.contentPadding }
          ]}
        >
          <Text style={[styles.compactTitle, { color: theme.colors.text }]}>
            企業一覧
          </Text>
        </View>

        <ApplicationTypeSegment
          value={activeType}
          theme={theme}
          transitionProgress={typeTransition}
          edgePullX={edgePullX}
          onChange={changeApplicationType}
        />

        <View
          style={[
            containerStyle,
            styles.searchArea,
            { paddingHorizontal: metrics.contentPadding }
          ]}
        >
          <SearchField
            value={query}
            placeholder="企業名、ID、業界、タグで検索"
            theme={theme}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.listArea, animatedThemeStyle, edgePullStyle]}
        {...swipeResponder.panHandlers}
      >
        <DismissKeyboardView style={styles.flex}>
          <FlashList
            data={groups}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyCompanies}
            contentContainerStyle={{
              paddingBottom: bottomPadding,
              paddingHorizontal: metrics.contentPadding,
              paddingTop: 8
            }}
            onScrollBeginDrag={Keyboard.dismiss}
            keyExtractor={(item) => item.status}
            renderItem={({ item }) => (
              <View style={containerStyle}>
                <CompanySection
                  title={item.status}
                  companies={item.companies}
                  theme={theme}
                  visiblePasswordIds={visiblePasswordIds}
                  onEdit={openEditModal}
                  onTogglePassword={togglePassword}
                  onToggleFavorite={handleToggleFavorite}
                  onCopy={copyToClipboard}
                  onOpenUrl={openUrl}
                  onDelete={handleDeleteCompany}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        </DismissKeyboardView>
      </Animated.View>

      <FloatingActionButton
        accentColor={activeTypeTheme.accent}
        label={`${applicationTypeLabels[activeType]}を追加`}
        onPress={() => openCreateModal(activeType)}
        theme={theme}
        style={{
          bottom: Math.max(insets.bottom, 8) + 24,
          right: metrics.contentPadding
        }}
      />

      <CompanyEditorModal
        visible={editorVisible}
        type={editorType}
        company={editingCompany}
        theme={theme}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      {toast ? <AppToast message={toast.message} theme={theme} tone={toast.tone} /> : null}
    </AnimatedSafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  listArea: {
    flex: 1
  },
  topArea: {
    paddingBottom: 12,
    paddingTop: 0
  },
  titleArea: {
    paddingBottom: 10,
    paddingTop: 4
  },
  compactTitle: {
    fontSize: 19,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center'
  },
  searchArea: {
    paddingTop: 12
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18
  },
  centerState: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minHeight: 240
  },
  plainEmptyState: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    minHeight: 220,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center'
  },
  clearSearchButton: {
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },
  pressed: {
    opacity: 0.72
  }
});

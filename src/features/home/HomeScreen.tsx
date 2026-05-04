import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getContentMetrics, getTheme, type AppTheme } from '../../constants/theme';
import { AuthUser } from '../auth/types';
import { AppButton } from '../../ui/AppButton';
import { AppToast } from '../../ui/AppToast';
import { DismissKeyboardView } from '../../ui/DismissKeyboardView';
import { FloatingActionButton } from '../../ui/FloatingActionButton';
import { IconButton } from '../../ui/IconButton';
import { SearchField } from '../../ui/SearchField';
import { SectionHeader } from '../../ui/SectionHeader';
import { ApplicationTypeSegment } from './components/ApplicationTypeSegment';
import { BottomNavigation, MainTab } from './components/BottomNavigation';
import { CompanyCard } from './components/CompanyCard';
import { CompanyEditorModal } from './components/CompanyEditorModal';
import { HomeMenuModal } from './components/HomeMenuModal';
import { QuestionCompanyPickerModal } from './components/QuestionCompanyPickerModal';
import { QuestionListView } from './components/QuestionListView';
import { QuestionMemoDialog } from './components/QuestionMemoDialog';
import { useCompanies } from './hooks/useCompanies';
import {
  ApplicationType,
  applicationTypeLabels,
  Company,
  CompanyDraft,
  CompanyQuestionAnswer,
  SelectionStatus
} from './types';
import {
  filterAndSortCompanies,
  getStatusList,
  groupCompaniesByStatus
} from './utils/companyUtils';
import {
  countQuestionMemos,
  filterQuestionMemos,
  flattenQuestionMemos,
  QuestionMemoEntry,
  QuestionMemoFilter,
  QuestionMemoSort,
  sortQuestionMemos
} from './utils/questionMemoUtils';

const transitionValueByType: Record<ApplicationType, number> = {
  internship: 0,
  fullTime: 1
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
type CompanyStatusGroup = ReturnType<typeof groupCompaniesByStatus>[number];
type CompanyListItem =
  | {
      kind: 'section';
      id: string;
      status: SelectionStatus;
      count: number;
    }
  | {
      kind: 'company';
      id: string;
      status: SelectionStatus;
      company: Company;
      isFirst: boolean;
      isLast: boolean;
    };
const PASSWORD_DEFAULT_VISIBLE_KEY = 'syuukatu:password-default-visible';
const COMPANY_LIST_OVERRIDE_PROPS = { initialDrawBatchSize: 8 } as const;
const DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION = { disabled: true } as const;

const buildCompanyListItems = (
  groups: CompanyStatusGroup[]
): CompanyListItem[] =>
  groups.flatMap((group) => [
    {
      kind: 'section',
      id: `section:${group.status}`,
      status: group.status,
      count: group.companies.length
    },
    ...group.companies.map((company, index) => ({
      kind: 'company' as const,
      id: company.id,
      status: group.status,
      company,
      isFirst: index === 0,
      isLast: index === group.companies.length - 1
    }))
  ]);

const getCompanyListItemType = (item: CompanyListItem) => item.kind;
const keyCompanyListItem = (item: CompanyListItem) => item.id;

const createQuestionMemoDraft = (): CompanyQuestionAnswer => {
  const now = new Date().toISOString();

  return {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: '',
    answer: '',
    createdAt: now,
    updatedAt: now
  };
};

const runHapticsSafely = async (task: () => Promise<void>) => {
  try {
    await task();
  } catch {}
};

type HomeScreenProps = {
  user: AuthUser;
  onSignOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const getSafeExternalUrl = (value: string) => {
  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

type CompanyListRowProps = {
  item: CompanyListItem;
  theme: AppTheme;
  containerStyle: ViewStyle;
  showPasswordControls: boolean;
  isPasswordVisible: (id: string) => boolean;
  onEdit: (company: Company) => void;
  onTogglePassword: (id: string) => void;
  onCopy: (value: string, label: string) => void;
  onOpenUrl: (company: Company) => void;
  onDelete: (company: Company) => void;
};

type CompanyCardListRowProps = Omit<CompanyListRowProps, 'item'> & {
  item: Extract<CompanyListItem, { kind: 'company' }>;
};

const CompanyCardListRow = ({
  item,
  theme,
  containerStyle,
  showPasswordControls,
  isPasswordVisible,
  onEdit,
  onTogglePassword,
  onCopy,
  onOpenUrl,
  onDelete
}: CompanyCardListRowProps) => {
  const { company } = item;
  const handleEdit = useCallback(() => onEdit(company), [company, onEdit]);
  const handleTogglePassword = useCallback(
    () => onTogglePassword(company.id),
    [company.id, onTogglePassword]
  );
  const handleOpenUrl = useCallback(
    () => onOpenUrl(company),
    [company, onOpenUrl]
  );
  const handleDelete = useCallback(
    () => onDelete(company),
    [company, onDelete]
  );

  return (
    <View
      style={[
        containerStyle,
        styles.companyCardShell,
        item.isFirst && styles.companyCardShellFirst,
        item.isLast && styles.companyCardShellLast,
        item.isFirst && theme.shadows.surface,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }
      ]}
    >
      {!item.isFirst ? (
        <View
          style={[
            styles.companyCardDivider,
            { backgroundColor: theme.colors.divider }
          ]}
        />
      ) : null}
      <CompanyCard
        company={company}
        isPasswordVisible={isPasswordVisible(company.id)}
        showPasswordControls={showPasswordControls}
        theme={theme}
        onPress={handleEdit}
        onTogglePassword={handleTogglePassword}
        onCopy={onCopy}
        onOpenUrl={handleOpenUrl}
        onDelete={handleDelete}
      />
    </View>
  );
};

const CompanyListRow = memo(
  ({
    item,
    theme,
    containerStyle,
    showPasswordControls,
    isPasswordVisible,
    onEdit,
    onTogglePassword,
    onCopy,
    onOpenUrl,
    onDelete
  }: CompanyListRowProps) => {
    if (item.kind === 'section') {
      return (
        <View style={[containerStyle, styles.companySectionHeader]}>
          <SectionHeader title={item.status} count={item.count} theme={theme} />
        </View>
      );
    }

    return (
      <CompanyCardListRow
        item={item}
        theme={theme}
        containerStyle={containerStyle}
        showPasswordControls={showPasswordControls}
        isPasswordVisible={isPasswordVisible}
        onEdit={onEdit}
        onTogglePassword={onTogglePassword}
        onCopy={onCopy}
        onOpenUrl={onOpenUrl}
        onDelete={onDelete}
      />
    );
  },
  (previous, next) => {
    if (
      previous.theme !== next.theme ||
      previous.containerStyle !== next.containerStyle ||
      previous.showPasswordControls !== next.showPasswordControls ||
      previous.onEdit !== next.onEdit ||
      previous.onTogglePassword !== next.onTogglePassword ||
      previous.onCopy !== next.onCopy ||
      previous.onOpenUrl !== next.onOpenUrl ||
      previous.onDelete !== next.onDelete
    ) {
      return false;
    }

    if (previous.item.kind !== next.item.kind) {
      return false;
    }

    if (previous.item.kind === 'section' && next.item.kind === 'section') {
      return (
        previous.item.status === next.item.status &&
        previous.item.count === next.item.count
      );
    }

    if (previous.item.kind === 'company' && next.item.kind === 'company') {
      return (
        previous.item.company === next.item.company &&
        previous.item.isFirst === next.item.isFirst &&
        previous.item.isLast === next.item.isLast &&
        previous.isPasswordVisible(previous.item.company.id) ===
          next.isPasswordVisible(next.item.company.id)
      );
    }

    return false;
  }
);

export const HomeScreen = ({
  user,
  onSignOut,
  getAccessToken
}: HomeScreenProps) => {
  const {
    companies,
    isLoading,
    storageError,
    localMigrationAvailable,
    isMigratingLocalData,
    upsertCompany,
    deleteCompany,
    importLocalCompanies,
    dismissLocalMigration
  } = useCompanies({ userId: user.id, getAccessToken });

  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const metrics = useMemo(() => getContentMetrics(width), [width]);
  const containerStyle = useMemo<ViewStyle>(
    () => ({
      alignSelf: 'center',
      maxWidth: theme.layout.maxContentWidth,
      width: '100%'
    }),
    [theme.layout.maxContentWidth]
  );

  const [companyQuery, setCompanyQuery] = useState('');
  const [questionQuery, setQuestionQuery] = useState('');
  const [activeType, setActiveType] = useState<ApplicationType>('internship');
  const [homeView, setHomeView] = useState<MainTab>('companies');
  const [questionFilter, setQuestionFilter] =
    useState<QuestionMemoFilter>('all');
  const [questionSort, setQuestionSort] =
    useState<QuestionMemoSort>('updatedAtDesc');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorType, setEditorType] = useState<ApplicationType>('internship');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingQuestionMemo, setEditingQuestionMemo] = useState<{
    companyId: string;
    item: CompanyQuestionAnswer;
  } | null>(null);
  const [questionCompanyPickerVisible, setQuestionCompanyPickerVisible] =
    useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [passwordDefaultVisible, setPasswordDefaultVisible] = useState(false);
  const [passwordPreferenceHydrated, setPasswordPreferenceHydrated] =
    useState(false);
  const [passwordVisibilityOverrides, setPasswordVisibilityOverrides] =
    useState<Set<string>>(new Set());
  const [questionCreateCompanyId, setQuestionCreateCompanyId] = useState<
    string | null
  >(null);
  const [questionSaveNoticeKey, setQuestionSaveNoticeKey] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const typeTransition = useRef(new Animated.Value(0)).current;
  const edgePullX = useRef(new Animated.Value(0)).current;
  const companyListRef = useRef<FlashListRef<CompanyListItem>>(null);
  const questionListRef = useRef<FlashListRef<QuestionMemoEntry>>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deferredCompanyQuery = useDeferredValue(companyQuery);
  const deferredQuestionQuery = useDeferredValue(questionQuery);
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
  const neutralBackgroundStyle = useMemo(
    () => ({ backgroundColor: theme.colors.background }),
    [theme.colors.background]
  );
  const navigationBottom = Math.max(insets.bottom, 6) + 6;
  const navigationHeight = 56;
  const navigationReservedHeight = navigationBottom + navigationHeight + 14;
  const bottomPadding = navigationReservedHeight + 96;
  const bottomNavigationWidth = Math.min(width - metrics.contentPadding * 2, 420);
  const availableCompanies = useMemo(
    () =>
      [...companies]
        .filter((company) => !company.archived)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [companies]
  );
  const activeCompanies = useMemo(
    () => filterAndSortCompanies(companies, activeType, deferredCompanyQuery),
    [activeType, companies, deferredCompanyQuery]
  );
  const groups = useMemo(
    () => groupCompaniesByStatus(activeCompanies, activeType),
    [activeCompanies, activeType]
  );
  const companyListItems = useMemo(
    () => buildCompanyListItems(groups),
    [groups]
  );
  const questionEntries = useMemo(
    () => flattenQuestionMemos(companies),
    [companies]
  );
  const questionCounts = useMemo(
    () => countQuestionMemos(questionEntries),
    [questionEntries]
  );
  const filteredQuestionEntries = useMemo(
    () =>
      sortQuestionMemos(
        filterQuestionMemos(
          questionEntries,
          deferredQuestionQuery,
          questionFilter
        ),
        questionSort
      ),
    [deferredQuestionQuery, questionEntries, questionFilter, questionSort]
  );

  const { internshipCount, fullTimeCount } = useMemo(
    () =>
      companies.reduce(
        (counts, company) => {
          if (company.archived) {
            return counts;
          }

          if (company.type === 'internship') {
            counts.internshipCount += 1;
          } else {
            counts.fullTimeCount += 1;
          }

          return counts;
        },
        { internshipCount: 0, fullTimeCount: 0 }
      ),
    [companies]
  );
  const activeTypeCount =
    activeType === 'internship' ? internshipCount : fullTimeCount;
  const searchPlaceholder =
    homeView === 'questions'
      ? '質問文、企業名、タグで検索'
      : '企業名、ID、業界、タグで検索';
  const searchValue = homeView === 'questions' ? questionQuery : companyQuery;
  const screenBackgroundStyle =
    homeView === 'companies'
      ? animatedThemeStyle
      : neutralBackgroundStyle;
  const pageMotionStyle = homeView === 'companies' ? edgePullStyle : null;
  const fabBottom = navigationReservedHeight + 8;
  const showPasswordControls = Platform.OS !== 'web';
  const companyListContentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomPadding,
      paddingHorizontal: metrics.contentPadding,
      paddingTop: 8
    }),
    [bottomPadding, metrics.contentPadding]
  );
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

  const scrollQuestionListToTop = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        questionListRef.current?.scrollToOffset({ offset: 0, animated });
      });
    });
  }, []);

  const scrollCompanyListToTop = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        companyListRef.current?.scrollToOffset({ offset: 0, animated });
      });
    });
  }, []);

  const clearCompanySearch = useCallback(() => {
    setCompanyQuery('');
    scrollCompanyListToTop(false);
  }, [scrollCompanyListToTop]);

  const clearQuestionSearch = useCallback(() => {
    setQuestionQuery('');
    scrollQuestionListToTop(false);
  }, [scrollQuestionListToTop]);

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(PASSWORD_DEFAULT_VISIBLE_KEY)
      .then((value) => {
        if (!mounted) {
          return;
        }

        setPasswordDefaultVisible(value === 'visible');
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setPasswordPreferenceHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!passwordPreferenceHydrated) {
      return;
    }

    AsyncStorage.setItem(
      PASSWORD_DEFAULT_VISIBLE_KEY,
      passwordDefaultVisible ? 'visible' : 'hidden'
    ).catch(() => {});
  }, [passwordDefaultVisible, passwordPreferenceHydrated]);

  useEffect(() => {
    if (!storageError) {
      return;
    }

    showToast(storageError, 'error');
  }, [showToast, storageError]);

  const openCreateModal = useCallback((type: ApplicationType) => {
    Keyboard.dismiss();
    setEditorType(type);
    setEditingCompany(null);
    setEditorVisible(true);
    void runHapticsSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
  }, []);

  const openEditModal = useCallback((company: Company) => {
    Keyboard.dismiss();
    setEditorType(company.type);
    setEditingCompany(company);
    setEditorVisible(true);
    void runHapticsSafely(() => Haptics.selectionAsync());
  }, []);

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
    (type: ApplicationType) => {
      if (type === activeType) {
        animateTypeTransition(type);
        return;
      }

      Keyboard.dismiss();
      setActiveType(type);
      animateTypeTransition(type);
      void runHapticsSafely(() => Haptics.selectionAsync());
    },
    [activeType, animateTypeTransition]
  );

  const changeHomeView = useCallback((view: MainTab) => {
    if (view === homeView) {
      return;
    }

    Keyboard.dismiss();
    setHomeView(view);
    void runHapticsSafely(() => Haptics.selectionAsync());
  }, [homeView]);

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

  const togglePassword = useCallback((id: string) => {
    setPasswordVisibilityOverrides((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isCompanyPasswordVisible = useCallback(
    (id: string) =>
      passwordDefaultVisible
        ? !passwordVisibilityOverrides.has(id)
        : passwordVisibilityOverrides.has(id),
    [passwordDefaultVisible, passwordVisibilityOverrides]
  );

  const changePasswordDefaultVisibility = useCallback((visible: boolean) => {
    setPasswordDefaultVisible(visible);
    setPasswordVisibilityOverrides(new Set());
  }, []);

  const copyToClipboard = useCallback(async (value: string, label: string) => {
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
  }, [showToast]);

  const openUrl = useCallback(async (company: Company) => {
    if (!company.myPageUrl) {
      Alert.alert('マイページURLが未設定です', '編集画面から登録してください。');
      return;
    }

    const safeUrl = getSafeExternalUrl(company.myPageUrl);

    if (!safeUrl) {
      Alert.alert(
        'URLを開けませんでした',
        'https:// または http:// から始まるURLを入力してください。'
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(safeUrl);
      if (!canOpen) {
        Alert.alert('URLを開けませんでした', 'URLの形式を確認してください。');
        return;
      }

      await Linking.openURL(safeUrl);
    } catch {
      Alert.alert('URLを開けませんでした', 'しばらくしてからもう一度お試しください。');
    }
  }, []);

  const handleSave = useCallback(async (draft: CompanyDraft) => {
    await upsertCompany(draft);
    void runHapticsSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
    showToast(draft.id ? '変更を保存しました' : '登録しました');
  }, [showToast, upsertCompany]);

  const handleDeleteCompany = useCallback((company: Company) => {
    Alert.alert(
      '企業を削除しますか？',
      showPasswordControls
        ? `${company.companyName}のIDと端末内のパスワードも削除されます。`
        : `${company.companyName}の登録情報を削除します。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCompany(company.id);
              void runHapticsSafely(() =>
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
  }, [deleteCompany, showPasswordControls, showToast]);

  const handleImportLocalCompanies = useCallback(async () => {
    try {
      await importLocalCompanies();
      showToast('端末の保存データをアカウントへ移行しました');
    } catch {
      showToast('保存データの移行に失敗しました', 'error');
    }
  }, [importLocalCompanies, showToast]);

  const handleDismissLocalMigration = useCallback(async () => {
    await dismissLocalMigration();
    showToast('端末データの移行案内を閉じました');
  }, [dismissLocalMigration, showToast]);

  const executeSignOut = useCallback(async () => {
    try {
      await onSignOut();
    } catch {
      showToast('ログアウトに失敗しました', 'error');
    }
  }, [onSignOut, showToast]);

  const handleSignOut = useCallback(() => {
    Alert.alert('ログアウトしますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => {
          void executeSignOut();
        }
      }
    ]);
  }, [executeSignOut]);

  const openQuestionCompanyPicker = useCallback(() => {
    Keyboard.dismiss();

    setQuestionCompanyPickerVisible(true);
    void runHapticsSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
  }, []);

  const openQuestionMemo = useCallback((entry: QuestionMemoEntry) => {
    Keyboard.dismiss();
    setEditingQuestionMemo({
      companyId: entry.company.id,
      item: entry.questionAnswer
    });
    void runHapticsSafely(() => Haptics.selectionAsync());
  }, []);

  const startQuestionMemoForCompany = useCallback((company: Company) => {
    setQuestionCompanyPickerVisible(false);
    setQuestionCreateCompanyId(company.id);
    setEditingQuestionMemo({
      companyId: company.id,
      item: createQuestionMemoDraft()
    });
  }, []);

  const createCompanyForQuestion = useCallback(async (companyName: string) => {
    const trimmedName = companyName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      const savedCompany = await upsertCompany({
        type: activeType,
        companyName: trimmedName,
        aspiration: 'unset',
        status: getStatusList(activeType)[0],
        loginId: '',
        password: '',
        myPageUrl: '',
        industry: '',
        role: '',
        tags: [],
        questionAnswers: [],
        memo: '',
        favorite: false,
        archived: false
      });

      void runHapticsSafely(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      );
      showToast('企業を追加しました');
      startQuestionMemoForCompany(savedCompany);
    } catch (error) {
      showToast('企業の追加に失敗しました', 'error');
      throw error;
    }
  }, [activeType, showToast, startQuestionMemoForCompany, upsertCompany]);

  const closeQuestionMemo = useCallback(() => {
    setEditingQuestionMemo(null);
    setQuestionCreateCompanyId(null);
  }, []);

  const saveQuestionMemo = useCallback(async (item: CompanyQuestionAnswer) => {
    if (!editingQuestionMemo) {
      return;
    }

    const targetCompany = companies.find(
      (company) => company.id === editingQuestionMemo.companyId
    );

    if (!targetCompany) {
      showToast('企業が見つかりませんでした', 'error');
      closeQuestionMemo();
      return;
    }

    const now = new Date().toISOString();
    const nextItem: CompanyQuestionAnswer = {
      ...item,
      question: item.question.trim(),
      answer: item.answer.trim(),
      createdAt: item.createdAt || now,
      updatedAt: now
    };

    if (!nextItem.question && !nextItem.answer) {
      closeQuestionMemo();
      return;
    }

    const currentItems = targetCompany.questionAnswers ?? [];
    const isExistingQuestionMemo = currentItems.some(
      (current) => current.id === nextItem.id
    );
    const nextQuestionAnswers = isExistingQuestionMemo
      ? currentItems.map((current) =>
          current.id === nextItem.id ? nextItem : current
        )
      : [...currentItems, nextItem];

    try {
      await upsertCompany({
        ...targetCompany,
        questionAnswers: nextQuestionAnswers
      });
      void runHapticsSafely(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      );
      showToast('質問メモを保存しました');
      const shouldContinueCreating =
        !isExistingQuestionMemo && questionCreateCompanyId === targetCompany.id;

      if (shouldContinueCreating) {
        setQuestionSaveNoticeKey((current) => current + 1);
        setEditingQuestionMemo({
          companyId: targetCompany.id,
          item: createQuestionMemoDraft()
        });
        return;
      }

      closeQuestionMemo();
      if (!isExistingQuestionMemo) {
        setHomeView('questions');
        setQuestionFilter('all');
        setQuestionSort('updatedAtDesc');
        setQuestionQuery('');
        scrollQuestionListToTop();
      }
    } catch {
      showToast('質問メモの保存に失敗しました', 'error');
    }
  }, [
    closeQuestionMemo,
    companies,
    editingQuestionMemo,
    questionCreateCompanyId,
    scrollQuestionListToTop,
    showToast,
    upsertCompany
  ]);

  const deleteQuestionMemo = useCallback((entry: QuestionMemoEntry) => {
    Alert.alert(
      '質問メモを削除しますか？',
      `${entry.company.companyName}の「${
        entry.questionAnswer.question || '題目未入力'
      }」を削除します。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const targetCompany = companies.find(
              (company) => company.id === entry.company.id
            );

            if (!targetCompany) {
              showToast('企業が見つかりませんでした', 'error');
              return;
            }

            try {
              await upsertCompany({
                ...targetCompany,
                questionAnswers: (targetCompany.questionAnswers ?? []).filter(
                  (item) => item.id !== entry.questionAnswer.id
                )
              });
              void runHapticsSafely(() =>
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                )
              );
              showToast('質問メモを削除しました');
            } catch {
              showToast('質問メモの削除に失敗しました', 'error');
            }
          }
        }
      ]
    );
  }, [companies, showToast, upsertCompany]);

  const renderEmptyCompanies = useCallback(() => {
    if (isLoading) {
      return (
        <View style={[containerStyle, styles.centerState]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            読み込み中
          </Text>
        </View>
      );
    }

    if (companyQuery.trim()) {
      return (
        <View style={[containerStyle, styles.plainEmptyState]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            一致する企業がありません
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="検索をクリア"
            onPress={clearCompanySearch}
            style={({ pressed }) => [
              styles.clearSearchButton,
              pressed && styles.pressed
            ]}
          >
            <Text
              style={[
                styles.clearSearchText,
                { color: theme.colors.primary }
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
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            登録済みの企業はありません
          </Text>
        </View>
      );
    }

    return null;
  }, [
    activeTypeCount,
    clearCompanySearch,
    companyQuery,
    containerStyle,
    isLoading,
    theme
  ]);

  const renderCompanyListItem = useCallback(
    ({ item }: { item: CompanyListItem }) => (
      <CompanyListRow
        item={item}
        theme={theme}
        containerStyle={containerStyle}
        showPasswordControls={showPasswordControls}
        isPasswordVisible={isCompanyPasswordVisible}
        onEdit={openEditModal}
        onTogglePassword={togglePassword}
        onCopy={copyToClipboard}
        onOpenUrl={openUrl}
        onDelete={handleDeleteCompany}
      />
    ),
    [
      containerStyle,
      copyToClipboard,
      handleDeleteCompany,
      isCompanyPasswordVisible,
      openEditModal,
      openUrl,
      showPasswordControls,
      theme,
      togglePassword
    ]
  );

  return (
    <AnimatedSafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, screenBackgroundStyle]}
    >
      <Animated.View
        style={[
          styles.topArea,
          screenBackgroundStyle,
          pageMotionStyle
        ]}
      >
        <View
          style={[
            containerStyle,
            styles.titleArea,
            { paddingHorizontal: metrics.contentPadding }
          ]}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleSide} />
            <View style={styles.titleCenter}>
              <Text style={[styles.compactTitle, { color: theme.colors.textPrimary }]}>
                {homeView === 'companies' ? '企業一覧' : '質問一覧'}
              </Text>
            </View>
            <View style={styles.titleSide}>
              {homeView === 'companies' ? (
                <IconButton
                  icon="menu-outline"
                  label="サイドメニューを開く"
                  onPress={() => setMenuVisible(true)}
                  theme={theme}
                  tone="neutral"
                  size="compact"
                  variant="plain"
                  iconSize={22}
                />
              ) : null}
            </View>
          </View>
        </View>

        {homeView === 'companies' ? (
          <ApplicationTypeSegment
            value={activeType}
            theme={theme}
            transitionProgress={typeTransition}
            edgePullX={edgePullX}
            onChange={changeApplicationType}
          />
        ) : null}

        <View
          style={[
            containerStyle,
            styles.searchArea,
            { paddingHorizontal: metrics.contentPadding }
          ]}
        >
          <SearchField
            value={searchValue}
            placeholder={searchPlaceholder}
            theme={theme}
            onChangeText={
              homeView === 'questions' ? setQuestionQuery : setCompanyQuery
            }
            onClear={() => {
              if (homeView === 'questions') {
                clearQuestionSearch();
                return;
              }

              clearCompanySearch();
            }}
          />
        </View>

        {localMigrationAvailable ? (
          <View
            style={[
              containerStyle,
              styles.migrationArea,
              { paddingHorizontal: metrics.contentPadding }
            ]}
          >
            <View
              style={[
                styles.migrationBanner,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <View style={styles.migrationTextBlock}>
                <Text
                  style={[
                    styles.migrationTitle,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  この端末の保存データがあります
                </Text>
                <Text
                  style={[
                    styles.migrationDescription,
                    { color: theme.colors.textMuted }
                  ]}
                >
                  パスワードはWebには移行されません。
                </Text>
              </View>
              <View style={styles.migrationActions}>
                <AppButton
                  label="移行"
                  size="compact"
                  loading={isMigratingLocalData}
                  disabled={isMigratingLocalData}
                  onPress={() => {
                    void handleImportLocalCompanies();
                  }}
                  theme={theme}
                />
                <AppButton
                  label="閉じる"
                  size="compact"
                  disabled={isMigratingLocalData}
                  onPress={() => {
                    void handleDismissLocalMigration();
                  }}
                  theme={theme}
                  variant="ghost"
                />
              </View>
            </View>
          </View>
        ) : null}
      </Animated.View>

      <Animated.View
        style={[styles.listArea, screenBackgroundStyle, pageMotionStyle]}
        {...(homeView === 'companies' ? swipeResponder.panHandlers : {})}
      >
        {homeView === 'companies' ? (
          <DismissKeyboardView style={styles.flex}>
            <FlashList
              ref={companyListRef}
              data={companyListItems}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={renderEmptyCompanies}
              contentContainerStyle={companyListContentContainerStyle}
              drawDistance={720}
              getItemType={getCompanyListItemType}
              keyExtractor={keyCompanyListItem}
              maintainVisibleContentPosition={
                DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION
              }
              onScrollBeginDrag={Keyboard.dismiss}
              overrideProps={COMPANY_LIST_OVERRIDE_PROPS}
              renderItem={renderCompanyListItem}
              showsVerticalScrollIndicator={false}
            />
          </DismissKeyboardView>
        ) : (
          <QuestionListView
            entries={filteredQuestionEntries}
            counts={questionCounts}
            filter={questionFilter}
            sort={questionSort}
            query={questionQuery}
            isLoading={isLoading}
            theme={theme}
            accentColor={theme.colors.selected}
            accentSurface={theme.colors.primarySubtle}
            accentBorder={theme.colors.primaryBorder}
            contentPadding={metrics.contentPadding}
            bottomPadding={bottomPadding}
            containerStyle={containerStyle}
            listRef={questionListRef}
            onFilterChange={setQuestionFilter}
            onSortChange={(sort) => {
              setQuestionSort(sort);
              scrollQuestionListToTop(false);
            }}
            onClearQuery={clearQuestionSearch}
            onOpenQuestion={(entry) => {
              void openQuestionMemo(entry);
            }}
            onOpenCompany={(entry) => openEditModal(entry.company)}
            onDelete={deleteQuestionMemo}
          />
        )}
      </Animated.View>

      <FloatingActionButton
        label={
          homeView === 'questions'
            ? '質問を追加'
            : `${applicationTypeLabels[activeType]}を追加`
        }
        onPress={() => {
          if (homeView === 'questions') {
            void openQuestionCompanyPicker();
            return;
          }

          void openCreateModal(activeType);
        }}
        theme={theme}
        style={{
          bottom: fabBottom,
          right: metrics.contentPadding
        }}
      />

      <BottomNavigation
        value={homeView}
        theme={theme}
        onChange={(view) => {
          void changeHomeView(view);
        }}
        style={{
          alignSelf: 'center',
          bottom: navigationBottom,
          left: (width - bottomNavigationWidth) / 2,
          width: bottomNavigationWidth
        }}
      />

      <CompanyEditorModal
        visible={editorVisible}
        type={editorType}
        company={editingCompany}
        theme={theme}
        allowPasswordStorage={showPasswordControls}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />

      <QuestionMemoDialog
        item={editingQuestionMemo?.item ?? null}
        theme={theme}
        saveNoticeKey={questionSaveNoticeKey}
        onClose={closeQuestionMemo}
        onSave={(item) => {
          void saveQuestionMemo(item);
        }}
      />

      <QuestionCompanyPickerModal
        visible={questionCompanyPickerVisible}
        companies={availableCompanies}
        theme={theme}
        onClose={() => setQuestionCompanyPickerVisible(false)}
        onSelect={startQuestionMemoForCompany}
        onCreateCompany={createCompanyForQuestion}
      />

      <HomeMenuModal
        visible={menuVisible}
        userEmail={user.email}
        showPasswordControls={showPasswordControls}
        passwordDefaultVisible={passwordDefaultVisible}
        theme={theme}
        onOpen={() => setMenuVisible(true)}
        onPasswordDefaultVisibleChange={changePasswordDefaultVisibility}
        onClose={() => setMenuVisible(false)}
        onSignOut={() => {
          setMenuVisible(false);
          handleSignOut();
        }}
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
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  titleSide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44
  },
  titleCenter: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  },
  searchArea: {
    paddingTop: 12
  },
  companySectionHeader: {
    marginTop: 24
  },
  companyCardShell: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  companyCardShellFirst: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12
  },
  companyCardShellLast: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  companyCardDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20
  },
  migrationArea: {
    paddingTop: 10
  },
  migrationBanner: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  migrationTextBlock: {
    flex: 1,
    minWidth: 0
  },
  migrationTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  migrationDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 2
  },
  migrationActions: {
    flexDirection: 'row',
    gap: 6
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

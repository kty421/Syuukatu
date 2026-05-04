import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme } from '../../../constants/theme';
import { QuestionMemoSort } from '../utils/questionMemoUtils';

type SortOption = {
  value: QuestionMemoSort;
  label: string;
  dividerBefore?: boolean;
};

type AnchorPosition = {
  top: number;
  right: number;
};

type QuestionSortMenuProps = {
  value: QuestionMemoSort;
  theme: AppTheme;
  accentColor: string;
  onChange: (value: QuestionMemoSort) => void;
};

const MENU_WIDTH = 188;
const MENU_HEIGHT = 148;
const SCREEN_MARGIN = 12;

const sortOptions: SortOption[] = [
  {
    value: 'titleAsc',
    label: 'タイトル順'
  },
  {
    value: 'createdAtDesc',
    label: '追加日'
  },
  {
    value: 'updatedAtDesc',
    label: '更新日'
  }
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const QuestionSortMenu = ({
  value,
  theme,
  accentColor,
  onChange
}: QuestionSortMenuProps) => {
  const triggerRef = useRef<View>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [rendered, setRendered] = useState(false);
  const [anchor, setAnchor] = useState<AnchorPosition>({
    right: insets.right + 20,
    top: insets.top + 84
  });

  const getAnchorPosition = useCallback(
    (x?: number, y?: number, triggerWidth = 40, triggerHeight = 40) => {
      const minTop = insets.top + SCREEN_MARGIN;
      const maxTop = Math.max(
        minTop,
        height - MENU_HEIGHT - insets.bottom - SCREEN_MARGIN
      );
      const minRight = insets.right + SCREEN_MARGIN;
      const maxRight = Math.max(
        minRight,
        width - MENU_WIDTH - insets.left - SCREEN_MARGIN
      );
      const measuredTop =
        y === undefined ? insets.top + 84 : y + triggerHeight + 8;
      const measuredRight =
        x === undefined ? insets.right + 20 : width - (x + triggerWidth);

      return {
        top: clamp(measuredTop, minTop, maxTop),
        right: clamp(measuredRight, minRight, maxRight)
      };
    },
    [height, insets.bottom, insets.left, insets.right, insets.top, width]
  );

  const animateOpen = useCallback(() => {
    setRendered(true);
    progress.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    });
  }, [progress]);

  const openMenu = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
      setAnchor(getAnchorPosition(x, y, triggerWidth, triggerHeight));
      animateOpen();
    });

    if (!triggerRef.current) {
      setAnchor(getAnchorPosition());
      animateOpen();
    }
  }, [animateOpen, getAnchorPosition]);

  const closeMenu = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
      }
    });
  }, [progress]);

  const selectOption = useCallback(
    (nextValue: QuestionMemoSort) => {
      if (nextValue !== value) {
        onChange(nextValue);
      }

      closeMenu();
    },
    [closeMenu, onChange, value]
  );

  const menuScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel="質問の並び替え"
        onPress={openMenu}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          },
          pressed && styles.pressed
        ]}
      >
        <Ionicons
          name="ellipsis-horizontal"
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>

      <Modal
        animationType="none"
        transparent
        visible={rendered}
        onRequestClose={closeMenu}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="並び替えメニューを閉じる"
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.backdrop,
                { opacity: progress }
              ]}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.menuShadow,
              {
                opacity: progress,
                right: anchor.right,
                top: anchor.top,
                transform: [{ scale: menuScale }],
                transformOrigin: 'top right'
              }
            ]}
          >
            <View style={styles.menuSurface}>
              {sortOptions.map((option) => {
                const selected = option.value === value;

                return (
                  <View key={option.value}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => selectOption(option.value)}
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed
                      ]}
                    >
                      <View style={styles.iconSlot}>
                        {selected ? (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={accentColor}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: selected ? accentColor : '#111827' }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 34,
    width: 40
  },
  modalRoot: {
    flex: 1
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  menuShadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 8,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    width: MENU_WIDTH
  },
  menuSurface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 2
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 14
  },
  menuItemPressed: {
    backgroundColor: '#F3F4F6'
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    marginLeft: 10
  },
  pressed: {
    opacity: 0.72
  }
});

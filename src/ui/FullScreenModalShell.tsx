import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme } from '../constants/theme';
import { ModalCloseButton } from './ModalCloseButton';
import { SwipeBackDismissView } from './SwipeBackDismissView';

type FullScreenModalShellProps = {
  visible: boolean;
  title: string;
  theme: AppTheme;
  children: ReactNode;
  onClose: () => void;
  closeIcon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export const FullScreenModalShell = ({
  visible,
  title,
  theme,
  children,
  onClose,
  closeIcon = Platform.OS === 'ios' ? 'chevron-back' : 'close',
  right,
  contentStyle
}: FullScreenModalShellProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <SwipeBackDismissView onDismiss={onClose}>
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.divider,
                paddingTop: insets.top + 6
              }
            ]}
          >
            <View style={styles.headerSide}>
              <ModalCloseButton
                icon={closeIcon}
                label="閉じる"
                onPress={onClose}
                theme={theme}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: theme.colors.textPrimary }]}
            >
              {title}
            </Text>
            <View style={styles.headerSide}>{right}</View>
          </View>

          <View style={[styles.content, contentStyle]}>{children}</View>
        </SwipeBackDismissView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 58,
    paddingBottom: 8,
    paddingHorizontal: 10
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center'
  },
  headerSide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36
  },
  content: {
    flex: 1
  }
});

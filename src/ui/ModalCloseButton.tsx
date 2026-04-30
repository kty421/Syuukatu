import { Ionicons } from '@expo/vector-icons';

import { AppTheme } from '../constants/theme';
import { IconButton } from './IconButton';

type ModalCloseButtonProps = {
  theme: AppTheme;
  onPress: () => void;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export const ModalCloseButton = ({
  theme,
  onPress,
  label = '閉じる',
  icon = 'close'
}: ModalCloseButtonProps) => (
  <IconButton
    icon={icon}
    label={label}
    onPress={onPress}
    theme={theme}
    tone="neutral"
    variant="filled"
    size="compact"
    iconSize={18}
  />
);

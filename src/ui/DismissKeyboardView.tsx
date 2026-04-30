import { ReactNode } from 'react';
import {
  Keyboard,
  StyleProp,
  TouchableWithoutFeedback,
  View,
  ViewStyle
} from 'react-native';

type DismissKeyboardViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const DismissKeyboardView = ({
  children,
  style
}: DismissKeyboardViewProps) => (
  <TouchableWithoutFeedback
    accessible={false}
    onPress={Keyboard.dismiss}
    touchSoundDisabled
  >
    <View style={style}>{children}</View>
  </TouchableWithoutFeedback>
);

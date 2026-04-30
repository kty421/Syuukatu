import { ReactNode, useMemo } from 'react';
import {
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';

type SwipeBackDismissViewProps = {
  children: ReactNode;
  onDismiss: () => void;
  edgeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export const SwipeBackDismissView = ({
  children,
  onDismiss,
  edgeWidth = 32,
  style
}: SwipeBackDismissViewProps) => {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (event, gesture) => {
          const startX = event.nativeEvent.pageX - gesture.dx;
          return (
            startX <= edgeWidth &&
            gesture.dx > 12 &&
            Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2
          );
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 90 || gesture.vx > 0.65) {
            onDismiss();
          }
        }
      }),
    [edgeWidth, onDismiss]
  );

  return (
    <View style={[styles.root, style]} {...responder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});

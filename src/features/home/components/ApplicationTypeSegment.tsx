import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { ApplicationType, applicationTypeLabels } from '../types';

type ApplicationTypeSegmentProps = {
  value: ApplicationType;
  theme: AppTheme;
  transitionProgress: Animated.Value;
  edgePullX?: Animated.Value;
  onChange: (type: ApplicationType) => void;
};

const options: ApplicationType[] = ['internship', 'fullTime'];

export const ApplicationTypeSegment = ({
  value,
  theme,
  transitionProgress,
  edgePullX,
  onChange
}: ApplicationTypeSegmentProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const internshipTextColor = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.applicationTypes.internship.accent, theme.colors.textMuted]
  });
  const fullTimeTextColor = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.textMuted, theme.applicationTypes.fullTime.accent]
  });
  const indicatorColor = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.applicationTypes.internship.accent,
      theme.applicationTypes.fullTime.accent
    ]
  });
  const indicatorTranslate = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerWidth / 2]
  });

  return (
    <View
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.divider,
          borderTopColor: theme.colors.divider
        }
      ]}
    >
      {options.map((type) => {
        const selected = value === type;
        const color =
          type === 'internship' ? internshipTextColor : fullTimeTextColor;

        return (
          <Pressable
            key={type}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(type)}
            style={({ pressed }) => [
              styles.option,
              pressed && { backgroundColor: theme.colors.surfaceSubtle }
            ]}
          >
            <Animated.Text
              style={[
                styles.title,
                {
                  color,
                  fontWeight: selected ? '800' : '500'
                }
              ]}
            >
              {applicationTypeLabels[type]}
            </Animated.Text>
          </Pressable>
        );
      })}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            backgroundColor: indicatorColor,
            transform: [
              {
                translateX: edgePullX
                  ? Animated.add(indicatorTranslate, edgePullX)
                  : indicatorTranslate
              }
            ]
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  option: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingBottom: 0,
    paddingHorizontal: 12,
    paddingTop: 0,
    position: 'relative'
  },
  title: {
    fontSize: 13,
    lineHeight: 18
  },
  indicator: {
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    width: '50%'
  }
});

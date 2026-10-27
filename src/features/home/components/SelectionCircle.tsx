import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppTheme } from "../../../constants/theme";

type SelectionCircleProps = {
  selected: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  theme: AppTheme;
};

export const SelectionCircle = ({ selected, indeterminate = false, disabled = false, theme }: SelectionCircleProps) => (
  <View
    style={[
      styles.circle,
      {
        backgroundColor: disabled ? theme.colors.disabledBackground : selected || indeterminate
          ? theme.colors.primary
          : theme.colors.surface,
        borderColor: disabled ? theme.colors.disabledText : selected || indeterminate
          ? theme.colors.primary
          : theme.colors.outlineStrong,
      },
    ]}>
    {selected || indeterminate ? (
      <Ionicons
        color={disabled ? theme.colors.disabledText : theme.colors.textOnPrimary}
        name={indeterminate ? "remove" : "checkmark"}
        size={16}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
});

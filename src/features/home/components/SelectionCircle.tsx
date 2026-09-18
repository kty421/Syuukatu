import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppTheme } from "../../../constants/theme";

type SelectionCircleProps = {
  selected: boolean;
  theme: AppTheme;
};

export const SelectionCircle = ({ selected, theme }: SelectionCircleProps) => (
  <View
    style={[
      styles.circle,
      {
        backgroundColor: selected
          ? theme.colors.primary
          : theme.colors.surface,
        borderColor: selected
          ? theme.colors.primary
          : theme.colors.outlineStrong,
      },
    ]}>
    {selected ? (
      <Ionicons
        color={theme.colors.textOnPrimary}
        name="checkmark"
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

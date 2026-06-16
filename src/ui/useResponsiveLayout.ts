import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type ResponsiveLayoutMode = "compact" | "medium" | "expanded";

export const responsiveBreakpoints = {
  medium: 768,
  expanded: 1024,
} as const;

export const useResponsiveLayout = () => {
  const { height, width } = useWindowDimensions();

  return useMemo(() => {
    const mode: ResponsiveLayoutMode =
      width >= responsiveBreakpoints.expanded
        ? "expanded"
        : width >= responsiveBreakpoints.medium
          ? "medium"
          : "compact";

    return {
      height,
      width,
      mode,
      isCompact: mode === "compact",
      isMedium: mode === "medium",
      isExpanded: mode === "expanded",
      isDesktopLike: mode !== "compact",
    };
  }, [height, width]);
};

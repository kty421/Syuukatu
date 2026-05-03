import { ColorSchemeName, Platform } from "react-native";

import { ApplicationType, AspirationLevel } from "../features/home/types";

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
} as const;

export const typography = {
  hero: {
    fontSize: 34,
    fontWeight: "800" as const,
    lineHeight: 40,
  },
  title1: {
    fontSize: 28,
    fontWeight: "800" as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: "800" as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 18,
    fontWeight: "700" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: "700" as const,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "700" as const,
    lineHeight: 17,
  },
  footnote: {
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 14,
  },
} as const;

export const motion = {
  quick: 160,
  standard: 220,
  expressive: 280,
} as const;

export const layout = {
  maxContentWidth: 960,
  modalMaxWidth: 760,
} as const;

type Palette = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnDanger: string;
  textDisabled: string;
  primary: string;
  primaryHover: string;
  primaryPressed: string;
  primarySubtle: string;
  primaryBorder: string;
  secondary: string;
  secondaryHover: string;
  secondarySubtle: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerHover: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  focusRing: string;
  selected: string;
  disabledBackground: string;
  disabledText: string;
  backgroundAlt: string;
  surfaceMuted: string;
  surfacePressed: string;
  surfaceOverlay: string;
  outline: string;
  outlineStrong: string;
  text: string;
  textSubtle: string;
  placeholder: string;
  onPrimary: string;
  primarySoft: string;
  dangerSoft: string;
  warningSoft: string;
  successSoft: string;
  overlay: string;
  shadow: string;
};

const lightPalette: Palette = {
  background: "#F6F8FB",
  surface: "#FFFFFF",
  surfaceElevated: "#FCFDFF",
  surfaceSubtle: "#EEF3F8",
  border: "#D6DEE8",
  divider: "#E6EBF1",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#6B7280",
  textOnPrimary: "#FFFFFF",
  textOnDanger: "#FFFFFF",
  textDisabled: "#7A8594",
  primary: "#315F9B",
  primaryHover: "#274F83",
  primaryPressed: "#1F416D",
  primarySubtle: "#EAF2FB",
  primaryBorder: "#B8CBE3",
  secondary: "#0F766E",
  secondaryHover: "#0B615A",
  secondarySubtle: "#E7F6F3",
  success: "#15803D",
  successSubtle: "#EAF7EE",
  warning: "#B7791F",
  warningSubtle: "#FFF6E5",
  danger: "#B42318",
  dangerHover: "#961B12",
  dangerSubtle: "#FFF0EE",
  info: "#2563EB",
  infoSubtle: "#EAF1FF",
  focusRing: "#5B8DEF",
  selected: "#315F9B",
  disabledBackground: "#E5EAF0",
  disabledText: "#7A8594",
  backgroundAlt: "#EEF3F8",
  surfaceMuted: "#EEF3F8",
  surfacePressed: "#E1E9F2",
  surfaceOverlay: "rgba(255,255,255,0.90)",
  outline: "#D6DEE8",
  outlineStrong: "#B8CBE3",
  text: "#111827",
  textSubtle: "#7A8594",
  placeholder: "#7A8594",
  onPrimary: "#FFFFFF",
  primarySoft: "#EAF2FB",
  dangerSoft: "#FFF0EE",
  warningSoft: "#FFF6E5",
  successSoft: "#EAF7EE",
  overlay: "rgba(10, 18, 28, 0.16)",
  shadow: "#09111D",
};

const darkPalette: Palette = {
  background: "#0B1118",
  surface: "#151B24",
  surfaceElevated: "#1B2330",
  surfaceSubtle: "#202B38",
  border: "#334155",
  divider: "#263241",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#A7B0BF",
  textOnPrimary: "#07121F",
  textOnDanger: "#2A0707",
  textDisabled: "#748094",
  primary: "#8CB8F2",
  primaryHover: "#A4C8F7",
  primaryPressed: "#6FA3E8",
  primarySubtle: "#19324F",
  primaryBorder: "#3B5F8C",
  secondary: "#5EEAD4",
  secondaryHover: "#7CF3E1",
  secondarySubtle: "#123B37",
  success: "#86EFAC",
  successSubtle: "#123421",
  warning: "#FCD34D",
  warningSubtle: "#3A2C12",
  danger: "#FCA5A5",
  dangerHover: "#F87171",
  dangerSubtle: "#3F1D1D",
  info: "#93C5FD",
  infoSubtle: "#172A46",
  focusRing: "#93C5FD",
  selected: "#8CB8F2",
  disabledBackground: "#263241",
  disabledText: "#748094",
  backgroundAlt: "#111A25",
  surfaceMuted: "#202B38",
  surfacePressed: "#2B3748",
  surfaceOverlay: "rgba(21,27,36,0.90)",
  outline: "#334155",
  outlineStrong: "#3B5F8C",
  text: "#F8FAFC",
  textSubtle: "#748094",
  placeholder: "#A7B0BF",
  onPrimary: "#07121F",
  primarySoft: "#19324F",
  dangerSoft: "#3F1D1D",
  warningSoft: "#3A2C12",
  successSoft: "#123421",
  overlay: "rgba(0, 0, 0, 0.36)",
  shadow: "#000000",
};

const createShadows = (isDark: boolean) => ({
  surface: Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : lightPalette.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 22,
    },
    android: {
      elevation: isDark ? 2 : 1,
    },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: isDark ? "#000000" : lightPalette.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.24 : 0.1,
      shadowRadius: 32,
    },
    android: {
      elevation: isDark ? 6 : 4,
    },
    default: {},
  }),
});

const createApplicationTypeStyles = (colors: Palette) =>
  ({
    internship: {
      accent: colors.secondary,
      muted: colors.secondarySubtle,
      soft: colors.background,
      border: colors.secondarySubtle,
    },
    fullTime: {
      accent: colors.primary,
      muted: colors.primarySubtle,
      soft: colors.background,
      border: colors.primaryBorder,
    },
  }) satisfies Record<
    ApplicationType,
    {
      accent: string;
      muted: string;
      soft: string;
      border: string;
    }
  >;

const createAspirationStyles = (isDark: boolean) =>
  ({
    high: {
      label: "高",
      foreground: isDark ? "#F0C2C8" : "#8A4B55",
      background: isDark ? "#332228" : "#FFF3F4",
    },
    middle: {
      label: "中",
      foreground: isDark ? "#EED49A" : "#766232",
      background: isDark ? "#342D1C" : "#FBF6E9",
    },
    low: {
      label: "低",
      foreground: isDark ? "#7ed67d" : "#2d8530",
      background: isDark ? "#18351D" : "#EAF7E8",
    },
    unset: {
      label: "未設定",
      foreground: isDark ? "#C4CBD6" : "#6B7280",
      background: isDark ? "#222933" : "#F2F4F7",
    },
  }) satisfies Record<
    AspirationLevel,
    {
      label: string;
      foreground: string;
      background: string;
    }
  >;

export type AppTheme = {
  isDark: boolean;
  blurTint: "light" | "dark";
  colors: Palette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
  layout: typeof layout;
  shadows: ReturnType<typeof createShadows>;
  applicationTypes: ReturnType<typeof createApplicationTypeStyles>;
  aspirations: ReturnType<typeof createAspirationStyles>;
};

export const getTheme = (scheme: ColorSchemeName): AppTheme => {
  const isDark = scheme === "dark";
  const colors = isDark ? darkPalette : lightPalette;

  return {
    isDark,
    blurTint: isDark ? "dark" : "light",
    colors,
    spacing,
    radii,
    typography,
    motion,
    layout,
    shadows: createShadows(isDark),
    applicationTypes: createApplicationTypeStyles(colors),
    aspirations: createAspirationStyles(isDark),
  };
};

export const getContentMetrics = (width: number) => {
  if (width >= 1024) {
    return {
      contentPadding: 32,
      heroColumns: true,
      compactHeader: false,
      sectionGap: 32,
    };
  }

  if (width >= 768) {
    return {
      contentPadding: 28,
      heroColumns: true,
      compactHeader: false,
      sectionGap: 28,
    };
  }

  return {
    contentPadding: 20,
    heroColumns: false,
    compactHeader: width < 390,
    sectionGap: 24,
  };
};

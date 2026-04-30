import { ColorSchemeName, Platform } from 'react-native';

import {
  ApplicationType,
  AspirationLevel
} from '../features/home/types';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 24
} as const;

export const typography = {
  hero: {
    fontSize: 34,
    fontWeight: '800' as const,
    lineHeight: 40
  },
  title1: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34
  },
  title2: {
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 28
  },
  title3: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 22
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 17
  },
  footnote: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16
  },
  caption: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14
  }
} as const;

export const motion = {
  quick: 160,
  standard: 220,
  expressive: 280
} as const;

export const layout = {
  maxContentWidth: 960,
  modalMaxWidth: 760
} as const;

type Palette = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfacePressed: string;
  surfaceOverlay: string;
  outline: string;
  outlineStrong: string;
  divider: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  placeholder: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  primaryBorder: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  overlay: string;
  shadow: string;
};

const lightPalette: Palette = {
  background: '#F5F6F8',
  backgroundAlt: '#EEF1F4',
  surface: '#FFFFFF',
  surfaceElevated: '#FCFCFD',
  surfaceMuted: '#F1F3F6',
  surfacePressed: '#E7EBF0',
  surfaceOverlay: 'rgba(255,255,255,0.82)',
  outline: '#D8DEE6',
  outlineStrong: '#C3CCD8',
  divider: '#E7EBF0',
  text: '#0F1724',
  textMuted: '#546071',
  textSubtle: '#7D8897',
  placeholder: '#A7AFBB',
  primary: '#2D5F9B',
  onPrimary: '#FFFFFF',
  primarySoft: '#EBF2FA',
  primaryBorder: '#C7D6E9',
  danger: '#B33530',
  dangerSoft: '#FFF2F1',
  warning: '#8E6708',
  warningSoft: '#FFF7E8',
  success: '#0E7C70',
  successSoft: '#E7F8F4',
  overlay: 'rgba(10, 18, 28, 0.16)',
  shadow: '#09111D'
};

const darkPalette: Palette = {
  background: '#0B0E13',
  backgroundAlt: '#121720',
  surface: '#151A22',
  surfaceElevated: '#1A2029',
  surfaceMuted: '#202734',
  surfacePressed: '#293142',
  surfaceOverlay: 'rgba(21,26,34,0.84)',
  outline: '#2A3342',
  outlineStrong: '#364255',
  divider: '#232B37',
  text: '#F5F7FB',
  textMuted: '#BBC3D1',
  textSubtle: '#8B95A6',
  placeholder: '#707A8A',
  primary: '#88AFE8',
  onPrimary: '#07121F',
  primarySoft: '#1A2C43',
  primaryBorder: '#35547D',
  danger: '#FF8F87',
  dangerSoft: '#40201E',
  warning: '#F5C76D',
  warningSoft: '#3C2D15',
  success: '#6CCFC2',
  successSoft: '#143A35',
  overlay: 'rgba(0, 0, 0, 0.36)',
  shadow: '#000000'
};

const createShadows = (isDark: boolean) => ({
  surface: Platform.select({
    ios: {
      shadowColor: isDark ? '#000000' : lightPalette.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 22
    },
    android: {
      elevation: isDark ? 2 : 1
    },
    default: {}
  }),
  floating: Platform.select({
    ios: {
      shadowColor: isDark ? '#000000' : lightPalette.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.24 : 0.1,
      shadowRadius: 32
    },
    android: {
      elevation: isDark ? 6 : 4
    },
    default: {}
  })
});

const createApplicationTypeStyles = (isDark: boolean) =>
  ({
    internship: {
      accent: isDark ? '#74D3DC' : '#107C86',
      muted: isDark ? '#16353A' : '#E7F8FA',
      soft: isDark ? '#10262B' : '#F6FCFD',
      border: isDark ? '#22535B' : '#BEE2E6'
    },
    fullTime: {
      accent: isDark ? '#8FB4F0' : '#183F72',
      muted: isDark ? '#172744' : '#E7F0FC',
      soft: isDark ? '#0E182A' : '#F2F7FF',
      border: isDark ? '#3A5F92' : '#AFC7E8'
    }
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
      label: '高',
      foreground: isDark ? '#F4C4C6' : '#8D4550',
      background: isDark ? '#362126' : '#FFF3F4'
    },
    middle: {
      label: '中',
      foreground: isDark ? '#F2D29A' : '#7B6630',
      background: isDark ? '#382D16' : '#FBF6E9'
    },
    low: {
      label: '低',
      foreground: isDark ? '#A9C8F7' : '#315F9B',
      background: isDark ? '#182A42' : '#EEF5FF'
    },
    unset: {
      label: '未設定',
      foreground: isDark ? '#C4CBD6' : '#6B7280',
      background: isDark ? '#222933' : '#F2F4F7'
    }
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
  blurTint: 'light' | 'dark';
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
  const isDark = scheme === 'dark';
  const colors = isDark ? darkPalette : lightPalette;

  return {
    isDark,
    blurTint: isDark ? 'dark' : 'light',
    colors,
    spacing,
    radii,
    typography,
    motion,
    layout,
    shadows: createShadows(isDark),
    applicationTypes: createApplicationTypeStyles(isDark),
    aspirations: createAspirationStyles(isDark)
  };
};

export const getContentMetrics = (width: number) => {
  if (width >= 1024) {
    return {
      contentPadding: 32,
      heroColumns: true,
      compactHeader: false,
      sectionGap: 32
    };
  }

  if (width >= 768) {
    return {
      contentPadding: 28,
      heroColumns: true,
      compactHeader: false,
      sectionGap: 28
    };
  }

  return {
    contentPadding: 20,
    heroColumns: false,
    compactHeader: width < 390,
    sectionGap: 24
  };
};

import { Platform } from 'react-native';

export const AppColors = {
  primary: '#4CAF50',
  primaryDark: '#45a049',
  warning: '#F44336',
  credit: '#9C27B0',
  creditDark: '#7B1FA2',
  orange: '#FF9800',
  orangeDark: '#F57C00',
  blue: '#2196F3',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#F0F0F0',
  divider: '#E0E0E0',
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
  },
  alert: {
    error: '#FFF3E0',
    warning: '#FFF3E0',
    debt: '#FFEBEE',
    stats: '#F5F5F5',
  },
};

const tintColorLight = AppColors.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: AppColors.text.primary,
    background: AppColors.background,
    tint: tintColorLight,
    icon: AppColors.text.secondary,
    tabIconDefault: AppColors.text.secondary,
    tabIconSelected: tintColorLight,
    surface: AppColors.surface,
    primary: AppColors.primary,
    warning: AppColors.warning,
    credit: AppColors.credit,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    surface: '#1E1E1E',
    primary: AppColors.primary,
    warning: AppColors.warning,
    credit: AppColors.credit,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
};

export const Shadow = {
  card: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' as any,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
  })!,
  fab: Platform.select({
    web: {
      boxShadow: `0px 4px 12px ${AppColors.primary}4D` as any,
    },
    default: {
      shadowColor: AppColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
  })!,
};

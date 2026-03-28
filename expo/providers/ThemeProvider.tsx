import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { colors as themeColors } from '../constants/colors';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'business-hub-theme-mode';

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgMuted: string;
  bgSecondary: string;
  bgGrouped: string;
  bgElevated: string;
  bgDark: string;
  bgDarkCard: string;
  bgDarkMuted: string;
  accent: string;
  accentLight: string;
  accentSoft: string;
  accentSoft2: string;
  accentDark: string;
  teal: string;
  tealLight: string;
  orange: string;
  orangeLight: string;
  indigo: string;
  indigoLight: string;
  pink: string;
  pinkLight: string;
  mint: string;
  mintLight: string;
  cyan: string;
  cyanLight: string;
  yellow: string;
  yellowLight: string;
  rose: string;
  roseLight: string;
  sky: string;
  skyLight: string;
  gold: string;
  goldLight: string;
  navy: string;
  navyLight: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textTertiary: string;
  textOnDark: string;
  textOnDarkMuted: string;
  white: string;
  black: string;
  separator: string;
  separatorLight: string;
  opaqueSeparator: string;
  fill: string;
  secondaryFill: string;
  tertiaryFill: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  destructive: string;
  border: string;
  borderLight: string;
  divider: string;
  glass: string;
  glassLight: string;
  glassBorder: string;
  gradientStart: string;
  gradientEnd: string;
  tabBarBg: string;
  tabBarBorder: string;
  cardShadow: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  badgeBg: string;
  shimmer: string;
  glow: string;
}

const darkColors: ThemeColors = {
  bg: themeColors.dark.background,
  bgCard: themeColors.dark.card,
  bgMuted: '#1E293B',
  bgSecondary: '#0F172A',
  bgGrouped: '#020617',
  bgElevated: '#1E293B',
  bgDark: '#020617',
  bgDarkCard: '#0F172A',
  bgDarkMuted: '#1E293B',
  accent: themeColors.dark.accent,
  accentLight: themeColors.dark.accentLight,
  accentSoft: 'rgba(129, 140, 248, 0.08)',
  accentSoft2: 'rgba(129, 140, 248, 0.04)',
  accentDark: '#6366F1',
  teal: '#2DD4BF',
  tealLight: 'rgba(45, 212, 191, 0.12)',
  orange: '#FB923C',
  orangeLight: 'rgba(251, 146, 60, 0.12)',
  indigo: '#818CF8',
  indigoLight: 'rgba(129, 140, 248, 0.12)',
  pink: '#F472B6',
  pinkLight: 'rgba(244, 114, 182, 0.12)',
  mint: '#34D399',
  mintLight: 'rgba(52, 211, 153, 0.12)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34, 211, 238, 0.12)',
  yellow: '#FBBF24',
  yellowLight: 'rgba(251, 191, 36, 0.12)',
  rose: '#FB7185',
  roseLight: 'rgba(251, 113, 133, 0.12)',
  sky: '#38BDF8',
  skyLight: 'rgba(56, 189, 248, 0.12)',
  gold: '#F59E0B',
  goldLight: 'rgba(245, 158, 11, 0.12)',
  navy: '#020617',
  navyLight: '#0F172A',
  text: themeColors.dark.text,
  textPrimary: themeColors.dark.text,
  textSecondary: themeColors.dark.textSecondary,
  textMuted: themeColors.dark.textMuted,
  textTertiary: '#475569',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#94A3B8',
  white: '#FFFFFF',
  black: '#020617',
  separator: '#1E293B',
  separatorLight: '#0F172A',
  opaqueSeparator: '#1E293B',
  fill: '#1E293B',
  secondaryFill: '#1E293B',
  tertiaryFill: '#0F172A',
  overlay: 'rgba(0,0,0,0.85)',
  skeleton: '#1E293B',
  skeletonHighlight: '#334155',
  success: themeColors.dark.success,
  successLight: 'rgba(52, 211, 153, 0.12)',
  warning: themeColors.dark.warning,
  warningLight: 'rgba(251, 191, 36, 0.12)',
  error: themeColors.dark.error,
  errorLight: 'rgba(248, 113, 113, 0.12)',
  destructive: '#F87171',
  border: themeColors.dark.cardBorder,
  borderLight: '#0F172A',
  divider: '#1E293B',
  glass: themeColors.dark.glass,
  glassLight: 'rgba(30, 41, 59, 0.5)',
  glassBorder: themeColors.dark.glassBorder,
  gradientStart: '#6366F1',
  gradientEnd: '#818CF8',
  tabBarBg: '#020617',
  tabBarBorder: 'rgba(129, 140, 248, 0.1)',
  cardShadow: '#000000',
  inputBg: '#0F172A',
  inputBorder: '#1E293B',
  inputFocusBorder: '#818CF8',
  badgeBg: 'rgba(129, 140, 248, 0.15)',
  shimmer: 'rgba(129, 140, 248, 0.08)',
  glow: themeColors.dark.glow,
};

const lightColors: ThemeColors = {
  bg: themeColors.light.background,
  bgCard: themeColors.light.card,
  bgMuted: '#F1F5F9',
  bgSecondary: '#F8FAFC',
  bgGrouped: '#F8FAFC',
  bgElevated: '#FFFFFF',
  bgDark: '#E2E8F0',
  bgDarkCard: '#F1F5F9',
  bgDarkMuted: '#CBD5E1',
  accent: themeColors.light.accent,
  accentLight: themeColors.light.accentLight,
  accentSoft: 'rgba(99, 102, 241, 0.06)',
  accentSoft2: 'rgba(99, 102, 241, 0.03)',
  accentDark: '#4F46E5',
  teal: '#0D9488',
  tealLight: 'rgba(13, 148, 136, 0.10)',
  orange: '#D97706',
  orangeLight: 'rgba(217, 119, 6, 0.10)',
  indigo: '#4F46E5',
  indigoLight: 'rgba(79, 70, 229, 0.10)',
  pink: '#DB2777',
  pinkLight: 'rgba(219, 39, 119, 0.10)',
  mint: '#059669',
  mintLight: 'rgba(5, 150, 105, 0.10)',
  cyan: '#0891B2',
  cyanLight: 'rgba(8, 145, 178, 0.10)',
  yellow: '#CA8A04',
  yellowLight: 'rgba(202, 138, 4, 0.10)',
  rose: '#E11D48',
  roseLight: 'rgba(225, 29, 72, 0.10)',
  sky: '#0284C7',
  skyLight: 'rgba(2, 132, 199, 0.10)',
  gold: '#B45309',
  goldLight: 'rgba(180, 83, 9, 0.10)',
  navy: '#F8FAFC',
  navyLight: '#F1F5F9',
  text: themeColors.light.text,
  textPrimary: themeColors.light.text,
  textSecondary: themeColors.light.textSecondary,
  textMuted: themeColors.light.textMuted,
  textTertiary: '#94A3B8',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#94A3B8',
  white: '#FFFFFF',
  black: '#1F2937',
  separator: '#E2E8F0',
  separatorLight: '#F1F5F9',
  opaqueSeparator: '#E2E8F0',
  fill: '#E2E8F0',
  secondaryFill: '#E2E8F0',
  tertiaryFill: '#F1F5F9',
  overlay: 'rgba(0,0,0,0.4)',
  skeleton: '#F1F5F9',
  skeletonHighlight: '#F8FAFC',
  success: themeColors.light.success,
  successLight: 'rgba(16, 185, 129, 0.10)',
  warning: themeColors.light.warning,
  warningLight: 'rgba(245, 158, 11, 0.10)',
  error: themeColors.light.error,
  errorLight: 'rgba(239, 68, 68, 0.10)',
  destructive: '#EF4444',
  border: themeColors.light.cardBorder,
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',
  glass: themeColors.light.glass,
  glassLight: 'rgba(255, 255, 255, 0.8)',
  glassBorder: themeColors.light.glassBorder,
  gradientStart: '#6366F1',
  gradientEnd: '#818CF8',
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.05)',
  cardShadow: 'rgba(0,0,0,0.08)',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputFocusBorder: '#6366F1',
  badgeBg: 'rgba(99, 102, 241, 0.12)',
  shimmer: 'rgba(99, 102, 241, 0.04)',
  glow: themeColors.light.glow,
};

function getSystemTheme(): 'dark' | 'light' {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          console.log('[ThemeProvider] loaded stored mode', stored);
          setMode(stored);
        }
      } catch (err) {
        console.log('[ThemeProvider] failed to load mode', err);
      } finally {
        setLoaded(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[ThemeProvider] system theme changed to', colorScheme);
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  const resolvedMode = mode === 'system' ? systemTheme : mode;
  const isDark = resolvedMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'dark' : (systemTheme === 'dark' ? 'light' : 'dark');
      console.log('[ThemeProvider] toggling theme', { current, next });
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [systemTheme]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    console.log('[ThemeProvider] setting theme mode to', newMode);
    setMode(newMode);
    void AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  return useMemo(
    () => ({
      mode,
      isDark,
      colors,
      loaded,
      toggleTheme,
      setThemeMode,
    }),
    [mode, isDark, colors, loaded, toggleTheme, setThemeMode],
  );
});

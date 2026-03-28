import { colors } from './colors';

export const theme = {
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    screenPadding: 20,
  },
  typography: {
    display: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1.5, lineHeight: 52 },
    largeTitle: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 42 },
    title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 34 },
    title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
    title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 25 },
    headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
    body: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.2, lineHeight: 24 },
    bodyMedium: { fontSize: 16, fontWeight: '500' as const, letterSpacing: -0.2, lineHeight: 24 },
    bodySemibold: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 24 },
    callout: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.1, lineHeight: 20 },
    subheadline: { fontSize: 14, fontWeight: '500' as const, letterSpacing: -0.1, lineHeight: 18 },
    footnote: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 16 },
    caption1: { fontSize: 12, fontWeight: '500' as const, lineHeight: 14 },
    label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
    
    // Aliases for backward compatibility
    h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 34 },
    h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
    h3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 25 },
    caption: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 16 },
    captionSemibold: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 16 },
    small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 14 },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 12,
    },
    premium: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
    },
  },
  // Backward compatibility for .shadow.sm
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  gradients: {
    primary: ['#6366F1', '#818CF8'],
    accent: ['#EC4899', '#F472B6'],
    surface: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    darkGlass: ['rgba(15, 23, 42, 0.8)', 'rgba(15, 23, 42, 0.4)'],
  },
  // Backward compatibility for theme.colors
  colors: {
    ...colors.dark,
    gold: '#F59E0B',
    goldLight: 'rgba(245, 158, 11, 0.12)',
    rose: '#FB7185',
    roseLight: 'rgba(251, 113, 133, 0.12)',
    sky: '#38BDF8',
    skyLight: 'rgba(56, 189, 248, 0.12)',
  }
};

export type Theme = typeof theme;
export { colors };

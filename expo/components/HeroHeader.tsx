import React from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../providers/ThemeProvider';
import { theme } from '../constants/theme';
import { BlurView } from 'expo-blur';

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  height?: number;
  gradient?: string[];
}

export function HeroHeader({
  title,
  subtitle,
  children,
  height = 240,
  gradient,
}: HeroHeaderProps) {
  const { isDark, colors } = useTheme();

  const getGradient = () => {
    if (gradient) return gradient;
    return isDark ? ['#020617', '#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
  };

  return (
    <View style={[styles.container, { height }]}>
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.glow, { backgroundColor: colors.accent, opacity: isDark ? 0.15 : 0.08 }]} />
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
        {children}
      </View>
      
      <View style={[styles.bottomFade, { backgroundColor: colors.background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    blur: 100,
  } as any,
  content: {
    zIndex: 1,
    marginTop: 40,
  },
  textContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.display,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.title3,
    opacity: 0.8,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.1,
  },
});

import React from 'react';
import { View, ViewStyle, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../providers/ThemeProvider';
import { theme } from '../constants/theme';
import { PressableScale } from './PressableScale';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: 'glass' | 'surface' | 'accent' | 'glow';
  gradient?: string[];
  padding?: number;
  borderRadius?: number;
}

export function PremiumCard({
  children,
  style,
  onPress,
  variant = 'surface',
  gradient,
  padding = theme.spacing.lg,
  borderRadius = theme.radius.xl,
}: PremiumCardProps) {
  const { isDark, colors } = useTheme();

  const CardWrapper = onPress ? PressableScale : View;

  const getGradients = () => {
    if (gradient) return gradient;
    switch (variant) {
      case 'accent':
        return isDark ? ['#6366F1', '#4F46E5'] : ['#818CF8', '#6366F1'];
      case 'glow':
        return isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F8FAFC'];
      case 'glass':
        return isDark ? ['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.2)'] : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)'];
      default:
        return isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F1F5F9'];
    }
  };

  return (
    <CardWrapper
      onPress={onPress}
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: variant === 'glass' ? 'transparent' : colors.bgCard,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        },
        variant === 'glow' && {
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 10,
        },
        !onPress && styles.shadow,
        style,
      ]}
    >
      <LinearGradient
        colors={getGradients()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius, padding }]}
      >
        {children}
      </LinearGradient>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    flex: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
});

import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../providers/ThemeProvider';
import { theme } from '../constants/theme';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  borderWidth?: number;
}

export function GlassView({
  children,
  style,
  intensity = 40,
  tint,
  borderRadius = theme.radius.md,
  borderWidth = 1,
}: GlassViewProps) {
  const { isDark, colors } = useTheme();
  
  const resolvedTint = tint || (isDark ? 'dark' : 'light');

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.webGlass,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)',
            borderRadius,
            borderWidth,
            borderColor: colors.glassBorder,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderRadius, overflow: 'hidden' }, style]}>
      <BlurView
        intensity={intensity}
        tint={resolvedTint}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            borderRadius,
            borderWidth,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  webGlass: {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  } as any,
});

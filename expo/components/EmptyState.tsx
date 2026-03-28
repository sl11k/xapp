import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor,
  compact = false,
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  const resolvedIconColor = iconColor ?? colors.accent;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, compact && styles.containerCompact, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.iconWrap, { backgroundColor: resolvedIconColor + '14' }]}>
        <View style={[styles.iconInner, { backgroundColor: resolvedIconColor + '1A' }]}>
          <Icon color={resolvedIconColor} size={compact ? 24 : 28} strokeWidth={1.5} />
        </View>
      </View>
      <Text style={[styles.title, { color: colors.text }, compact && styles.titleCompact]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }, compact && styles.descCompact]}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.accent },
            isDark && {
              shadowColor: colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 44,
    gap: 10,
  },
  containerCompact: {
    paddingVertical: 36,
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  descCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 26,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    color: '#0B0F14',
  },
});

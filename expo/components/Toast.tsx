import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, X, CircleAlert, Info } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ visible, message, type = 'success', onDismiss, duration = 2500 }: ToastProps) {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const getConfig = (t: ToastType) => {
    switch (t) {
      case 'success':
        return { icon: Check, iconBg: colors.successLight, iconColor: colors.success };
      case 'error':
        return { icon: CircleAlert, iconBg: colors.errorLight, iconColor: colors.error };
      case 'info':
        return { icon: Info, iconBg: colors.cyanLight, iconColor: colors.cyan };
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 200 }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        ]).start(() => onDismissRef.current());
      }, duration);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, duration, translateY, opacity, scale]);

  if (!visible) return null;

  const config = getConfig(type);
  const Icon = config.icon;
  const bg = isDark ? 'rgba(20,26,34,0.95)' : 'rgba(255,255,255,0.97)';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismissRef.current());
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: bg,
        borderColor,
        transform: [{ translateY }, { scale }],
        opacity,
        shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.15)',
        shadowOpacity: isDark ? 0.5 : 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
      },
    ]}>
      <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
        <Icon color={config.iconColor} size={15} strokeWidth={2.2} />
      </View>
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>{message}</Text>
      <Pressable onPress={dismiss} style={styles.closeBtn} hitSlop={8}>
        <X color={colors.textTertiary} size={14} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 9999,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
});

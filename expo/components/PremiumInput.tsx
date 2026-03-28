import React, { useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/constants/theme';

interface PremiumInputProps extends TextInputProps {
  label: string;
  multiline?: boolean;
}

export function PremiumInput({ label, multiline, style, onFocus, onBlur, ...props }: PremiumInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const glow = useMemo(() => new Animated.Value(0), []);

  const handleFocus = (e: any) => {
    setFocused(true);
    Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    Animated.timing(glow, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });
  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.22],
  });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: focused ? colors.accent : colors.textMuted }]}>{label}</Text>
      <Animated.View style={[styles.inputWrap, { backgroundColor: colors.bgCard, borderColor, shadowColor: colors.accent, shadowOpacity }]}>
        <TextInput
          {...props}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, multiline && styles.multiline, { color: colors.text }, style]}
          placeholderTextColor={colors.textMuted}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    ...theme.typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 14,
  },
  multiline: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
});

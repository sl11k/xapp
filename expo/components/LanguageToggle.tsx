import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Globe } from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={toggleLanguage}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: colors.accentLight, borderColor: colors.accentSoft },
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      testID="language-toggle"
    >
      <Globe color={colors.accent} size={13} strokeWidth={1.8} />
      <Text style={[styles.label, { color: colors.accent }]}>{language === 'ar' ? 'EN' : 'عربي'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});

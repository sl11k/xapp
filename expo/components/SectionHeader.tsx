import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const { isRTL } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>{title}</Text>
      {action ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.action, { color: colors.accent }]}>{action}</Text>
          <ChevronRight
            color={colors.accent}
            size={14}
            strokeWidth={2}
            style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  actionRow: {
    alignItems: 'center',
    gap: 2,
  },
  action: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface AppIconProps {
  icon: LucideIcon;
  active?: boolean;
  size?: number;
  color?: string;
  filled?: boolean;
}

export function AppIcon({ icon: Icon, active = false, size = 20, color, filled = false }: AppIconProps) {
  const { colors } = useTheme();
  const iconColor = color ?? (active ? colors.accent : colors.textSecondary);

  return (
    <View style={[styles.wrap, active && [styles.activeWrap, { backgroundColor: colors.accentLight }]]}>
      <Icon
        color={iconColor}
        size={size}
        strokeWidth={active ? 2.6 : 2.3}
        fill={filled && active ? iconColor : 'transparent'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWrap: {
    borderRadius: 12,
    padding: 2,
  },
});

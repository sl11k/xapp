import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface RefreshCharacterProps {
  progress: number;
  refreshing: boolean;
}

export function RefreshCharacter({ progress, refreshing }: RefreshCharacterProps) {
  const { colors } = useTheme();
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) {
      breathe.stopAnimation();
      breathe.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [refreshing, breathe]);

  const clamped = Math.max(0, Math.min(progress, 1));
  const translateY = (1 - clamped) * 18;
  const rotate = `${(clamped * 12 - 6).toFixed(1)}deg`;
  const scale = refreshing ? breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) : 0.92 + clamped * 0.1;

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.scene,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            transform: [{ translateY }, { rotate }, { scale: scale as any }],
          },
        ]}
      >
        <Text style={styles.emoji}>🧑‍💼</Text>
        <View style={[styles.laptop, { backgroundColor: colors.accent }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  scene: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  laptop: {
    width: 24,
    height: 4,
    borderRadius: 3,
    marginTop: 2,
  },
});

import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps extends PressableProps {
  scale?: number;
  haptic?: boolean;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  activeShadow?: boolean;
}

export function PressableScale({
  scale = 0.97,
  haptic = false,
  style,
  children,
  onPress,
  activeShadow = false,
  ...rest
}: PressableScaleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const shadowAnim = useRef(new Animated.Value(0)).current;

  const onPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: scale,
        useNativeDriver: true,
        damping: 18,
        stiffness: 280,
        mass: 0.8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, shadowAnim, scale]);

  const onPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
        mass: 0.6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, shadowAnim]);

  const handlePress = useCallback(
    (e: any) => {
      if (haptic) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
    },
    [haptic, onPress],
  );

  const dynamicShadow = activeShadow
    ? {
        shadowOpacity: shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.16] }),
        shadowRadius: shadowAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 12] }),
      }
    : null;

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress} {...rest}>
      <Animated.View
        style={[
          style as ViewStyle,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim, shadowColor: '#000', shadowOffset: { width: 0, height: 4 } },
          dynamicShadow as any,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

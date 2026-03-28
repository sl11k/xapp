import React, { useState, useRef, ReactNode, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface LottiePullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: ReactNode;
}

const REFRESH_THRESHOLD = 120;
const MAX_PULL = 200;

export function LottiePullToRefresh({
  onRefresh,
  isRefreshing,
  children,
}: LottiePullToRefreshProps) {
  const { colors } = useTheme();
  const pullDistance = useRef(new Animated.Value(0)).current;
  const [isPulling, setIsPulling] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  // Sync Lottie animation with refresh state
  useEffect(() => {
    if (isRefreshing) {
      lottieRef.current?.play();
    } else {
      Animated.spring(pullDistance, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start(() => {
        lottieRef.current?.reset();
      });
    }
  }, [isRefreshing]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => {
        // Only allow pulling if we are at the top (this is simplified, usually requires scroll offset check)
        return !isRefreshing && gestureState.dy > 0;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isRefreshing && gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRefreshing) return;
        
        // Resistance effect: move less than the actual drag
        const newDist = Math.min(gestureState.dy * 0.5, MAX_PULL);
        pullDistance.setValue(newDist);
        
        if (newDist > 10) {
          setIsPulling(true);
          // Map pull distance to lottie progress (0 to 1)
          const progress = Math.min(newDist / REFRESH_THRESHOLD, 1);
          lottieRef.current?.progress = progress;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsPulling(false);
        const finalDist = gestureState.dy * 0.5;
        
        if (finalDist >= REFRESH_THRESHOLD) {
          // Trigger refresh
          Animated.spring(pullDistance, {
            toValue: REFRESH_THRESHOLD,
            useNativeDriver: true,
          }).start();
          onRefresh();
        } else {
          // Snap back
          Animated.spring(pullDistance, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const lottieOpacity = pullDistance.interpolate({
    inputRange: [0, 50, REFRESH_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const lottieScale = pullDistance.interpolate({
    inputRange: [0, REFRESH_THRESHOLD],
    outputRange: [0.6, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Refresh Indicator Background */}
      <Animated.View
        style={[
          styles.refreshContainer,
          {
            backgroundColor: colors.bg,
            transform: [{ translateY: Animated.add(pullDistance, -REFRESH_THRESHOLD) }],
            opacity: lottieOpacity,
          },
        ]}
      >
        <LottieView
          ref={lottieRef}
          source={require('@/assets/lottie-refresh.json')}
          style={[styles.lottie, { transform: [{ scale: lottieScale }] }]}
          autoPlay={isRefreshing}
          loop={isRefreshing}
        />
      </Animated.View>

      {/* Main Content Area */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: pullDistance }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  refreshContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: REFRESH_THRESHOLD,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
  },
});

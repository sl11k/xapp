import React, { useState, useRef, ReactNode, useEffect, useCallback } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  Animated,
  StyleSheet,
  View,
  Platform,
  PanResponder,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface LottiePullToRefreshProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: ReactNode;
  lottieSource?: any;
}

const REFRESH_THRESHOLD = 120;
const MAX_PULL = 200;

export function LottiePullToRefreshScrollView({
  onRefresh,
  isRefreshing,
  children,
  lottieSource,
  ...props
}: LottiePullToRefreshProps) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  
  // Track scroll position
  const scrollY = useRef(0);
  
  // Animation value for the pull down distance
  const pullDistance = useRef(new Animated.Value(0)).current;

  // Lottie control
  useEffect(() => {
    if (isRefreshing || refreshing) {
      lottieRef.current?.play();
    } else {
      Animated.spring(pullDistance, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start(() => {
        lottieRef.current?.reset();
      });
    }
  }, [isRefreshing, refreshing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture drag if we are at the top and pulling down
        return scrollY.current <= 0 && gestureState.dy > 10 && !isRefreshing && !refreshing;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRefreshing || refreshing) return;
        
        // Add resistance
        const newDist = Math.min(gestureState.dy * 0.4, MAX_PULL);
        pullDistance.setValue(newDist);
        
        // Map pull distance to lottie progress (0 to 1)
        if (lottieRef.current) {
           const progress = Math.min(newDist / REFRESH_THRESHOLD, 1);
           // Try-catch for Lottie progress update as it can occasionally throw if not fully mounted
           try {
             lottieRef.current.play(progress * 100, progress * 100); 
           } catch(e) {}
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalDist = gestureState.dy * 0.4;
        
        if (finalDist >= REFRESH_THRESHOLD) {
          // Trigger refresh
          Animated.spring(pullDistance, {
            toValue: REFRESH_THRESHOLD,
            useNativeDriver: true,
          }).start();
          handleRefresh();
        } else {
          // Snap back
          Animated.spring(pullDistance, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
         Animated.spring(pullDistance, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
      }
    })
  ).current;

  const handleScroll = useCallback((e: any) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    props.onScroll?.(e);
  }, [props.onScroll]);

  // Native behavior handling for platforms that support negative offset natively (iOS)
  const handleScrollEndDrag = (e: any) => {
    if (Platform.OS !== 'web') {
       const offsetY = e.nativeEvent.contentOffset.y;
       if (offsetY < -REFRESH_THRESHOLD && !refreshing && !isRefreshing) {
         handleRefresh();
       }
    }
    props.onScrollEndDrag?.(e);
  };

  const lottieOpacity = pullDistance.interpolate({
    inputRange: [0, 20, REFRESH_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const lottieScale = pullDistance.interpolate({
    inputRange: [0, REFRESH_THRESHOLD],
    outputRange: [0.6, 1],
    extrapolate: 'clamp',
  });

  const translateY = pullDistance.interpolate({
    inputRange: [0, MAX_PULL],
    outputRange: [0, MAX_PULL],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container} {...(Platform.OS === 'web' ? panResponder.panHandlers : {})}>
      <Animated.View
        style={[
          styles.refreshContainer,
          {
            backgroundColor: colors.bg,
            opacity: lottieOpacity,
            transform: [
              { translateY: Animated.add(pullDistance, -REFRESH_THRESHOLD) },
              { scale: lottieScale }
            ],
          },
        ]}
      >
        <LottieView
          ref={lottieRef}
          source={lottieSource || require('@/assets/lottie-refresh.json')}
          style={styles.lottie}
          autoPlay={false}
          loop={true}
        />
      </Animated.View>

      <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
        <ScrollView
          {...props}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEndDrag}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            props.contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
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
    zIndex: -1,
  },
  lottie: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
  },
});

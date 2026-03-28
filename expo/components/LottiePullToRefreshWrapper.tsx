import React, { useState, useRef, ReactNode, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Platform,
  PanResponder,
  Text,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface LottiePullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: ReactNode;
  lottieSource?: any;
  scrollY?: Animated.Value | number; // To track if we are at the top
}

const REFRESH_THRESHOLD = 100;
const MAX_PULL = 180;
const REFRESH_DELAY_MS = 1500;
const TOP_EDGE_GAP = 1;
const HEADER_GAP = 2;

export function LottiePullToRefreshWrapper({
  onRefresh,
  isRefreshing,
  children,
  lottieSource,
}: LottiePullToRefreshProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  
  // Animation value for the pull down distance
  const pullDistance = useRef(new Animated.Value(0)).current;
  // Separate animation for fade out when done
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  // A variable to track if we are currently dragging
  const isDragging = useRef(false);

  // Lottie control and animations
  useEffect(() => {
    if (isRefreshing || refreshing) {
      fadeOutAnim.setValue(1);
      lottieRef.current?.play(0, 120);
      // Provide haptic feedback when refresh officially starts
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Fallback for web if supported
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(150);
        }
      }
    } else {
      // Refresh completed, trigger fade out
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After fade out, reset pull distance instantly and restore opacity
        pullDistance.setValue(0);
        fadeOutAnim.setValue(1);
        lottieRef.current?.reset();
      });
    }
  }, [isRefreshing, refreshing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, REFRESH_DELAY_MS));
    await onRefresh();
    setRefreshing(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      // We only want to handle the gesture if the user is pulling down
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if pulling down with a decent amount of force, and not already refreshing
        return gestureState.dy > 15 && gestureState.vy > 0.1 && !isRefreshing && !refreshing;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return gestureState.dy > 15 && gestureState.vy > 0.1 && !isRefreshing && !refreshing;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRefreshing || refreshing || !isDragging.current) return;
        
        const newDist = Math.min(gestureState.dy * 0.45, MAX_PULL);
        pullDistance.setValue(newDist);
        const progress = Math.min(newDist / REFRESH_THRESHOLD, 1);
        const endFrame = Math.max(1, Math.round(progress * 120));
        lottieRef.current?.play(0, endFrame);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        const finalDist = gestureState.dy * 0.45;
        
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
         isDragging.current = false;
         Animated.spring(pullDistance, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
      }
    })
  ).current;

  const lottieOpacity = pullDistance.interpolate({
    inputRange: [0, 20, REFRESH_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const finalOpacity = Animated.multiply(lottieOpacity, fadeOutAnim);

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

  const panHandlers = panResponder.panHandlers;

  return (
    <View style={styles.container} {...panHandlers}>
      <Animated.View
        style={[
          styles.refreshContainer,
          {
            backgroundColor: colors.bg,
            opacity: finalOpacity,
            transform: [
              { scale: lottieScale }
            ],
          },
        ]}
      >
        <View style={styles.lottieBounds}>
          <LottieView
            ref={lottieRef}
            source={lottieSource || require('@/assets/lottie-refresh.json')}
            style={styles.lottie}
            autoPlay={false}
            loop={isRefreshing || refreshing}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'جار التحميل...' : 'Reloading...'}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
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
    top: TOP_EDGE_GAP,
    left: 0,
    right: 0,
    height: REFRESH_THRESHOLD,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: HEADER_GAP,
    zIndex: 20,
    pointerEvents: 'none',
  },
  lottieBounds: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
});

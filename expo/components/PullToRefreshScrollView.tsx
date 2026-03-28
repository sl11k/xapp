import React, { useState, useRef, ReactNode } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  Animated,
  StyleSheet,
  View,
  Text,
  Platform,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Laptop, Lightbulb, Building } from 'lucide-react-native';

interface PullToRefreshScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: ReactNode;
}

const REFRESH_THRESHOLD = 80;

export function PullToRefreshScrollView({
  onRefresh,
  isRefreshing,
  children,
  ...props
}: PullToRefreshScrollViewProps) {
  const { colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false, listener: props.onScroll }
  );

  const handleRelease = async (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (offsetY < -REFRESH_THRESHOLD && !refreshing && !isRefreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    props.onScrollEndDrag?.(e);
  };

  const iconScale = scrollY.interpolate({
    inputRange: [-REFRESH_THRESHOLD * 1.5, 0],
    outputRange: [1.2, 0],
    extrapolate: 'clamp',
  });

  const iconOpacity = scrollY.interpolate({
    inputRange: [-REFRESH_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const iconRotate = scrollY.interpolate({
    inputRange: [-REFRESH_THRESHOLD * 2, 0],
    outputRange: ['-15deg', '15deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.refreshContainer,
          {
            backgroundColor: colors.bg,
            opacity: iconOpacity,
            transform: [{ scale: iconScale }, { translateY: scrollY.interpolate({
              inputRange: [-100, 0],
              outputRange: [20, -20],
              extrapolate: 'clamp'
            }) }],
          },
        ]}
      >
        <Animated.View style={[styles.iconWrapper, { transform: [{ rotate: iconRotate }] }]}>
          <Laptop color={colors.accent} size={28} strokeWidth={2} />
        </Animated.View>
        <Animated.View style={[styles.iconWrapper, { position: 'absolute', top: -10, right: -10, transform: [{ scale: isRefreshing ? 1.2 : 0.8 }] }]}>
          <Lightbulb color={colors.yellow} size={16} strokeWidth={2.5} />
        </Animated.View>
      </Animated.View>

      <ScrollView
        {...props}
        onScroll={handleScroll}
        onScrollEndDrag={handleRelease}
        scrollEventThrottle={16}
        contentContainerStyle={[
          props.contentContainerStyle,
          { paddingTop: isRefreshing || refreshing ? REFRESH_THRESHOLD : 0 },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  iconWrapper: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
  }
});

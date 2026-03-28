import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 10, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.65, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function FeedCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.feedCard, { backgroundColor: colors.bgCard }]}>
      <View style={sk.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={sk.flex}>
          <Skeleton width={130} height={14} borderRadius={7} />
          <Skeleton width={90} height={11} borderRadius={6} />
        </View>
        <Skeleton width={32} height={12} borderRadius={6} />
      </View>
      <Skeleton height={14} borderRadius={7} />
      <Skeleton height={14} borderRadius={7} />
      <Skeleton width="65%" height={14} borderRadius={7} />
      <View style={sk.actions}>
        <Skeleton width={48} height={12} borderRadius={6} />
        <Skeleton width={48} height={12} borderRadius={6} />
        <Skeleton width={48} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export function CommunityCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard }]}>
      <View style={sk.row}>
        <Skeleton width={52} height={52} borderRadius={16} />
        <View style={sk.flex}>
          <Skeleton width={140} height={15} borderRadius={8} />
          <Skeleton width={200} height={12} borderRadius={6} />
          <Skeleton width={160} height={12} borderRadius={6} />
        </View>
      </View>
      <View style={sk.actions}>
        <Skeleton width={64} height={24} borderRadius={12} />
        <Skeleton width={76} height={36} borderRadius={18} />
      </View>
    </View>
  );
}

export function ServiceCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard }]}>
      <View style={sk.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={sk.flex}>
          <Skeleton width={110} height={14} borderRadius={7} />
          <Skeleton width={70} height={22} borderRadius={11} />
        </View>
        <Skeleton width={50} height={14} borderRadius={7} />
      </View>
      <Skeleton height={15} borderRadius={8} />
      <Skeleton width="75%" height={15} borderRadius={8} />
      <View style={sk.actions}>
        <Skeleton width={80} height={14} borderRadius={7} />
        <Skeleton width={60} height={14} borderRadius={7} />
        <Skeleton width={76} height={36} borderRadius={18} />
      </View>
    </View>
  );
}

export function ConversationSkeleton() {
  return (
    <View style={sk.conversationRow}>
      <Skeleton width={54} height={54} borderRadius={27} />
      <View style={sk.flex}>
        <View style={sk.actions}>
          <Skeleton width={120} height={15} borderRadius={8} />
          <Skeleton width={36} height={12} borderRadius={6} />
        </View>
        <Skeleton height={13} borderRadius={7} />
        <Skeleton width="55%" height={13} borderRadius={7} />
      </View>
    </View>
  );
}

export function ResourceCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard }]}>
      <View style={sk.row}>
        <Skeleton width={48} height={48} borderRadius={14} />
        <View style={sk.flex}>
          <Skeleton width={70} height={22} borderRadius={11} />
          <Skeleton width={180} height={15} borderRadius={8} />
        </View>
      </View>
      <Skeleton height={13} borderRadius={7} />
      <Skeleton width="75%" height={13} borderRadius={7} />
    </View>
  );
}

const sk = StyleSheet.create({
  feedCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});

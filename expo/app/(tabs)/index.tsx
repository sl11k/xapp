import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Bookmark,
  Heart,
  MessageCircle,
  PenLine,
  Search,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { FeedCardSkeleton } from '@/components/SkeletonLoader';
import { GlassView } from '@/components/GlassView';
import { PremiumCard } from '@/components/PremiumCard';
import { AppIcon } from '@/components/AppIcon';
import { RefreshCharacter } from '@/components/RefreshCharacter';
import { trpcClient } from '@/lib/trpc';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/constants/theme';
import { formatCount } from '@/lib/format';
import type { EnrichedPost } from '@/types/post';

const { width } = Dimensions.get('window');

function getAvatarColor(id: string): string {
  const colors = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const BASE_CATEGORIES_AR = ['لك', 'الحوكمة', 'الفرص', 'تحليلات'];
const BASE_CATEGORIES_EN = ['For you', 'Governance', 'Opportunities', 'Insights'];

function HomeTopBar() {
  const router = useRouter();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const horizontalPadding = width >= 768 ? 32 : 20;

  return (
    <View style={[styles.homeHeader, { paddingHorizontal: horizontalPadding, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.appTitle, { color: colors.text }]}>x app</Text>
      <View style={[styles.heroActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <PressableScale
          onPress={() => router.push('/explore')}
          style={[
            styles.heroControl,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <AppIcon icon={Search} size={20} />
        </PressableScale>
        <PressableScale
          onPress={() => router.push('/notifications')}
          style={[
            styles.heroControl,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <AppIcon icon={Bell} size={20} />
          <View style={[styles.notifDot, { backgroundColor: colors.accent, borderColor: colors.bgCard }]} />
        </PressableScale>
      </View>
    </View>
  );
}

function CategoryTabs({ activeCategory, onSelect, extraCategories }: { activeCategory: string; onSelect: (cat: string) => void; extraCategories: string[] }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const categories = language === 'ar' ? [...BASE_CATEGORIES_AR, ...extraCategories] : [...BASE_CATEGORIES_EN, ...extraCategories];

  return (
    <View style={styles.catWrapper}>
      <FlatList
        horizontal
        inverted={isRTL}
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        renderItem={({ item }) => {
          const isActive = activeCategory === item || (activeCategory === '' && item === categories[0]);
          return (
            <PressableScale
              onPress={() => {
                onSelect(item === categories[0] ? '' : item);
                void Haptics.selectionAsync();
              }}
              style={[
                styles.catPill,
                isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
                !isActive && { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <Text style={[
                styles.catText,
                { color: isActive ? '#FFF' : colors.textMuted },
                isActive && { fontWeight: '700' },
              ]}>{item}</Text>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}

function ComposeCard() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();

  return (
    <PremiumCard
      onPress={() => router.push('/create-post')}
      variant="glow"
      style={styles.composeCard}
      padding={theme.spacing.md}
    >
      <View style={[styles.composeContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.composeAvatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.composeAvatarText}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.composePlaceholder, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {language === 'ar' ? 'ماذا يدور في ذهنك؟' : "What's on your mind?"}
        </Text>
        <View style={[styles.composeIcon, { backgroundColor: colors.accentLight }]}>
          <PenLine color={colors.accent} size={18} strokeWidth={2.5} />
        </View>
      </View>
    </PremiumCard>
  );
}

const FeedCard = React.memo(function FeedCard({
  post,
  onPress,
  onLike,
  onSave,
  onAuthorPress,
  index,
}: {
  post: EnrichedPost;
  onPress: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAuthorPress: (authorId: string) => void;
  index: number;
}) {
  const { isRTL } = useLanguage();
  const { colors, isDark } = useTheme();
  const isLarge = index % 5 === 0;
  const isLayered = index % 3 === 1;

  const handleLike = () => {
    onLike(post.id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    onSave(post.id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const avatarColor = getAvatarColor(post.authorId);
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <PremiumCard
      variant={isLarge ? 'accent' : isLayered ? 'glow' : 'surface'}
      onPress={onPress}
      style={[styles.feedCard, isLarge && styles.feedCardLarge]}
      padding={0}
    >
      <View style={styles.feedCardInner}>
        <View style={[styles.feedHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PressableScale onPress={() => onAuthorPress(post.authorId)}>
            <View style={[styles.feedAvatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.feedAvatarText}>{post.authorInitial}</Text>
            </View>
          </PressableScale>
          <View style={[styles.feedAuthorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.feedAuthorName, { color: isLarge ? '#FFF' : colors.text }]}>{post.authorName}</Text>
            <Text style={[styles.feedAuthorRole, { color: isLarge ? 'rgba(255,255,255,0.7)' : colors.textMuted }]} numberOfLines={1}>
              {post.authorRole || 'Business Professional'}
            </Text>
          </View>
          <Text style={[styles.feedTime, { color: isLarge ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>{timeAgo}</Text>
        </View>

        <View style={styles.feedContentContainer}>
          <Text 
            style={[
              styles.feedContent, 
              { textAlign: isRTL ? 'right' : 'left', color: isLarge ? '#FFF' : colors.text },
              isLarge && styles.feedContentLarge
            ]}
            numberOfLines={isLarge ? 4 : 3}
          >
            {post.content}
          </Text>
          {isLayered && (
            <View style={[styles.layerStripe, { backgroundColor: isLarge ? 'rgba(255,255,255,0.22)' : colors.accentLight }]} />
          )}
        </View>

        {post.topic && (
          <View style={[styles.topicRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <GlassView intensity={20} borderRadius={8} style={styles.topicBadge}>
              <Text style={[styles.topicText, { color: isLarge ? '#FFF' : colors.accent }]}>#{post.topic}</Text>
            </GlassView>
          </View>
        )}

        <View style={[styles.feedActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.actionGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <PressableScale onPress={handleLike} style={styles.actionBtn}>
              <AppIcon icon={Heart} active={post.isLiked} filled color={post.isLiked ? (isLarge ? '#FFF' : colors.error) : (isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted)} />
              <Text style={[styles.actionText, { color: isLarge ? '#FFF' : colors.textSecondary }]}>{formatCount(post.likesCount)}</Text>
            </PressableScale>
            <PressableScale onPress={onPress} style={styles.actionBtn}>
              <AppIcon icon={MessageCircle} color={isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted} />
              <Text style={[styles.actionText, { color: isLarge ? '#FFF' : colors.textSecondary }]}>{formatCount(post.commentsCount)}</Text>
            </PressableScale>
          </View>
          <View style={[styles.actionGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <PressableScale onPress={handleSave} style={styles.actionBtn}>
              <AppIcon icon={Bookmark} active={post.isSaved} filled color={post.isSaved ? (isLarge ? '#FFF' : colors.accent) : (isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted)} />
            </PressableScale>
            <PressableScale style={styles.actionBtn}>
              <AppIcon icon={Share2} color={isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted} />
            </PressableScale>
          </View>
        </View>
      </View>
    </PremiumCard>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [communityCategories, setCommunityCategories] = useState<string[]>([]);
  const [pullProgress, setPullProgress] = useState(0);

  const feedQuery = useInfiniteQuery({
    queryKey: ['posts', 'feed'],
    queryFn: async ({ pageParam = 0 }) => {
      return trpcClient.posts.list.query({ cursor: pageParam as number, limit: 20 });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
  });

  const allPosts = useMemo(() => {
    const raw = feedQuery.data?.pages.flatMap((p) => p.posts) ?? [];
    if (!activeCategory) return raw;
    return raw.filter((post) => {
      const topic = (post.topic ?? '').toLowerCase();
      const cat = activeCategory.toLowerCase();
      return topic.includes(cat);
    });
  }, [feedQuery.data, activeCategory]);

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => trpcClient.posts.toggleLike.mutate({ postId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => trpcClient.posts.toggleSave.mutate({ postId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (data.saved) {
        setToastMsg(language === 'ar' ? 'تم الحفظ' : 'Saved to collection');
        setToastVisible(true);
      }
    },
  });

  const handleLike = useCallback((postId: string) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    likeMutation.mutate(postId);
  }, [isAuthenticated, likeMutation, router]);

  const handleSave = useCallback((postId: string) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    saveMutation.mutate(postId);
  }, [isAuthenticated, saveMutation, router]);

  const renderItem = useCallback(({ item, index }: { item: EnrichedPost; index: number }) => (
    <FeedCard
      post={item}
      onPress={() => router.push(`/post/${item.id}`)}
      onLike={handleLike}
      onSave={handleSave}
      onAuthorPress={(id) => router.push(`/user/${id}`)}
      index={index}
    />
  ), [router, handleLike, handleSave]);

  const isRefreshing = feedQuery.isRefetching && !feedQuery.isFetchingNextPage;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LottiePullToRefreshWrapper
          isRefreshing={isRefreshing}
          onRefresh={() => feedQuery.refetch()}
        >
          <FlatList
            data={allPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={
              <>
                <HomeTopBar />
                <ComposeCard />
                <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} extraCategories={communityCategories} />
                <View style={styles.feedTitleContainer}>
                  <Text style={[styles.feedTitle, { color: colors.text }]}>
                    {language === 'ar' ? 'أحدث التحليلات' : 'Latest Insights'}
                  </Text>
                  <Sparkles color={colors.accent} size={20} strokeWidth={2.5} />
                </View>
              </>
            }
            ListEmptyComponent={feedQuery.isLoading ? <LoadingSkeleton /> : <EmptyFeed />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              const progress = Math.max(0, Math.min(1, -y / 90));
              if (progress !== pullProgress) setPullProgress(progress);
            }}
            scrollEventThrottle={16}
            onEndReached={() => {
              if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
                feedQuery.fetchNextPage();
              }
            }}
          />
        </LottiePullToRefreshWrapper>
        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </SafeAreaView>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  );
}

function EmptyFeed() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyOrb, { backgroundColor: colors.accentLight }]}>
        <Sparkles color={colors.accent} size={24} strokeWidth={2.6} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No posts yet</Text>
      <Text style={{ color: colors.textSecondary }}>Start sharing to light up your feed.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },
  homeHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.7,
    textTransform: 'lowercase',
  },
  heroActions: {
    gap: 10,
    alignItems: 'center',
  },
  heroControl: {
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  catWrapper: {
    marginTop: 0,
    marginBottom: 14,
  },
  catRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 20,
  },
  catPill: {
    minHeight: 46,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    fontSize: 16,
    fontWeight: '700',
  },
  composeCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  composeContent: {
    alignItems: 'center',
    gap: 16,
  },
  composeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  composePlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  composeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  feedCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
  },
  feedCardLarge: {
    minHeight: 280,
  },
  feedCardInner: {
    padding: 24,
  },
  feedHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  feedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  feedAuthorInfo: {
    flex: 1,
    gap: 2,
  },
  feedAuthorName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  feedAuthorRole: {
    fontSize: 13,
    fontWeight: '500',
  },
  feedTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedContentContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  feedContent: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  feedContentLarge: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '600',
  },
  layerStripe: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: '35%',
    height: 6,
    borderRadius: 4,
  },
  topicRow: {
    marginBottom: 20,
  },
  topicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
  },
  actionGroup: {
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
});

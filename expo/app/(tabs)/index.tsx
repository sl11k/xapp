import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
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
  BookOpen,
  Clock,
  ExternalLink,
  Heart,
  MessageCircle,
  PenLine,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { FeedCardSkeleton } from '@/components/SkeletonLoader';
import { GlassView } from '@/components/GlassView';
import { PremiumCard } from '@/components/PremiumCard';
import { AppIcon } from '@/components/AppIcon';
import { trpcClient } from '@/lib/trpc';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/constants/theme';
import { formatCount } from '@/lib/format';
import { resources, getLocalizedText } from '@/data/businessHub';
import type { ResourceItem } from '@/data/businessHub';
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

// ── Section Segment Bar ─────────────────────────────────────────────────────
function SectionSegment({
  active,
  onChange,
}: {
  active: 'feed' | 'knowledge';
  onChange: (s: 'feed' | 'knowledge') => void;
}) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const horizontalPadding = width >= 768 ? 32 : 20;

  const labels = {
    feed: language === 'ar' ? 'لك' : 'For You',
    knowledge: language === 'ar' ? 'مركز المعرفة' : 'Knowledge',
  };

  const order: Array<'feed' | 'knowledge'> = isRTL
    ? ['knowledge', 'feed']
    : ['feed', 'knowledge'];

  return (
    <View
      style={[
        segStyles.wrapper,
        { paddingHorizontal: horizontalPadding, flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      {order.map((key) => {
        const isActive = active === key;
        return (
          <PressableScale
            key={key}
            onPress={() => {
              onChange(key);
              void Haptics.selectionAsync();
            }}
            style={[segStyles.tab, isActive && { borderBottomColor: colors.accent, borderBottomWidth: 2.5 }]}
          >
            {key === 'knowledge' && (
              <BookOpen
                size={14}
                color={isActive ? colors.accent : colors.textMuted}
                strokeWidth={2.2}
                style={{ marginRight: isRTL ? 0 : 5, marginLeft: isRTL ? 5 : 0 }}
              />
            )}
            <Text
              style={[
                segStyles.label,
                { color: isActive ? colors.accent : colors.textMuted },
                isActive && { fontWeight: '800' },
              ]}
            >
              {labels[key]}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,100,100,0.12)',
    marginBottom: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

// ── Home Top Bar ─────────────────────────────────────────────────────────────
function HomeTopBar() {
  const router = useRouter();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const horizontalPadding = width >= 768 ? 32 : 20;

  return (
    <View style={[styles.homeHeader, { paddingHorizontal: horizontalPadding, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.appTitle, { color: colors.accent }]}>muwassa</Text>
      <View style={[styles.heroActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <PressableScale
          onPress={() => router.push('/explore')}
          style={[styles.heroControl, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <AppIcon icon={Search} size={20} />
        </PressableScale>
        <PressableScale
          onPress={() => router.push('/notifications')}
          style={[styles.heroControl, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <AppIcon icon={Bell} size={20} />
          <View style={[styles.notifDot, { backgroundColor: colors.accent, borderColor: colors.bgCard }]} />
        </PressableScale>
      </View>
    </View>
  );
}

// ── Category Tabs ────────────────────────────────────────────────────────────
function CategoryTabs({
  activeCategory,
  onSelect,
  extraCategories,
}: {
  activeCategory: string;
  onSelect: (cat: string) => void;
  extraCategories: string[];
}) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const categories =
    language === 'ar'
      ? [...BASE_CATEGORIES_AR, ...extraCategories]
      : [...BASE_CATEGORIES_EN, ...extraCategories];

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
          const isActive =
            activeCategory === item ||
            (activeCategory === '' && item === categories[0]);
          return (
            <PressableScale
              onPress={() => {
                onSelect(item === categories[0] ? '' : item);
                void Haptics.selectionAsync();
              }}
              style={[
                styles.catPill,
                isActive
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  { color: isActive ? '#FFF' : colors.textMuted },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {item}
              </Text>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}

// ── Compose Card ─────────────────────────────────────────────────────────────
function ComposeCard() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const { colors } = useTheme();

  return (
    <PremiumCard
      onPress={() => router.push('/create-post')}
      variant="glow"
      style={styles.composeCard}
      padding={theme.spacing.md}
    >
      <View style={[styles.composeContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.composeAvatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.composeAvatarText}>
            {(profile?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text
          style={[
            styles.composePlaceholder,
            { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary },
          ]}
        >
          {language === 'ar' ? 'ماذا يدور في ذهنك؟' : "What's on your mind?"}
        </Text>
        <View style={[styles.composeIcon, { backgroundColor: colors.accentLight }]}>
          <PenLine color={colors.accent} size={18} strokeWidth={2.5} />
        </View>
      </View>
    </PremiumCard>
  );
}

// ── Feed Card ────────────────────────────────────────────────────────────────
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
  const { colors } = useTheme();
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
            <Text style={[styles.feedAuthorName, { color: isLarge ? '#FFF' : colors.text }]}>
              {post.authorName}
            </Text>
            <Text
              style={[styles.feedAuthorRole, { color: isLarge ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}
              numberOfLines={1}
            >
              {post.authorRole || 'Business Professional'}
            </Text>
          </View>
          <Text style={[styles.feedTime, { color: isLarge ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
            {timeAgo}
          </Text>
        </View>

        <View style={styles.feedContentContainer}>
          <Text
            style={[
              styles.feedContent,
              { textAlign: isRTL ? 'right' : 'left', color: isLarge ? '#FFF' : colors.text },
              isLarge && styles.feedContentLarge,
            ]}
            numberOfLines={isLarge ? 4 : 3}
          >
            {post.content}
          </Text>
          {isLayered && (
            <View
              style={[
                styles.layerStripe,
                { backgroundColor: isLarge ? 'rgba(255,255,255,0.22)' : colors.accentLight },
              ]}
            />
          )}
        </View>

        {post.topic && (
          <View style={[styles.topicRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <GlassView intensity={20} borderRadius={8} style={styles.topicBadge}>
              <Text style={[styles.topicText, { color: isLarge ? '#FFF' : colors.accent }]}>
                #{post.topic}
              </Text>
            </GlassView>
          </View>
        )}

        <View style={[styles.feedActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.actionGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <PressableScale onPress={handleLike} style={styles.actionBtn}>
              <AppIcon
                icon={Heart}
                active={post.isLiked}
                filled
                color={
                  post.isLiked
                    ? isLarge ? '#FFF' : colors.error
                    : isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted
                }
              />
              <Text style={[styles.actionText, { color: isLarge ? '#FFF' : colors.textSecondary }]}>
                {formatCount(post.likesCount)}
              </Text>
            </PressableScale>
            <PressableScale onPress={onPress} style={styles.actionBtn}>
              <AppIcon
                icon={MessageCircle}
                color={isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted}
              />
              <Text style={[styles.actionText, { color: isLarge ? '#FFF' : colors.textSecondary }]}>
                {formatCount(post.commentsCount)}
              </Text>
            </PressableScale>
          </View>
          <View style={[styles.actionGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <PressableScale onPress={handleSave} style={styles.actionBtn}>
              <AppIcon
                icon={Bookmark}
                active={post.isSaved}
                filled
                color={
                  post.isSaved
                    ? isLarge ? '#FFF' : colors.accent
                    : isLarge ? 'rgba(255,255,255,0.65)' : colors.textMuted
                }
              />
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

// ── Knowledge Article Card ────────────────────────────────────────────────────
const ARTICLE_CATEGORY_COLORS: Record<string, string> = {
  Compliance: '#F59E0B',
  Governance: '#6366F1',
  Communities: '#10B981',
  Business: '#EC4899',
  Template: '#F59E0B',
  Guide: '#6366F1',
  Framework: '#3B82F6',
  'Case Study': '#EC4899',
  Checklist: '#10B981',
};

function KnowledgeArticleCard({
  item,
  index,
  onPress,
}: {
  item: ResourceItem;
  index: number;
  onPress: () => void;
}) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  const typeEn = item.type.en;
  const accentColor = ARTICLE_CATEGORY_COLORS[typeEn] ?? colors.accent;
  const title = getLocalizedText(item.title, language);
  const desc = item.description ? getLocalizedText(item.description, language) : '';
  const readTime = item.readTime ? getLocalizedText(item.readTime, language) : '';
  const typeLabel = getLocalizedText(item.type, language);
  const isFeatured = index === 0;

  if (isFeatured) {
    return (
      <PremiumCard
        variant="accent"
        onPress={onPress}
        style={styles.articleFeatured}
        padding={0}
      >
        <View style={styles.articleFeaturedInner}>
          <View style={[styles.articleTypeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <BookOpen size={11} color="#FFF" strokeWidth={2.5} />
            <Text style={[styles.articleTypeText, { color: '#FFF' }]}>{typeLabel}</Text>
          </View>
          <Text
            style={[styles.articleFeaturedTitle, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[styles.articleFeaturedDesc, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={2}
          >
            {desc}
          </Text>
          <View style={[styles.articleMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.articleAuthorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.articleAuthorDot, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
              <Text style={styles.articleAuthorLight}>{item.author}</Text>
            </View>
            {readTime ? (
              <View style={[styles.articleReadTimeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Clock size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.articleReadTimeLight}>{readTime}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </PremiumCard>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.articleCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.articleCardLeft, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.articleTypeBadge, { backgroundColor: accentColor + '18' }]}>
          <BookOpen size={11} color={accentColor} strokeWidth={2.5} />
          <Text style={[styles.articleTypeText, { color: accentColor }]}>{typeLabel}</Text>
        </View>
        <Text
          style={[styles.articleTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {desc ? (
          <Text
            style={[styles.articleDesc, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={2}
          >
            {desc}
          </Text>
        ) : null}
        <View style={[styles.articleMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.articleAuthorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.articleAuthorDot, { backgroundColor: colors.textMuted }]} />
            <Text style={[styles.articleAuthor, { color: colors.textMuted }]}>{item.author}</Text>
          </View>
          {readTime ? (
            <View style={[styles.articleReadTimeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={[styles.articleReadTime, { color: colors.textMuted }]}>{readTime}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.articleIconBox, { backgroundColor: accentColor + '12' }]}>
        <BookOpen size={22} color={accentColor} strokeWidth={1.8} />
      </View>
    </Pressable>
  );
}

// ── Knowledge Section ────────────────────────────────────────────────────────
const KNOWLEDGE_FILTERS_AR = ['الكل', 'أدلة', 'قوالب', 'دراسات حالة', 'أُطر عمل'];
const KNOWLEDGE_FILTERS_EN = ['All', 'Guides', 'Templates', 'Case Studies', 'Frameworks'];

function KnowledgeSection() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState(0);

  const filters = language === 'ar' ? KNOWLEDGE_FILTERS_AR : KNOWLEDGE_FILTERS_EN;
  const typeMap: Record<number, string> = {
    1: 'Guide',
    2: 'Template',
    3: 'Case Study',
    4: 'Framework',
  };

  const filtered = useMemo(() => {
    if (activeFilter === 0) return resources;
    const t = typeMap[activeFilter];
    return resources.filter((r) => r.type.en === t);
  }, [activeFilter]);

  return (
    <View>
      {/* Filter chips */}
      <FlatList
        horizontal
        inverted={isRTL}
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.knowledgeFilterRow}
        style={{ flexGrow: 0, marginBottom: 12 }}
        renderItem={({ item, index }) => {
          const isActive = activeFilter === index;
          return (
            <PressableScale
              onPress={() => { setActiveFilter(index); void Haptics.selectionAsync(); }}
              style={[
                styles.knowledgeFilterPill,
                isActive
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.knowledgeFilterText, { color: isActive ? '#FFF' : colors.textMuted }]}>
                {item}
              </Text>
            </PressableScale>
          );
        }}
      />

      {/* Articles */}
      {filtered.map((item, index) => (
        <KnowledgeArticleCard
          key={item.id}
          item={item}
          index={index}
          onPress={() => router.push('/knowledge')}
        />
      ))}

      {/* See all link */}
      <Pressable
        onPress={() => router.push('/knowledge')}
        style={({ pressed }) => [
          styles.seeAllBtn,
          { borderColor: colors.border, backgroundColor: colors.bgCard },
          pressed && { opacity: 0.7 },
        ]}
      >
        <BookOpen size={16} color={colors.accent} strokeWidth={2} />
        <Text style={[styles.seeAllText, { color: colors.accent }]}>
          {language === 'ar' ? 'استعراض جميع المقالات' : 'Browse all articles'}
        </Text>
        <ExternalLink size={14} color={colors.accent} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [communityCategories] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'feed' | 'knowledge'>('feed');

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

  const handleLike = useCallback(
    (postId: string) => {
      if (!isAuthenticated) { router.push('/login'); return; }
      likeMutation.mutate(postId);
    },
    [isAuthenticated, likeMutation, router],
  );

  const handleSave = useCallback(
    (postId: string) => {
      if (!isAuthenticated) { router.push('/login'); return; }
      saveMutation.mutate(postId);
    },
    [isAuthenticated, saveMutation, router],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: EnrichedPost; index: number }) => (
      <FeedCard
        post={item}
        onPress={() => router.push(`/post/${item.id}`)}
        onLike={handleLike}
        onSave={handleSave}
        onAuthorPress={(id) => router.push(`/user/${id}`)}
        index={index}
      />
    ),
    [router, handleLike, handleSave],
  );

  const isRefreshing = feedQuery.isRefetching && !feedQuery.isFetchingNextPage;

  const FeedHeader = (
    <>
      <HomeTopBar />
      <SectionSegment active={activeSection} onChange={setActiveSection} />
      {activeSection === 'feed' ? (
        <>
          <ComposeCard />
          <CategoryTabs
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            extraCategories={communityCategories}
          />
          <View style={styles.feedTitleContainer}>
            <Text style={[styles.feedTitle, { color: colors.text }]}>
              {language === 'ar' ? 'أحدث التحليلات' : 'Latest Insights'}
            </Text>
            <Sparkles color={colors.accent} size={20} strokeWidth={2.5} />
          </View>
        </>
      ) : (
        <View style={styles.knowledgeHeader}>
          <View style={styles.knowledgeTitleRow}>
            <BookOpen size={20} color={colors.accent} strokeWidth={2.2} />
            <Text style={[styles.knowledgeSectionTitle, { color: colors.text }]}>
              {language === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
            </Text>
          </View>
          <Text style={[styles.knowledgeSectionSub, { color: colors.textSecondary }]}>
            {language === 'ar'
              ? 'أدلة، قوالب ودراسات حالة من خبراء الأعمال'
              : 'Guides, templates & case studies from business experts'}
          </Text>
        </View>
      )}
    </>
  );

  if (activeSection === 'knowledge') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {FeedHeader}
            <KnowledgeSection />
          </ScrollView>
        </SafeAreaView>
        <Toast
          visible={toastVisible}
          message={toastMsg}
          type="success"
          onDismiss={() => setToastVisible(false)}
        />
      </View>
    );
  }

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
            ListHeaderComponent={FeedHeader}
            ListEmptyComponent={
              feedQuery.isLoading ? <LoadingSkeleton /> : <EmptyFeed />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
                feedQuery.fetchNextPage();
              }
            }}
          />
        </LottiePullToRefreshWrapper>
        <Toast
          visible={toastVisible}
          message={toastMsg}
          type="success"
          onDismiss={() => setToastVisible(false)}
        />
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

  // ── Header ──────────────────────────────────────────────────────────────
  homeHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroActions: {
    gap: 10,
    alignItems: 'center',
  },
  heroControl: {
    width: 46,
    height: 46,
    borderRadius: 16,
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

  // ── Category tabs ────────────────────────────────────────────────────────
  catWrapper: { marginTop: 0, marginBottom: 14 },
  catRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 20 },
  catPill: {
    minHeight: 42,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: { fontSize: 15, fontWeight: '700' },

  // ── Compose card ─────────────────────────────────────────────────────────
  composeCard: { marginHorizontal: 20, marginBottom: 16, marginTop: 14 },
  composeContent: { alignItems: 'center', gap: 12 },
  composeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  composePlaceholder: { flex: 1, fontSize: 15, fontWeight: '500' },
  composeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Feed title ────────────────────────────────────────────────────────────
  feedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  feedTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

  // ── Feed card ─────────────────────────────────────────────────────────────
  feedCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 28 },
  feedCardLarge: { minHeight: 280 },
  feedCardInner: { padding: 22 },
  feedHeader: { alignItems: 'center', gap: 12, marginBottom: 14 },
  feedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  feedAuthorInfo: { flex: 1, gap: 2 },
  feedAuthorName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  feedAuthorRole: { fontSize: 13, fontWeight: '500' },
  feedTime: { fontSize: 12, fontWeight: '600' },
  feedContentContainer: { marginBottom: 18, position: 'relative' },
  feedContent: { fontSize: 15, lineHeight: 24, letterSpacing: -0.1 },
  feedContentLarge: { fontSize: 19, lineHeight: 30, fontWeight: '600' },
  layerStripe: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: '35%',
    height: 6,
    borderRadius: 4,
  },
  topicRow: { marginBottom: 18 },
  topicBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  topicText: { fontSize: 12, fontWeight: '700' },
  feedActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 18,
  },
  actionGroup: { gap: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700' },

  // ── Knowledge header ──────────────────────────────────────────────────────
  knowledgeHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 6,
  },
  knowledgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  knowledgeSectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  knowledgeSectionSub: { fontSize: 13, lineHeight: 20 },

  // ── Knowledge filter ──────────────────────────────────────────────────────
  knowledgeFilterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  knowledgeFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  knowledgeFilterText: { fontSize: 13, fontWeight: '600' },

  // ── Article cards ─────────────────────────────────────────────────────────
  articleFeatured: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 24,
    minHeight: 200,
  },
  articleFeaturedInner: {
    padding: 22,
    gap: 10,
  },
  articleFeaturedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  articleFeaturedDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
  },
  articleCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  articleCardLeft: { flex: 1, gap: 6 },
  articleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  articleTypeText: { fontSize: 11, fontWeight: '700' },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  articleDesc: { fontSize: 13, lineHeight: 19 },
  articleMeta: { alignItems: 'center', gap: 10, marginTop: 2 },
  articleAuthorRow: { alignItems: 'center', gap: 6 },
  articleAuthorDot: { width: 5, height: 5, borderRadius: 3 },
  articleAuthor: { fontSize: 12, fontWeight: '500' },
  articleAuthorLight: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  articleReadTimeRow: { alignItems: 'center', gap: 4 },
  articleReadTime: { fontSize: 12, fontWeight: '500' },
  articleReadTimeLight: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  // ── See all ───────────────────────────────────────────────────────────────
  seeAllBtn: {
    margin: 20,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  seeAllText: { fontSize: 14, fontWeight: '700' },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: { padding: 40, alignItems: 'center', gap: 8 },
  emptyOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
});

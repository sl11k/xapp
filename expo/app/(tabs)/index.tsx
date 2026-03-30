import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
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

type ActiveSection = 'foryou' | 'following' | 'knowledge';

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

// ─────────────────────────────────────────────────────────────────────────────
// TikTok-style Header with centered tabs
// ─────────────────────────────────────────────────────────────────────────────
function HomeHeader({
  active,
  onChange,
}: {
  active: ActiveSection;
  onChange: (s: ActiveSection) => void;
}) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  const tabs: { key: ActiveSection; label: string }[] = isRTL
    ? [
        { key: 'knowledge', label: language === 'ar' ? 'مركز المعرفة' : 'Knowledge' },
        { key: 'following', label: language === 'ar' ? 'أتابعه' : 'Following' },
        { key: 'foryou',    label: language === 'ar' ? 'لك' : 'For You' },
      ]
    : [
        { key: 'foryou',    label: language === 'ar' ? 'لك' : 'For You' },
        { key: 'following', label: language === 'ar' ? 'أتابعه' : 'Following' },
        { key: 'knowledge', label: language === 'ar' ? 'مركز المعرفة' : 'Knowledge' },
      ];

  return (
    <View style={[hStyles.container, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      {/* Left icon */}
      <PressableScale
        onPress={() => router.push('/explore')}
        style={hStyles.sideBtn}
      >
        <Search color={colors.text} size={22} strokeWidth={2} />
      </PressableScale>

      {/* Center tabs */}
      <View style={[hStyles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                onChange(tab.key);
                void Haptics.selectionAsync();
              }}
              style={hStyles.tabItem}
            >
              <Text
                style={[
                  hStyles.tabLabel,
                  {
                    color: isActive ? colors.text : colors.textMuted,
                    fontWeight: isActive ? '800' : '500',
                    fontSize: isActive ? 16 : 14,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View style={[hStyles.tabUnderline, { backgroundColor: colors.text }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Right icon */}
      <PressableScale
        onPress={() => router.push('/notifications')}
        style={hStyles.sideBtn}
      >
        <Bell color={colors.text} size={22} strokeWidth={2} />
        <View style={[hStyles.notifDot, { backgroundColor: colors.accent, borderColor: colors.bg }]} />
      </PressableScale>
    </View>
  );
}

const hStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  tabsRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 20,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 6,
    position: 'relative',
  },
  tabLabel: {
    letterSpacing: -0.3,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 2.5,
    borderRadius: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Category Tabs (horizontal filter pills)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Compose Card
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Feed Card
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Article Card
// ─────────────────────────────────────────────────────────────────────────────
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
      <PremiumCard variant="accent" onPress={onPress} style={styles.articleFeatured} padding={0}>
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
      style={({ pressed }) => [
        styles.articleCard,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
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

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Section
// ─────────────────────────────────────────────────────────────────────────────
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
      {/* Header */}
      <View style={[styles.knowledgeHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <BookOpen size={20} color={colors.accent} strokeWidth={2.2} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.knowledgeSectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
          </Text>
          <Text style={[styles.knowledgeSectionSub, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar'
              ? 'أدلة، قوالب ودراسات حالة من خبراء الأعمال'
              : 'Guides, templates & case studies from business experts'}
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        inverted={isRTL}
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.knowledgeFilterRow}
        style={{ flexGrow: 0, marginBottom: 14 }}
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

      {/* See all */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Following Empty State
// ─────────────────────────────────────────────────────────────────────────────
function FollowingEmpty() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyOrb, { backgroundColor: colors.accentLight }]}>
        <Sparkles color={colors.accent} size={24} strokeWidth={2.6} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {language === 'ar' ? 'لا يوجد منشورات بعد' : 'No posts yet'}
      </Text>
      <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
        {language === 'ar'
          ? 'تابع أشخاصاً ومجتمعات لترى منشوراتهم هنا'
          : 'Follow people and communities to see their posts here'}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('foryou');

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

  const renderFeedItem = useCallback(
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

  // ── Knowledge tab ──
  if (activeSection === 'knowledge') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <HomeHeader active={activeSection} onChange={setActiveSection} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            <KnowledgeSection />
          </ScrollView>
        </SafeAreaView>
        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </View>
    );
  }

  // ── Following tab ──
  if (activeSection === 'following') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <HomeHeader active={activeSection} onChange={setActiveSection} />
          <ComposeCard />
          <FollowingEmpty />
        </SafeAreaView>
        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </View>
    );
  }

  // ── For You tab (default feed) ──
  const FeedListHeader = (
    <>
      <ComposeCard />
      <CategoryTabs
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        extraCategories={[]}
      />
      <View style={styles.feedTitleContainer}>
        <Text style={[styles.feedTitle, { color: colors.text }]}>
          {language === 'ar' ? 'أحدث التحليلات' : 'Latest Insights'}
        </Text>
        <Sparkles color={colors.accent} size={20} strokeWidth={2.5} />
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <HomeHeader active={activeSection} onChange={setActiveSection} />
        <LottiePullToRefreshWrapper
          isRefreshing={isRefreshing}
          onRefresh={() => feedQuery.refetch()}
        >
          <FlatList
            data={allPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderFeedItem}
            ListHeaderComponent={FeedListHeader}
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
      </SafeAreaView>
      <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },

  // category tabs
  catWrapper: { marginBottom: 14 },
  catRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  catPill: {
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: { fontSize: 14, fontWeight: '600' },

  // compose
  composeCard: { marginHorizontal: 16, marginBottom: 14, marginTop: 14 },
  composeContent: { alignItems: 'center', gap: 12 },
  composeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeAvatarText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  composePlaceholder: { flex: 1, fontSize: 15, fontWeight: '500' },
  composeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // feed title
  feedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  feedTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },

  // feed card
  feedCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 24 },
  feedCardLarge: { minHeight: 260 },
  feedCardInner: { padding: 20 },
  feedHeader: { alignItems: 'center', gap: 12, marginBottom: 12 },
  feedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  feedAuthorInfo: { flex: 1, gap: 2 },
  feedAuthorName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  feedAuthorRole: { fontSize: 12, fontWeight: '500' },
  feedTime: { fontSize: 11, fontWeight: '600' },
  feedContentContainer: { marginBottom: 16, position: 'relative' },
  feedContent: { fontSize: 15, lineHeight: 24, letterSpacing: -0.1 },
  feedContentLarge: { fontSize: 18, lineHeight: 28, fontWeight: '600' },
  layerStripe: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: '35%',
    height: 5,
    borderRadius: 3,
  },
  topicRow: { marginBottom: 16 },
  topicBadge: { paddingHorizontal: 10, paddingVertical: 5 },
  topicText: { fontSize: 12, fontWeight: '700' },
  feedActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  actionGroup: { gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700' },

  // knowledge header
  knowledgeHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  knowledgeSectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  knowledgeSectionSub: { fontSize: 13, lineHeight: 20, marginTop: 2 },

  // knowledge filter
  knowledgeFilterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  knowledgeFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  knowledgeFilterText: { fontSize: 13, fontWeight: '600' },

  // article cards
  articleFeatured: { marginHorizontal: 16, marginBottom: 12, borderRadius: 22, minHeight: 190 },
  articleFeaturedInner: { padding: 20, gap: 10 },
  articleFeaturedTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  articleFeaturedDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
  articleCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  articleCardLeft: { flex: 1, gap: 5 },
  articleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
  articleTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, letterSpacing: -0.2 },
  articleDesc: { fontSize: 12, lineHeight: 18 },
  articleMeta: { alignItems: 'center', gap: 8, marginTop: 2 },
  articleAuthorRow: { alignItems: 'center', gap: 5 },
  articleAuthorDot: { width: 4, height: 4, borderRadius: 2 },
  articleAuthor: { fontSize: 11, fontWeight: '500' },
  articleAuthorLight: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  articleReadTimeRow: { alignItems: 'center', gap: 4 },
  articleReadTime: { fontSize: 11, fontWeight: '500' },
  articleReadTimeLight: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  // see all
  seeAllBtn: {
    margin: 16,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  seeAllText: { fontSize: 14, fontWeight: '700' },

  // empty
  emptyContainer: { padding: 40, alignItems: 'center', gap: 10 },
  emptyOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
});

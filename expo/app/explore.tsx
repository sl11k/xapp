import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  Heart,
  MessageCircle,
  Search,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import {
  communities,
  expertSuggestions,
  feedPosts,
  getLocalizedText,
  services,
  trendingTopics,
} from '@/data/businessHub';
import { useLanguage } from '@/providers/LanguageProvider';
import { trpcClient } from '@/lib/trpc';

const SEARCH_TABS_AR = ['الكل', 'منشورات', 'مستخدمون', 'مجتمعات', 'خدمات'];
const SEARCH_TABS_EN = ['All', 'Posts', 'Users', 'Communities', 'Services'];

interface SearchPost {
  id: string;
  authorId: string;
  content: string;
  topic: string;
  createdAt: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorInitial: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface SearchCommunity {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  privacy: string;
  icon: string;
  accent: string;
  memberCount: number;
  isMember: boolean;
}

interface SearchService {
  id: string;
  ownerId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  price: string;
  priceAr: string;
  ownerName: string;
  ownerInitial: string;
}

interface SearchUser {
  userId: string;
  name: string;
  role: string;
  company: string;
  bio: string;
  industry: string;
  initial: string;
}

interface SearchData {
  posts: SearchPost[];
  communities: SearchCommunity[];
  services: SearchService[];
  users: SearchUser[];
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = language === 'ar' ? SEARCH_TABS_AR : SEARCH_TABS_EN;
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!hasQuery) {
      setSearchData(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        console.log('[Explore] searching for:', query.trim());
        const results = await trpcClient.search.query.query({
          q: query.trim(),
          limit: 15,
        });
        console.log('[Explore] search results:', {
          posts: results.posts.length,
          communities: results.communities.length,
          services: results.services.length,
          users: results.users.length,
        });
        setSearchData(results);
      } catch (err) {
        console.log('[Explore] search error:', err);
        setSearchData({ posts: [], communities: [], services: [], users: [] });
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, hasQuery]);

  const renderTrending = useCallback(() => (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TrendingUp color={colors.rose} size={18} />
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'المواضيع الرائجة' : 'Trending Topics'}
        </Text>
      </View>
      <View style={[styles.hashtagsWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {trendingTopics.map((topic) => {
          const label = getLocalizedText(topic.label, language);
          const slug = label.replace(/\s+/g, '');
          return (
            <Pressable
              key={topic.id}
              style={({ pressed }) => [
                styles.hashtagPill,
                topic.isHot
                  ? { backgroundColor: colors.rose + '18', borderColor: colors.rose + '40' }
                  : { backgroundColor: colors.bgCard, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <TrendingUp
                size={11}
                color={topic.isHot ? colors.rose : colors.textMuted}
                strokeWidth={2.5}
              />
              <Text style={[styles.hashtagText, { color: topic.isHot ? colors.rose : colors.textMuted }]}>
                #{slug}
              </Text>
              <Text style={[styles.hashtagCount, { color: topic.isHot ? colors.rose + 'CC' : colors.textMuted }]}>
                {topic.posts}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  ), [isRTL, language, colors, styles]);

  const renderExperts = useCallback(() => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 20 }]}>
        {language === 'ar' ? 'خبراء بارزون' : 'Top Experts'}
      </Text>
      <View style={styles.gridWrap}>
        {expertSuggestions.map((expert) => (
          <Pressable key={expert.id} style={({ pressed }) => [styles.expertCard, pressed && styles.pressed]}>
            <View style={[styles.expertAvatar, { backgroundColor: expert.avatarColor }]}>
              <Text style={styles.expertInitial}>{expert.nameInitial}</Text>
            </View>
            <Text style={styles.expertName} numberOfLines={1}>{expert.name}</Text>
            <Text style={styles.expertRole} numberOfLines={1}>{getLocalizedText(expert.role, language)}</Text>
            <View style={styles.expertRepRow}>
              <TrendingUp color={colors.accent} size={10} />
              <Text style={styles.expertRepText}>{expert.reputation}</Text>
            </View>
            <Pressable style={styles.followBtn} onPress={() => router.push(`/user/${expert.id}`)}>
              <Text style={styles.followText}>{language === 'ar' ? 'تابع' : 'Follow'}</Text>
            </Pressable>
          </Pressable>
        ))}
      </View>
    </View>
  ), [isRTL, language, colors, router, styles]);

  const renderDiscoverCommunities = useCallback(() => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 20 }]}>
        {language === 'ar' ? 'مجتمعات نشطة' : 'Active Communities'}
      </Text>
      {communities.slice(0, 4).map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/community/${c.id}`)}
          style={({ pressed }) => [styles.communityRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}
        >
          <View style={[styles.communityIcon, { backgroundColor: c.accent + '18' }]}>
            <Text style={styles.communityEmoji}>{c.icon}</Text>
          </View>
          <View style={[styles.communityInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.communityName} numberOfLines={1}>{getLocalizedText(c.name, language)}</Text>
            <View style={[styles.communityMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Users color={colors.textMuted} size={12} />
              <Text style={styles.communityMembers}>{c.members}</Text>
            </View>
          </View>
          <Pressable style={[styles.joinSmallBtn, { backgroundColor: c.accent }]} onPress={() => router.push(`/community/${c.id}`)}>
            <Text style={styles.joinSmallText}>{language === 'ar' ? 'انضم' : 'Join'}</Text>
          </Pressable>
        </Pressable>
      ))}
    </View>
  ), [isRTL, language, router, colors, styles]);

  const renderDiscoverServices = useCallback(() => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 20 }]}>
        {language === 'ar' ? 'خدمات مقترحة' : 'Recommended Services'}
      </Text>
      <View style={styles.gridWrap}>
        {services.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/service/${s.id}`)}
            style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
          >
            <View style={[styles.serviceAvatar, { backgroundColor: s.avatarColor }]}>
              <Text style={styles.serviceInitial}>{s.providerInitial}</Text>
            </View>
            <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {getLocalizedText(s.title, language)}
            </Text>
            <Text style={styles.servicePrice}>{getLocalizedText(s.price, language)}</Text>
            <View style={styles.serviceRating}>
              <Text style={styles.serviceRatingText}>⭐ {s.rating}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  ), [isRTL, language, router, styles]);

  const renderPopularPosts = useCallback(() => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 20 }]}>
        {language === 'ar' ? 'منشورات شائعة' : 'Popular Posts'}
      </Text>
      {feedPosts.slice(0, 3).map((post) => (
        <Pressable
          key={post.id}
          onPress={() => router.push(`/post/${post.id}`)}
          style={({ pressed }) => [styles.postCard, pressed && styles.pressed]}
        >
          <View style={[styles.postTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.postAvatar, { backgroundColor: post.avatarColor }]}>
              <Text style={styles.postAvatarText}>{post.authorInitial}</Text>
            </View>
            <View style={[styles.postInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postRole}>{getLocalizedText(post.role, language)}</Text>
            </View>
          </View>
          <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {getLocalizedText(post.content, language)}
          </Text>
          <View style={[styles.postActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.postAction}>
              <Heart color={colors.textMuted} size={14} />
              <Text style={styles.postActionText}>{post.stats.likes}</Text>
            </View>
            <View style={styles.postAction}>
              <MessageCircle color={colors.textMuted} size={14} />
              <Text style={styles.postActionText}>{post.stats.comments}</Text>
            </View>
            <View style={styles.postAction}>
              <Bookmark color={colors.textMuted} size={14} />
              <Text style={styles.postActionText}>{post.stats.saves}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  ), [isRTL, language, router, colors, styles]);

  const renderPostResults = useCallback((postsList: SearchPost[]) => {
    if (postsList.length === 0) return null;
    return (
      <View style={styles.resultSection}>
        <View style={[styles.resultSectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MessageCircle color={colors.accent} size={16} />
          <Text style={[styles.resultSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'منشورات' : 'Posts'}
          </Text>
          <Text style={styles.resultCount}>{postsList.length}</Text>
        </View>
        {postsList.map((post) => (
          <Pressable
            key={post.id}
            onPress={() => router.push(`/post/${post.id}`)}
            style={({ pressed }) => [styles.postCard, pressed && styles.pressed]}
          >
            <View style={[styles.postTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.postAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.postAvatarText}>{post.authorInitial}</Text>
              </View>
              <View style={[styles.postInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.postAuthor}>{post.authorName}</Text>
                <Text style={styles.postRole}>{post.authorRole}</Text>
              </View>
            </View>
            <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {post.content}
            </Text>
            <View style={[styles.postActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.postAction}>
                <Heart color={post.isLiked ? colors.rose : colors.textMuted} size={14} />
                <Text style={styles.postActionText}>{post.likesCount}</Text>
              </View>
              <View style={styles.postAction}>
                <MessageCircle color={colors.textMuted} size={14} />
                <Text style={styles.postActionText}>{post.commentsCount}</Text>
              </View>
              <View style={styles.postAction}>
                <Bookmark color={post.isSaved ? colors.accent : colors.textMuted} size={14} />
                <Text style={styles.postActionText}>{post.savesCount}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }, [isRTL, language, router, colors, styles]);

  const renderUserResults = useCallback((usersList: SearchUser[]) => {
    if (usersList.length === 0) return null;
    return (
      <View style={styles.resultSection}>
        <View style={[styles.resultSectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <User color={colors.accent} size={16} />
          <Text style={[styles.resultSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'مستخدمون' : 'Users'}
          </Text>
          <Text style={styles.resultCount}>{usersList.length}</Text>
        </View>
        {usersList.map((u) => (
          <Pressable
            key={u.userId}
            style={({ pressed }) => [styles.userRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}
          >
            <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.userAvatarText}>{u.initial}</Text>
            </View>
            <View style={[styles.userInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.userName}>{u.name}</Text>
              {u.role ? (
                <Text style={styles.userRole} numberOfLines={1}>{u.role}{u.company ? ` · ${u.company}` : ''}</Text>
              ) : u.company ? (
                <Text style={styles.userRole} numberOfLines={1}>{u.company}</Text>
              ) : null}
              {u.industry ? (
                <View style={[styles.userIndustryTag, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Briefcase color={colors.textMuted} size={10} />
                  <Text style={styles.userIndustryText}>{u.industry}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    );
  }, [isRTL, language, colors, styles]);

  const renderCommunityResults = useCallback((communitiesList: SearchCommunity[]) => {
    if (communitiesList.length === 0) return null;
    return (
      <View style={styles.resultSection}>
        <View style={[styles.resultSectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Users color={colors.accent} size={16} />
          <Text style={[styles.resultSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'مجتمعات' : 'Communities'}
          </Text>
          <Text style={styles.resultCount}>{communitiesList.length}</Text>
        </View>
        {communitiesList.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/community/${c.id}`)}
            style={({ pressed }) => [styles.communityRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}
          >
            <View style={[styles.communityIcon, { backgroundColor: c.accent + '18' }]}>
              <Text style={styles.communityEmoji}>{c.icon}</Text>
            </View>
            <View style={[styles.communityInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.communityName} numberOfLines={1}>
                {language === 'ar' ? c.nameAr : c.name}
              </Text>
              <View style={[styles.communityMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Users color={colors.textMuted} size={12} />
                <Text style={styles.communityMembers}>
                  {c.memberCount} {language === 'ar' ? 'عضو' : 'members'}
                </Text>
              </View>
            </View>
            {c.isMember ? (
              <View style={[styles.joinedBadge]}>
                <Text style={styles.joinedText}>{language === 'ar' ? 'عضو' : 'Joined'}</Text>
              </View>
            ) : (
              <Pressable style={[styles.joinSmallBtn, { backgroundColor: c.accent }]}>
                <Text style={styles.joinSmallText}>{language === 'ar' ? 'انضم' : 'Join'}</Text>
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>
    );
  }, [isRTL, language, router, colors, styles]);

  const renderServiceResults = useCallback((servicesList: SearchService[]) => {
    if (servicesList.length === 0) return null;
    return (
      <View style={styles.resultSection}>
        <View style={[styles.resultSectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ShoppingBag color={colors.accent} size={16} />
          <Text style={[styles.resultSectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'خدمات' : 'Services'}
          </Text>
          <Text style={styles.resultCount}>{servicesList.length}</Text>
        </View>
        {servicesList.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/service/${s.id}`)}
            style={({ pressed }) => [styles.serviceRow, pressed && styles.pressed]}
          >
            <View style={[styles.serviceRowTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.serviceAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.serviceInitial}>{s.ownerInitial}</Text>
              </View>
              <View style={[styles.serviceRowInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.serviceRowTitle} numberOfLines={1}>
                  {language === 'ar' ? s.titleAr : s.title}
                </Text>
                <Text style={styles.serviceRowOwner}>{s.ownerName}</Text>
              </View>
            </View>
            <View style={[styles.serviceRowBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.serviceCategoryTag}>
                <Text style={styles.serviceCategoryText}>
                  {language === 'ar' ? s.categoryAr : s.category}
                </Text>
              </View>
              <Text style={styles.serviceRowPrice}>
                {language === 'ar' ? s.priceAr : s.price}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }, [isRTL, language, router, colors, styles]);

  const renderSearchResults = useCallback(() => {
    if (isSearching) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>
            {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
          </Text>
        </View>
      );
    }

    if (!searchData) return null;

    const totalResults =
      searchData.posts.length +
      searchData.communities.length +
      searchData.services.length +
      searchData.users.length;

    if (totalResults === 0) {
      return (
        <View style={styles.emptyState}>
          <Search color={colors.textMuted} size={40} />
          <Text style={styles.emptyTitle}>
            {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
          </Text>
          <Text style={styles.emptyDesc}>
            {language === 'ar' ? 'جرّب كلمات بحث مختلفة' : 'Try different search terms'}
          </Text>
        </View>
      );
    }

    const showPosts = activeTab === 0 || activeTab === 1;
    const showUsers = activeTab === 0 || activeTab === 2;
    const showCommunities = activeTab === 0 || activeTab === 3;
    const showServices = activeTab === 0 || activeTab === 4;

    return (
      <View>
        {showPosts && renderPostResults(searchData.posts)}
        {showUsers && renderUserResults(searchData.users)}
        {showCommunities && renderCommunityResults(searchData.communities)}
        {showServices && renderServiceResults(searchData.services)}
      </View>
    );
  }, [searchData, isSearching, activeTab, language, colors, styles, renderPostResults, renderUserResults, renderCommunityResults, renderServiceResults]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.searchHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="explore-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <View style={[styles.searchInputWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Search color={colors.textMuted} size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={language === 'ar' ? 'ابحث عن منشورات، خبراء، مجتمعات...' : 'Search posts, experts, communities...'}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              autoFocus
              testID="explore-search-input"
            />
            {hasQuery ? (
              <Pressable onPress={() => setQuery('')}>
                <X color={colors.textMuted} size={16} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {hasQuery ? (
          <View style={{ flex: 1 }}>
            <FlatList
              horizontal
              inverted={isRTL}
              data={tabs}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.tabsRow}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => setActiveTab(index)}
                  style={[styles.tabPill, activeTab === index && styles.tabPillActive]}
                >
                  <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{item}</Text>
                </Pressable>
              )}
            />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {renderSearchResults()}
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} testID="explore-scroll">
            {renderTrending()}
            {renderExperts()}
            {renderDiscoverCommunities()}
            {renderDiscoverServices()}
            {renderPopularPosts()}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

const createStyles = (c: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.bg,
  },
  safe: {
    flex: 1,
  },
  searchHeader: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.bgMuted,
    borderWidth: 1,
    borderColor: c.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrap: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.bgCard,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
    paddingVertical: 0,
  },
  tabsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  tabPill: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: c.textMuted,
  },
  tabTextActive: {
    color: c.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingTop: 20,
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: c.text,
  },
  pressed: {
    opacity: 0.7,
  },
  hashtagsWrap: {
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  hashtagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  hashtagText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  hashtagCount: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  gridWrap: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  expertCard: {
    width: '48%',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInitial: {
    color: c.white,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  expertName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.text,
    textAlign: 'center',
  },
  expertRole: {
    fontSize: 11,
    color: c.textMuted,
    textAlign: 'center',
  },
  expertRepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  expertRepText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: c.accent,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: c.accent,
  },
  followText: {
    color: c.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  communityRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  communityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityEmoji: {
    fontSize: 20,
  },
  communityInfo: {
    flex: 1,
    gap: 4,
  },
  communityName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.text,
  },
  communityMeta: {
    alignItems: 'center',
    gap: 4,
  },
  communityMembers: {
    fontSize: 12,
    color: c.textMuted,
  },
  joinSmallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
  },
  joinSmallText: {
    color: c.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  joinedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: c.bgMuted,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: c.textMuted,
  },
  serviceCard: {
    width: '48%',
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 8,
  },
  serviceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInitial: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.text,
    lineHeight: 20,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: c.accent,
  },
  serviceRating: {
    alignSelf: 'center',
  },
  serviceRatingText: {
    fontSize: 11,
    color: c.textMuted,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 10,
    ...theme.shadow.sm,
  },
  postTop: {
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  postInfo: {
    flex: 1,
    gap: 2,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
  },
  postRole: {
    fontSize: 12,
    color: c.textMuted,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 22,
    color: c.textSecondary,
  },
  postActions: {
    gap: 16,
    paddingTop: 4,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '600' as const,
  },
  resultSection: {
    paddingTop: 16,
    gap: 4,
  },
  resultSectionHeader: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  resultSectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textMuted,
    backgroundColor: c.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  userRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.text,
  },
  userRole: {
    fontSize: 13,
    color: c.textSecondary,
  },
  userIndustryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  userIndustryText: {
    fontSize: 11,
    color: c.textMuted,
  },
  serviceRow: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 10,
  },
  serviceRowTop: {
    alignItems: 'center',
    gap: 10,
  },
  serviceRowInfo: {
    flex: 1,
    gap: 2,
  },
  serviceRowTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
  },
  serviceRowOwner: {
    fontSize: 12,
    color: c.textMuted,
  },
  serviceRowBottom: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceCategoryTag: {
    backgroundColor: c.bgMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceCategoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  serviceRowPrice: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: c.accent,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: c.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  emptyDesc: {
    ...theme.typography.caption,
    color: c.textMuted,
  },
});

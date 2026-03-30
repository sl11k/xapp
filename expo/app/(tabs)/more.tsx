import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Bookmark,
  ClipboardList,
  Heart,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react-native';

import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import type { EnrichedPost } from '@/types/post';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

interface UserStats {
  postsCount: number;
  commentsCount: number;
  receivedLikes: number;
  servicesCount: number;
  completedServices: number;
  communitiesJoined: number;
  postsThisMonth: number;
  reputationLevel: number;
  reputationProgress: number;
}

const REPUTATION_LEVELS = [
  { emoji: '🌱', labelAr: 'مساهم', labelEn: 'Contributor' },
  { emoji: '⭐', labelAr: 'متخصص', labelEn: 'Specialist' },
  { emoji: '🏆', labelAr: 'خبير', labelEn: 'Expert' },
  { emoji: '👑', labelAr: 'قائد', labelEn: 'Leader' },
];

const PROFILE_TABS_AR = ['المنشورات', 'الإعجابات', 'المجتمعات'];
const PROFILE_TABS_EN = ['Posts', 'Likes', 'Communities'];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ProfileHeader({ stats, onStatPress }: { stats: UserStats | null; onStatPress: (tab: number) => void }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile, isAuthenticated } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 100 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const displayName = profile?.name || (language === 'ar' ? 'زائر' : 'Guest');
  const displayRole = profile?.role || (language === 'ar' ? 'مستخدم جديد' : 'New member');
  const nameInitial = displayName.charAt(0).toUpperCase();

  const repLevel = stats?.reputationLevel ?? 0;
  const repLabel = language === 'ar' ? REPUTATION_LEVELS[repLevel].labelAr : REPUTATION_LEVELS[repLevel].labelEn;

  return (
    <Animated.View style={[styles.profileSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* ── LinkedIn-style cover banner ── */}
      <LinearGradient
        colors={isDark
          ? ['#1e1b4b', '#312e81', '#1e1b4b']
          : ['#6366F1', '#818CF8', '#A5B4FC']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.coverBanner}
      >
        <View style={styles.coverPattern}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.coverDot, { opacity: 0.12 + i * 0.04, left: i * 52 + 10, top: i % 2 === 0 ? 10 : 28 }]} />
          ))}
        </View>
        <View style={[styles.coverActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <LanguageToggle />
        </View>
      </LinearGradient>

      {/* ── Avatar overlapping banner (LinkedIn style) ── */}
      <View style={[styles.profileTopBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#00C9A7', '#00E5C3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradientRing}
          >
            <View style={[styles.avatarInner, { backgroundColor: isDark ? colors.bg : colors.bgCard }]}>
              <LinearGradient
                colors={['#00C9A7', '#00E5C3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarLarge}
              >
                {isAuthenticated ? (
                  <Text style={styles.avatarLargeText}>{nameInitial}</Text>
                ) : (
                  <UserRound color="#FFF" size={30} strokeWidth={1.8} />
                )}
              </LinearGradient>
            </View>
          </LinearGradient>
          {isAuthenticated && (
            <View style={[styles.onlineIndicator, { backgroundColor: '#00C9A7', borderColor: isDark ? colors.bg : colors.bgCard }]} />
          )}
        </View>
        <View style={[styles.profileInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileRole, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
            {displayRole}
          </Text>
          {isAuthenticated ? (
            <View style={[styles.repBadge, { backgroundColor: colors.orangeLight }]}>
              <Text style={styles.repEmoji}>{REPUTATION_LEVELS[repLevel].emoji}</Text>
              <Text style={[styles.repText, { color: colors.orange }]}>{repLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[
        styles.themeToggleRow,
        { backgroundColor: isDark ? colors.bgCard : colors.white },
      ]}>
        <View style={[styles.themeToggleInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <LinearGradient
            colors={isDark ? ['#818CF8', '#A5B4FC'] : ['#FFB547', '#FFD080']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.themeIconWrap}
          >
            {isDark ? (
              <Moon color="#FFF" size={16} strokeWidth={1.8} />
            ) : (
              <Sun color="#FFF" size={16} strokeWidth={1.8} />
            )}
          </LinearGradient>
          <Text style={[styles.themeToggleLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
            {language === 'ar' ? (isDark ? 'الوضع الداكن' : 'الوضع الفاتح') : (isDark ? 'Dark Mode' : 'Light Mode')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            trackColor={{ false: colors.bgMuted, true: 'rgba(0,201,167,0.3)' }}
            thumbColor={isDark ? '#00C9A7' : colors.textMuted}
          />
        </View>
      </View>

      <View style={[
        styles.statsCard,
        { backgroundColor: isDark ? colors.bgCard : colors.white },
      ]}>
        <Pressable onPress={() => onStatPress(0)} style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{stats?.postsCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'منشورات' : 'Posts'}</Text>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: isDark ? colors.border : colors.separator }]} />
        <Pressable onPress={() => onStatPress(1)} style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.statValue, { color: colors.rose }]}>{stats?.receivedLikes ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'إعجابات' : 'Likes'}</Text>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: isDark ? colors.border : colors.separator }]} />
        <Pressable onPress={() => onStatPress(2)} style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.statValue, { color: '#818CF8' }]}>{stats?.communitiesJoined ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{language === 'ar' ? 'مجتمعات' : 'Groups'}</Text>
        </Pressable>
      </View>

      {isAuthenticated ? (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/edit-profile');
          }}
          style={({ pressed }) => [
            styles.editBtn,
            { backgroundColor: isDark ? colors.bgCard : colors.white },
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
          testID="edit-profile-btn"
        >
          <Text style={[styles.editBtnText, { color: colors.accent }]}>
            {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/login');
          }}
          style={({ pressed }) => [
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          testID="profile-login-btn"
        >
          <LinearGradient
            colors={['#00C9A7', '#00E5C3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signInBtn}
          >
            <Text style={styles.signInBtnText}>
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </LinearGradient>
        </Pressable>
      )}
    </Animated.View>
  );
}

function ProfileTabs({ activeTab, onSelect }: { activeTab: number; onSelect: (i: number) => void }) {
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();
  const tabs = language === 'ar' ? PROFILE_TABS_AR : PROFILE_TABS_EN;

  return (
    <View style={[styles.tabsContainer, { borderBottomColor: isDark ? colors.border : colors.separator }]}>
      {tabs.map((item, index) => (
        <Pressable
          key={item}
          onPress={() => {
            onSelect(index);
            void Haptics.selectionAsync();
          }}
          style={({ pressed }) => [styles.profileTabItem, activeTab === index && { borderBottomColor: colors.accent }, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === index && { color: colors.accent, fontWeight: '700' as const }]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MyPostsList({ userId }: { userId: string }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await trpcClient.users.userPosts.query({ userId });
        setPosts(data);
      } catch (err) {
        console.log('[Profile] my posts error', err);
      } finally {
        setLoading(false);
      }
    })().catch(() => {});
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />;
  if (posts.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <View style={[styles.emptyTabIcon, { backgroundColor: colors.accentLight }]}>
          <MessageCircle color={colors.accent} size={22} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>{language === 'ar' ? 'لا توجد منشورات' : 'No posts yet'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabListContent}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => router.push(`/post/${post.id}`)}
          style={({ pressed }) => [
            styles.postCard,
            { backgroundColor: isDark ? colors.bgCard : colors.white },
            pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={3}>
            {post.content}
          </Text>
          {post.topic ? (
            <View style={[styles.topicBadge, { alignSelf: isRTL ? 'flex-end' : 'flex-start', backgroundColor: colors.accentLight }]}>
              <Text style={[styles.topicText, { color: colors.accent }]}>{post.topic}</Text>
            </View>
          ) : null}
          <View style={[styles.postMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Heart color={colors.textTertiary} size={12} strokeWidth={2} />
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>{post.likesCount}</Text>
            </View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <MessageCircle color={colors.textTertiary} size={12} strokeWidth={2} />
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>{post.commentsCount}</Text>
            </View>
            <Text style={[styles.postMetaTime, { color: colors.textTertiary }]}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function MyLikesList({ userId }: { userId: string }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await trpcClient.users.userLikedPosts.query({ userId });
        setPosts(data);
      } catch (err) {
        console.log('[Profile] liked posts error', err);
      } finally {
        setLoading(false);
      }
    })().catch(() => {});
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />;
  if (posts.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <View style={[styles.emptyTabIcon, { backgroundColor: colors.roseLight }]}>
          <Heart color={colors.rose} size={22} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>{language === 'ar' ? 'لا توجد إعجابات' : 'No liked posts yet'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabListContent}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => router.push(`/post/${post.id}`)}
          style={({ pressed }) => [
            styles.postCard,
            { backgroundColor: isDark ? colors.bgCard : colors.white },
            pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={[styles.postAuthorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.postAuthorName, { color: colors.text }]}>{post.authorName}</Text>
            <Text style={[styles.postMetaTime, { color: colors.textTertiary }]}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
          <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={3}>
            {post.content}
          </Text>
          <View style={[styles.postMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Heart color={colors.rose} fill={colors.rose} size={12} />
              <Text style={[styles.postMetaText, { color: colors.rose }]}>{post.likesCount}</Text>
            </View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <MessageCircle color={colors.textTertiary} size={12} strokeWidth={2} />
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>{post.commentsCount}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

interface CommunityBrief {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  accent: string;
  memberCount: number;
  privacy: string;
}

function MyCommunitiesList({ userId }: { userId: string }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [communities, setCommunities] = useState<CommunityBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await trpcClient.users.userCommunities.query({ userId });
        setCommunities(data);
      } catch (err) {
        console.log('[Profile] communities error', err);
      } finally {
        setLoading(false);
      }
    })().catch(() => {});
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />;
  if (communities.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <View style={[styles.emptyTabIcon, { backgroundColor: colors.accentLight }]}>
          <Users color={colors.accent} size={22} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>{language === 'ar' ? 'لم تنضم لأي مجتمع' : 'No communities joined'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.communityListContent}>
      {communities.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/community/${c.id}`)}
          style={({ pressed }) => [
            styles.communityRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
            pressed && { opacity: 0.7, backgroundColor: isDark ? colors.bgElevated : colors.bgMuted },
          ]}
        >
          <View style={[styles.communityIcon, { backgroundColor: c.accent + '20' }]}>
            <Text style={styles.communityEmoji}>{c.icon}</Text>
          </View>
          <View style={[styles.communityInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.communityName, { color: colors.text }]}>{language === 'ar' ? c.nameAr : c.name}</Text>
            <Text style={[styles.communityMembers, { color: colors.textSecondary }]}>{c.memberCount} {language === 'ar' ? 'عضو' : 'members'}</Text>
          </View>
          <ChevronRight color={colors.textTertiary} size={16} strokeWidth={1.8} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
        </Pressable>
      ))}
    </View>
  );
}

function ReputationCard({ stats }: { stats: UserStats | null }) {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = (stats?.reputationProgress ?? 0) / 100;
  const currentLevel = stats?.reputationLevel ?? 0;
  const nextLevelIdx = Math.min(currentLevel + 1, 3);
  const nextLabel = language === 'ar' ? REPUTATION_LEVELS[nextLevelIdx].labelAr : REPUTATION_LEVELS[nextLevelIdx].labelEn;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 1200, delay: 400, useNativeDriver: false }).start();
  }, [progressAnim, progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[
      styles.repCard,
      { backgroundColor: isDark ? colors.bgCard : colors.white },
    ]}>
      <View style={[styles.repCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <LinearGradient
          colors={['#FFB547', '#FFD080']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.repCardIconWrap}
        >
          <TrendingUp color="#FFF" size={15} strokeWidth={2.2} />
        </LinearGradient>
        <Text style={[styles.repCardTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {language === 'ar' ? 'نظام السمعة' : 'Reputation'}
        </Text>
      </View>
      <View style={styles.repProgressRow}>
        <Text style={[styles.repProgressLabel, { color: colors.textSecondary }]}>
          {language === 'ar' ? `التالي: ${nextLabel}` : `Next: ${nextLabel}`}
        </Text>
        <Text style={[styles.repProgressPct, { color: colors.accent }]}>{stats?.reputationProgress ?? 0}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth as any }]}>
          <LinearGradient
            colors={['#00C9A7', '#00E5C3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        </Animated.View>
      </View>
      <View style={[styles.repLevels, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {REPUTATION_LEVELS.map((level, i) => {
          const isActive = i <= currentLevel;
          return (
            <View key={i} style={styles.repLevelItem}>
              <View style={[
                styles.repLevel,
                { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted },
                isActive && { opacity: 1, backgroundColor: colors.accentLight },
              ]}>
                <Text style={styles.repLevelEmoji}>{level.emoji}</Text>
              </View>
              <Text style={[styles.repLevelLabel, { color: colors.textTertiary }, isActive && { color: colors.accent, fontWeight: '700' as const }]}>
                {language === 'ar' ? level.labelAr : level.labelEn}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function QuickLinks() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  const links = [
    { icon: Shield, label: language === 'ar' ? 'الحوكمة والامتثال' : 'Governance', gradColors: ['#FFB547', '#FFD080'] as [string, string], route: '/governance' as const },
    { icon: BookOpen, label: language === 'ar' ? 'مركز المعرفة' : 'Knowledge Hub', gradColors: ['#22D3EE', '#67E8F9'] as [string, string], route: '/knowledge' as const },
    { icon: Calendar, label: language === 'ar' ? 'الفعاليات' : 'Events', gradColors: ['#00C9A7', '#00E5C3'] as [string, string], route: '/events' as const },
    { icon: Bookmark, label: language === 'ar' ? 'المحفوظات' : 'Saved', gradColors: ['#818CF8', '#A5B4FC'] as [string, string], route: '/saved' as const },
    { icon: ClipboardList, label: language === 'ar' ? 'طلبات الخدمات' : 'Requests', gradColors: ['#FB7185', '#FDA4AF'] as [string, string], route: '/my-requests' as const },
  ];

  return (
    <View style={[
      styles.linksCard,
      { backgroundColor: isDark ? colors.bgCard : colors.white },
    ]}>
      <Text style={[styles.linksTitle, { color: colors.textTertiary }]}>{language === 'ar' ? 'الوصول السريع' : 'QUICK ACCESS'}</Text>
      {links.map((link, index) => (
        <React.Fragment key={index}>
          <Pressable
            onPress={() => router.push(link.route)}
            style={({ pressed }) => [
              styles.linkItem,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              pressed && { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted, transform: [{ scale: 0.99 }] },
            ]}
            testID={`profile-link-${index}`}
          >
            <LinearGradient
              colors={link.gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linkIcon}
            >
              <link.icon color="#FFF" size={17} strokeWidth={1.8} />
            </LinearGradient>
            <Text style={[styles.linkLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>{link.label}</Text>
            <ChevronRight color={colors.textTertiary} size={15} strokeWidth={1.8} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </Pressable>
          {index < links.length - 1 ? <View style={[styles.linkDivider, { backgroundColor: isDark ? colors.border : colors.separator }]} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
}

function MenuLinks() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();

  const handleSignOut = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace('/welcome');
  }, [logout, router]);

  return (
    <View style={[
      styles.menuCard,
      { backgroundColor: isDark ? colors.bgCard : colors.white },
    ]}>
      {isAuthenticated ? (
        <>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.menuItem,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              pressed && { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted }]}>
              <Settings color={colors.textSecondary} size={18} strokeWidth={1.8} />
            </View>
            <Text style={[styles.menuLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </Text>
            <ChevronRight color={colors.textTertiary} size={15} strokeWidth={1.8} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: isDark ? colors.border : colors.separator }]} />
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.menuItem,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              pressed && { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.errorLight }]}>
              <LogOut color={colors.destructive} size={18} strokeWidth={1.8} />
            </View>
            <Text style={[styles.menuLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: colors.destructive }]}>
              {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

export default function MoreScreen() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) { setStats(null); return; }
    try {
      const data = await trpcClient.users.stats.query();
      setStats(data);
      console.log('[Profile] fetched stats', data);
    } catch (err) {
      console.log('[Profile] stats error', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const handleStatPress = useCallback((tab: number) => {
    if (!isAuthenticated) return;
    setActiveTab(tab);
    void Haptics.selectionAsync();
  }, [isAuthenticated]);

  const handleCloseTab = useCallback(() => {
    setActiveTab(null);
  }, []);

  const userId = user?.id ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LottiePullToRefreshWrapper
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            testID="profile-scroll"
          >
            <ProfileHeader stats={stats} onStatPress={handleStatPress} />

            {activeTab !== null && isAuthenticated ? (
              <View style={styles.tabSection}>
                <ProfileTabs activeTab={activeTab} onSelect={setActiveTab} />
                <Pressable onPress={handleCloseTab} style={({ pressed }) => [styles.closeTabBtn, pressed && { opacity: 0.6 }]}>
                  <Text style={[styles.closeTabText, { color: colors.accent }]}>{language === 'ar' ? 'إغلاق' : 'Close'}</Text>
                </Pressable>
                <View style={styles.tabContent}>
                  {activeTab === 0 ? <MyPostsList userId={userId} /> : null}
                  {activeTab === 1 ? <MyLikesList userId={userId} /> : null}
                  {activeTab === 2 ? <MyCommunitiesList userId={userId} /> : null}
                </View>
              </View>
            ) : (
              <>
                <ReputationCard stats={stats} />
                <QuickLinks />
                <MenuLinks />
              </>
            )}
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>Business Hub v1.0.0</Text>
          </ScrollView>
        </LottiePullToRefreshWrapper>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  profileSection: { paddingBottom: 16, gap: 0, overflow: 'hidden' },
  coverBanner: {
    height: 110,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  coverPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  coverDot: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  coverActions: {
    position: 'absolute',
    top: 12,
    right: 16,
    left: 16,
    justifyContent: 'flex-end',
  },
  profileTopBar: {
    paddingHorizontal: 20,
    paddingTop: 0,
    marginTop: -38,
    alignItems: 'flex-end',
    gap: 12,
  },
  avatarContainer: { position: 'relative' },
  avatarGradientRing: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { fontSize: 27, fontWeight: '800' as const, color: '#FFF' },
  onlineIndicator: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  profileInfo: { flex: 1, gap: 4, paddingTop: 42 },
  profileName: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5 },
  profileRole: { fontSize: 14, letterSpacing: -0.1 },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
  },
  repEmoji: { fontSize: 12 },
  repText: { fontSize: 12, fontWeight: '700' as const },
  themeToggleRow: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  themeToggleInner: { alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  themeIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  themeToggleLabel: { fontSize: 15, fontWeight: '500' as const, letterSpacing: -0.2 },
  statsCard: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 22, gap: 4 },
  statDivider: { width: 1, marginVertical: 16 },
  statValue: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  statLabel: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.1 },
  editBtn: { alignItems: 'center', marginHorizontal: 20, paddingVertical: 14, borderRadius: 20 },
  editBtnText: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.2 },
  signInBtn: { alignItems: 'center', marginHorizontal: 20, paddingVertical: 16, borderRadius: 20 },
  signInBtnText: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2, color: '#FFF' },
  tabSection: { marginTop: 4 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  profileTabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' as const, letterSpacing: -0.1 },
  closeTabBtn: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  closeTabText: { fontSize: 14, fontWeight: '600' as const },
  tabContent: { minHeight: 100, paddingBottom: 16 },
  tabListContent: { paddingHorizontal: 20, gap: 10, paddingTop: 4 },
  emptyTab: { alignItems: 'center', paddingVertical: 44, gap: 10 },
  emptyTabIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTabText: { fontSize: 14, fontWeight: '500' as const },
  postCard: { padding: 16, borderRadius: 18, gap: 8 },
  postContent: { fontSize: 14, lineHeight: 22, letterSpacing: -0.2 },
  topicBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  topicText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.1 },
  postMeta: { gap: 14, alignItems: 'center', paddingTop: 4 },
  postMetaText: { fontSize: 12, fontWeight: '600' as const },
  postMetaTime: { fontSize: 12, fontWeight: '500' as const },
  postAuthorRow: { alignItems: 'center', justifyContent: 'space-between' },
  postAuthorName: { fontSize: 14, fontWeight: '700' as const },
  communityListContent: { paddingTop: 4 },
  communityRow: { alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  communityIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  communityEmoji: { fontSize: 22 },
  communityInfo: { flex: 1, gap: 3 },
  communityName: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.2 },
  communityMembers: { fontSize: 12, fontWeight: '500' as const },
  repCard: { marginHorizontal: 20, marginTop: 4, padding: 20, borderRadius: 22, gap: 14 },
  repCardHeader: { alignItems: 'center', gap: 10 },
  repCardIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  repCardTitle: { flex: 1, fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  repProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repProgressLabel: { fontSize: 13, fontWeight: '500' as const },
  repProgressPct: { fontSize: 13, fontWeight: '700' as const },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  progressGradient: { flex: 1 },
  repLevels: { justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 6 },
  repLevelItem: { alignItems: 'center', gap: 5 },
  repLevel: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', opacity: 0.35 },
  repLevelEmoji: { fontSize: 18 },
  repLevelLabel: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.1 },
  linksCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 22, overflow: 'hidden' },
  linksTitle: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  linkItem: { alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  linkDivider: { height: 1, marginLeft: 66 },
  linkIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 15, fontWeight: '500' as const, letterSpacing: -0.2 },
  menuCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 22, overflow: 'hidden' },
  menuItem: { alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuDivider: { height: 1, marginLeft: 66 },
  menuLabel: { fontSize: 15, fontWeight: '500' as const, letterSpacing: -0.2 },
  versionText: { fontSize: 12, fontWeight: '500' as const, textAlign: 'center' as const, marginTop: 28 },
});

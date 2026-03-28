import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Star,
  Trophy,
  UserPlus,
  UserMinus,
  Settings,
  Share2,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { GlassView } from '@/components/GlassView';
import { PremiumCard } from '@/components/PremiumCard';
import { HeroHeader } from '@/components/HeroHeader';
import { PressableScale } from '@/components/PressableScale';
import type { EnrichedPost } from '@/types/post';

const { width } = Dimensions.get('window');

const REPUTATION_LEVELS = [
  { emoji: '🌱', labelAr: 'مساهم', labelEn: 'Contributor', color: '#10B981' },
  { emoji: '⭐', labelAr: 'متخصص', labelEn: 'Specialist', color: '#6366F1' },
  { emoji: '🏆', labelAr: 'خبير', labelEn: 'Expert', color: '#F59E0B' },
  { emoji: '👑', labelAr: 'قائد', labelEn: 'Leader', color: '#EC4899' },
];

function getAvatarColor(str: string): string {
  const colors = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

const TABS_AR = ['المنشورات', 'الخدمات'];
const TABS_EN = ['Posts', 'Services'];

export default function UserProfileScreen() {
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated, profile: myProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = language === 'ar' ? TABS_AR : TABS_EN;

  const profileQuery = useQuery({
    queryKey: ['users', 'profile', id],
    queryFn: () => trpcClient.users.profile.query({ userId: id ?? '' }),
    enabled: !!id,
  });

  const postsQuery = useQuery({
    queryKey: ['users', 'userPosts', id],
    queryFn: () => trpcClient.users.userPosts.query({ userId: id ?? '' }),
    enabled: !!id && activeTab === 0,
  });

  const servicesQuery = useQuery({
    queryKey: ['users', 'userServices', id],
    queryFn: () => trpcClient.users.userServices.query({ userId: id ?? '' }),
    enabled: !!id && activeTab === 1,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profileQuery.data?.isFollowing) {
        return trpcClient.users.unfollow.mutate({ targetUserId: id ?? '' });
      }
      return trpcClient.users.follow.mutate({ targetUserId: id ?? '' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'profile', id] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleMessage = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      const result = await trpcClient.messages.getOrCreate.mutate({ otherUserId: id ?? '' });
      router.push(`/chat/${result.conversationId}`);
    } catch (err) {
      console.log('[UserProfile] message error', err);
    }
  }, [isAuthenticated, id, router]);

  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!profile) return null;

  const avatarColor = getAvatarColor(profile.userId);
  const repLevel = profile.reputationLevel ?? 0;
  const isOwnProfile = profile.isOwnProfile;

  const renderHeader = () => (
    <View>
      <HeroHeader 
        title={profile.name} 
        subtitle={profile.role || (language === 'ar' ? 'عضو في مجتمع رورك' : 'Rork Community Member')}
        height={320}
      >
        <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PressableScale onPress={() => router.back()} style={styles.navBtn}>
            <GlassView intensity={30} borderRadius={20} style={styles.navBtnGlass}>
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </GlassView>
          </PressableScale>
          <View style={{ flex: 1 }} />
          {isOwnProfile && (
            <PressableScale onPress={() => router.push('/settings')} style={styles.navBtn}>
              <GlassView intensity={30} borderRadius={20} style={styles.navBtnGlass}>
                <Settings color={colors.text} size={20} />
              </GlassView>
            </PressableScale>
          )}
          <PressableScale style={styles.navBtn}>
            <GlassView intensity={30} borderRadius={20} style={styles.navBtnGlass}>
              <Share2 color={colors.text} size={20} />
            </GlassView>
          </PressableScale>
        </View>

        <View style={[styles.profileTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.avatarContainer, { borderColor: avatarColor }]}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{(profile.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          </View>
          
          <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.stats?.postsCount ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'منشور' : 'Posts'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.followersCount ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'متابع' : 'Followers'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.reputationPoints ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'نقاط' : 'Points'}</Text>
            </View>
          </View>
        </View>
      </HeroHeader>

      <View style={styles.infoSection}>
        <View style={[styles.badgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <GlassView intensity={20} borderRadius={12} style={styles.repBadge}>
            <Trophy color={REPUTATION_LEVELS[repLevel].color} size={14} />
            <Text style={[styles.repText, { color: REPUTATION_LEVELS[repLevel].color }]}>
              {REPUTATION_LEVELS[repLevel].emoji} {language === 'ar' ? REPUTATION_LEVELS[repLevel].labelAr : REPUTATION_LEVELS[repLevel].labelEn}
            </Text>
          </GlassView>
          {profile.industry && (
            <GlassView intensity={10} borderRadius={12} style={styles.industryBadge}>
              <Text style={[styles.industryText, { color: colors.accent }]}>{profile.industry}</Text>
            </GlassView>
          )}
        </View>

        {profile.bio && (
          <Text style={[styles.bio, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
            {profile.bio}
          </Text>
        )}

        <View style={[styles.detailsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {profile.location && (
            <View style={[styles.detailItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MapPin color={colors.textMuted} size={14} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{profile.location}</Text>
            </View>
          )}
          {profile.company && (
            <View style={[styles.detailItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Building2 color={colors.textMuted} size={14} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{profile.company}</Text>
            </View>
          )}
        </View>

        {!isOwnProfile && (
          <View style={[styles.profileActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <PressableScale 
              onPress={() => followMutation.mutate()} 
              style={styles.actionBtn}
              disabled={followMutation.isPending}
            >
              <LinearGradient
                colors={profile.isFollowing ? [colors.surface, colors.surfaceSecondary] : [colors.accent, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.actionGradient, profile.isFollowing && { borderWidth: 1, borderColor: colors.border }]}
              >
                {followMutation.isPending ? (
                  <ActivityIndicator size="small" color={profile.isFollowing ? colors.accent : "#FFF"} />
                ) : (
                  <>
                    {profile.isFollowing ? <UserMinus color={colors.text} size={18} /> : <UserPlus color="#FFF" size={18} />}
                    <Text style={[styles.actionBtnText, { color: profile.isFollowing ? colors.text : "#FFF" }]}>
                      {profile.isFollowing ? (language === 'ar' ? 'إلغاء المتابعة' : 'Unfollow') : (language === 'ar' ? 'متابعة' : 'Follow')}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </PressableScale>
            
            <PressableScale onPress={handleMessage} style={styles.actionBtn}>
              <GlassView intensity={20} borderRadius={16} style={styles.messageBtn}>
                <Send color={colors.accent} size={18} />
                <Text style={[styles.messageBtnText, { color: colors.accent }]}>
                  {language === 'ar' ? 'رسالة' : 'Message'}
                </Text>
              </GlassView>
            </PressableScale>
          </View>
        )}
      </View>

      <View style={[styles.tabContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {tabs.map((tab, index) => (
          <PressableScale
            key={tab}
            onPress={() => {
              setActiveTab(index);
              void Haptics.selectionAsync();
            }}
            style={[styles.tab, activeTab === index && { borderBottomColor: colors.accent }]}
          >
            <Text style={[styles.tabText, { color: activeTab === index ? colors.accent : colors.textMuted }]}>
              {tab}
            </Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LottiePullToRefreshWrapper
          isRefreshing={profileQuery.isRefetching}
          onRefresh={() => profileQuery.refetch()}
        >
          <FlatList
            data={activeTab === 0 ? (postsQuery.data ?? []) : (servicesQuery.data ?? [])}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              activeTab === 0 ? (
                <PremiumCard variant="surface" style={styles.contentCard} onPress={() => router.push(`/post/${item.id}`)}>
                  <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={3}>
                    {item.content}
                  </Text>
                  <View style={[styles.postFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.postStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Heart color={colors.textMuted} size={14} />
                      <Text style={{ color: colors.textMuted }}>{item.likesCount}</Text>
                    </View>
                    <View style={[styles.postStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MessageCircle color={colors.textMuted} size={14} />
                      <Text style={{ color: colors.textMuted }}>{item.commentsCount}</Text>
                    </View>
                  </View>
                </PremiumCard>
              ) : (
                <PremiumCard variant="surface" style={styles.contentCard} onPress={() => router.push(`/service/${item.id}`)}>
                  <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
                    {language === 'ar' ? item.titleAr : item.title}
                  </Text>
                  <Text style={[styles.servicePrice, { textAlign: isRTL ? 'right' : 'left', color: colors.accent }]}>
                    {language === 'ar' ? item.priceAr : item.price}
                  </Text>
                </PremiumCard>
              )
            )}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ color: colors.textMuted }}>{language === 'ar' ? 'لا توجد بيانات' : 'No data yet'}</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </LottiePullToRefreshWrapper>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },
  headerActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    gap: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
  },
  navBtnGlass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTop: {
    marginTop: 60,
    alignItems: 'center',
    gap: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 35,
    borderWidth: 3,
    padding: 4,
  },
  avatar: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  statsGrid: {
    flex: 1,
    justifyContent: 'space-around',
    gap: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  badgesRow: {
    gap: 8,
    marginBottom: 16,
  },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  repText: {
    fontSize: 13,
    fontWeight: '700',
  },
  industryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  industryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bio: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  detailItem: {
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileActions: {
    gap: 12,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
  },
  actionGradient: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  messageBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  contentCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postFooter: {
    gap: 16,
  },
  postStat: {
    alignItems: 'center',
    gap: 4,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
});

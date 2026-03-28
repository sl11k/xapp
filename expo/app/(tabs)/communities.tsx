import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';     
import { LinearGradient } from 'expo-linear-gradient';
import {
  Crown,
  Globe,
  Lock,
  Search,
  Sparkles,
  Users,
  Compass,
  ArrowUpRight,
} from 'lucide-react-native';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { CommunityCardSkeleton } from '@/components/SkeletonLoader';
import { GlassView } from '@/components/GlassView';
import { PremiumCard } from '@/components/PremiumCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/constants/theme';
import { trpcClient } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { internalPageStyles } from '@/styles/internalPageStyles';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

interface CommunityItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  privacy: 'public' | 'private' | 'premium';
  icon: string;
  accent: string;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  createdAt: string;
}

const FILTERS_AR = ['الكل', 'عام', 'خاص', 'مميز'];
const FILTERS_EN = ['All', 'Public', 'Private', 'Premium'];

function CustomHeader() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={internalPageStyles.headerWrap}>
      <Text style={[internalPageStyles.titleText, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar' ? 'المجتمعات' : 'Communities'}
      </Text>
      <View
        style={[
          internalPageStyles.searchBar,
          { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgCard, borderColor: colors.border },
        ]}
      >
        <Search color={colors.text} size={20} strokeWidth={2.5} />
        <Text style={[internalPageStyles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {language === 'ar' ? 'ابحث عن مجتمع...' : 'Search communities...'}
        </Text>
      </View>
    </View>
  );
}

function FilterTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const filters = language === 'ar' ? FILTERS_AR : FILTERS_EN;

  return (
    <View style={styles.filterWrapper}>
      <FlatList
        horizontal
        inverted={isRTL}
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={internalPageStyles.chipsRow}
        renderItem={({ item, index }) => (
          <PressableScale
            onPress={() => {
              onSelect(index);
              void Haptics.selectionAsync();
            }}
            style={[
              styles.filterPill,
              active === index && { backgroundColor: colors.accent, borderColor: colors.accent },
              active !== index && { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: active === index ? '#FFF' : colors.textMuted },
              active === index && { fontWeight: '700' },
            ]}>{item}</Text>
          </PressableScale>
        )}
      />
    </View>
  );
}

const CommunityCard = React.memo(function CommunityCard({
  item,
  onJoinToggle,
  isJoining,
}: {
  item: CommunityItem;
  onJoinToggle: (id: string, isMember: boolean) => void;
  isJoining: boolean;
}) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const displayName = language === 'ar' ? item.nameAr : item.name;
  const displayDesc = language === 'ar' ? item.descriptionAr : item.description;
  const isPremium = item.privacy === 'premium';
  const isPrivate = item.privacy === 'private';

  const handleJoin = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onJoinToggle(item.id, item.isMember);
  }, [item.id, item.isMember, onJoinToggle]);

  return (
    <PremiumCard
      variant="surface"
      onPress={() => router.push(`/community/${item.id}`)}
      style={styles.card}
      padding={0}
    >
      <View style={styles.cardInner}>
        <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.cardIcon, { backgroundColor: item.accent + '1F' }]}>
            <Text style={styles.cardEmoji}>{item.icon}</Text>
          </View>
          <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.cardNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
              {isPremium && <Crown color={colors.warning} size={14} fill={colors.warning} />}
            </View>
            <Text style={[styles.cardDesc, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]} numberOfLines={2}>
              {displayDesc}
            </Text>
          </View>
          <ArrowUpRight color={colors.textMuted} size={20} strokeWidth={2.5} />
        </View>

        <View style={[styles.cardBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.statGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statItem}>
              <Users color={colors.accent} size={14} strokeWidth={2.5} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.memberCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Sparkles color={colors.accent} size={14} strokeWidth={2.5} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.postCount}</Text>
            </View>
          </View>

          {item.isMember ? (
            <GlassView intensity={20} borderRadius={12} style={styles.joinedBadge}>
              <Text style={[styles.joinedText, { color: colors.accent }]}>
                {language === 'ar' ? 'عضو' : 'Member'}
              </Text>
            </GlassView>
          ) : (
            <PressableScale onPress={handleJoin} disabled={isJoining}>
              <LinearGradient
                colors={isPremium ? [colors.warning, '#F59E0B'] : [colors.accent, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinBtn}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.joinText}>{language === 'ar' ? 'انضمام' : 'Join'}</Text>
                )}
              </LinearGradient>
            </PressableScale>
          )}
        </View>
      </View>
    </PremiumCard>
  );
});

export default function CommunitiesScreen() {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const filterMap: Record<number, 'public' | 'private' | 'premium' | undefined> = {
    0: undefined,
    1: 'public',
    2: 'private',
    3: 'premium',
  };

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list', filterMap[activeFilter]],
    queryFn: () => trpcClient.communities.list.query({ filter: filterMap[activeFilter] }),
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => trpcClient.communities.join.mutate({ communityId }),
    onSuccess: (_data, communityId) => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      setToastMsg(language === 'ar' ? 'تم الانضمام بنجاح' : 'Successfully joined');
      setToastVisible(true);
      setJoiningId(null);
    },
    onError: () => setJoiningId(null),
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId: string) => trpcClient.communities.leave.mutate({ communityId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      setJoiningId(null);
    },
    onError: () => setJoiningId(null),
  });

  const handleJoinToggle = useCallback((communityId: string, isMember: boolean) => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please log in first');
      setToastVisible(true);
      return;
    }
    setJoiningId(communityId);
    if (isMember) {
      leaveMutation.mutate(communityId);
    } else {
      joinMutation.mutate(communityId);
    }
  }, [isAuthenticated, language, joinMutation, leaveMutation]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LottiePullToRefreshWrapper
          isRefreshing={communitiesQuery.isRefetching}
          onRefresh={() => communitiesQuery.refetch()}
        >
          <FlatList
            data={communitiesQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CommunityCard item={item} onJoinToggle={handleJoinToggle} isJoining={joiningId === item.id} />
            )}
            ListHeaderComponent={
              <>
                <CustomHeader />
                <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
                <View style={styles.sectionTitleContainer}>
                  <Compass color={colors.accent} size={22} strokeWidth={2.5} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'ar' ? 'اكتشف المجتمعات' : 'Discover Communities'}
                  </Text>
                </View>
              </>
            }
            ListEmptyComponent={communitiesQuery.isLoading ? <LoadingSkeleton /> : <EmptyState />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Text style={{ color: colors.textSecondary }}>No communities found.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },
  filterWrapper: {
    marginTop: 0,
  },
  filterPill: {
    ...internalPageStyles.chipPill,
  },
  filterText: {
    ...internalPageStyles.chipText,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
  },
  cardInner: {
    padding: 24,
  },
  cardTop: {
    gap: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardNameRow: {
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  cardBottom: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 20,
  },
  statGroup: {
    gap: 16,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
  },
  joinedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  joinBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 90,
    alignItems: 'center',
  },
  joinText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

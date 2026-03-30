import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
  Search,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { CommunityCardSkeleton } from '@/components/SkeletonLoader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';

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

// ── Header ────────────────────────────────────────────────────────────────────
function Header() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.header,
      { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border },
    ]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {language === 'ar' ? 'المجتمعات' : 'Communities'}
      </Text>
      <PressableScale
        onPress={() => router.push('/explore')}
        style={[styles.headerBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        <Search color={colors.text} size={20} strokeWidth={2} />
      </PressableScale>
    </View>
  );
}

// ── Featured Horizontal Strip (Instagram Stories style) ──────────────────────
function FeaturedStrip({ communities }: { communities: CommunityItem[] }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const featured = communities.slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <View style={styles.featuredSection}>
      <View style={[styles.sectionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Sparkles color={colors.accent} size={15} strokeWidth={2.5} />
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {language === 'ar' ? 'نشطة الآن' : 'Active Now'}
        </Text>
      </View>
      <FlatList
        horizontal
        inverted={isRTL}
        data={featured}
        keyExtractor={(item) => `feat-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredRow}
        renderItem={({ item }) => (
          <PressableScale
            onPress={() => { void Haptics.selectionAsync(); router.push(`/community/${item.id}`); }}
            style={styles.featuredItem}
          >
            <View style={[
              styles.featuredRingWrap,
              item.isMember && { borderColor: colors.accent, borderWidth: 2.5 },
              !item.isMember && { borderColor: item.accent + '55', borderWidth: 2 },
            ]}>
              <View style={[styles.featuredAvatar, { backgroundColor: item.accent + '22' }]}>
                <Text style={styles.featuredEmoji}>{item.icon}</Text>
              </View>
            </View>
            <Text style={[styles.featuredName, { color: colors.text }]} numberOfLines={1}>
              {language === 'ar' ? item.nameAr : item.name}
            </Text>
          </PressableScale>
        )}
      />
    </View>
  );
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────
function FilterTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const filters = language === 'ar' ? FILTERS_AR : FILTERS_EN;

  return (
    <FlatList
      horizontal
      inverted={isRTL}
      data={filters}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.filterRow}
      renderItem={({ item, index }) => {
        const isActive = active === index;
        return (
          <PressableScale
            onPress={() => { onSelect(index); void Haptics.selectionAsync(); }}
            style={[
              styles.filterPill,
              isActive
                ? { backgroundColor: colors.accent, borderColor: colors.accent }
                : { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: isActive ? '#FFF' : colors.textMuted },
              isActive && { fontWeight: '700' },
            ]}>
              {item}
            </Text>
          </PressableScale>
        );
      }}
    />
  );
}

// ── Community Card ────────────────────────────────────────────────────────────
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
  const { colors } = useTheme();
  const displayName = language === 'ar' ? item.nameAr : item.name;
  const displayDesc = language === 'ar' ? item.descriptionAr : item.description;
  const isPremium = item.privacy === 'premium';

  return (
    <Pressable
      onPress={() => router.push(`/community/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        pressed && { opacity: 0.88 },
      ]}
    >
      {/* Icon */}
      <View style={[styles.cardIcon, { backgroundColor: item.accent + '18' }]}>
        <Text style={styles.cardEmoji}>{item.icon}</Text>
      </View>

      {/* Info */}
      <View style={[styles.cardBody, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.cardTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          {isPremium && <Crown color={colors.warning} size={12} fill={colors.warning} />}
        </View>
        <Text style={[styles.cardDesc, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {displayDesc}
        </Text>
        <View style={[styles.cardMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Users size={11} color={colors.textMuted} />
          <Text style={[styles.cardMetaText, { color: colors.textMuted }]}>{item.memberCount}</Text>
          <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.cardMetaText, { color: colors.textMuted }]}>
            {item.postCount} {language === 'ar' ? 'منشور' : 'posts'}
          </Text>
        </View>
      </View>

      {/* Action */}
      {item.isMember ? (
        <View style={[styles.memberBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.memberText, { color: colors.accent }]}>
            {language === 'ar' ? 'عضو' : 'Joined'}
          </Text>
        </View>
      ) : (
        <PressableScale
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onJoinToggle(item.id, item.isMember);
          }}
          disabled={isJoining}
        >
          <LinearGradient
            colors={isPremium ? [colors.warning, '#F59E0B'] : [colors.accent, colors.gradientEnd ?? '#A5B4FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.joinBtn}
          >
            {isJoining
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.joinText}>{language === 'ar' ? 'انضم' : 'Join'}</Text>
            }
          </LinearGradient>
        </PressableScale>
      )}
    </Pressable>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────
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
    0: undefined, 1: 'public', 2: 'private', 3: 'premium',
  };

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list', filterMap[activeFilter]],
    queryFn: () => trpcClient.communities.list.query({ filter: filterMap[activeFilter] }),
  });

  const allCommunities = (communitiesQuery.data ?? []) as CommunityItem[];

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => trpcClient.communities.join.mutate({ communityId }),
    onSuccess: () => {
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
    if (isMember) leaveMutation.mutate(communityId);
    else joinMutation.mutate(communityId);
  }, [isAuthenticated, language, joinMutation, leaveMutation]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header />
        <LottiePullToRefreshWrapper
          isRefreshing={communitiesQuery.isRefetching}
          onRefresh={() => communitiesQuery.refetch()}
        >
          <FlatList
            data={allCommunities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CommunityCard item={item} onJoinToggle={handleJoinToggle} isJoining={joiningId === item.id} />
            )}
            ListHeaderComponent={
              <>
                {allCommunities.length > 0 && <FeaturedStrip communities={allCommunities} />}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
                <View style={[styles.listTitleRow, { flexDirection: 'row' }]}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    {language === 'ar' ? 'كل المجتمعات' : 'All Communities'}
                  </Text>
                  <Text style={[styles.listCount, { color: colors.textMuted }]}>
                    {allCommunities.length}
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
    <View style={{ paddingHorizontal: 16 }}>
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  return (
    <View style={styles.emptyContainer}>
      <Users color={colors.textMuted} size={36} strokeWidth={1.5} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {language === 'ar' ? 'لا توجد مجتمعات' : 'No communities found'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },

  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredSection: { paddingTop: 16, paddingBottom: 4 },
  sectionRow: { alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  featuredRow: { paddingHorizontal: 16, gap: 14, paddingBottom: 8 },
  featuredItem: { alignItems: 'center', width: 66, gap: 5 },
  featuredRingWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  featuredAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredEmoji: { fontSize: 22 },
  featuredName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  divider: { height: StyleSheet.hairlineWidth, marginTop: 8, marginBottom: 4 },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingTop: 12, paddingBottom: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },

  listTitleRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  listTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  listCount: { fontSize: 13, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 22 },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { alignItems: 'center', gap: 6 },
  cardName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, flex: 1 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  cardMeta: { alignItems: 'center', gap: 5, marginTop: 2 },
  cardMetaText: { fontSize: 11, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2 },
  memberBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  memberText: { fontSize: 12, fontWeight: '700' },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, minWidth: 64, alignItems: 'center' },
  joinText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
});

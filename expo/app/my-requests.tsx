import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Inbox,
  Send,
  X,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Toast } from '@/components/Toast';
import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { internalPageStyles } from '@/styles/internalPageStyles';

const AVATAR_COLORS = ['#1A6B4A', '#2E7AD6', '#C94458', '#B8892A', '#7C3AED', '#16A34A'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type TabKey = 'sent' | 'received';

function formatTimeAgo(dateStr: string, language: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (language === 'ar') {
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    return `منذ ${diffDays} ي`;
  }
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface SentRequest {
  id: string;
  serviceId: string;
  requesterId: string;
  message: string;
  proposedPrice: string;
  proposedTimeline: string;
  status: string;
  conversationId: string | null;
  createdAt: string;
  serviceTitle: string;
  serviceTitleAr: string;
  servicePrice: string;
  servicePriceAr: string;
  providerName: string;
  providerInitial: string;
}

interface IncomingRequest {
  id: string;
  serviceId: string;
  requesterId: string;
  message: string;
  proposedPrice: string;
  proposedTimeline: string;
  status: string;
  conversationId: string | null;
  createdAt: string;
  serviceTitle: string;
  serviceTitleAr: string;
  servicePrice: string;
  servicePriceAr: string;
  requesterName: string;
  requesterInitial: string;
}

const SentRequestCard = React.memo(function SentRequestCard({
  item,
  language,
  isRTL,
  onOpenChat,
  onRate,
}: {
  item: SentRequest;
  language: string;
  isRTL: boolean;
  onOpenChat: (convId: string) => void;
  onRate: (requestId: string, serviceId: string) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const statusConfig: Record<string, { color: string; bgColor: string; labelAr: string; labelEn: string }> = {
    pending: { color: colors.gold, bgColor: colors.goldLight, labelAr: 'قيد الانتظار', labelEn: 'Pending' },
    accepted: { color: colors.accent, bgColor: colors.accentLight, labelAr: 'مقبول', labelEn: 'Accepted' },
    rejected: { color: colors.rose, bgColor: colors.roseLight, labelAr: 'مرفوض', labelEn: 'Rejected' },
    completed: { color: colors.sky, bgColor: colors.skyLight, labelAr: 'مكتمل', labelEn: 'Completed' },
  };
  const statusCfg = statusConfig[item.status] ?? statusConfig.pending;
  const title = language === 'ar' ? item.serviceTitleAr : item.serviceTitle;
  const time = formatTimeAgo(item.createdAt, language);

  return (
    <View style={styles.card}>
      <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.serviceId) }]}>
          <Text style={styles.avatarText}>{item.providerInitial}</Text>
        </View>
        <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{title}</Text>
          <Text style={styles.cardSub}>{item.providerName} · {time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {language === 'ar' ? statusCfg.labelAr : statusCfg.labelEn}
          </Text>
        </View>
      </View>

      {item.message ? (
        <Text style={[styles.cardMessage, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {item.message}
        </Text>
      ) : null}

      {(item.proposedPrice || item.proposedTimeline) ? (
        <View style={[styles.proposalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {item.proposedPrice ? (
            <View style={[styles.proposalPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.proposalLabel}>{language === 'ar' ? 'السعر:' : 'Price:'}</Text>
              <Text style={styles.proposalValue}>{item.proposedPrice}</Text>
            </View>
          ) : null}
          {item.proposedTimeline ? (
            <View style={[styles.proposalPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.proposalLabel}>{language === 'ar' ? 'المدة:' : 'Timeline:'}</Text>
              <Text style={styles.proposalValue}>{item.proposedTimeline}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.cardActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {item.status === 'accepted' && item.conversationId ? (
          <>
            <Pressable
              onPress={() => onOpenChat(item.conversationId!)}
              style={[styles.actionBtn, styles.actionBtnPrimary]}
            >
              <Text style={styles.actionBtnPrimaryText}>
                {language === 'ar' ? 'فتح المحادثة' : 'Open Chat'}
              </Text>
            </Pressable>
          </>
        ) : null}
        {item.status === 'completed' ? (
          <Pressable
            onPress={() => onRate(item.id, item.serviceId)}
            style={[styles.actionBtn, styles.actionBtnPrimary]}
          >
            <Text style={styles.actionBtnPrimaryText}>
              {language === 'ar' ? 'تقييم الخدمة' : 'Rate Service'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const IncomingRequestCard = React.memo(function IncomingRequestCard({
  item,
  language,
  isRTL,
  onAccept,
  onReject,
  isActing,
}: {
  item: IncomingRequest;
  language: string;
  isRTL: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isActing: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const statusConfig: Record<string, { color: string; bgColor: string; labelAr: string; labelEn: string }> = {
    pending: { color: colors.gold, bgColor: colors.goldLight, labelAr: 'قيد الانتظار', labelEn: 'Pending' },
    accepted: { color: colors.accent, bgColor: colors.accentLight, labelAr: 'مقبول', labelEn: 'Accepted' },
    rejected: { color: colors.rose, bgColor: colors.roseLight, labelAr: 'مرفوض', labelEn: 'Rejected' },
    completed: { color: colors.sky, bgColor: colors.skyLight, labelAr: 'مكتمل', labelEn: 'Completed' },
  };
  const statusCfg = statusConfig[item.status] ?? statusConfig.pending;
  const title = language === 'ar' ? item.serviceTitleAr : item.serviceTitle;
  const time = formatTimeAgo(item.createdAt, language);

  return (
    <View style={styles.card}>
      <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.requesterId) }]}>
          <Text style={styles.avatarText}>{item.requesterInitial}</Text>
        </View>
        <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.cardSub}>{item.requesterName}</Text>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{title}</Text>
          <Text style={styles.cardTime}>{time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {language === 'ar' ? statusCfg.labelAr : statusCfg.labelEn}
          </Text>
        </View>
      </View>

      {item.message ? (
        <Text style={[styles.cardMessage, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={3}>
          {item.message}
        </Text>
      ) : null}

      {(item.proposedPrice || item.proposedTimeline) ? (
        <View style={[styles.proposalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {item.proposedPrice ? (
            <View style={[styles.proposalPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.proposalLabel}>{language === 'ar' ? 'عرض السعر:' : 'Price offer:'}</Text>
              <Text style={styles.proposalValue}>{item.proposedPrice}</Text>
            </View>
          ) : null}
          {item.proposedTimeline ? (
            <View style={[styles.proposalPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.proposalLabel}>{language === 'ar' ? 'المدة:' : 'Timeline:'}</Text>
              <Text style={styles.proposalValue}>{item.proposedTimeline}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {item.status === 'pending' ? (
        <View style={[styles.cardActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => onAccept(item.id)}
            disabled={isActing}
            style={[styles.actionBtn, styles.actionBtnAccept]}
          >
            {isActing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Check color={colors.white} size={14} />
                <Text style={styles.actionBtnAcceptText}>
                  {language === 'ar' ? 'قبول' : 'Accept'}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => onReject(item.id)}
            disabled={isActing}
            style={[styles.actionBtn, styles.actionBtnReject]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <X color={colors.rose} size={14} />
              <Text style={styles.actionBtnRejectText}>
                {language === 'ar' ? 'رفض' : 'Reject'}
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

export default function MyRequestsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('sent');
  const [actingId, setActingId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const sentQuery = useQuery({
    queryKey: ['marketplace', 'myRequests'],
    queryFn: () => trpcClient.marketplace.myRequests.query(),
    enabled: isAuthenticated,
  });

  const incomingQuery = useQuery({
    queryKey: ['marketplace', 'incomingRequests'],
    queryFn: () => trpcClient.marketplace.incomingRequests.query(),
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (input: { requestId: string; status: 'accepted' | 'rejected' }) =>
      trpcClient.marketplace.updateRequestStatus.mutate(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setActingId(null);
      const msg = variables.status === 'accepted'
        ? (language === 'ar' ? 'تم قبول الطلب وإنشاء محادثة' : 'Request accepted & chat created')
        : (language === 'ar' ? 'تم رفض الطلب' : 'Request rejected');
      setToastMsg(msg);
      setToastVisible(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      setActingId(null);
      setToastMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setToastVisible(true);
    },
  });

  const handleAccept = useCallback((requestId: string) => {
    setActingId(requestId);
    updateStatusMutation.mutate({ requestId, status: 'accepted' });
  }, [updateStatusMutation]);

  const handleReject = useCallback((requestId: string) => {
    setActingId(requestId);
    updateStatusMutation.mutate({ requestId, status: 'rejected' });
  }, [updateStatusMutation]);

  const handleOpenChat = useCallback((convId: string) => {
    router.push(`/chat/${convId}`);
  }, [router]);

  const handleRate = useCallback((requestId: string, serviceId: string) => {
    router.push(`/rate-service?requestId=${requestId}&serviceId=${serviceId}` as never);
  }, [router]);

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['marketplace', 'myRequests'] });
    void queryClient.invalidateQueries({ queryKey: ['marketplace', 'incomingRequests'] });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  const sentRequests = sentQuery.data ?? [];
  const incomingRequests = incomingQuery.data ?? [];
  const isLoading = activeTab === 'sent' ? sentQuery.isLoading : incomingQuery.isLoading;
  const isRefreshing = activeTab === 'sent' ? sentQuery.isRefetching : incomingQuery.isRefetching;

  const tabs = [
    { key: 'sent' as TabKey, label: language === 'ar' ? 'طلباتي المرسلة' : 'Sent Requests', count: sentRequests.length },
    { key: 'received' as TabKey, label: language === 'ar' ? 'الطلبات الواردة' : 'Incoming Requests', count: incomingRequests.length },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <Text style={styles.headerTitle}>{language === 'ar' ? 'طلبات الخدمات' : 'Service Requests'}</Text>
            <View style={{ width: 38 }} />
          </View>
          <EmptyState
            icon={Inbox}
            title={language === 'ar' ? 'سجل الدخول لعرض طلباتك' : 'Sign in to view requests'}
            description={language === 'ar' ? 'يجب تسجيل الدخول لإدارة طلبات الخدمات' : 'You need to sign in to manage service requests'}
            iconColor={colors.textMuted}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.headerTitle}>{language === 'ar' ? 'طلبات الخدمات' : 'Service Requests'}</Text>
          <View style={{ width: 38 }} />
        </View>

        <FlatList
          horizontal
          inverted={isRTL}
          data={tabs}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.tabRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setActiveTab(item.key);
                void Haptics.selectionAsync();
              }}
              style={[styles.tabPill, activeTab === item.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
              {item.count > 0 ? (
                <View style={[styles.tabBadge, activeTab === item.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === item.key && styles.tabBadgeTextActive]}>
                    {item.count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : activeTab === 'sent' ? (
          <LottiePullToRefreshWrapper
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          >
            <FlatList
              data={sentRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SentRequestCard
                  item={item}
                  language={language}
                  isRTL={isRTL}
                  onOpenChat={handleOpenChat}
                  onRate={handleRate}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon={Send}
                  title={language === 'ar' ? 'لا توجد طلبات مرسلة' : 'No sent requests'}
                  description={language === 'ar' ? 'لم ترسل أي طلب خدمة بعد' : "You haven't sent any service requests yet"}
                  iconColor={colors.textMuted}
                  compact
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </LottiePullToRefreshWrapper>
        ) : (
          <LottiePullToRefreshWrapper
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          >
            <FlatList
              data={incomingRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <IncomingRequestCard
                  item={item}
                  language={language}
                  isRTL={isRTL}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isActing={actingId === item.id}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon={Inbox}
                  title={language === 'ar' ? 'لا توجد طلبات واردة' : 'No incoming requests'}
                  description={language === 'ar' ? 'لم يصلك أي طلب خدمة بعد' : "You haven't received any service requests yet"}
                  iconColor={colors.textMuted}
                  compact
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </LottiePullToRefreshWrapper>
        )}

        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
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
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  tabRow: internalPageStyles.chipsRow,
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...internalPageStyles.chipPill,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: c.bgCard,
    borderColor: c.border,
  },
  tabActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  tabText: {
    ...internalPageStyles.chipText,
    fontSize: 14,
    color: c.textMuted,
  },
  tabTextActive: {
    color: c.white,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    ...theme.typography.small,
    color: c.textMuted,
  },
  tabBadgeTextActive: {
    color: c.white,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
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
  cardTop: {
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    ...theme.typography.bodySemibold,
    color: c.text,
  },
  cardSub: {
    ...theme.typography.caption,
    color: c.textSecondary,
  },
  cardTime: {
    ...theme.typography.label,
    color: c.textMuted,
  },
  cardMessage: {
    ...theme.typography.caption,
    color: c.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusText: {
    ...theme.typography.small,
    fontWeight: '700' as const,
  },
  proposalRow: {
    gap: 8,
    flexWrap: 'wrap',
  },
  proposalPill: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: c.bgMuted,
  },
  proposalLabel: {
    ...theme.typography.label,
    color: c.textMuted,
  },
  proposalValue: {
    ...theme.typography.captionSemibold,
    color: c.text,
  },
  cardActions: {
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: c.accent,
  },
  actionBtnPrimaryText: {
    color: c.white,
    ...theme.typography.captionSemibold,
  },
  actionBtnAccept: {
    backgroundColor: c.accent,
  },
  actionBtnAcceptText: {
    color: c.white,
    ...theme.typography.captionSemibold,
  },
  actionBtnReject: {
    backgroundColor: c.roseLight,
    borderWidth: 1,
    borderColor: c.rose,
  },
  actionBtnRejectText: {
    color: c.rose,
    ...theme.typography.captionSemibold,
  },
});

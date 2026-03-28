import React, { useCallback, useState, useMemo } from 'react';
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
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react-native';

import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { internalPageStyles } from '@/styles/internalPageStyles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

type NotificationType = 'like' | 'comment' | 'message' | 'service_request';

interface NotificationData {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorInitial: string;
  avatarColor: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
}

type FilterKey = 'all' | 'unread' | 'like' | 'comment' | 'service_request';

const FILTER_TABS_AR = ['الكل', 'غير مقروء', 'إعجابات', 'تعليقات', 'خدمات'];
const FILTER_TABS_EN = ['All', 'Unread', 'Likes', 'Comments', 'Services'];
const FILTER_KEYS: FilterKey[] = ['all', 'unread', 'like', 'comment', 'service_request'];

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'like': return Heart;
    case 'comment': return MessageCircle;
    case 'service_request': return ShoppingBag;
    case 'message': return MessageSquare;
    default: return Bell;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'like': return '#FB7185'; // rose
    case 'comment': return '#38BDF8'; // sky
    case 'service_request': return '#F59E0B'; // gold
    case 'message': return '#6366F1'; // indigo
    default: return '#64748B'; // muted
  }
}

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

const NotificationRow = React.memo(function NotificationRow({
  item,
  language,
  isRTL,
  onMarkRead,
  onNavigate,
}: {
  item: NotificationData;
  language: string;
  isRTL: boolean;
  onMarkRead: (id: string) => void;
  onNavigate: (item: NotificationData) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const Icon = getNotificationIcon(item.type);
  const color = getNotificationColor(item.type);
  const title = language === 'ar' ? item.title.ar : item.title.en;
  const body = language === 'ar' ? item.body.ar : item.body.en;
  const time = formatTimeAgo(item.createdAt, language);

  const handlePress = useCallback(() => {
    if (!item.read) {
      onMarkRead(item.id);
    }
    onNavigate(item);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [item, onMarkRead, onNavigate]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.notifRow,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        !item.read && styles.notifUnread,
        pressed && styles.pressed,
      ]}
      testID={`notification-${item.id}`}
    >
      <View style={styles.notifIconWrap}>
        <View style={[styles.notifAvatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.notifInitial}>{item.actorInitial}</Text>
        </View>
        <View style={[styles.notifTypeBadge, { backgroundColor: color }, isRTL ? { left: -2 } : { right: -2 }]}>
          <Icon color="#FFF" size={10} strokeWidth={3} />
        </View>
      </View>

      <View style={[styles.notifContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread, { textAlign: isRTL ? 'right' : 'left' }]}>
          {title}
        </Text>
        <Text style={[styles.notifBody, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {body}
        </Text>
        <Text style={styles.notifTime}>{time}</Text>
      </View>

      {!item.read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
});

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState(0);

  const filterKey = FILTER_KEYS[activeFilter];
  const apiFilter = filterKey === 'all' ? undefined : filterKey;

  const notificationsQuery = useQuery({
    queryKey: ['notifications', apiFilter],
    queryFn: () => trpcClient.notifications.list.query({ cursor: 0, limit: 50, filter: apiFilter as any }),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => trpcClient.notifications.unreadCount.query(),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => trpcClient.notifications.markRead.mutate({ notificationId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => trpcClient.notifications.markAllRead.mutate(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = useMemo(() => {
    return notificationsQuery.data?.notifications ?? [];
  }, [notificationsQuery.data]);

  const unreadCount = unreadQuery.data?.count ?? 0;

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  const handleMarkRead = useCallback((id: string) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const handleNavigate = useCallback((item: NotificationData) => {
    switch (item.type) {
      case 'like':
      case 'comment':
        router.push(`/post/${item.referenceId}`);
        break;
      case 'message':
        router.push(`/chat/${item.referenceId}`);
        break;
      case 'service_request':
        router.push(`/service/${item.referenceId}`);
        break;
    }
  }, [router]);

  const handleMarkAllRead = useCallback(() => {
    void markAllReadMutation.mutateAsync();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [markAllReadMutation]);

  const tabs = language === 'ar' ? FILTER_TABS_AR : FILTER_TABS_EN;

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="notif-back">
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </Text>
            </View>
          </View>
          <EmptyState
            icon={BellOff}
            title={language === 'ar' ? 'سجل الدخول لعرض الإشعارات' : 'Sign in to view notifications'}
            description={language === 'ar' ? 'يجب تسجيل الدخول لعرض إشعاراتك' : 'You need to sign in to see your notifications'}
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
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="notif-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              style={styles.markReadBtn}
            >
              <Text style={styles.markReadText}>
                {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          horizontal
          inverted={isRTL}
          data={tabs}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => {
                setActiveFilter(index);
                void Haptics.selectionAsync();
              }}
              style={[styles.filterPill, activeFilter === index && styles.filterActive]}
            >
              <Text style={[styles.filterText, activeFilter === index && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          )}
        />

        {notificationsQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
            description={language === 'ar' ? 'سيتم إعلامك بالتحديثات الجديدة' : 'You\'ll be notified of new updates'}
            iconColor={colors.textMuted}
          />
        ) : (
          <LottiePullToRefreshWrapper
            isRefreshing={notificationsQuery.isRefetching}
            onRefresh={handleRefresh}
          >
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NotificationRow
                  item={item}
                  language={language}
                  isRTL={isRTL}
                  onMarkRead={handleMarkRead}
                  onNavigate={handleNavigate}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              testID="notifications-list"
            />
          </LottiePullToRefreshWrapper>
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
  header: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.typography.h1,
    color: c.text,
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentLight,
  },
  markReadText: {
    ...theme.typography.label,
    color: c.accent,
  },
  filterRow: internalPageStyles.chipsRow,
  filterPill: {
    ...internalPageStyles.chipPill,
    minHeight: 42,
    backgroundColor: c.bgCard,
    borderColor: c.border,
  },
  filterActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  filterText: {
    ...internalPageStyles.chipText,
    fontSize: 14,
    color: c.textMuted,
  },
  filterTextActive: {
    color: c.white,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  notifRow: {
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  notifUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  pressed: {
    backgroundColor: c.bgMuted,
  },
  notifIconWrap: {
    position: 'relative',
  },
  notifAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifInitial: {
    color: c.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  notifTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.bg,
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    ...theme.typography.bodySemibold,
    color: c.text,
  },
  notifTitleUnread: {
    fontWeight: '700' as const,
  },
  notifBody: {
    ...theme.typography.caption,
    lineHeight: 20,
    color: c.textSecondary,
  },
  notifTime: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.accent,
    marginTop: 6,
  },
  separator: {
    height: 1,
    backgroundColor: c.divider,
    marginLeft: 78,
    marginRight: 20,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

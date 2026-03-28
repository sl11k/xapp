import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  Archive,
  Inbox,
  SquarePen,
  Search,
} from 'lucide-react-native';

import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { ConversationSkeleton } from '@/components/SkeletonLoader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

const FILTER_TABS_AR = ['الكل', 'غير مقروء'];
const FILTER_TABS_EN = ['All', 'Unread'];

const AVATAR_COLORS = [
  '#00C9A7', '#FFB547', '#FB7185', '#818CF8', '#22D3EE',
  '#F472B6', '#34D399', '#38BDF8', '#A78BFA', '#FBBF24',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

interface ConversationItem {
  id: string;
  participants: string[];
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  lastMessage: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
    readBy: string[];
  } | null;
  unreadCount: number;
  updatedAt: string;
  communityId?: string;
  communityName?: string;
  communityIcon?: string;
}

const POLL_INTERVAL = 8000;

function Header() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.headerWrap}>
      <LinearGradient
        colors={isDark
          ? ['rgba(129,140,248,0.06)', 'transparent']
          : ['rgba(99,102,241,0.04)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {language === 'ar' ? 'الرسائل' : 'Messages'}
        </Text>
        <Pressable
          onPress={() => router.push('/new-conversation')}
          style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.92 }] }]}
          testID="new-message-btn"
        >
          <LinearGradient
            colors={['#818CF8', '#A5B4FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newMsgBtn}
          >
            <SquarePen color="#FFF" size={17} strokeWidth={2} />
          </LinearGradient>
        </Pressable>
      </View>
      <Pressable style={({ pressed }) => [
        styles.searchBar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: isDark ? colors.bgCard : colors.bgMuted,
        },
        pressed && { opacity: 0.7 },
      ]}>
        <Search color={colors.textTertiary} size={17} strokeWidth={1.8} />
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
          {language === 'ar' ? 'ابحث في المحادثات...' : 'Search conversations...'}
        </Text>
      </Pressable>
    </View>
  );
}

function FilterTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const tabs = language === 'ar' ? FILTER_TABS_AR : FILTER_TABS_EN;

  return (
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
            onSelect(index);
            void Haptics.selectionAsync();
          }}
          style={[
            styles.filterPill,
            { backgroundColor: isDark ? colors.bgCard : colors.white },
            active === index && styles.filterPillActive,
          ]}
        >
          {active === index ? (
            <LinearGradient
              colors={['#818CF8', '#A5B4FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
          ) : null}
          <Text style={[
            styles.filterText,
            { color: colors.textSecondary },
            active === index && { color: '#FFF', fontWeight: '700' as const },
          ]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

const ConversationRow = React.memo(function ConversationRow({
  item,
  currentUserId,
}: {
  item: ConversationItem;
  currentUserId: string;
}) {
  const router = useRouter();
  const { isRTL } = useLanguage();
  const { colors, isDark } = useTheme();
  const hasUnread = item.unreadCount > 0;
  const isCommunity = !!item.communityId;
  const name = isCommunity ? (item.communityName ?? 'Community') : item.otherUser.name;
  const initial = isCommunity ? '' : getInitial(name);
  const avatarColor = isCommunity ? '#818CF8' : getAvatarColor(item.otherUser.id);
  const time = item.lastMessage ? formatTime(item.lastMessage.createdAt) : formatTime(item.updatedAt);
  const preview = item.lastMessage
    ? (item.lastMessage.senderId === currentUserId ? 'You: ' : '') + item.lastMessage.content
    : (isCommunity ? 'Community chat' : '');

  return (
    <PressableScale
      onPress={() => router.push(`/chat/${item.id}`)}
      style={[styles.chatRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      haptic
      testID={`conversation-${item.id}`}
    >
      <View style={styles.avatarWrap}>
        {isCommunity ? (
          <View style={[styles.avatar, { backgroundColor: 'rgba(129,140,248,0.15)' }]}>
            <Text style={{ fontSize: 22 }}>{item.communityIcon ?? '👥'}</Text>
          </View>
        ) : (
          <LinearGradient
            colors={[avatarColor, avatarColor + 'BB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        )}
        {!isCommunity ? (
          <View style={[styles.onlineDot, { backgroundColor: '#00C9A7', borderColor: isDark ? colors.bg : colors.bgCard }]} />
        ) : null}
      </View>

      <View style={[styles.chatInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.chatNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={[styles.chatName, { color: colors.text }, hasUnread && styles.chatNameUnread]} numberOfLines={1}>{name}</Text>
            {isCommunity ? (
              <View style={[styles.communityBadge, { backgroundColor: 'rgba(129,140,248,0.12)' }]}>
                <Text style={[styles.communityBadgeText, { color: '#818CF8' }]}>Group</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.chatTime, { color: colors.textTertiary }, hasUnread && { color: '#818CF8', fontWeight: '700' as const }]}>{time}</Text>
        </View>
        <View style={[styles.previewRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text
            style={[styles.chatPreview, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }, hasUnread && { color: colors.text, fontWeight: '500' as const }]}
            numberOfLines={2}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <LinearGradient
              colors={['#818CF8', '#A5B4FC']}
              style={styles.unreadBadge}
            >
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </LinearGradient>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
});

function LoadingSkeleton() {
  return (
    <View>
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { colors, isDark } = useTheme();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    try {
      console.log('[Messages] fetching conversations...');
      const data = await trpcClient.messages.listConversations.query();
      console.log('[Messages] fetched', data.length, 'conversations');
      setConversations(data);
    } catch (err) {
      console.log('[Messages] fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      console.log('[Messages] polling conversations...');
      void fetchConversations();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchConversations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [fetchConversations]);

  const filteredConversations = useMemo(() => {
    if (activeFilter === 0) return conversations;
    if (activeFilter === 1) return conversations.filter((c) => c.unreadCount > 0);
    return conversations;
  }, [activeFilter, conversations]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Header />
          <EmptyState
            icon={Inbox}
            title={language === 'ar' ? 'سجّل الدخول للمراسلة' : 'Sign in to message'}
            description={language === 'ar' ? 'سجّل الدخول لبدء المحادثات' : 'Sign in to start conversations'}
            iconColor={colors.accent}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LottiePullToRefreshWrapper
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <Header />
          <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              icon={activeFilter === 1 ? Archive : Inbox}
              title={
                activeFilter === 1
                  ? (language === 'ar' ? 'لا توجد رسائل غير مقروءة' : 'No unread messages')
                  : (language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet')
              }
              description={
                activeFilter === 1
                  ? (language === 'ar' ? 'أنت على اطلاع بكل الرسائل' : 'You\'re all caught up')
                  : (language === 'ar' ? 'ابدأ محادثة مع خبير أو زميل مهني' : 'Start a conversation with an expert or colleague')
              }
              actionLabel={activeFilter === 0 ? (language === 'ar' ? 'رسالة جديدة' : 'New message') : undefined}
              onAction={activeFilter === 0 ? () => router.push('/new-conversation') : undefined}
              iconColor={colors.accent}
            />
          ) : (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ConversationRow item={item} currentUserId={user?.id ?? ''} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: isDark ? colors.border : colors.separator }]} />
              )}
              testID="messages-list"
            />
          )}
        </LottiePullToRefreshWrapper>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100, flexGrow: 1 },
  headerWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14, overflow: 'hidden' },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.5 },
  newMsgBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchBar: { alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 20 },
  searchText: { flex: 1, fontSize: 14, letterSpacing: -0.2 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
  filterPillActive: {},
  filterText: { fontSize: 13, fontWeight: '600' as const },
  chatRow: { alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  avatarWrap: { position: 'relative' as const },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 19, fontWeight: '700' as const },
  onlineDot: {
    position: 'absolute' as const,
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  chatInfo: { flex: 1, gap: 5 },
  chatNameRow: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chatName: { fontSize: 16, fontWeight: '500' as const, letterSpacing: -0.2 },
  chatNameUnread: { fontWeight: '700' as const },
  chatTime: { fontSize: 12, fontWeight: '500' as const },
  previewRow: { alignItems: 'center', gap: 8 },
  chatPreview: { flex: 1, fontSize: 14, lineHeight: 20 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '700' as const },
  separator: { height: 1, marginLeft: 88, marginRight: 20 },
  communityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  communityBadgeText: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.2 },
});

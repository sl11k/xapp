import React, { useMemo } from 'react';
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
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  MessageCircle,
  Trash2,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { EnrichedPost } from '@/types/post';
import { PremiumCard } from '@/components/PremiumCard';

const AVATAR_COLORS = ['#1A6B4A', '#B8892A', '#2E7AD6', '#C94458', '#7C3AED', '#059669', '#D44B63', '#3B82F6'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SavedScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const savedQuery = useQuery({
    queryKey: ['posts', 'saved'],
    queryFn: async () => {
      console.log('[SavedScreen] fetching saved posts');
      return trpcClient.posts.savedPosts.query();
    },
    enabled: isAuthenticated,
  });

  const unsaveMutation = useMutation({
    mutationFn: async (postId: string) => {
      return trpcClient.posts.toggleSave.mutate({ postId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const items = savedQuery.data ?? [];

  const renderItem = ({ item }: { item: EnrichedPost }) => {
    const avatarColor = getAvatarColor(item.authorId);

    return (
      <Pressable onPress={() => router.push(`/post/${item.id}`)} testID={`saved-${item.id}`}>
        <PremiumCard style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} padding={14}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{item.authorInitial}</Text>
        </View>

        <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.typeBadge, { backgroundColor: colors.sky + '15' }]}>
            <MessageCircle color={colors.sky} size={11} />
            <Text style={[styles.typeText, { color: colors.sky }]}>
              {language === 'ar' ? 'منشور' : 'Post'}
            </Text>
          </View>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {item.content.substring(0, 80)}{item.content.length > 80 ? '...' : ''}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.authorName}{item.authorRole ? ` · ${item.authorRole}` : ''}
          </Text>
          <Text style={styles.savedTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        <Pressable
          style={styles.removeBtn}
          onPress={() => unsaveMutation.mutate(item.id)}
          testID={`unsave-${item.id}`}
        >
          <Trash2 color={colors.textMuted} size={16} />
        </Pressable>
        </PremiumCard>
      </Pressable>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="saved-back">
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'المحفوظات' : 'Saved Items'}
              </Text>
            </View>
          </View>
          <View style={styles.emptyState}>
            <Bookmark color={colors.textMuted} size={40} />
            <Text style={styles.emptyTitle}>
              {language === 'ar' ? 'سجّل الدخول لعرض المحفوظات' : 'Sign in to view saved items'}
            </Text>
            <Pressable onPress={() => router.push('/login')} style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="saved-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'المحفوظات' : 'Saved Items'}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Bookmark color={colors.accent} size={14} />
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>

        {savedQuery.isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Bookmark color={colors.textMuted} size={40} />
            <Text style={styles.emptyTitle}>
              {language === 'ar' ? 'لا توجد عناصر محفوظة' : 'No saved items'}
            </Text>
            <Text style={styles.emptyDesc}>
              {language === 'ar'
                ? 'احفظ المنشورات للوصول إليها لاحقاً'
                : 'Save posts to access them later'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            testID="saved-list"
            showsVerticalScrollIndicator={false}
          />
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
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
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
    ...theme.typography.h1,
    color: c.text,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentLight,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: c.accent,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
    borderRadius: 18,
  },
  pressed: {
    backgroundColor: c.bgMuted,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    gap: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 12,
    color: c.textMuted,
  },
  savedTime: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  emptyDesc: {
    ...theme.typography.caption,
    color: c.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  loginBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    backgroundColor: c.accent,
  },
  loginBtnText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});

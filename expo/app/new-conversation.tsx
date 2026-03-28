import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Search,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';

interface UserItem {
  userId: string;
  name: string;
  role: string;
  company: string;
  initial: string;
}

const AVATAR_COLORS = [
  '#1A6B4A', '#2E7AD6', '#C94458', '#B8892A', '#16A34A',
  '#7C3AED', '#0D9488', '#DC2626', '#EA580C', '#4F46E5',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function NewConversationScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUsers = async () => {
      try {
        console.log('[NewConversation] fetching users...');
        const data = await trpcClient.users.list.query();
        setUsers(data.filter((u: UserItem) => u.userId !== user?.id));
        console.log('[NewConversation] fetched', data.length, 'users');
      } catch (err) {
        console.log('[NewConversation] fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchUsers();
  }, [isAuthenticated, user?.id]);

  const filteredUsers = searchQuery.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleStartChat = useCallback(async (otherUserId: string) => {
    if (startingChat) return;
    setStartingChat(otherUserId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      console.log('[NewConversation] creating conversation with', otherUserId);
      const result = await trpcClient.messages.getOrCreate.mutate({ otherUserId });
      console.log('[NewConversation] conversation created', result.conversationId);
      router.replace(`/chat/${result.conversationId}`);
    } catch (err) {
      console.log('[NewConversation] error', err);
      setStartingChat(null);
    }
  }, [startingChat, router]);

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <Text style={styles.errorText}>
            {language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in'}
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="new-conv-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'رسالة جديدة' : 'New Message'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={[styles.searchWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Search color={colors.textMuted} size={18} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'Search users...'}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
            testID="new-conv-search"
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MessageCircle color={colors.textMuted} size={40} />
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? (language === 'ar' ? 'لا توجد نتائج' : 'No users found')
                : (language === 'ar' ? 'لا يوجد مستخدمون بعد' : 'No users yet')}
            </Text>
            <Text style={styles.emptyDesc}>
              {language === 'ar'
                ? 'ادعُ زملاءك للانضمام للمنصة'
                : 'Invite your colleagues to join the platform'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleStartChat(item.userId)}
                disabled={startingChat === item.userId}
                style={({ pressed }) => [
                  styles.userRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  pressed && { opacity: 0.7 },
                ]}
                testID={`user-${item.userId}`}
              >
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.userId) }]}>
                  <Text style={styles.avatarText}>{item.initial}</Text>
                </View>
                <View style={[styles.userInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userRole}>
                    {item.role ? `${item.role}` : ''}
                    {item.role && item.company ? ' · ' : ''}
                    {item.company ? item.company : ''}
                    {!item.role && !item.company ? (language === 'ar' ? 'عضو' : 'Member') : ''}
                  </Text>
                </View>
                {startingChat === item.userId ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <View style={styles.msgIcon}>
                    <MessageCircle color={colors.accent} size={18} />
                  </View>
                )}
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="users-list"
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
  errorText: {
    fontSize: 16,
    color: c.textMuted,
    textAlign: 'center' as const,
    marginTop: 40,
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
  searchWrap: {
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    padding: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyText: {
    ...theme.typography.h3,
    color: c.text,
  },
  emptyDesc: {
    ...theme.typography.caption,
    color: c.textMuted,
    textAlign: 'center' as const,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  userRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.bgCard,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    ...theme.typography.bodySemibold,
    color: c.text,
  },
  userRole: {
    ...theme.typography.caption,
    color: c.textMuted,
  },
  msgIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: c.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

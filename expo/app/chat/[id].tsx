import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CheckCircle2,
  Paperclip,
  Phone,
  Send,
  Video,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { Toast } from '@/components/Toast';

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

interface ConvInfo {
  id: string;
  participants: string[];
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  updatedAt: string;
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

function getInitial(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

const POLL_INTERVAL = 5000;

const MessageBubble = React.memo(function MessageBubble({
  message,
  currentUserId,
}: {
  message: MessageItem;
  currentUserId: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isMe = message.senderId === currentUserId;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isMe ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isRead = message.readBy.length > 1;
  const time = formatMessageTime(message.createdAt);

  return (
    <Animated.View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
          {message.content}
        </Text>
        <View style={styles.bubbleMeta}>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
            {time}
          </Text>
          {isMe ? (
            <View style={styles.statusIcon}>
              {isRead ? (
                <CheckCheck color={colors.accent} size={13} />
              ) : (
                <Check color="rgba(255,255,255,0.5)" size={13} />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
});

function DateDivider({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.dateDivider}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{label}</Text>
      <View style={styles.dateLine} />
    </View>
  );
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [convInfo, setConvInfo] = useState<ConvInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [serviceRequest, setServiceRequest] = useState<{ id: string; serviceId: string; status: string; serviceTitle: string; serviceTitleAr: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;
  const lastMessageCountRef = useRef(0);

  const fetchConvInfo = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    try {
      console.log('[Chat] fetching conv info for', id);
      const info = await trpcClient.messages.getConversationInfo.query({ conversationId: id });
      setConvInfo(info);
    } catch (err) {
      console.log('[Chat] fetchConvInfo error', err);
    }
  }, [id, isAuthenticated]);

  const fetchMessages = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    try {
      const result = await trpcClient.messages.getMessages.query({
        conversationId: id,
        cursor: 0,
        limit: 100,
      });
      console.log('[Chat] fetched', result.messages.length, 'messages');
      setMessages(result.messages);

      if (result.messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      lastMessageCountRef.current = result.messages.length;
    } catch (err) {
      console.log('[Chat] fetchMessages error', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated]);

  const markRead = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    try {
      await trpcClient.messages.markRead.mutate({ conversationId: id });
      console.log('[Chat] marked as read', id);
    } catch (err) {
      console.log('[Chat] markRead error', err);
    }
  }, [id, isAuthenticated]);

  const fetchServiceRequest = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    try {
      const req = await trpcClient.marketplace.getRequestByConversation.query({ conversationId: id });
      if (req) {
        setServiceRequest(req);
        console.log('[Chat] found service request', req.id, 'status=', req.status);
      }
    } catch (err) {
      console.log('[Chat] fetchServiceRequest error', err);
    }
  }, [id, isAuthenticated]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!serviceRequest) return;
    try {
      await trpcClient.marketplace.confirmDelivery.mutate({ requestId: serviceRequest.id });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setServiceRequest((prev) => prev ? { ...prev, status: 'completed' } : null);
      setToastMsg(language === 'ar' ? 'تم تأكيد استلام الخدمة' : 'Service delivery confirmed');
      setToastVisible(true);
      setTimeout(() => {
        router.push(`/rate-service?requestId=${serviceRequest.id}&serviceId=${serviceRequest.serviceId}` as never);
      }, 800);
    } catch (err) {
      console.log('[Chat] confirmDelivery error', err);
      setToastMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setToastVisible(true);
    }
  }, [serviceRequest, language, router]);

  useEffect(() => {
    void fetchConvInfo();
    void fetchMessages().then(() => markRead());
    void fetchServiceRequest();
  }, [fetchConvInfo, fetchMessages, markRead, fetchServiceRequest]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const interval = setInterval(() => {
      console.log('[Chat] polling messages...');
      void fetchMessages();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, id, fetchMessages]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !id || isSending) return;
    const text = messageText.trim();
    console.log('[Chat] sending message:', text);

    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, damping: 10, stiffness: 400 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 400 }),
    ]).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessageText('');
    setIsSending(true);

    try {
      const newMsg = await trpcClient.messages.send.mutate({
        conversationId: id,
        content: text,
      });
      console.log('[Chat] message sent', newMsg.id);
      setMessages((prev) => [...prev, newMsg]);
      lastMessageCountRef.current += 1;
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.log('[Chat] send error', err);
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  }, [messageText, id, isSending, sendScale]);

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.errorText}>{language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  const otherName = convInfo?.otherUser.name ?? '...';
  const otherInitial = getInitial(otherName);
  const avatarColor = convInfo ? getAvatarColor(convInfo.otherUser.id) : colors.textMuted;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.chatHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="chat-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <View style={[styles.chatAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.chatAvatarText}>{otherInitial}</Text>
          </View>
          <View style={[styles.chatUserInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.chatUserName} numberOfLines={1}>{otherName}</Text>
            <Text style={styles.chatUserStatus}>
              {convInfo?.otherUser.role || (language === 'ar' ? 'متصل' : 'Online')}
            </Text>
          </View>
          <View style={[styles.chatActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={({ pressed }) => [styles.chatActionBtn, pressed && { opacity: 0.7 }]}>
              <Phone color={colors.textSecondary} size={18} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.chatActionBtn, pressed && { opacity: 0.7 }]}>
              <Video color={colors.textSecondary} size={18} />
            </Pressable>
          </View>
        </View>

        {serviceRequest && serviceRequest.status === 'accepted' ? (
          <View style={styles.serviceBarWrap}>
            <Pressable
              onPress={handleConfirmDelivery}
              style={({ pressed }) => [styles.serviceBar, pressed && { opacity: 0.9 }]}
              testID="confirm-delivery"
            >
              <CheckCircle2 color={colors.white} size={16} />
              <Text style={styles.serviceBarText}>
                {language === 'ar' ? 'تأكيد استلام الخدمة' : 'Confirm Service Received'}
              </Text>
            </Pressable>
          </View>
        ) : serviceRequest && serviceRequest.status === 'completed' ? (
          <View style={styles.serviceBarWrap}>
            <View style={[styles.serviceBar, { backgroundColor: colors.sky }]}>
              <Check color={colors.white} size={16} />
              <Text style={styles.serviceBarText}>
                {language === 'ar' ? 'تم استلام الخدمة ✓' : 'Service Completed ✓'}
              </Text>
            </View>
          </View>
        ) : null}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MessageBubble message={item} currentUserId={user?.id ?? ''} />
              )}
              ListHeaderComponent={
                messages.length > 0 ? (
                  <DateDivider label={language === 'ar' ? 'اليوم' : 'Today'} />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatText}>
                    {language === 'ar' ? 'ابدأ المحادثة...' : 'Start the conversation...'}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              testID="chat-messages"
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
            />
          )}

          <View style={[styles.inputBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={({ pressed }) => [styles.attachBtn, pressed && { opacity: 0.7 }]}>
              <Paperclip color={colors.textSecondary} size={20} />
            </Pressable>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              multiline
              testID="chat-input"
            />
            <Pressable onPress={handleSend} disabled={!messageText.trim() || isSending} testID="chat-send">
              <Animated.View style={[
                styles.sendBtn,
                (!messageText.trim() || isSending) && styles.sendBtnDisabled,
                { transform: [{ scale: sendScale }] },
              ]}>
                <Send color={messageText.trim() && !isSending ? colors.white : colors.textMuted} size={16} />
              </Animated.View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

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
  errorText: {
    fontSize: 16,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: c.textMuted,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyChatText: {
    fontSize: 14,
    color: c.textMuted,
  },
  chatHeader: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
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
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  chatUserInfo: {
    flex: 1,
    gap: 2,
  },
  chatUserName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
  },
  chatUserStatus: {
    fontSize: 12,
    color: c.accent,
    fontWeight: '500' as const,
  },
  chatActions: {
    gap: 4,
  },
  chatActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  serviceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: c.accent,
    borderRadius: 16,
  },
  serviceBarText: {
    color: c.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 6,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.divider,
  },
  dateText: {
    ...theme.typography.label,
    color: c.textMuted,
  },
  bubbleRow: {
    marginVertical: 3,
  },
  bubbleRowMe: {
    alignItems: 'flex-end',
  },
  bubbleRowOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: c.accent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextMe: {
    color: c.white,
  },
  bubbleTextOther: {
    color: c.text,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 11,
  },
  bubbleTimeMe: {
    color: c.textOnDarkMuted,
  },
  bubbleTimeOther: {
    color: c.textMuted,
  },
  statusIcon: {
    marginTop: 1,
  },
  inputBar: {
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.bg,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: c.bgMuted,
  },
});

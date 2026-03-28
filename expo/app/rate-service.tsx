import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
  Star,
} from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { Toast } from '@/components/Toast';

const RATING_LABELS_AR = ['', 'سيء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];
const RATING_LABELS_EN = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RateServiceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { requestId, serviceId } = useLocalSearchParams<{ requestId: string; serviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const reviewMutation = useMutation({
    mutationFn: (input: { serviceId: string; requestId: string; rating: number; comment: string }) =>
      trpcClient.marketplace.addReview.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastType('success');
      setToastMsg(language === 'ar' ? 'شكراً لتقييمك!' : 'Thank you for your review!');
      setToastVisible(true);
      setTimeout(() => router.back(), 1200);
    },
    onError: (err) => {
      console.log('[RateService] error', err.message);
      setToastType('error');
      setToastMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setToastVisible(true);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!serviceId || !requestId) return;
    if (rating === 0) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'يرجى اختيار تقييم' : 'Please select a rating');
      setToastVisible(true);
      return;
    }
    reviewMutation.mutate({
      serviceId,
      requestId,
      rating,
      comment: comment.trim(),
    });
  }, [serviceId, requestId, rating, comment, language, reviewMutation]);

  const handleStarPress = useCallback((star: number) => {
    setRating(star);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const ratingLabel = rating > 0
    ? (language === 'ar' ? RATING_LABELS_AR[rating] : RATING_LABELS_EN[rating])
    : '';

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.errorText}>{language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.navTitle}>
            {language === 'ar' ? 'تقييم الخدمة' : 'Rate Service'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.ratingSection}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>
                {rating === 0 ? '⭐' : rating <= 2 ? '😐' : rating <= 3 ? '🙂' : rating <= 4 ? '😊' : '🤩'}
              </Text>
            </View>

            <Text style={styles.ratingPrompt}>
              {language === 'ar' ? 'كيف كانت تجربتك؟' : 'How was your experience?'}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => handleStarPress(star)}
                  style={styles.starBtn}
                  testID={`star-${star}`}
                >
                  <Star
                    color={star <= rating ? colors.gold : colors.border}
                    fill={star <= rating ? colors.gold : 'transparent'}
                    size={38}
                  />
                </Pressable>
              ))}
            </View>

            {ratingLabel ? (
              <View style={styles.ratingLabelWrap}>
                <Text style={styles.ratingLabelText}>{ratingLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.commentSection}>
            <Text style={[styles.commentLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'أضف تعليقك (اختياري)' : 'Add a comment (optional)'}
            </Text>
            <TextInput
              style={[styles.commentInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={comment}
              onChangeText={setComment}
              placeholder={language === 'ar'
                ? 'شاركنا رأيك عن الخدمة المقدمة...'
                : 'Share your thoughts about the service...'}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              testID="review-comment"
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={reviewMutation.isPending || rating === 0}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.85 },
              (reviewMutation.isPending || rating === 0) && { opacity: 0.5 },
            ]}
            testID="review-submit"
          >
            {reviewMutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.submitText}>
                {language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
              </Text>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>

        <Toast visible={toastVisible} message={toastMsg} type={toastType} onDismiss={() => setToastVisible(false)} />
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
  navBar: {
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
  navTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  scrollContent: {
    padding: 16,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    gap: 16,
    ...theme.shadow.sm,
  },
  emojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  ratingPrompt: {
    ...theme.typography.h2,
    color: c.text,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabelWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: c.goldLight,
  },
  ratingLabelText: {
    ...theme.typography.captionSemibold,
    color: c.gold,
  },
  commentSection: {
    marginTop: 16,
    gap: 8,
  },
  commentLabel: {
    ...theme.typography.captionSemibold,
    color: c.textSecondary,
  },
  commentInput: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.text,
    minHeight: 120,
    paddingTop: 12,
  },
  submitBtn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

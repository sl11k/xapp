import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Edit3,
  MessageCircle,
  Share2,
  Star,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { Toast } from '@/components/Toast';

const AVATAR_COLORS = ['#1A6B4A', '#2E7AD6', '#C94458', '#B8892A', '#7C3AED', '#16A34A'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ServiceDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const serviceQuery = useQuery({
    queryKey: ['marketplace', 'byId', id],
    queryFn: () => trpcClient.marketplace.byId.query({ id: id ?? '' }),
    enabled: !!id,
  });

  const requestMutation = useMutation({
    mutationFn: (input: { serviceId: string; message: string }) =>
      trpcClient.marketplace.requestService.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace', 'myRequests'] });
      setToastType('success');
      setToastMsg(language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request sent successfully');
      setToastVisible(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      console.log('[ServiceDetail] request error', err.message);
      setToastType('error');
      const msg = err.message.includes('CANNOT_REQUEST_OWN')
        ? (language === 'ar' ? 'لا يمكنك طلب خدمتك الخاصة' : 'Cannot request your own service')
        : (language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setToastMsg(msg);
      setToastVisible(true);
    },
  });

  const handleRequest = useCallback(() => {
    if (!isAuthenticated) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      setToastVisible(true);
      return;
    }
    if (!id) return;
    router.push(`/request-service?serviceId=${id}` as never);
  }, [isAuthenticated, id, language, router]);

  const service = serviceQuery.data;
  const isOwner = isAuthenticated && user && service && user.id === service.ownerId;

  if (serviceQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <Text style={styles.navTitle}>{language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}</Text>
            <View style={{ width: 38 }} />
          </View>
          <Text style={styles.errorText}>{language === 'ar' ? 'الخدمة غير موجودة' : 'Service not found'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  const avatarColor = getAvatarColor(service.id);
  const title = language === 'ar' ? service.titleAr : service.title;
  const description = language === 'ar' ? service.descriptionAr : service.description;
  const category = language === 'ar' ? service.categoryAr : service.category;
  const price = language === 'ar' ? service.priceAr : service.price;
  const delivery = language === 'ar' ? service.deliveryAr : service.delivery;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="service-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.navTitle}>{language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}</Text>
          {isOwner ? (
            <Pressable
              onPress={() => router.push(`/create-service?editId=${service.id}` as never)}
              style={styles.shareBtn}
            >
              <Edit3 color={colors.accent} size={18} />
            </Pressable>
          ) : (
            <Pressable style={styles.shareBtn}>
              <Share2 color={colors.textSecondary} size={18} />
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.providerSection}>
            <View style={[styles.providerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.providerAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.providerInitial}>{service.ownerInitial}</Text>
              </View>
              <View style={[styles.providerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.providerName}>{service.ownerName}</Text>
                <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Star color={colors.gold} fill={colors.gold} size={14} />
                  <Text style={styles.ratingText}>{service.averageRating > 0 ? service.averageRating.toFixed(1) : '—'}</Text>
                  <Text style={styles.reviewCount}>({service.reviewCount} {language === 'ar' ? 'تقييم' : 'reviews'})</Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [styles.msgBtn, pressed && { opacity: 0.7 }]}>
                <MessageCircle color={colors.accent} size={18} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.catBadgeWrap, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.catBadge, { backgroundColor: avatarColor + '18' }]}>
              <Text style={[styles.catBadgeText, { color: avatarColor }]}>{category}</Text>
            </View>
          </View>

          <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {title}
          </Text>

          {description ? (
            <Text style={[styles.serviceDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
              {description}
            </Text>
          ) : null}

          <View style={[styles.metricsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.accent }]}>{price}</Text>
              <Text style={styles.metricLabel}>{language === 'ar' ? 'السعر' : 'Price'}</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricValueRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Clock color={colors.sky} size={16} />
                <Text style={[styles.metricValue, { color: colors.sky }]}>{delivery}</Text>
              </View>
              <Text style={styles.metricLabel}>{language === 'ar' ? 'التسليم' : 'Delivery'}</Text>
            </View>
          </View>

          {service.features && service.features.length > 0 ? (
            <View style={styles.featuresSection}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'ما يشمله العرض' : "What's Included"}
              </Text>
              {service.features.map((feature: { en: string; ar: string }, index: number) => (
                <View key={index} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.checkIcon}>
                    <Check color={colors.accent} size={14} />
                  </View>
                  <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? feature.ar : feature.en}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'التقييمات' : 'Reviews'}
            </Text>
            <View style={styles.reviewSummary}>
              <Text style={styles.reviewBigNumber}>{service.averageRating > 0 ? service.averageRating.toFixed(1) : '—'}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} color={colors.gold} fill={s <= Math.round(service.averageRating) ? colors.gold : 'transparent'} size={16} />
                ))}
              </View>
              <Text style={styles.reviewTotalText}>
                {service.reviewCount} {language === 'ar' ? 'تقييم' : 'reviews'}
              </Text>
            </View>

            {service.reviews && service.reviews.length > 0 ? (
              service.reviews.slice(0, 3).map((review: { id: string; reviewerInitial: string; reviewerName: string; rating: number; comment: string }) => (
                <View key={review.id} style={styles.sampleReview}>
                  <View style={[styles.sampleReviewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.reviewerAvatar, { backgroundColor: colors.sky }]}>
                      <Text style={styles.reviewerInitial}>{review.reviewerInitial}</Text>
                    </View>
                    <View style={[styles.reviewerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                      <View style={styles.miniStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} color={colors.gold} fill={s <= review.rating ? colors.gold : 'transparent'} size={10} />
                        ))}
                      </View>
                    </View>
                  </View>
                  {review.comment ? (
                    <Text style={[styles.reviewText, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>
                {language === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
              </Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.bottomPrice}>
            <Text style={styles.bottomPriceLabel}>{language === 'ar' ? 'يبدأ من' : 'Starting from'}</Text>
            <Text style={styles.bottomPriceValue}>{price}</Text>
          </View>
          <Pressable
            onPress={handleRequest}
            disabled={requestMutation.isPending}
            style={({ pressed }) => [styles.requestBtn, pressed && { opacity: 0.85 }, requestMutation.isPending && { opacity: 0.6 }]}
            testID="service-request"
          >
            <Text style={styles.requestBtnText}>
              {requestMutation.isPending
                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                : requestMutation.isSuccess
                  ? (language === 'ar' ? 'تم الطلب' : 'Requested')
                  : (language === 'ar' ? 'طلب الخدمة' : 'Request Service')}
            </Text>
          </Pressable>
        </View>

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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  providerSection: {
    marginBottom: 0,
    padding: 14,
    borderRadius: 18,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  providerRow: {
    alignItems: 'center',
    gap: 12,
  },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInitial: {
    color: c.white,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  providerInfo: {
    flex: 1,
    gap: 4,
  },
  providerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: c.text,
  },
  ratingRow: {
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: c.text,
  },
  reviewCount: {
    fontSize: 13,
    color: c.textMuted,
  },
  msgBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: c.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadgeWrap: {
    marginBottom: 10,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  serviceTitle: {
    ...theme.typography.h1,
    color: c.text,
    lineHeight: 32,
    marginBottom: 10,
  },
  serviceDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: c.textSecondary,
    marginBottom: 20,
  },
  metricsRow: {
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    gap: 6,
  },
  metricValueRow: {
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  metricLabel: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  featuresSection: {
    marginBottom: 12,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  featureRow: {
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: c.text,
    lineHeight: 20,
  },
  reviewsSection: {
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    gap: 16,
  },
  reviewSummary: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  reviewBigNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: c.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  reviewTotalText: {
    fontSize: 13,
    color: c.textMuted,
  },
  sampleReview: {
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: c.surfaceSecondary,
    gap: 10,
  },
  sampleReviewHeader: {
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitial: {
    color: c.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  reviewerInfo: {
    flex: 1,
    gap: 3,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.text,
  },
  miniStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
  },
  noReviewsText: {
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.bg,
  },
  bottomPrice: {
    gap: 2,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: c.textMuted,
  },
  bottomPriceValue: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: c.accent,
  },
  requestBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: c.accent,
  },
  requestBtnText: {
    color: c.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
});

import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  Clock,
  DollarSign,
  FileText,
  Sparkles,
  Send,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { Toast } from '@/components/Toast';
import { PremiumCard } from '@/components/PremiumCard';
import { PremiumInput } from '@/components/PremiumInput';
import { AppIcon } from '@/components/AppIcon';

export default function RequestServiceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const serviceQuery = useQuery({
    queryKey: ['marketplace', 'byId', serviceId],
    queryFn: () => trpcClient.marketplace.byId.query({ id: serviceId ?? '' }),
    enabled: !!serviceId,
  });

  const requestMutation = useMutation({
    mutationFn: (input: { serviceId: string; message: string; proposedPrice: string; proposedTimeline: string }) =>
      trpcClient.marketplace.requestService.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastType('success');
      setToastMsg(language === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Request sent successfully!');
      setToastVisible(true);
      setTimeout(() => router.back(), 1200);
    },
    onError: (err) => {
      console.log('[RequestService] error', err.message);
      const msg = err.message.includes('CANNOT_REQUEST_OWN')
        ? (language === 'ar' ? 'لا يمكنك طلب خدمتك الخاصة' : 'Cannot request your own service')
        : (language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setToastType('error');
      setToastMsg(msg);
      setToastVisible(true);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!serviceId) return;
    if (!message.trim()) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'يرجى كتابة تفاصيل الطلب' : 'Please describe your request');
      setToastVisible(true);
      return;
    }
    requestMutation.mutate({
      serviceId,
      message: message.trim(),
      proposedPrice: proposedPrice.trim(),
      proposedTimeline: proposedTimeline.trim(),
    });
  }, [serviceId, message, proposedPrice, proposedTimeline, language, requestMutation]);

  const service = serviceQuery.data;
  const title = service ? (language === 'ar' ? service.titleAr : service.title) : '';
  const price = service ? (language === 'ar' ? service.priceAr : service.price) : '';
  const delivery = service ? (language === 'ar' ? service.deliveryAr : service.delivery) : '';

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.errorText}>{language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in first'}</Text>
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
            {language === 'ar' ? 'تقديم طلب خدمة' : 'Request Service'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {service ? (
              <PremiumCard style={styles.serviceInfoCard} padding={16} borderRadius={20}>
                <Text style={[styles.serviceInfoTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {title}
                </Text>
                <View style={[styles.serviceInfoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.infoPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <DollarSign color={colors.accent} size={14} />
                    <Text style={styles.infoPillText}>{price}</Text>
                  </View>
                  <View style={[styles.infoPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Clock color={colors.sky} size={14} />
                    <Text style={styles.infoPillText}>{delivery}</Text>
                  </View>
                </View>
                <Text style={[styles.providerLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? `مزود الخدمة: ${service.ownerName}` : `Provider: ${service.ownerName}`}
                </Text>
              </PremiumCard>
            ) : serviceQuery.isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null}

            <View style={styles.progressRow}>
              <View style={[styles.progressDot, styles.progressDotActive, { backgroundColor: colors.accent }]} />
              <View style={[styles.progressBar, { backgroundColor: colors.accent }]} />
              <View style={[styles.progressDot, { backgroundColor: colors.bgMuted }]} />
            </View>

            <PremiumCard style={styles.formSection} padding={16} borderRadius={20}>
              <View style={[styles.fieldHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppIcon icon={FileText} />
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'تفاصيل الطلب *' : 'Request Details *'}
                </Text>
              </View>
              <PremiumInput
                style={[styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                value={message}
                onChangeText={setMessage}
                label={language === 'ar' ? 'المطلوب تنفيذه' : 'What should be delivered'}
                placeholder={language === 'ar'
                  ? 'اشرح ما تحتاجه بالتفصيل، الأهداف، المتطلبات الخاصة...'
                  : 'Describe what you need in detail, goals, special requirements...'}
                multiline
                testID="request-message"
              />

              <View style={[styles.fieldHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppIcon icon={DollarSign} />
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'عرض السعر المقترح (اختياري)' : 'Proposed Price (optional)'}
                </Text>
              </View>
              <PremiumInput
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                label={language === 'ar' ? 'الميزانية' : 'Budget'}
                placeholder={language === 'ar' ? 'مثال: 3,000 SAR' : 'e.g. SAR 3,000'}
                testID="request-price"
              />

              <View style={[styles.fieldHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppIcon icon={Clock} />
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'المدة المقترحة (اختياري)' : 'Proposed Timeline (optional)'}
                </Text>
              </View>
              <PremiumInput
                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={proposedTimeline}
                onChangeText={setProposedTimeline}
                label={language === 'ar' ? 'المدة' : 'Timeline'}
                placeholder={language === 'ar' ? 'مثال: أسبوعين' : 'e.g. 2 weeks'}
                testID="request-timeline"
              />
            </PremiumCard>

            <Pressable
              onPress={handleSubmit}
              disabled={requestMutation.isPending}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                requestMutation.isPending && { opacity: 0.6 },
              ]}
              testID="request-submit"
            >
              {requestMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <View style={[styles.submitInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Sparkles color={colors.white} size={16} />
                  <Send color={colors.white} size={18} />
                  <Text style={styles.submitText}>
                    {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

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
  loadingWrap: {
    padding: 20,
    alignItems: 'center',
  },
  navBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    backgroundColor: c.bgCard,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  serviceInfoCard: {
    gap: 10,
    marginBottom: 20,
  },
  serviceInfoTitle: {
    ...theme.typography.h3,
    color: c.text,
    lineHeight: 24,
  },
  serviceInfoRow: {
    gap: 10,
  },
  infoPill: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    backgroundColor: c.bgMuted,
  },
  infoPillText: {
    ...theme.typography.captionSemibold,
    color: c.text,
  },
  providerLabel: {
    ...theme.typography.caption,
    color: c.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressBar: {
    width: 80,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  formSection: {
    gap: 6,
  },
  fieldHeader: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    ...theme.typography.captionSemibold,
    color: c.textSecondary,
    flex: 1,
  },
  input: {
    fontSize: 15,
  },
  textArea: {
    fontSize: 15,
    minHeight: 140,
  },
  submitBtn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitInner: {
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { Toast } from '@/components/Toast';

const CATEGORIES = [
  { en: 'Governance', ar: 'حوكمة' },
  { en: 'Consulting', ar: 'استشارات' },
  { en: 'Cybersecurity', ar: 'أمن سيبراني' },
  { en: 'Marketing', ar: 'تسويق' },
];

export default function CreateServiceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId;
  const isEdit = !!editId;

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [selectedCat, setSelectedCat] = useState(0);
  const [price, setPrice] = useState('');
  const [priceAr, setPriceAr] = useState('');
  const [delivery, setDelivery] = useState('');
  const [deliveryAr, setDeliveryAr] = useState('');
  const [features, setFeatures] = useState<Array<{ en: string; ar: string }>>([]);
  const [newFeatureEn, setNewFeatureEn] = useState('');
  const [newFeatureAr, setNewFeatureAr] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const existingQuery = useQuery({
    queryKey: ['marketplace', 'byId', editId],
    queryFn: () => trpcClient.marketplace.byId.query({ id: editId! }),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingQuery.data) {
      const s = existingQuery.data;
      setTitle(s.title);
      setTitleAr(s.titleAr);
      setDescription(s.description);
      setDescriptionAr(s.descriptionAr);
      setPrice(s.price);
      setPriceAr(s.priceAr);
      setDelivery(s.delivery);
      setDeliveryAr(s.deliveryAr);
      setFeatures(s.features as Array<{ en: string; ar: string }>);
      const catIdx = CATEGORIES.findIndex((c) => c.en === s.category);
      if (catIdx >= 0) setSelectedCat(catIdx);
    }
  }, [existingQuery.data]);

  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      titleAr: string;
      description: string;
      descriptionAr: string;
      category: string;
      categoryAr: string;
      price: string;
      priceAr: string;
      delivery: string;
      deliveryAr: string;
      features: Array<{ en: string; ar: string }>;
    }) => trpcClient.marketplace.create.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      console.log('[CreateService] create error', err.message);
      showToast(language === 'ar' ? 'حدث خطأ أثناء الإنشاء' : 'Failed to create service', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      title?: string;
      titleAr?: string;
      description?: string;
      descriptionAr?: string;
      category?: string;
      categoryAr?: string;
      price?: string;
      priceAr?: string;
      delivery?: string;
      deliveryAr?: string;
      features?: Array<{ en: string; ar: string }>;
    }) => trpcClient.marketplace.update.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      console.log('[CreateService] update error', err.message);
      showToast(language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Failed to update service', 'error');
    },
  });

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const handleAddFeature = useCallback(() => {
    if (!newFeatureEn.trim() && !newFeatureAr.trim()) return;
    setFeatures((prev) => [...prev, { en: newFeatureEn.trim(), ar: newFeatureAr.trim() }]);
    setNewFeatureEn('');
    setNewFeatureAr('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newFeatureEn, newFeatureAr]);

  const handleRemoveFeature = useCallback((index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !titleAr.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال عنوان الخدمة' : 'Please enter service title', 'error');
      return;
    }
    if (!price.trim() || !priceAr.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال السعر' : 'Please enter price', 'error');
      return;
    }
    if (!delivery.trim() || !deliveryAr.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال وقت التسليم' : 'Please enter delivery time', 'error');
      return;
    }

    const cat = CATEGORIES[selectedCat];
    const payload = {
      title: title.trim(),
      titleAr: titleAr.trim(),
      description: description.trim(),
      descriptionAr: descriptionAr.trim(),
      category: cat.en,
      categoryAr: cat.ar,
      price: price.trim(),
      priceAr: priceAr.trim(),
      delivery: delivery.trim(),
      deliveryAr: deliveryAr.trim(),
      features,
    };

    if (isEdit && editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [title, titleAr, description, descriptionAr, selectedCat, price, priceAr, delivery, deliveryAr, features, isEdit, editId, language, showToast, createMutation, updateMutation]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.errorText}>{language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login first'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (isEdit && existingQuery.isLoading) {
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

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.navTitle}>
            {isEdit
              ? (language === 'ar' ? 'تعديل الخدمة' : 'Edit Service')
              : (language === 'ar' ? 'إنشاء خدمة' : 'Create Service')}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}
            </Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              value={title}
              onChangeText={setTitle}
              placeholder={language === 'ar' ? 'أدخل العنوان بالإنجليزية' : 'Enter title in English'}
              placeholderTextColor={colors.textMuted}
              testID="service-title-en"
            />

            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}
            </Text>
            <TextInput
              style={[styles.input, { textAlign: 'right' }]}
              value={titleAr}
              onChangeText={setTitleAr}
              placeholder="أدخل العنوان بالعربية"
              placeholderTextColor={colors.textMuted}
              testID="service-title-ar"
            />

            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
              value={description}
              onChangeText={setDescription}
              placeholder={language === 'ar' ? 'أدخل الوصف بالإنجليزية' : 'Enter description in English'}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: 'right' }]}
              value={descriptionAr}
              onChangeText={setDescriptionAr}
              placeholder="أدخل الوصف بالعربية"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الفئة' : 'Category'}
            </Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((cat, idx) => (
                <Pressable
                  key={cat.en}
                  onPress={() => setSelectedCat(idx)}
                  style={[styles.catPill, selectedCat === idx && styles.catPillActive]}
                >
                  <Text style={[styles.catPillText, selectedCat === idx && styles.catPillTextActive]}>
                    {language === 'ar' ? cat.ar : cat.en}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.rowFields, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.halfField}>
                <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'السعر (إنجليزي)' : 'Price (English)'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="SAR 5,000"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'السعر (عربي)' : 'Price (Arabic)'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: 'right' }]}
                  value={priceAr}
                  onChangeText={setPriceAr}
                  placeholder="٥٬٠٠٠ ر.س"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={[styles.rowFields, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.halfField}>
                <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'التسليم (إنجليزي)' : 'Delivery (English)'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={delivery}
                  onChangeText={setDelivery}
                  placeholder="2-3 weeks"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'التسليم (عربي)' : 'Delivery (Arabic)'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: 'right' }]}
                  value={deliveryAr}
                  onChangeText={setDeliveryAr}
                  placeholder="٢-٣ أسابيع"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'المميزات' : 'Features'}
            </Text>
            {features.map((f, idx) => (
              <View key={idx} style={[styles.featureItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.featureItemText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? f.ar : f.en}
                </Text>
                <Pressable onPress={() => handleRemoveFeature(idx)} hitSlop={8}>
                  <Trash2 color={colors.rose} size={16} />
                </Pressable>
              </View>
            ))}
            <View style={styles.addFeatureWrap}>
              <TextInput
                style={[styles.featureInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={newFeatureEn}
                onChangeText={setNewFeatureEn}
                placeholder={language === 'ar' ? 'ميزة بالإنجليزية' : 'Feature in English'}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.featureInput, { textAlign: 'right' }]}
                value={newFeatureAr}
                onChangeText={setNewFeatureAr}
                placeholder="ميزة بالعربية"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable onPress={handleAddFeature} style={({ pressed }) => [styles.addFeatureBtn, pressed && { opacity: 0.7 }]}>
                <Plus color={colors.white} size={18} />
                <Text style={styles.addFeatureBtnText}>
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isPending}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, isPending && { opacity: 0.6 }]}
              testID="service-submit"
            >
              {isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isEdit
                    ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                    : (language === 'ar' ? 'نشر الخدمة' : 'Publish Service')}
                </Text>
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
    padding: 20,
  },
  sectionLabel: {
    ...theme.typography.captionSemibold,
    color: c.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.text,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: c.bgMuted,
    borderWidth: 1,
    borderColor: c.border,
  },
  catPillActive: {
    backgroundColor: c.text,
    borderColor: c.text,
  },
  catPillText: {
    ...theme.typography.captionSemibold,
    color: c.textSecondary,
  },
  catPillTextActive: {
    color: c.white,
  },
  rowFields: {
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  featureItem: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: c.bgCard,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: c.borderLight,
    marginBottom: 6,
  },
  featureItemText: {
    flex: 1,
    ...theme.typography.body,
    color: c.text,
  },
  addFeatureWrap: {
    gap: 8,
    marginTop: 4,
  },
  featureInput: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: c.text,
  },
  addFeatureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: c.navy,
  },
  addFeatureBtnText: {
    ...theme.typography.captionSemibold,
    color: c.white,
  },
  submitBtn: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: theme.radius.full,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

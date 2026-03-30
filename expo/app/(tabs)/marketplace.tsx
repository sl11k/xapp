import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  Bookmark,
  Clock,
  Filter,
  Plus,
  Search,
  Star,
  ArrowRight,
  ShoppingBag,
  Zap,
} from 'lucide-react-native';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { ServiceCardSkeleton } from '@/components/SkeletonLoader';
import { GlassView } from '@/components/GlassView';
import { PremiumCard } from '@/components/PremiumCard';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/constants/theme';
import { trpcClient } from '@/lib/trpc';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { internalPageStyles } from '@/styles/internalPageStyles';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

const CATS_AR = ['الكل', 'حوكمة', 'استشارات', 'أمن سيبراني', 'تسويق'];
const CATS_EN = ['All', 'Governance', 'Consulting', 'Cybersecurity', 'Marketing'];
const CAT_KEYS_EN = ['', 'Governance', 'Consulting', 'Cybersecurity', 'Marketing'];

interface ServiceItem {
  id: string;
  ownerId: string;
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
  ownerName: string;
  ownerInitial: string;
  ownerRole: string;
  createdAt: string;
  updatedAt: string;
}

function CustomHeader({ onCreatePress, isAuthenticated }: { onCreatePress: () => void; isAuthenticated: boolean }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={internalPageStyles.headerWrap}>
      <View style={[internalPageStyles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[internalPageStyles.titleText, { color: colors.text }]}>
          {language === 'ar' ? 'سوق الخدمات' : 'Service Market'}
        </Text>
        {isAuthenticated && (
          <PressableScale onPress={onCreatePress}>
            <LinearGradient
              colors={[colors.accent, colors.gradientEnd]}
              style={styles.addBtn}
            >
              <Plus color="#FFF" size={24} strokeWidth={2.5} />
            </LinearGradient>
          </PressableScale>
        )}
      </View>
      <View
        style={[
          internalPageStyles.searchBar,
          { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgCard, borderColor: colors.border },
        ]}
      >
        <Search color={colors.text} size={20} strokeWidth={2.5} />
        <Text style={[internalPageStyles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {language === 'ar' ? 'ابحث عن خدمة...' : 'Search services...'}
        </Text>
      </View>
    </View>
  );
}

function CategoryTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const cats = language === 'ar' ? CATS_AR : CATS_EN;

  return (
    <View style={styles.catWrapper}>
      <FlatList
        horizontal
        inverted={isRTL}
        data={cats}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={internalPageStyles.chipsRow}
        renderItem={({ item, index }) => (
          <PressableScale
            onPress={() => {
              onSelect(index);
              void Haptics.selectionAsync();
            }}
            style={[
              styles.catPill,
              active === index && { backgroundColor: colors.accent, borderColor: colors.accent },
              active !== index && { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <Text style={[
              styles.catText,
              { color: active === index ? '#FFF' : colors.textMuted },
              active === index && { fontWeight: '700' },
            ]}>{item}</Text>
          </PressableScale>
        )}
      />
    </View>
  );
}

const ServiceCard = React.memo(function ServiceCard({
  item,
  onRequest,
  onSave,
  requestedIds,
}: {
  item: ServiceItem;
  onRequest: (id: string, title: string) => void;
  onSave: () => void;
  requestedIds: Set<string>;
}) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const title = language === 'ar' ? item.titleAr : item.title;
  const category = language === 'ar' ? item.categoryAr : item.category;
  const price = language === 'ar' ? item.priceAr : item.price;
  const delivery = language === 'ar' ? item.deliveryAr : item.delivery;

  return (
    <PremiumCard
      variant="surface"
      onPress={() => router.push(`/service/${item.id}`)}
      style={styles.card}
      padding={0}
    >
      <View style={styles.cardInner}>
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <GlassView intensity={20} borderRadius={12} style={styles.catBadge}>
            <Text style={[styles.catBadgeText, { color: colors.accent }]}>{category}</Text>
          </GlassView>
          <View style={[styles.ratingBadge, { backgroundColor: colors.warning + '20' }]}>
            <Star color={colors.warning} fill={colors.warning} size={12} />
            <Text style={[styles.ratingText, { color: colors.warning }]}>4.9</Text>
          </View>
        </View>

        <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>

        <View style={[styles.providerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.providerAvatar, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.providerInitial, { color: colors.accent }]}>{item.ownerInitial}</Text>
          </View>
          <Text style={[styles.providerName, { color: colors.textSecondary }]}>{item.ownerName}</Text>
        </View>

        <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.priceInfo}>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'تبدأ من' : 'Starts from'}</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>{price}</Text>
          </View>
          
          <PressableScale onPress={() => onRequest(item.id, title)}>
            <LinearGradient
              colors={[colors.accent, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.orderBtn}
            >
              <Zap color="#FFF" size={16} fill="#FFF" />
              <Text style={styles.orderBtnText}>{language === 'ar' ? 'طلب' : 'Order'}</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      </View>
    </PremiumCard>
  );
});

export default function MarketplaceScreen() {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeCat, setActiveCat] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const category = CAT_KEYS_EN[activeCat] || undefined;

  const servicesQuery = useQuery({
    queryKey: ['marketplace', 'list', category],
    queryFn: () => trpcClient.marketplace.list.query({ cursor: 0, limit: 20, category }),
  });

  const handleRequest = (serviceId: string) => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login first');
      setToastVisible(true);
      return;
    }
    router.push(`/request-service?serviceId=${serviceId}` as any);
  };

  const handleCreatePress = () => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login first');
      setToastVisible(true);
      return;
    }
    router.push('/create-service');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LottiePullToRefreshWrapper
          isRefreshing={servicesQuery.isRefetching}
          onRefresh={() => servicesQuery.refetch()}
        >
          <FlatList
            data={servicesQuery.data?.services ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ServiceCard 
                item={item as ServiceItem} 
                onRequest={handleRequest} 
                onSave={() => {}} 
                requestedIds={new Set()} 
              />
            )}
            ListHeaderComponent={
              <>
                <CustomHeader onCreatePress={handleCreatePress} isAuthenticated={isAuthenticated} />
                <CategoryTabs active={activeCat} onSelect={setActiveCat} />
                <View style={styles.sectionTitleContainer}>
                  <ShoppingBag color={colors.accent} size={22} strokeWidth={2.5} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'ar' ? 'خدمات مختارة' : 'Featured Services'}
                  </Text>
                </View>
              </>
            }
            ListEmptyComponent={servicesQuery.isLoading ? <LoadingSkeleton /> : <EmptyState />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </LottiePullToRefreshWrapper>
        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </SafeAreaView>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Text style={{ color: colors.textSecondary }}>No services available.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catWrapper: {
    marginTop: 0,
  },
  catPill: {
    ...internalPageStyles.chipPill,
  },
  catText: {
    ...internalPageStyles.chipText,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  providerRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  providerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInitial: {
    fontSize: 12,
    fontWeight: '800',
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
    paddingTop: 12,
  },
  priceInfo: {
    gap: 1,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  orderBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

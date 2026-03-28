import React, { useMemo, useCallback, useState } from 'react';
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
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  MessageSquare,
  Search,
  Shield,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import {
  getLocalizedText,
  governanceCategories,
  resources,
} from '@/data/businessHub';
import type { GovernanceCategory } from '@/data/businessHub';
import { useLanguage } from '@/providers/LanguageProvider';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

function Header() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="gov-back">
          {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'الحوكمة والامتثال' : 'Governance & Compliance'}
          </Text>
        </View>
      </View>
      <Text style={[styles.headerSub, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar'
          ? 'مركز متخصص للنقاشات التنظيمية والسياسات والموارد المهنية'
          : 'Specialized hub for regulatory discussions, policies, and professional resources'}
      </Text>
      <Pressable style={({ pressed }) => [styles.searchBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}>
        <Search color={colors.textMuted} size={18} />
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'ابحث في الحوكمة والامتثال...' : 'Search governance & compliance...'}
        </Text>
      </Pressable>
    </View>
  );
}

function QuickStats() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();
  const stats = language === 'ar'
    ? [
        { value: '204', label: 'مورد', color: colors.accent },
        { value: '56', label: 'قالب', color: colors.gold },
        { value: '18', label: 'خبير', color: colors.sky },
      ]
    : [
        { value: '204', label: 'Resources', color: colors.accent },
        { value: '56', label: 'Templates', color: colors.gold },
        { value: '18', label: 'Experts', color: colors.sky },
      ];

  return (
    <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {stats.map((s, i) => (
        <View key={i} style={styles.statCard}>
          <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const CategoryCard = React.memo(function CategoryCard({ item }: { item: GovernanceCategory }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();

  return (
    <Pressable style={({ pressed }) => [styles.catCard, pressed && styles.pressed]} testID={`gov-cat-${item.id}`}>
      <View style={[styles.catTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.catIcon, { backgroundColor: item.accent + '18' }]}>
          <Text style={styles.catEmoji}>{item.icon}</Text>
        </View>
        <View style={[styles.catInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.catName}>{getLocalizedText(item.name, language)}</Text>
          <Text style={[styles.catDesc, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {getLocalizedText(item.description, language)}
          </Text>
        </View>
      </View>
      <View style={[styles.catBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.catCountBadge, { backgroundColor: item.accent + '18' }]}>
          <FileText color={item.accent} size={12} />
          <Text style={[styles.catCountText, { color: item.accent }]}>
            {item.count} {language === 'ar' ? 'مورد' : 'resources'}
          </Text>
        </View>
        <View style={[styles.catActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={styles.catActionBtn}>
            <MessageSquare color={colors.textMuted} size={14} />
          </Pressable>
          <Pressable style={styles.catActionBtn}>
            <BookOpen color={colors.textMuted} size={14} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

function RecentResources() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();
  const govResources = resources.filter(
    (r) => r.category.en === 'Compliance' || r.category.en === 'Governance'
  );

  return (
    <View style={styles.recentSection}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar' ? 'أحدث الموارد' : 'Recent Resources'}
      </Text>
      {govResources.map((resource) => (
        <Pressable
          key={resource.id}
          style={({ pressed }) => [styles.resourceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}
        >
          <View style={styles.resourceIcon}>
            <FileText color={colors.gold} size={16} />
          </View>
          <View style={[styles.resourceInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.resourceTitle} numberOfLines={1}>{getLocalizedText(resource.title, language)}</Text>
            <Text style={styles.resourceMeta}>
              {getLocalizedText(resource.type, language)} · {resource.author ?? ''} {resource.readTime ? `· ${getLocalizedText(resource.readTime, language)}` : ''}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ExpertCTA() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();

  return (
    <View style={styles.ctaCard}>
      <Shield color={colors.gold} size={24} />
      <Text style={[styles.ctaTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar' ? 'هل أنت خبير حوكمة؟' : 'Are you a governance expert?'}
      </Text>
      <Text style={[styles.ctaDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar'
          ? 'انضم كمستشار وقدّم خبراتك لمجتمع الأعمال'
          : 'Join as a consultant and share your expertise with the business community'}
      </Text>
      <Pressable style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.ctaBtnText}>{language === 'ar' ? 'تقدّم الآن' : 'Apply Now'}</Text>
      </Pressable>
    </View>
  );
}

export default function GovernanceScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = React.useCallback(({ item }: { item: GovernanceCategory }) => (
    <CategoryCard item={item} />
  ), []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <LottiePullToRefreshWrapper
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <FlatList
            data={governanceCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={
              <>
                <Header />
                <QuickStats />
              </>
            }
            ListFooterComponent={
              <>
                <RecentResources />
                <ExpertCTA />
                <View style={{ height: 40 }} />
              </>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="governance-list"
          />
        </LottiePullToRefreshWrapper>
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
  listContent: {
    paddingBottom: 40,
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  headerRow: {
    alignItems: 'center',
    gap: 12,
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
  headerSub: {
    fontSize: 14,
    color: c.textSecondary,
    lineHeight: 22,
  },
  searchBar: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: c.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  statsRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  statLabel: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  catCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 14,
    ...theme.shadow.sm,
  },
  catTop: {
    gap: 12,
    alignItems: 'flex-start',
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 22,
  },
  catInfo: {
    flex: 1,
    gap: 4,
  },
  catName: {
    ...theme.typography.h3,
    color: c.text,
  },
  catDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
  },
  catBottom: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  catCountText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  catActions: {
    gap: 8,
  },
  catActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: c.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSection: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 12,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  resourceRow: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  resourceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: c.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceInfo: {
    flex: 1,
    gap: 3,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
  },
  resourceMeta: {
    fontSize: 12,
    color: c.textMuted,
  },
  ctaCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: theme.radius.lg,
    backgroundColor: c.goldLight,
    gap: 10,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: c.text,
  },
  ctaDesc: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  ctaBtn: {
    marginTop: 4,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    backgroundColor: c.gold,
  },
  ctaBtnText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});

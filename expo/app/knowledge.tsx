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
  Bookmark,
  ChevronRight,
  Clock,
  FileText,
  Search,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { getLocalizedText, resources } from '@/data/businessHub';
import type { ResourceItem } from '@/data/businessHub';
import { useLanguage } from '@/providers/LanguageProvider';
import { internalPageStyles } from '@/styles/internalPageStyles';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

const FILTERS_AR = ['الكل', 'أدلة', 'قوالب', 'دراسات حالة', 'أُطر عمل'];
const FILTERS_EN = ['All', 'Guides', 'Templates', 'Case Studies', 'Frameworks'];

function Header() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="knowledge-back">
          {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'مركز المعرفة' : 'Knowledge Hub'}
          </Text>
        </View>
      </View>
      <Text style={[styles.headerSub, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar'
          ? 'أدلة، قوالب، دراسات حالة، وموارد مهنية متخصصة'
          : 'Guides, templates, case studies, and specialized professional resources'}
      </Text>
      <Pressable style={({ pressed }) => [styles.searchBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}>
        <Search color={colors.textMuted} size={18} />
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'ابحث في الموارد...' : 'Search resources...'}
        </Text>
      </Pressable>
    </View>
  );
}

function FilterTabs() {
  const { isRTL, language } = useLanguage();
  const styles = useStyles();
  const [active, setActive] = useState(0);
  const filters = language === 'ar' ? FILTERS_AR : FILTERS_EN;

  return (
    <FlatList
      horizontal
      inverted={isRTL}
      data={filters}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.filterRow}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => setActive(index)}
          style={[styles.filterPill, active === index ? styles.filterActive : null]}
        >
          <Text style={[styles.filterText, active === index ? styles.filterTextActive : null]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

const ResourceCard = React.memo(function ResourceCard({ item }: { item: ResourceItem }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();

  const typeColor = item.type.en === 'Template' ? colors.gold
    : item.type.en === 'Guide' ? colors.accent
    : item.type.en === 'Framework' ? colors.sky
    : colors.rose;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} testID={`resource-${item.id}`}>
      <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.cardIconWrap, { backgroundColor: typeColor + '18' }]}>
          <FileText color={typeColor} size={18} />
        </View>
        <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{getLocalizedText(item.type, language)}</Text>
          </View>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {getLocalizedText(item.title, language)}
          </Text>
        </View>
      </View>

      {item.description ? (
        <Text style={[styles.cardDesc, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {getLocalizedText(item.description, language)}
        </Text>
      ) : null}

      <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {item.author ? <Text style={styles.metaText}>{item.author}</Text> : null}
          {item.readTime ? (
            <View style={[styles.readTime, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock color={colors.textMuted} size={12} />
              <Text style={styles.metaText}>{getLocalizedText(item.readTime, language)}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.cardActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={styles.cardActionBtn}>
            <Bookmark color={colors.textMuted} size={16} />
          </Pressable>
          <ChevronRight color={colors.textMuted} size={16} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
        </View>
      </View>
    </Pressable>
  );
});

export default function KnowledgeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = React.useCallback(({ item }: { item: ResourceItem }) => (
    <ResourceCard item={item} />
  ), []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <LottiePullToRefreshWrapper
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <FlatList
            data={resources}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={
              <>
                <Header />
                <FilterTabs />
              </>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="knowledge-list"
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
    paddingBottom: 12,
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
  filterRow: internalPageStyles.chipsRow,
  filterPill: {
    ...internalPageStyles.chipPill,
    backgroundColor: c.bgCard,
    borderColor: c.border,
  },
  filterActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  filterText: {
    ...internalPageStyles.chipText,
    color: c.textMuted,
  },
  filterTextActive: {
    color: c.white,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 10,
    ...theme.shadow.sm,
  },
  cardTop: {
    gap: 12,
    alignItems: 'flex-start',
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  typeBadge: {
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
    ...theme.typography.bodySemibold,
    color: c.text,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
  },
  cardFooter: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metaRow: {
    alignItems: 'center',
    gap: 10,
  },
  readTime: {
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  cardActions: {
    alignItems: 'center',
    gap: 8,
  },
  cardActionBtn: {
    padding: 4,
  },
});

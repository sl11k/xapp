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
  Calendar,
  MapPin,
  Monitor,
  Search,
  Star,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { events, getLocalizedText } from '@/data/businessHub';
import type { EventItem } from '@/data/businessHub';
import { useLanguage } from '@/providers/LanguageProvider';
import { internalPageStyles } from '@/styles/internalPageStyles';
import { LottiePullToRefreshWrapper } from '@/components/LottiePullToRefreshWrapper';
import { Platform } from 'react-native';

const FILTERS_AR = ['الكل', 'عبر الإنترنت', 'حضوري', 'مميز'];
const FILTERS_EN = ['All', 'Online', 'In-person', 'Premium'];

function Header() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="events-back">
          {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'الفعاليات والويبينارات' : 'Events & Webinars'}
          </Text>
        </View>
      </View>
      <Text style={[styles.headerSub, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar'
          ? 'ورش عمل، تدريب، وجلسات مهنية من خبراء المجتمع'
          : 'Workshops, training, and professional sessions from community experts'}
      </Text>
      <Pressable style={({ pressed }) => [styles.searchBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }, pressed && styles.pressed]}>
        <Search color={colors.textMuted} size={18} />
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'ابحث عن فعالية...' : 'Search events...'}
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

const EventCard = React.memo(function EventCard({ item }: { item: EventItem }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();
  const isOnline = item.format.en.toLowerCase().includes('online') || item.format.en.toLowerCase().includes('live');
  const eventAccent = item.accent ?? colors.accent;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} testID={`event-${item.id}`}>
      <View style={[styles.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.dateBox, { backgroundColor: eventAccent + '12' }]}>
          <Text style={[styles.dateDay, { color: eventAccent }]}>{item.day}</Text>
          <Text style={[styles.dateMonth, { color: eventAccent }]}>{getLocalizedText(item.month, language)}</Text>
        </View>
        <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {getLocalizedText(item.title, language)}
          </Text>
          {item.description ? (
            <Text style={[styles.cardDesc, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {getLocalizedText(item.description, language)}
            </Text>
          ) : null}
          <View style={[styles.cardMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.cardHost}>{item.host}</Text>
            <View style={[styles.formatBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {isOnline ? <Monitor color={colors.sky} size={11} /> : <MapPin color={colors.rose} size={11} />}
              <Text style={[styles.formatText, { color: isOnline ? colors.sky : colors.rose }]}>
                {getLocalizedText(item.format, language)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.attendeesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Star color={colors.gold} size={13} />
          <Text style={styles.attendeesText}>
            {item.attendees} {language === 'ar' ? 'مشارك' : 'attendees'}
          </Text>
        </View>
        <Pressable style={({ pressed }) => [styles.registerBtn, { backgroundColor: eventAccent }, pressed && { opacity: 0.85 }]}>
          <Calendar color={colors.white} size={14} />
          <Text style={styles.registerText}>{language === 'ar' ? 'سجّل' : 'Register'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

export default function EventsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderItem = React.useCallback(({ item }: { item: EventItem }) => (
    <EventCard item={item} />
  ), []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <LottiePullToRefreshWrapper
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <FlatList
            data={events.slice(1)}
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
            testID="events-list"
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
    gap: 12,
    ...theme.shadow.sm,
  },
  cardRow: {
    gap: 14,
    alignItems: 'flex-start',
  },
  dateBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardInfo: {
    flex: 1,
    gap: 6,
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
  cardMeta: {
    alignItems: 'center',
    gap: 10,
  },
  cardHost: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  formatBadge: {
    alignItems: 'center',
    gap: 4,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  cardFooter: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesRow: {
    alignItems: 'center',
    gap: 5,
  },
  attendeesText: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
  },
  registerText: {
    color: c.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
});

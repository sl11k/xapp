import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, Shield, Users } from 'lucide-react-native';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { AppIcon } from '@/components/AppIcon';

export default function CommunitySettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const [notify, setNotify] = React.useState(true);
  const [approval, setApproval] = React.useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => router.back()}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{language === 'ar' ? 'إعدادات المجتمع' : 'Community Settings'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>ID: {id}</Text>

          <View style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <AppIcon icon={Bell} active />
              <Text style={[styles.rowText, { color: colors.text }]}>{language === 'ar' ? 'إشعارات المجتمع' : 'Community notifications'}</Text>
            </View>
            <Switch value={notify} onValueChange={setNotify} />
          </View>

          <View style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <AppIcon icon={Users} active />
              <Text style={[styles.rowText, { color: colors.text }]}>{language === 'ar' ? 'مراجعة طلبات الانضمام' : 'Review join requests'}</Text>
            </View>
            <Switch value={approval} onValueChange={setApproval} />
          </View>

          <View style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <AppIcon icon={Shield} active />
              <Text style={[styles.rowText, { color: colors.text }]}>{language === 'ar' ? 'خصوصية المجتمع' : 'Community privacy'}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.accent }]}>{language === 'ar' ? 'محفوظة' : 'Saved'}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
});

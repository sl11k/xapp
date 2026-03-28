import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Shield,
  Smartphone,
  Trash2,
  User,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme, ThemeMode } from '@/providers/ThemeProvider';

interface SettingToggle {
  id: string;
  label: string;
  icon: typeof Bell;
  color: string;
  value: boolean;
}

interface SettingLink {
  id: string;
  label: string;
  icon: typeof Bell;
  color: string;
  value?: string;
  danger?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[modalStyles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[modalStyles.container, { backgroundColor: colors.bgCard }]}>
          <Text style={[modalStyles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[modalStyles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={modalStyles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [modalStyles.cancelBtn, { backgroundColor: colors.bgMuted }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[modalStyles.cancelText, { color: colors.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                modalStyles.confirmBtn,
                danger ? { backgroundColor: colors.error } : { backgroundColor: colors.accent },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[modalStyles.confirmText, { color: colors.white }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const { colors, mode, setThemeMode } = useTheme();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.back();
    }
  }, [isAuthenticated, router]);

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const handleToggle = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case 'push': setPushNotifs((v) => !v); break;
      case 'email': setEmailNotifs((v) => !v); break;
      case 'private': setPrivateProfile((v) => !v); break;
    }
  }, []);

  const handleThemeSelect = (newMode: ThemeMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(newMode);
  };

  const renderLinkItem = (item: SettingLink) => (
    <Pressable
      key={item.id}
      onPress={() => {
        if (item.id === 'language') toggleLanguage();
        if (item.id === 'logout') setLogoutModal(true);
        if (item.id === 'delete') setDeleteModal(true);
        if (item.id === 'profile') router.push('/edit-profile');
      }}
      style={({ pressed }) => [styles.linkItem, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }, pressed && { backgroundColor: colors.bgMuted }]}
    >
      <View style={[styles.linkIcon, { backgroundColor: item.color + '15' }]}>
        <item.icon color={item.color} size={18} />
      </View>
      <Text style={[styles.linkLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: item.danger ? colors.error : colors.text }]}>
        {item.label}
      </Text>
      {item.value ? (
        <Text style={[styles.linkValue, { color: colors.textMuted }]}>{item.value}</Text>
      ) : null}
      <ChevronRight
        color={colors.textMuted}
        size={16}
        style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      />
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgMuted }]}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
            {language === 'ar' ? 'المظهر' : 'Appearance'}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.themeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable 
                onPress={() => handleThemeSelect('light')}
                style={[styles.themeOption, mode === 'light' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
              >
                <Sun color={mode === 'light' ? colors.accent : colors.textMuted} size={20} />
                <Text style={[styles.themeText, { color: mode === 'light' ? colors.accent : colors.textSecondary }]}>
                  {language === 'ar' ? 'فاتح' : 'Light'}
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => handleThemeSelect('dark')}
                style={[styles.themeOption, mode === 'dark' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
              >
                <Moon color={mode === 'dark' ? colors.accent : colors.textMuted} size={20} />
                <Text style={[styles.themeText, { color: mode === 'dark' ? colors.accent : colors.textSecondary }]}>
                  {language === 'ar' ? 'داكن' : 'Dark'}
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => handleThemeSelect('system')}
                style={[styles.themeOption, mode === 'system' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
              >
                <Monitor color={mode === 'system' ? colors.accent : colors.textMuted} size={20} />
                <Text style={[styles.themeText, { color: mode === 'system' ? colors.accent : colors.textSecondary }]}>
                  {language === 'ar' ? 'تلقائي' : 'Auto'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
            {language === 'ar' ? 'الحساب' : 'Account'}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {renderLinkItem({ id: 'profile', label: language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile', icon: User, color: colors.accent })}
            {renderLinkItem({ id: 'password', label: language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password', icon: Lock, color: colors.sky })}
          </View>

          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
            {language === 'ar' ? 'عام' : 'General'}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {renderLinkItem({ id: 'language', label: language === 'ar' ? 'اللغة' : 'Language', icon: Globe, color: colors.sky, value: language === 'ar' ? 'العربية' : 'English' })}
            {renderLinkItem({ id: 'about', label: language === 'ar' ? 'عن التطبيق' : 'About', icon: Info, color: colors.indigo, value: 'v1.0.0' })}
          </View>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, marginTop: 24 }]}>
            {renderLinkItem({ id: 'logout', label: language === 'ar' ? 'تسجيل الخروج' : 'Sign Out', icon: LogOut, color: colors.error, danger: true })}
            {renderLinkItem({ id: 'delete', label: language === 'ar' ? 'حذف الحساب' : 'Delete Account', icon: Trash2, color: colors.error, danger: true })}
          </View>

          <Text style={[styles.versionText, { color: colors.textMuted }]}>Business Hub v2.0.0 Redesign</Text>
          <View style={{ height: 100 }} />
        </ScrollView>

        <ConfirmModal
          visible={logoutModal}
          title={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          message={language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to sign out?'}
          confirmLabel={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          cancelLabel={language === 'ar' ? 'إلغاء' : 'Cancel'}
          danger
          onConfirm={() => {
            setLogoutModal(false);
            logout();
            router.replace('/welcome');
          }}
          onCancel={() => setLogoutModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  container: { width: '100%', borderRadius: 24, padding: 24, gap: 14 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
  confirmText: { fontSize: 15, fontWeight: '800' },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '800', paddingHorizontal: 4, paddingTop: 20, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  linkItem: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 16, fontWeight: '600' },
  linkValue: { fontSize: 14, fontWeight: '600', marginHorizontal: 4 },
  themeRow: { padding: 12, gap: 8 },
  themeOption: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  themeText: { fontSize: 13, fontWeight: '700' },
  versionText: { fontSize: 12, textAlign: 'center', marginTop: 32 },
});

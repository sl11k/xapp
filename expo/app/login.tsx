import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  UserRound,
  Sparkles,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { GlassView } from '@/components/GlassView';
import { PressableScale } from '@/components/PressableScale';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const { colors, isDark } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchMode = useCallback((newMode: AuthMode) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setMode(newMode);
      setLocalError(null);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    void Haptics.selectionAsync();
  }, [fadeAnim]);

  const isPending = isLoggingIn || isRegistering;

  const handleSubmit = useCallback(async () => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setLocalError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setLocalError(language === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await register({ email: email.trim(), password, name: name.trim() });
      }
      router.replace('/(tabs)');
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [email, password, name, mode, language, login, register, router]);

  const serverError = mode === 'login' ? loginError : registerError;
  const displayError = localError ?? serverError;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={isDark ? ['#020617', '#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, { backgroundColor: colors.accent, opacity: isDark ? 0.1 : 0.05 }]} />
      
      <SafeAreaView style={styles.safe}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PressableScale onPress={() => router.back()} style={styles.backBtn}>
            <GlassView intensity={30} borderRadius={20} style={styles.navBtnGlass}>
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </GlassView>
          </PressableScale>
          <PressableScale onPress={toggleLanguage}>
            <GlassView intensity={30} borderRadius={20} style={styles.langBtn}>
              <Globe color={colors.textSecondary} size={15} strokeWidth={2} />
              <Text style={[styles.langText, { color: colors.textSecondary }]}>
                {language === 'ar' ? 'English' : 'العربية'}
              </Text>
            </GlassView>
          </PressableScale>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroSection}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
                <Sparkles color={colors.accent} size={32} strokeWidth={2.5} />
              </View>
              <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
                {mode === 'login'
                  ? (language === 'ar' ? 'مرحباً بك مجدداً' : 'Welcome Back')
                  : (language === 'ar' ? 'ابدأ رحلتك معنا' : 'Start Your Journey')
                }
              </Text>
              <Text style={[styles.heroSub, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {mode === 'login'
                  ? (language === 'ar' ? 'سجل دخولك للوصول إلى مجتمعك المهني' : 'Sign in to access your professional community')
                  : (language === 'ar' ? 'انضم إلى أكبر منصة مهنية في المنطقة' : 'Join the premier professional platform in the region')
                }
              </Text>
            </View>

            <View style={[styles.tabRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <PressableScale
                onPress={() => switchMode('login')}
                style={[styles.tab, mode === 'login' && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.tabText, { color: mode === 'login' ? '#FFF' : colors.textMuted }]}>
                  {language === 'ar' ? 'دخول' : 'Sign In'}
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => switchMode('register')}
                style={[styles.tab, mode === 'register' && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.tabText, { color: mode === 'register' ? '#FFF' : colors.textMuted }]}>
                  {language === 'ar' ? 'تسجيل' : 'Register'}
                </Text>
              </PressableScale>
            </View>

            <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
              <GlassView intensity={isDark ? 20 : 40} borderRadius={30} style={styles.formGlass} padding={24}>
                {mode === 'register' && (
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </Text>
                    <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bg }]}>
                      <UserRound color={colors.textMuted} size={18} strokeWidth={2} />
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder={language === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
                        placeholderTextColor={colors.textMuted + '80'}
                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Text>
                  <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bg }]}>
                    <Mail color={colors.textMuted} size={18} strokeWidth={2} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="example@email.com"
                      placeholderTextColor={colors.textMuted + '80'}
                      style={[styles.input, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </Text>
                  <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bg }]}>
                    <Lock color={colors.textMuted} size={18} strokeWidth={2} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={language === 'ar' ? '٦ أحرف على الأقل' : 'At least 6 characters'}
                      placeholderTextColor={colors.textMuted + '80'}
                      style={[styles.input, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      {showPassword ? (
                        <EyeOff color={colors.textMuted} size={18} strokeWidth={2} />
                      ) : (
                        <Eye color={colors.textMuted} size={18} strokeWidth={2} />
                      )}
                    </Pressable>
                  </View>
                </View>

                {displayError && (
                  <View style={[styles.errorBox, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
                  </View>
                )}

                <PressableScale
                  onPress={handleSubmit}
                  disabled={isPending}
                  style={styles.submitBtn}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isPending ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {mode === 'login'
                          ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                          : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
                        }
                      </Text>
                    )}
                  </LinearGradient>
                </PressableScale>
              </GlassView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  } as any,
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
  },
  navBtnGlass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    gap: 12,
    marginTop: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    ...theme.typography.display,
    fontSize: 32,
    textAlign: 'center',
  },
  heroSub: {
    ...theme.typography.title3,
    textAlign: 'center',
    opacity: 0.8,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '800',
  },
  formSection: {
    gap: 20,
  },
  formGlass: {
    gap: 20,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldInput: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  errorBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 12,
  },
  submitGradient: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

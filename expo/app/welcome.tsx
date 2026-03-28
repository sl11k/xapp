import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Globe, Shield, TrendingUp, Users } from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

function FeatureItem({ icon: Icon, title, color, delay }: { icon: typeof Users; title: string; color: string; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={[styles.featureItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.featureIcon, { backgroundColor: color + '15' }]}>
        <Icon color={color} size={20} strokeWidth={1.5} />
      </View>
      <Text style={styles.featureText}>{title}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { colors, isDark } = useTheme();
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [heroFade, heroSlide]);

  const { enterGuest } = useAuth();

  const handleGetStarted = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/login');
  }, [router]);

  const handleGuest = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    enterGuest();
    router.replace('/(tabs)');
  }, [router, enterGuest]);

  const features = language === 'ar'
    ? [
        { icon: Users, title: 'مجتمعات مهنية متخصصة', color: colors.accent },
        { icon: TrendingUp, title: 'سوق خدمات احترافية', color: colors.orange },
        { icon: Shield, title: 'مركز الحوكمة والامتثال', color: colors.teal },
      ]
    : [
        { icon: Users, title: 'Specialized professional communities', color: colors.accent },
        { icon: TrendingUp, title: 'Professional services marketplace', color: colors.orange },
        { icon: Shield, title: 'Governance & compliance hub', color: colors.teal },
      ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={isDark ? ['#020617', '#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, { backgroundColor: colors.accent, opacity: isDark ? 0.1 : 0.05 }]} />
      
      <SafeAreaView style={styles.safe}>
        <View style={[styles.langRow, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
          <Pressable onPress={toggleLanguage} style={({ pressed }) => [styles.langBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.7 }]}>
            <Globe color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)"} size={15} strokeWidth={1.5} />
            <Text style={[styles.langText, { color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }]}>{language === 'ar' ? 'English' : 'العربية'}</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
            <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
              <View style={styles.logoInner}>
                <View style={styles.logoNode} />
                <View style={styles.logoLine1} />
                <View style={styles.logoLine2} />
                <View style={styles.logoNode2} />
                <View style={styles.logoNode3} />
              </View>
            </View>

            <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
              {language === 'ar' ? 'مجتمع\nالأعمال' : 'Business\nHub'}
            </Text>
            <Text style={[styles.heroSub, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
              {language === 'ar'
                ? 'المنصة المهنية الأولى للتواصل والمعرفة والخدمات الاحترافية'
                : 'The premier professional platform for networking, knowledge, and expert services'}
            </Text>
          </Animated.View>

          <View style={styles.features}>
            {features.map((f, i) => (
              <FeatureItem key={i} icon={f.icon} title={f.title} color={f.color} delay={400 + i * 150} />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.primaryBtnText, { color: isDark ? '#0A0A0F' : '#FFF' }]}>
              {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
            </Text>
            <ArrowRight color={isDark ? '#0A0A0F' : '#FFF'} size={18} strokeWidth={2} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </Pressable>

          <Pressable
            onPress={handleGuest}
            style={({ pressed }) => [styles.guestBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.guestBtnText, { color: colors.textMuted }]}>
              {language === 'ar' ? 'تصفح كضيف' : 'Browse as Guest'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  safe: {
    flex: 1,
  },
  langRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  langText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  hero: {
    gap: 16,
    marginBottom: 44,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoInner: {
    width: 36,
    height: 36,
    position: 'relative',
  },
  logoNode: {
    position: 'absolute',
    top: 2,
    left: 13,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  logoLine1: {
    position: 'absolute',
    top: 12,
    left: 7,
    width: 1.5,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-30deg' }],
  },
  logoLine2: {
    position: 'absolute',
    top: 12,
    right: 7,
    width: 1.5,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '30deg' }],
  },
  logoNode2: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  logoNode3: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: -0.32,
  },
  actions: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
  },
  primaryBtnText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  guestBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: -0.32,
  },
});

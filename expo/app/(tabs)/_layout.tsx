import { Tabs } from 'expo-router';
import {
  Compass,
  Home,
  MessageSquare,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();

  const tabLabels = {
    home:        language === 'ar' ? 'الرئيسية' : 'Home',
    communities: language === 'ar' ? 'اكتشف'   : 'Discover',
    messages:    language === 'ar' ? 'الرسائل'  : 'Messages',
    marketplace: language === 'ar' ? 'السوق'    : 'Market',
    more:        language === 'ar' ? 'حسابي'    : 'Profile',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          height: 68,
          borderRadius: 34,
          paddingBottom: 0,
          overflow: 'hidden',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 34,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.tabBarBorder,
                overflow: 'hidden',
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(15,23,42,0.96)', 'rgba(15,23,42,0.82)']
                  : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.90)']
              }
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          marginBottom: 8,
          lineHeight: 13,
          letterSpacing: 0.1,
        },
        tabBarItemStyle: {
          height: 68,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabLabels.home,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />}
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={[s.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: tabLabels.communities,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />}
              <Compass color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={[s.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: tabLabels.messages,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />}
              <MessageSquare color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={[s.activeDot, { backgroundColor: colors.accent }]} />}
              {/* Unread dot */}
              <View style={[s.unreadDot, { backgroundColor: colors.error, borderColor: isDark ? '#020617' : '#F8FAFC' }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: tabLabels.marketplace,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />}
              <ShoppingBag color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={[s.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: tabLabels.more,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />}
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={[s.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.1,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});

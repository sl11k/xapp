import { Tabs } from 'expo-router';
import {
  Compass,
  Home,
  MessageSquare,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();

  const tabLabels = {
    home: language === 'ar' ? 'الرئيسية' : 'Home',
    communities: language === 'ar' ? 'اكتشف' : 'Discover',
    messages: language === 'ar' ? 'الرسائل' : 'Messages',
    marketplace: language === 'ar' ? 'السوق' : 'Market',
    more: language === 'ar' ? 'حسابي' : 'Profile',
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
          bottom: 24,
          left: 20,
          right: 20,
          height: 72,
          borderRadius: 36,
          paddingBottom: 0,
          overflow: 'hidden',
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 36,
                borderWidth: 1,
                borderColor: colors.tabBarBorder,
                overflow: 'hidden',
              },
            ]}
          >
            <LinearGradient
              colors={isDark ? ['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 0.7)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700' as const,
          marginBottom: 8,
          lineHeight: 14,
        },
        tabBarItemStyle: {
          height: 72,
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
              {focused && (
                <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />
              )}
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
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
              {focused && (
                <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />
              )}
              <Compass color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
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
              {focused && (
                <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />
              )}
              <MessageSquare color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
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
              {focused && (
                <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />
              )}
              <ShoppingBag color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
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
              {focused && (
                <View style={[s.activeGlow, { backgroundColor: colors.accent }]} />
              )}
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
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
    width: 50,
    height: 34,
  },
  activeGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.1,
  },
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { I18nManager, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function RootLayoutNav() {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      }
    }
  }, [isRTL]);

  return (
    <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
      <Stack screenOptions={{
        headerBackTitle: 'Back',
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animationTypeForReplace: 'push',
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="community/[id]" />
        <Stack.Screen name="community/[id]/settings" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="service/[id]" />
        <Stack.Screen name="create-service" options={{ presentation: 'modal', gestureDirection: 'vertical' }} />
        <Stack.Screen name="request-service" options={{ presentation: 'modal', gestureDirection: 'vertical' }} />
        <Stack.Screen name="rate-service" options={{ presentation: 'modal', gestureDirection: 'vertical' }} />
        <Stack.Screen name="my-requests" />
        <Stack.Screen name="new-conversation" options={{ presentation: 'modal', gestureDirection: 'vertical' }} />
        <Stack.Screen name="governance" />
        <Stack.Screen name="knowledge" />
        <Stack.Screen name="events" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen
          name="create-post"
          options={{
            presentation: 'modal',
            gestureDirection: 'vertical',
            contentStyle: { backgroundColor: colors.bgCard },
          }}
        />
      </Stack>
    </View>
  );
}

function ThemedRoot() {
  const { colors } = useTheme();

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] ready v3');
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export type SupportedLanguage = 'ar' | 'en';

type TranslationLeaf = string;
type TranslationTree = {
  [key: string]: TranslationLeaf | TranslationTree;
};

const STORAGE_KEY = 'business-hub-language';

const translations: Record<SupportedLanguage, TranslationTree> = {
  ar: {
    tabs: {
      home: 'الرئيسية',
      communities: 'استكشاف',
      messages: 'الرسائل',
      marketplace: 'السوق',
      more: 'الملف',
    },
    common: {
      switchToEnglish: 'English',
      switchToArabic: 'العربية',
      guestMode: 'تصفح كضيف',
      exploreNow: 'استكشف الآن',
      viewAll: 'عرض الكل',
      premium: 'مميز',
    },
  },
  en: {
    tabs: {
      home: 'Home',
      communities: 'Explore',
      messages: 'Messages',
      marketplace: 'Marketplace',
      more: 'Profile',
    },
    common: {
      switchToEnglish: 'English',
      switchToArabic: 'العربية',
      guestMode: 'Browse as guest',
      exploreNow: 'Explore now',
      viewAll: 'View all',
      premium: 'Premium',
    },
  },
};

function readNestedValue(source: TranslationTree, path: string): string {
  const segments = path.split('.');
  let current: TranslationLeaf | TranslationTree = source;

  for (const segment of segments) {
    if (typeof current === 'string') {
      return path;
    }

    const nextValue: TranslationLeaf | TranslationTree | undefined = current[segment];

    if (!nextValue) {
      return path;
    }

    current = nextValue;
  }

  return typeof current === 'string' ? current : path;
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<SupportedLanguage>('ar');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedValue === 'ar' || storedValue === 'en') {
          console.log('[LanguageProvider] loaded stored language', storedValue);
          setLanguage(storedValue);
        }
      } catch (error) {
        console.log('[LanguageProvider] failed to load language', error);
      }
    };

    void loadLanguage();
  }, []);

  const isRTL = language === 'ar';

  const toggleLanguage = useCallback(() => {
    setLanguage((currentLanguage) => {
      const nextLanguage: SupportedLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
      console.log('[LanguageProvider] toggling language', { currentLanguage, nextLanguage });
      void AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
      return nextLanguage;
    });
  }, []);

  const t = useCallback(
    (path: string) => readNestedValue(translations[language], path),
    [language],
  );

  return useMemo(
    () => ({
      language,
      isRTL,
      toggleLanguage,
      t,
    }),
    [isRTL, language, t, toggleLanguage],
  );
});

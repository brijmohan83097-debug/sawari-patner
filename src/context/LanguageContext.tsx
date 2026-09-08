import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SupportedLanguage, 
  SUPPORTED_LANGUAGES, 
  TRANSLATIONS, 
  TranslationKey, 
  LanguageInfo 
} from '../i18n/translations';
import { soundManager } from '../utils/audio';

export type AppTheme = 'dark' | 'light';
export type DefaultNavigation = 'google_maps' | 'in_app';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  t: (key: TranslationKey, fallback?: string) => string;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  defaultNavigation: DefaultNavigation;
  setDefaultNavigation: (nav: DefaultNavigation) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language state with localStorage persistence
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('sawari_language');
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved as SupportedLanguage;
      }
    } catch {
      // ignore
    }
    return 'hi'; // Default friendly language: Hindi (or English)
  });

  // 2. Theme mode state with localStorage persistence
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('sawari_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // 3. Sound alerts state
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return soundManager.isEnabled();
  });

  // 4. Default Navigation preference
  const [defaultNavigation, setDefaultNavigationState] = useState<DefaultNavigation>(() => {
    try {
      const saved = localStorage.getItem('sawari_default_nav');
      if (saved === 'in_app' || saved === 'google_maps') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'google_maps';
  });

  // Persist language change
  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('sawari_language', newLang);
    } catch {
      // ignore
    }
  };

  // Persist theme change
  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('sawari_theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Persist sound state
  const setSoundEnabled = (enabled: boolean) => {
    soundManager.setEnabled(enabled);
    setSoundEnabledState(enabled);
  };

  const toggleSound = () => {
    const updated = soundManager.toggleSound();
    setSoundEnabledState(updated);
  };

  // Persist default navigation
  const setDefaultNavigation = (nav: DefaultNavigation) => {
    setDefaultNavigationState(nav);
    try {
      localStorage.setItem('sawari_default_nav', nav);
    } catch {
      // ignore
    }
  };

  // Sync theme to root class on mount
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  // Translation lookup helper
  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    const fallbackDict = TRANSLATIONS.en;
    if (fallbackDict && fallbackDict[key]) {
      return fallbackDict[key];
    }
    return fallback || key;
  };

  const currentLanguageInfo = 
    SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageInfo,
        languages: SUPPORTED_LANGUAGES,
        t,
        theme,
        setTheme,
        toggleTheme,
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        defaultNavigation,
        setDefaultNavigation
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback to avoid uncaught crashes in standalone or testing rendering
    const fallbackLang = 'hi' as SupportedLanguage;
    const fallbackInfo = SUPPORTED_LANGUAGES[0];
    return {
      language: fallbackLang,
      setLanguage: () => {},
      currentLanguageInfo: fallbackInfo,
      languages: SUPPORTED_LANGUAGES,
      t: (key: TranslationKey, fallback?: string) => {
        return TRANSLATIONS.hi?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
      },
      theme: 'dark' as AppTheme,
      setTheme: () => {},
      toggleTheme: () => {},
      soundEnabled: true,
      setSoundEnabled: () => {},
      toggleSound: () => true,
      defaultNavigation: 'google_maps' as DefaultNavigation,
      setDefaultNavigation: () => {}
    };
  }
  return context;
}

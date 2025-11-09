import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language } from "./i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("orange-tool-language");
    return (stored === "ar" || stored === "en") ? stored : "en";
  });

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("orange-tool-language", language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const resolveKey = (lang: Language, key: string): string | undefined => {
    const segments = key.split(".");
    let value: unknown = translations[lang];
    for (const segment of segments) {
      if (value && typeof value === "object" && segment in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }
    return typeof value === "string" ? value : undefined;
  };

  const t = (key: string): string => {
    return resolveKey(language, key) ?? resolveKey("en", key) ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

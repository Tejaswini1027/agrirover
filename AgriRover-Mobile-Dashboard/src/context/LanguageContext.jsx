import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadCache, saveCache, translateText } from '../i18n/translate';
import { RTL_LANGS } from '../i18n/languages';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(() => localStorage.getItem('agv-lang') || 'en');
    const [cache, setCache] = useState(() => loadCache());
    const [pendingCount, setPendingCount] = useState(0);
    const pending = useRef(new Set());

    useEffect(() => {
        document.documentElement.setAttribute('dir', RTL_LANGS.has(language) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', language);
    }, [language]);

    const setLanguage = useCallback((lang) => {
        setLanguageState(lang);
        localStorage.setItem('agv-lang', lang);
    }, []);

    const t = useCallback(
        (text) => {
            if (!text || language === 'en') return text;
            const langCache = cache[language];
            if (langCache && langCache[text] !== undefined) return langCache[text];

            const key = `${language}::${text}`;
            if (!pending.current.has(key)) {
                pending.current.add(key);
                setPendingCount((n) => n + 1);
                translateText(text, language).then((translated) => {
                    pending.current.delete(key);
                    setPendingCount((n) => Math.max(0, n - 1));
                    setCache((prev) => {
                        const next = { ...prev, [language]: { ...(prev[language] || {}), [text]: translated } };
                        saveCache(next);
                        return next;
                    });
                });
            }
            return text;
        },
        [language, cache]
    );

    const value = useMemo(() => ({ language, setLanguage, t, translating: pendingCount > 0 }), [language, setLanguage, t, pendingCount]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export function useT() {
    return useContext(LanguageContext).t;
}

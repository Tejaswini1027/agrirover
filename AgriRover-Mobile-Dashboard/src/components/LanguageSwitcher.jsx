import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';
import { LANGUAGES } from '../i18n/languages';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage, translating } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <motion.button
                onClick={() => setOpen((v) => !v)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                aria-label="Change language"
                className="relative w-8 h-8 md:w-9 md:h-9 rounded-xl bg-panel-soft border border-line flex items-center justify-center text-muted hover:text-ink"
            >
                {current.code === 'en' ? (
                    <Icon name="language" size={17} />
                ) : (
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-accent">{current.code}</span>
                )}
                {translating && (
                    <motion.span
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 mt-2 w-48 max-h-80 overflow-y-auto rounded-2xl bg-panel border border-line shadow-2xl p-1.5 z-40"
                    >
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => {
                                    setLanguage(l.code);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition-colors ${
                                    l.code === language ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-panel-soft'
                                }`}
                            >
                                <span className="w-6 text-[10px] font-extrabold uppercase tracking-wide text-muted">{l.code}</span>
                                <span className="flex-1">{l.label}</span>
                                {l.code === language && <Icon name="check" size={16} className="text-accent" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

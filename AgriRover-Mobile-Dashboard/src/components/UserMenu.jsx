import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';

export default function UserMenu() {
    const t = useT();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';

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
                className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-accent flex items-center justify-center text-accent-ink text-xs font-extrabold"
            >
                {initial}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 mt-2 w-48 rounded-2xl bg-panel border border-line shadow-2xl p-1.5 z-40"
                    >
                        <div className="px-3 py-2 border-b border-line mb-1">
                            <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                            <p className="text-[10px] text-muted">{t('Signed in with Face ID')}</p>
                        </div>
                        <button
                            onClick={() => { setOpen(false); logout(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left text-rose hover:bg-rose-soft transition-colors"
                        >
                            <Icon name="logout" size={16} />
                            {t('Log Out')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

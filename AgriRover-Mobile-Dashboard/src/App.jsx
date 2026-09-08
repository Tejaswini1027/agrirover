import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavContext } from './context/NavContext';
import { useT } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import Icon from './components/Icon';
import ThemeToggle from './components/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';
import UserMenu from './components/UserMenu';
import FloatingDock from './components/FloatingDock';
import AuthScreen from './auth/AuthScreen';
import Overview from './sections/Overview';
import FieldOps from './sections/FieldOps';
import Intelligence from './sections/Intelligence';
import Activity from './sections/Activity';
import { farm, rover, SIMULATION_MODE, alerts } from './data/simulation';

const SECTIONS = { overview: Overview, field: FieldOps, intel: Intelligence, activity: Activity };

// One shared page container so the header and the main content are always
// aligned to the same edges. No fixed max-width — the app fills the viewport
// on large screens; the responsive padding just keeps comfortable gutters
// instead of a dead band on the right.
const CONTAINER = 'w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14';

function useTheme() {
    const [theme, setTheme] = useState(() => localStorage.getItem('agv-theme') || 'dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('agv-theme', theme);
    }, [theme]);
    return [theme, setTheme];
}

function LoadingSplash() {
    return <div className="min-h-screen bg-canvas" />;
}

export default function App() {
    const t = useT();
    const { isAuthenticated, checking } = useAuth();
    const [theme, setTheme] = useTheme();
    const [tab, setTab] = useState('overview');
    const unreadAlerts = alerts.filter((a) => a.severity !== 'info').length;
    const ActiveSection = SECTIONS[tab];

    const TABS = [
        { id: 'overview', label: t('Overview'), icon: 'dashboard' },
        { id: 'field', label: t('Field Ops'), icon: 'satellite_alt' },
        { id: 'intel', label: t('Intelligence'), icon: 'insights' },
        { id: 'activity', label: t('Activity'), icon: 'notifications' },
    ];

    if (checking) return <LoadingSplash />;
    if (!isAuthenticated) return <AuthScreen />;

    return (
        <NavContext.Provider value={{ goTo: setTab }}>
            <div className="min-h-screen bg-canvas text-text flex flex-col">
                <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-line">
                    <div className={`${CONTAINER} h-14 md:h-16 flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-accent flex items-center justify-center shrink-0"
                            >
                                <Icon name="eco" size={18} className="text-accent-ink" fill />
                            </motion.div>
                            <div className="min-w-0">
                                <p className="font-display font-extrabold text-[13px] md:text-sm leading-none text-ink">AgriVision</p>
                                <p className="text-[10px] md:text-[11px] text-muted mt-0.5 truncate">{t(farm.name)} · {t(farm.sector)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                            {SIMULATION_MODE && (
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-amber-soft text-amber text-[9px] md:text-[10px] font-bold uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber pulse-dot" />
                                    {t('Simulation')}
                                </span>
                            )}
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-soft text-accent text-[10px] font-bold uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                {rover.status}
                            </span>
                            <LanguageSwitcher />
                            <ThemeToggle theme={theme} setTheme={setTheme} />
                            <UserMenu />
                        </div>
                    </div>
                </header>

                <main className={`${CONTAINER} flex-1 pt-5 md:pt-7 pb-32 md:pb-28 overflow-x-hidden`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab}
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -18 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <ActiveSection />
                        </motion.div>
                    </AnimatePresence>
                </main>

                <FloatingDock tabs={TABS} active={tab} onChange={setTab} badges={{ activity: unreadAlerts || null }} />
            </div>
        </NavContext.Provider>
    );
}

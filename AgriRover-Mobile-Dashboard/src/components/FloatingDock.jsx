import { motion } from 'framer-motion';
import Icon from './Icon';

export default function FloatingDock({ tabs, active, onChange, badges = {} }) {
    return (
        <nav className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}>
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.1 }}
                className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-[26px] bg-panel/80 backdrop-blur-xl border border-line shadow-[0_8px_32px_rgba(0,0,0,0.18)] max-w-full overflow-x-auto"
            >
                {tabs.map((t) => {
                    const isActive = active === t.id;
                    const badge = badges[t.id];
                    return (
                        <motion.button
                            key={t.id}
                            onClick={() => onChange(t.id)}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="relative flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-3xl shrink-0"
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="dock-active"
                                    className="absolute inset-0 bg-accent rounded-3xl"
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                />
                            )}
                            <span className={`relative flex items-center gap-1.5 ${isActive ? 'text-accent-ink' : 'text-muted'}`}>
                                <Icon name={t.icon} size={21} fill={isActive} />
                                <motion.span
                                    initial={false}
                                    animate={{ width: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0, marginLeft: isActive ? 2 : 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden whitespace-nowrap text-[13px] font-bold"
                                >
                                    {t.label}
                                </motion.span>
                            </span>
                            {!!badge && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose text-white text-[9px] font-bold flex items-center justify-center border-2 border-panel">
                                    {badge}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>
        </nav>
    );
}

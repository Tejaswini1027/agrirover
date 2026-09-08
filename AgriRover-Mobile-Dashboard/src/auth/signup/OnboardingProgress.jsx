import { motion } from 'framer-motion';
import Icon from '../../components/Icon';
import { useT } from '../../context/LanguageContext';

// Three high-level phases so the user always knows where they are, even
// though the middle phase spans several screens (scan, personal, location,
// farm).
export default function OnboardingProgress({ phase }) {
    const t = useT();
    const phases = [t('Face'), t('Details'), t('Review')];

    return (
        <div className="flex items-center gap-2 mb-5">
            {phases.map((label, i) => {
                const done = i < phase;
                const active = i === phase;
                return (
                    <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                        <div className="flex items-center gap-1.5">
                            <motion.span
                                animate={{ scale: active ? 1 : 0.9 }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    done ? 'bg-accent' : active ? 'bg-accent' : 'bg-white/10'
                                }`}
                            >
                                {done ? (
                                    <Icon name="check" size={12} className="text-accent-ink" />
                                ) : (
                                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent-ink' : 'bg-white/40'}`} />
                                )}
                            </motion.span>
                            <span className={`text-[11px] font-medium ${done || active ? 'text-white/85' : 'text-white/35'}`}>
                                {label}
                            </span>
                        </div>
                        {i < phases.length - 1 && (
                            <div className="flex-1 h-px bg-white/10 relative overflow-hidden min-w-[8px]">
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-accent"
                                    initial={false}
                                    animate={{ width: done ? '100%' : '0%' }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

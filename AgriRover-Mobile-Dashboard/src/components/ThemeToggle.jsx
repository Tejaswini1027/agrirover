import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

export default function ThemeToggle({ theme, setTheme }) {
    const next = theme === 'dark' ? 'light' : 'dark';
    return (
        <motion.button
            onClick={() => setTheme(next)}
            whileTap={{ scale: 0.88, rotate: 20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            aria-label="Toggle theme"
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-panel-soft border border-line flex items-center justify-center text-muted hover:text-ink overflow-hidden"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={theme}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-center"
                >
                    <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={17} />
                </motion.span>
            </AnimatePresence>
        </motion.button>
    );
}

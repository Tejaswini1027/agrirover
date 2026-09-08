import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../Icon';

// idle -> loading -> success -> back to idle (or caller-controlled via onSettle)
export default function StatefulButton({
    onPress,
    idleLabel,
    loadingLabel = 'Working…',
    successLabel = 'Done',
    idleIcon = 'play_arrow',
    className = '',
    tone = 'accent',
    disabled = false,
}) {
    const [state, setState] = useState('idle');

    const TONE = {
        accent: 'bg-accent text-accent-ink',
        rose: 'bg-rose text-white',
        panel: 'bg-panel-soft text-ink',
    };

    const run = async () => {
        if (state !== 'idle' || disabled) return;
        setState('loading');
        try {
            await onPress?.();
            setState('success');
            setTimeout(() => setState('idle'), 1100);
        } catch {
            setState('idle');
        }
    };

    return (
        <motion.button
            onClick={run}
            disabled={disabled || state !== 'idle'}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`relative overflow-hidden flex items-center justify-center gap-1.5 font-bold disabled:cursor-default ${TONE[tone]} ${className}`}
        >
            <AnimatePresence mode="wait" initial={false}>
                {state === 'idle' && (
                    <motion.span key="idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="flex items-center gap-1.5">
                        <Icon name={idleIcon} size={16} />
                        {idleLabel}
                    </motion.span>
                )}
                {state === 'loading' && (
                    <motion.span key="loading" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="flex items-center gap-1.5">
                        <Icon name="progress_activity" size={16} className="animate-spin" />
                        {loadingLabel}
                    </motion.span>
                )}
                {state === 'success' && (
                    <motion.span key="success" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="flex items-center gap-1.5">
                        <Icon name="check_circle" size={16} fill />
                        {successLabel}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

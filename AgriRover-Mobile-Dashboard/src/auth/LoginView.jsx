import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import FaceScanner from '../components/auth/FaceScanner';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';

export default function LoginView() {
    const t = useT();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    // Remounts the scanner after a failed attempt so it returns to a clean
    // idle state instead of sitting on its success screen.
    const [attempt, setAttempt] = useState(0);

    const handleCapture = async (descriptor) => {
        setError('');
        setBusy(true);
        try {
            await login(descriptor);
            // On success AuthContext swaps this screen out entirely.
        } catch (err) {
            setError(err.message);
            setBusy(false);
            setAttempt((n) => n + 1);
        }
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1.5 text-center">
                <h2 className="font-display font-bold text-lg text-white">{t('Welcome back 🌱')}</h2>
                <p className="text-[13px] text-white/50">{t('Your face is your key.')}</p>
            </div>

            <FaceScanner key={attempt} onCapture={handleCapture} />

            {busy && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-1.5 text-[12px] text-white/50"
                >
                    <Icon name="progress_activity" size={13} className="animate-spin" />
                    {t('Recognizing…')}
                </motion.p>
            )}

            {error && !busy && (
                <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
                    transition={{ duration: 0.4 }}
                    className="w-full text-center"
                >
                    <p className="text-[13px] text-rose font-medium">{t("We couldn't recognize you")}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{error}</p>
                </motion.div>
            )}
        </div>
    );
}

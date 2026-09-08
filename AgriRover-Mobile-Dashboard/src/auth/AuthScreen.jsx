import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import LoginView from './LoginView';
import SignupFlow from './signup/SignupFlow';
import { useT } from '../context/LanguageContext';

export default function AuthScreen() {
    const t = useT();
    const [mode, setMode] = useState('login'); // 'login' | 'signup'

    return (
        <div className="agv-auth flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient dark agricultural backdrop — restrained, not colorful */}
            <div className="absolute inset-0 bg-[radial-gradient(1100px_700px_at_20%_-10%,rgba(126,216,63,0.10),transparent_60%),radial-gradient(900px_600px_at_100%_110%,rgba(63,176,216,0.08),transparent_60%)]" />
            <motion.div
                className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-[100px]"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-sky/10 blur-[100px]"
                animate={{ scale: [1.15, 1, 1.15] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                className="relative w-full max-w-sm agv-glass-card rounded-[28px] p-6 sm:p-7"
            >
                <div className="flex flex-col items-center gap-2 mb-6">
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(126,216,63,0.55)]"
                    >
                        <Icon name="eco" size={28} className="text-accent-ink" fill />
                    </motion.div>
                    <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">AgriVision</h1>
                    <p className="text-[13px] text-white/45 text-center">{t('Your farm. Smarter.')}</p>
                </div>

                <div className="relative flex items-center gap-1 bg-white/5 rounded-2xl p-1 mb-6 border border-white/10">
                    <motion.span
                        layout
                        className="absolute top-1 bottom-1 rounded-xl bg-accent"
                        animate={{ left: mode === 'login' ? '4px' : '50%', right: mode === 'login' ? '50%' : '4px' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                    {['login', 'signup'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${mode === m ? 'text-accent-ink' : 'text-white/50'}`}
                        >
                            {m === 'login' ? t('Log In') : t('Sign Up')}
                        </button>
                    ))}
                </div>

                {/* No AnimatePresence mode="wait" here: waiting on an exit
                    animation before mounting the new view lets a quick tab tap
                    strand the old view in the DOM. Swap immediately, animate the
                    entrance only. */}
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'signup' ? 16 : -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {mode === 'login' ? <LoginView /> : <SignupFlow />}
                </motion.div>

                {mode === 'login' && (
                    <p className="text-[11px] text-white/35 text-center leading-relaxed mt-5">
                        {t("Don't have an account?")}{' '}
                        <button onClick={() => setMode('signup')} className="text-accent font-semibold underline underline-offset-2">
                            {t('Sign up')}
                        </button>
                    </p>
                )}
            </motion.div>
        </div>
    );
}

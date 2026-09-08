import { motion } from 'framer-motion';
import Icon from '../../components/Icon';
import FaceScanner from '../../components/auth/FaceScanner';
import { useT } from '../../context/LanguageContext';

export default function SignupStepFace({ descriptor, onCapture, onContinue }) {
    const t = useT();

    if (descriptor) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                    className="w-20 h-20 rounded-full bg-accent flex items-center justify-center"
                >
                    <Icon name="check" size={36} className="text-accent-ink" />
                </motion.div>
                <p className="text-[15px] font-semibold text-white">{t('Face registered successfully ✓')}</p>
                <p className="text-[12px] text-white/45 text-center max-w-[260px] leading-relaxed">
                    {t('Your face is converted into a secure digital key on your device. Your photo is not stored.')}
                </p>
                <motion.button
                    onClick={onContinue}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-3.5 rounded-2xl bg-accent text-accent-ink text-sm font-bold mt-1"
                >
                    {t('Continue')}
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-[13px] text-white/55 text-center leading-relaxed">
                {t("First, let's secure your account with Face Login.")}
            </p>
            {/* Average several frames at enrolment: this vector is what every
                future login is measured against, so its quality matters most. */}
            <FaceScanner onCapture={onCapture} samples={5} />
        </div>
    );
}

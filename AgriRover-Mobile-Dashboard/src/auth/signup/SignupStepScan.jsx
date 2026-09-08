import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/Icon';
import DocumentScanner from '../../components/auth/DocumentScanner';
import { scanDocument } from '../../services/ocrService';
import { useT } from '../../context/LanguageContext';

// Offers document scanning as the fast path to filling the profile, with
// manual entry always available — camera denial, a blurry card, or OCR
// simply failing must never dead-end the registration.
export default function SignupStepScan({ onExtracted, onManual }) {
    const t = useT();
    const [scanning, setScanning] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const handleCapture = async (imageDataUrl) => {
        setBusy(true);
        setError('');

        const result = await scanDocument(imageDataUrl);

        // The captured image is dropped here: it is not kept in state, not
        // cached, and never sent anywhere except the one OCR request above.
        setBusy(false);

        if (!result.ok) {
            setScanning(false);
            setError(result.error);
            return;
        }
        onExtracted(result.fields, result.confidence);
    };

    if (scanning) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-[13px] text-white/55 text-center">
                    {t('Place your Aadhaar card inside the frame')}
                </p>
                <DocumentScanner
                    onCapture={handleCapture}
                    onCancel={() => setScanning(false)}
                    busy={busy}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon name="id_card" size={26} className="text-accent" />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{t("Let's get your details")}</h3>
                <p className="text-[12px] text-white/45 leading-relaxed max-w-[280px]">
                    {t('Scan your Aadhaar card to fill your profile automatically. You can review and edit everything before saving.')}
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-rose/10 border border-rose/25 px-4 py-3"
                >
                    <p className="text-[12px] text-rose leading-snug">{error}</p>
                </motion.div>
            )}

            <motion.button
                onClick={() => { setError(''); setScanning(true); }}
                whileTap={{ scale: 0.96 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-accent-ink text-sm font-bold"
            >
                <Icon name="photo_camera" size={18} />
                {error ? t('Scan Again') : t('Scan Aadhaar Card')}
            </motion.button>

            <button
                onClick={onManual}
                className="w-full py-3.5 rounded-2xl agv-glass-input text-sm font-semibold"
            >
                {t('Enter Details Manually')}
            </button>

            <p className="text-[11px] text-white/30 text-center leading-relaxed">
                {t('Your card image is used only to read the text and is never saved. Scanning fills in your details — it does not verify your identity.')}
            </p>
        </div>
    );
}

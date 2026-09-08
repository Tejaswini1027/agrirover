import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon';
import { useT } from '../../context/LanguageContext';
import { useCamera } from '../../hooks/useCamera';

const DOC_STATE = {
    IDLE: 'idle',
    STARTING: 'starting',
    READY: 'ready',
    CAPTURED: 'captured',
    ERROR: 'error',
};

// Downscale so the upload stays small while keeping enough resolution for
// OCR. ~1600px on the long edge is the sweet spot: smaller loses small print,
// larger mostly costs upload time and OCR seconds.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

// Grabs the current video frame, downscales it, and boosts contrast a little
// — printed cards photographed in poor light OCR noticeably better with a
// mild contrast lift than with the raw frame.
function frameToDataUrl(videoEl) {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return null;

    const scale = Math.min(1, MAX_EDGE / Math.max(vw, vh));
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(videoEl, 0, 0, w, h);

    try {
        const img = ctx.getImageData(0, 0, w, h);
        const d = img.data;
        const contrast = 1.25;
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < d.length; i += 4) {
            d[i] = d[i] * contrast + intercept;
            d[i + 1] = d[i + 1] * contrast + intercept;
            d[i + 2] = d[i + 2] * contrast + intercept;
        }
        ctx.putImageData(img, 0, 0);
    } catch {
        // Canvas read can fail in odd browser states; the un-enhanced frame
        // is still perfectly usable for OCR.
    }

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

// Rear-camera document capture. The captured frame lives only in memory and
// is handed straight to the caller for OCR — it is never uploaded for
// storage, written to disk, or kept after the step completes.
export default function DocumentScanner({ onCapture, onCancel, busy }) {
    const t = useT();
    const videoRef = useRef(null);
    const camera = useCamera(videoRef);
    const [state, setState] = useState(DOC_STATE.IDLE);

    const start = useCallback(async () => {
        setState(DOC_STATE.STARTING);
        // Rear camera for documents — 'environment' is the back camera on
        // phones and is ignored harmlessly on laptops.
        const ok = await camera.start('environment');
        setState(ok ? DOC_STATE.READY : DOC_STATE.ERROR);
    }, [camera]);

    useEffect(() => {
        start();
        return () => camera.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const capture = () => {
        const dataUrl = frameToDataUrl(videoRef.current);
        if (!dataUrl) return;
        setState(DOC_STATE.CAPTURED);
        camera.stop();
        onCapture(dataUrl);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden agv-glass-card">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                {/* Card-shaped guide. Aadhaar/ID cards are roughly 1.58:1. */}
                {state === DOC_STATE.READY && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                        <div className="relative w-full max-w-[300px] aspect-[1.58/1] rounded-xl border-2 border-accent/70">
                            <span className="absolute -top-px -left-px w-5 h-5 border-t-4 border-l-4 border-accent rounded-tl-xl" />
                            <span className="absolute -top-px -right-px w-5 h-5 border-t-4 border-r-4 border-accent rounded-tr-xl" />
                            <span className="absolute -bottom-px -left-px w-5 h-5 border-b-4 border-l-4 border-accent rounded-bl-xl" />
                            <span className="absolute -bottom-px -right-px w-5 h-5 border-b-4 border-r-4 border-accent rounded-br-xl" />
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {(state === DOC_STATE.STARTING || busy) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/55"
                        >
                            <Icon name="progress_activity" size={26} className="text-white/75 animate-spin" />
                            <span className="text-[11px] text-white/75">
                                {busy ? t('Reading your card…') : t('Starting camera…')}
                            </span>
                        </motion.div>
                    )}

                    {state === DOC_STATE.ERROR && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/60 p-6 text-center"
                        >
                            <Icon name="videocam_off" size={24} className="text-rose" />
                            <p className="text-[11px] text-white/85 leading-snug">{camera.error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {state === DOC_STATE.READY && !busy && (
                <ul className="text-[11px] text-white/45 leading-relaxed space-y-0.5">
                    <li>• {t('Make sure all four corners are visible')}</li>
                    <li>• {t('Keep the card flat and avoid glare')}</li>
                    <li>• {t('Use good lighting')}</li>
                </ul>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={() => { camera.stop(); onCancel(); }}
                    disabled={busy}
                    className="flex-1 py-3.5 rounded-2xl agv-glass-input text-sm font-semibold disabled:opacity-50"
                >
                    {t('Back')}
                </button>
                {state === DOC_STATE.ERROR ? (
                    <motion.button
                        onClick={start}
                        whileTap={{ scale: 0.96 }}
                        className="flex-[2] py-3.5 rounded-2xl agv-glass-input text-sm font-semibold"
                    >
                        {t('Try Again')}
                    </motion.button>
                ) : (
                    <motion.button
                        onClick={capture}
                        disabled={state !== DOC_STATE.READY || busy}
                        whileTap={{ scale: 0.96 }}
                        className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-accent-ink text-sm font-bold disabled:opacity-50"
                    >
                        <Icon name="photo_camera" size={18} />
                        {t('Capture')}
                    </motion.button>
                )}
            </div>
        </div>
    );
}

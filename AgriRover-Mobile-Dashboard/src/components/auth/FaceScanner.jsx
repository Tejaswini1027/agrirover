import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon';
import { useT } from '../../context/LanguageContext';
import { useCamera, CAMERA_STATE } from '../../hooks/useCamera';
import { loadFaceModels, probeFace, captureDescriptor } from '../../lib/faceModels';

export const SCAN_STATE = {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    SCANNING: 'scanning',
    FACE_DETECTED: 'face_detected',
    CAPTURING: 'capturing',
    SUCCESS: 'success',
    TIMEOUT: 'timeout',
    CAMERA_ERROR: 'camera_error',
    MODEL_ERROR: 'model_error',
};

// Frames of stable, well-framed detection required before capturing. Guards
// against grabbing an embedding from a blurred or half-turned frame.
const STABLE_FRAMES = 3;
const POLL_INTERVAL_MS = 350;
const SCAN_TIMEOUT_MS = 30000;

const GUIDANCE = {
    no_face: 'Look directly at the camera',
    multiple_faces: 'Please make sure only one person is in the frame',
    too_far: 'Move a little closer',
    partial_frame: 'Center your face inside the circle',
};

// Continuous face scanner. The user presses Start once; a single polling
// loop then runs cheap detection until framing is stable, at which point it
// computes the descriptor exactly once and stops itself.
//
// Deliberately never treats "a face was detected" as success — onCapture
// fires only after captureDescriptor returns a real 128-value embedding.
export default function FaceScanner({ onCapture, autoStart = false, samples = 1 }) {
    const t = useT();
    const videoRef = useRef(null);
    const camera = useCamera(videoRef);

    const [state, setState] = useState(SCAN_STATE.IDLE);
    const [hint, setHint] = useState('');
    const [modelError, setModelError] = useState('');
    const [errorDetail, setErrorDetail] = useState('');
    const [showDetail, setShowDetail] = useState(false);

    // One loop at a time: every start bumps the generation, and the loop
    // exits as soon as it notices it is no longer the current generation.
    const generationRef = useRef(0);
    const stableCountRef = useRef(0);

    const stopLoop = useCallback(() => {
        generationRef.current += 1;
        stableCountRef.current = 0;
    }, []);

    const runLoop = useCallback(async (generation, deadline) => {
        while (generation === generationRef.current) {
            if (Date.now() > deadline) {
                setState(SCAN_STATE.TIMEOUT);
                camera.stop();
                return;
            }

            let verdict;
            try {
                verdict = await probeFace(videoRef.current);
            } catch (err) {
                console.error('[face-auth] detection failed:', err);
                setState(SCAN_STATE.MODEL_ERROR);
                setModelError(t('Face detection failed. Please try again.'));
                camera.stop();
                return;
            }

            if (generation !== generationRef.current) return;

            if (!verdict.ok) {
                stableCountRef.current = 0;
                setState(SCAN_STATE.SCANNING);
                setHint(t(GUIDANCE[verdict.reason] || GUIDANCE.no_face));
            } else {
                stableCountRef.current += 1;
                setState(SCAN_STATE.FACE_DETECTED);
                setHint(t('Face detected — hold still…'));

                if (stableCountRef.current >= STABLE_FRAMES) {
                    setState(SCAN_STATE.CAPTURING);
                    let result;
                    try {
                        result = await captureDescriptor(videoRef.current, { samples });
                    } catch (err) {
                        console.error('[face-auth] capture failed:', err);
                        setState(SCAN_STATE.MODEL_ERROR);
                        setModelError(t('Face capture failed. Please try again.'));
                        camera.stop();
                        return;
                    }

                    if (generation !== generationRef.current) return;

                    if (result.ok) {
                        // Stop the loop and the camera before handing the
                        // descriptor up, so nothing keeps running behind the
                        // success screen.
                        generationRef.current += 1;
                        camera.stop();
                        setState(SCAN_STATE.SUCCESS);
                        setTimeout(() => onCapture(result.descriptor), 700);
                        return;
                    }

                    // Framing slipped between probe and capture — keep going.
                    stableCountRef.current = 0;
                    setHint(t(GUIDANCE[result.reason] || GUIDANCE.no_face));
                }
            }

            await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
    }, [camera, onCapture, t, samples]);

    const startScan = useCallback(async () => {
        stopLoop();
        setState(SCAN_STATE.INITIALIZING);
        setHint('');
        setModelError('');
        setErrorDetail('');
        setShowDetail(false);

        try {
            await loadFaceModels();
        } catch (err) {
            console.error('[face-auth] model load failed:', err);
            setState(SCAN_STATE.MODEL_ERROR);
            setModelError(
                err?.modelLabel
                    ? t(`Could not load the ${err.modelLabel} model.`)
                    : t('Could not load the face recognition model.')
            );
            // Keep the technical cause available on screen — this screen is
            // usually hit on a phone, where opening a console is impractical.
            setErrorDetail(err?.message || '');
            return;
        }

        const ok = await camera.start('user');
        if (!ok) {
            setState(SCAN_STATE.CAMERA_ERROR);
            return;
        }

        generationRef.current += 1;
        const generation = generationRef.current;
        stableCountRef.current = 0;
        setState(SCAN_STATE.SCANNING);
        setHint(t('Look directly at the camera'));
        runLoop(generation, Date.now() + SCAN_TIMEOUT_MS);
    }, [camera, runLoop, stopLoop, t]);

    useEffect(() => {
        if (autoStart) startScan();
        return () => {
            stopLoop();
            camera.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isLive = state === SCAN_STATE.SCANNING || state === SCAN_STATE.FACE_DETECTED || state === SCAN_STATE.CAPTURING;
    const isBusy = state === SCAN_STATE.INITIALIZING || isLive || state === SCAN_STATE.SUCCESS;
    const errorText = state === SCAN_STATE.CAMERA_ERROR ? camera.error : modelError;

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden agv-glass-card flex items-center justify-center shrink-0">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover -scale-x-100 ${isLive || state === SCAN_STATE.SUCCESS ? '' : 'opacity-0'}`}
                />

                {isLive && (
                    <div
                        className={`pointer-events-none absolute inset-[10%] rounded-full border-2 transition-colors duration-300 ${
                            state === SCAN_STATE.SCANNING ? 'border-dashed border-white/35' : 'border-accent'
                        }`}
                    />
                )}

                <AnimatePresence mode="wait">
                    {state === SCAN_STATE.IDLE && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6"
                        >
                            <Icon name="face" size={34} className="text-white/40" />
                            <span className="text-[11px] text-white/45 leading-snug">
                                {t('Your face becomes your AgriVision key')}
                            </span>
                        </motion.div>
                    )}

                    {state === SCAN_STATE.INITIALIZING && (
                        <motion.div
                            key="init"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/45"
                        >
                            <Icon name="progress_activity" size={26} className="text-white/70 animate-spin" />
                            <span className="text-[11px] text-white/70">{t('Starting camera…')}</span>
                        </motion.div>
                    )}

                    {state === SCAN_STATE.CAPTURING && (
                        <motion.div key="capturing" className="absolute inset-0 overflow-hidden rounded-full">
                            <div className="agv-scan-line absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-accent/50 to-transparent" />
                        </motion.div>
                    )}

                    {state === SCAN_STATE.SUCCESS && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                                className="w-12 h-12 rounded-full bg-accent flex items-center justify-center"
                            >
                                <Icon name="check" size={24} className="text-accent-ink" />
                            </motion.div>
                            <span className="text-[11px] text-white/85 font-medium">{t('Face captured successfully')}</span>
                        </motion.div>
                    )}

                    {(state === SCAN_STATE.CAMERA_ERROR || state === SCAN_STATE.MODEL_ERROR || state === SCAN_STATE.TIMEOUT) && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/60 p-5 text-center"
                        >
                            <Icon name={state === SCAN_STATE.TIMEOUT ? 'timer_off' : 'videocam_off'} size={24} className="text-rose" />
                            <p className="text-[11px] text-white/85 leading-snug">
                                {state === SCAN_STATE.TIMEOUT
                                    ? t("We couldn't get a clear look at your face. Try again in better light.")
                                    : errorText}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <p className="text-[12px] text-white/55 text-center min-h-[18px] px-2">
                {isLive ? hint : ''}
            </p>

            {errorDetail && (
                <div className="w-full -mt-1">
                    <button
                        onClick={() => setShowDetail((v) => !v)}
                        className="w-full text-[11px] text-white/40 underline underline-offset-2 py-1"
                    >
                        {showDetail ? t('Hide details') : t('Show technical details')}
                    </button>
                    {showDetail && (
                        <p className="mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[10px] leading-relaxed text-white/60 break-words font-mono">
                            {errorDetail}
                        </p>
                    )}
                </div>
            )}

            {state === SCAN_STATE.IDLE && (
                <motion.button
                    onClick={startScan}
                    whileTap={{ scale: 0.96 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-accent-ink text-sm font-bold"
                >
                    <Icon name="face" size={18} />
                    {t('Start Face Scan')}
                </motion.button>
            )}

            {(state === SCAN_STATE.CAMERA_ERROR || state === SCAN_STATE.MODEL_ERROR || state === SCAN_STATE.TIMEOUT) && (
                <motion.button
                    onClick={startScan}
                    whileTap={{ scale: 0.96 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl agv-glass-input text-sm font-semibold"
                >
                    <Icon name="refresh" size={18} />
                    {t('Try Again')}
                </motion.button>
            )}

            {isBusy && state !== SCAN_STATE.SUCCESS && (
                <button
                    onClick={() => { stopLoop(); camera.stop(); setState(SCAN_STATE.IDLE); }}
                    className="text-[11px] text-white/35 underline underline-offset-2 py-1"
                >
                    {t('Cancel')}
                </button>
            )}
        </div>
    );
}

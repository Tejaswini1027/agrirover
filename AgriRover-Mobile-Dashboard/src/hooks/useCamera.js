import { useCallback, useEffect, useRef, useState } from 'react';

export const CAMERA_STATE = {
    IDLE: 'idle',
    STARTING: 'starting',
    READY: 'ready',
    ERROR: 'error',
};

// Maps a getUserMedia failure to a message a farmer can act on, rather than
// a raw DOMException name.
function friendlyCameraError(err) {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || /permission/i.test(err?.message || '')) {
        return 'Camera access is required for this step. Please allow camera access in your browser settings and try again.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        return 'No camera was found on this device.';
    }
    if (name === 'NotReadableError') {
        return 'The camera is already in use by another app. Close it and try again.';
    }
    return 'We could not start the camera. Please try again.';
}

// Owns the MediaStream lifecycle for one video element.
//
// Guarantees that matter here: only one stream is ever live at a time (a
// second start() stops the first), and every track is stopped on stop() and
// on unmount — a camera left running after the user leaves the screen is a
// real privacy problem, not just a leak.
export function useCamera(videoRef) {
    const streamRef = useRef(null);
    // Incremented on every start/stop so a slow getUserMedia that resolves
    // after the component moved on can detect it is stale and clean up
    // after itself instead of attaching an orphan stream.
    const generationRef = useRef(0);

    const [state, setState] = useState(CAMERA_STATE.IDLE);
    const [error, setError] = useState('');

    const stop = useCallback(() => {
        generationRef.current += 1;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setState(CAMERA_STATE.IDLE);
    }, [videoRef]);

    const start = useCallback(async (facingMode = 'user') => {
        // getUserMedia only exists on secure contexts (https:// or
        // localhost). Opened from a phone over plain http://<lan-ip> it is
        // silently undefined, which would otherwise surface as a confusing
        // TypeError.
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            setError('Camera requires a secure connection. Open this page via https:// to continue.');
            setState(CAMERA_STATE.ERROR);
            return false;
        }

        // Drop any existing stream before opening another.
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        generationRef.current += 1;
        const generation = generationRef.current;

        setState(CAMERA_STATE.STARTING);
        setError('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            if (generation !== generationRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return false;
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Some browsers will not begin playback from a programmatic
                // srcObject assignment without an explicit play().
                await videoRef.current.play().catch(() => {});
            }
            setState(CAMERA_STATE.READY);
            return true;
        } catch (err) {
            if (generation !== generationRef.current) return false;
            setError(friendlyCameraError(err));
            setState(CAMERA_STATE.ERROR);
            return false;
        }
    }, [videoRef]);

    useEffect(() => stop, [stop]);

    return { state, error, start, stop };
}

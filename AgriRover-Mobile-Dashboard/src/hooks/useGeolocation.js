import { useCallback, useEffect, useRef, useState } from 'react';

// Device / user location via the browser Geolocation API.
//
// This is the ONLY source of the operator's "current location" — there are
// no hardcoded coordinates anywhere in this hook. The Agri Rover's own GPS
// is a separate concern (see useRoverPosition) and never flows through here.

export const GPS_STATUS = {
    IDLE: 'idle', // not requested yet
    LOCATING: 'locating', // request in flight  -> 🟡 Getting Location…
    ACTIVE: 'active', // have a fresh fix       -> 🟢 GPS Active
    UNAVAILABLE: 'unavailable', // last attempt failed    -> 🔴 GPS Unavailable
};

// Always ask for a fresh, high-accuracy fix. maximumAge:0 means the browser
// must not hand back a cached position — required for "Use Current Location".
const GEO_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
};

function messageForError(err) {
    // No Geolocation API at all (old browser, or an insecure origin that
    // isn't localhost).
    if (!err || err.code == null) {
        return 'Please enable location services on your device.';
    }
    switch (err.code) {
        case 1: // PERMISSION_DENIED
            return 'Location permission denied. Please allow location access.';
        case 2: // POSITION_UNAVAILABLE — GPS/radio can't get a fix
            return 'Unable to determine your current location.';
        case 3: // TIMEOUT
            return 'Location request timed out. Please try again.';
        default:
            return 'Unable to determine your current location.';
    }
}

export function useGeolocation({ immediate = true } = {}) {
    const [status, setStatus] = useState(GPS_STATUS.IDLE);
    const [position, setPosition] = useState(null); // { lat, lng, accuracy }
    const [error, setError] = useState('');
    const [updatedAt, setUpdatedAt] = useState(null); // Date of the last good fix

    // Guards against a slow getCurrentPosition callback landing after the
    // component unmounted, or after a newer request superseded it.
    const reqIdRef = useRef(0);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const request = useCallback(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setStatus(GPS_STATUS.UNAVAILABLE);
            setError('Please enable location services on your device.');
            return;
        }

        const reqId = ++reqIdRef.current;
        setStatus(GPS_STATUS.LOCATING);
        setError('');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (!mountedRef.current || reqId !== reqIdRef.current) return;
                const { latitude, longitude, accuracy } = pos.coords;
                setPosition({ lat: latitude, lng: longitude, accuracy });
                setUpdatedAt(new Date(pos.timestamp || Date.now()));
                setError('');
                setStatus(GPS_STATUS.ACTIVE);
            },
            (err) => {
                if (!mountedRef.current || reqId !== reqIdRef.current) return;
                setError(messageForError(err));
                setStatus(GPS_STATUS.UNAVAILABLE);
            },
            GEO_OPTIONS
        );
    }, []);

    // Request once when the GPS/map page mounts.
    useEffect(() => {
        if (immediate) request();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // `refresh` is what the "Use Current Location" button calls — identical to
    // the initial request, so it also runs with maximumAge:0 (never cached).
    return { status, position, error, updatedAt, refresh: request };
}

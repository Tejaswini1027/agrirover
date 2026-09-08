import { useEffect, useState } from 'react';
import { simulatedWalk } from '../data/simulation';

// Agri Rover GPS position — kept deliberately separate from the operator's
// device location (useGeolocation).
//
// There is no rover telemetry backend in this project yet, so the position
// comes from the simulated walk in src/data/simulation.js and is flagged
// `source: 'simulated'`. When a real endpoint exists (e.g. the ESP32 / NEO-6M
// pipeline pushing { latitude, longitude } over the API), fetch/subscribe to
// it HERE and return `source: 'rover'` — every consumer already distinguishes
// the two, and real telemetry must win over the simulation whenever present.

export function useRoverPosition({ intervalMs = 2200 } = {}) {
    const [idx, setIdx] = useState(0);
    const [updatedAt, setUpdatedAt] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setIdx((i) => (i + 1) % simulatedWalk.length);
            setUpdatedAt(new Date());
        }, intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    const [lat, lng] = simulatedWalk[idx];
    return {
        position: { lat, lng },
        latlng: simulatedWalk[idx], // [lat, lng] tuple for leaflet
        source: 'simulated', // 'simulated' until a real rover feed is wired in
        updatedAt,
    };
}

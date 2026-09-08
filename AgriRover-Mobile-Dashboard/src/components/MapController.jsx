import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// <MapContainer center> is only read once, on mount. This helper lives inside
// the map and imperatively re-centres it onto `target` ([lat, lng]) whenever
// the coordinates change or `recenterKey` changes.
//
// `recenterKey` lets an explicit action ("Use Current Location") re-centre the
// map even when the coordinates happen to be identical to before. Switching
// the base tile layer does NOT change either prop, so the centre and zoom are
// preserved across GPS/Satellite view changes.
export default function MapController({ target, zoom, recenterKey }) {
    const map = useMap();

    useEffect(() => {
        if (!target) return;
        const [lat, lng] = target;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        map.setView([lat, lng], zoom ?? map.getZoom());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target && target[0], target && target[1], recenterKey, zoom]);

    return null;
}

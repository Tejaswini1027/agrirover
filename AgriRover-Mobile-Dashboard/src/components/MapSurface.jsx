import { useState } from 'react';
import { MapContainer } from 'react-leaflet';
import Icon from './Icon';
import BaseTileLayer from './BaseTileLayer';
import MapViewSwitch from './MapViewSwitch';
import { useT } from '../context/LanguageContext';

// A Leaflet map with a GPS View / Satellite View base-layer toggle baked in.
//
// Switching the toggle only swaps the tile layer inside the SAME MapContainer,
// so the centre, zoom, and every child overlay (markers, polygons,
// MapController) are preserved — no remount, no duplicate map or markers.
// Pass overlays as children exactly as you would inside <MapContainer>.
export default function MapSurface({ height = 400, center, zoom = 16, children, switchIdBase }) {
    const t = useT();
    const [view, setView] = useState('gps'); // 'gps' | 'satellite' — GPS View is the default
    const [tileError, setTileError] = useState(false);
    const [nonce, setNonce] = useState(0); // bumped to force a tile reload on retry

    const changeView = (v) => {
        setView(v);
        setTileError(false); // a fresh layer gets a fresh chance
    };
    const retry = () => {
        setTileError(false);
        setNonce((n) => n + 1);
    };

    return (
        <div className="relative rounded-2xl overflow-hidden border border-line" style={{ height }}>
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} attributionControl>
                <BaseTileLayer
                    mode={view}
                    nonce={nonce}
                    onError={() => setTileError(true)}
                    onLoad={() => setTileError(false)}
                />
                {children}
            </MapContainer>

            <MapViewSwitch value={view} onChange={changeView} idBase={switchIdBase} />

            {tileError && view === 'satellite' && (
                <div className="absolute top-2 left-2 z-[1000] max-w-[68%] flex items-start gap-2 px-3 py-2 rounded-xl bg-panel/90 backdrop-blur-md border border-rose/40 shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
                    <Icon name="error" size={14} className="text-rose mt-0.5 shrink-0" />
                    <p className="text-[11px] text-ink leading-snug">
                        {t('Satellite imagery unavailable. Please try again.')}
                        <button onClick={retry} className="ml-1.5 font-bold text-accent underline underline-offset-2">
                            {t('Retry')}
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
}

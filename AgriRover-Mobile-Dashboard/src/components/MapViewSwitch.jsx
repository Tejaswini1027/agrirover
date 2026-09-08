import { motion } from 'framer-motion';
import Icon from './Icon';
import { useT } from '../context/LanguageContext';

// Base-layer toggle that sits inside the map, top-right. Switching only swaps
// the tile layer — the Leaflet map, its centre, zoom and every marker stay
// put. Active option uses the app's lime-green pill style, matching the
// Field Ops sub-nav.
const OPTIONS = [
    { id: 'gps', label: 'GPS View', icon: 'map' },
    { id: 'satellite', label: 'Satellite View', icon: 'satellite_alt' },
];

export default function MapViewSwitch({ value, onChange, idBase = 'map-view' }) {
    const t = useT();
    return (
        <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1 p-1 rounded-xl bg-panel/85 backdrop-blur-md border border-line shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
            {OPTIONS.map((o) => {
                const active = value === o.id;
                return (
                    <button
                        key={o.id}
                        type="button"
                        onClick={() => onChange(o.id)}
                        aria-pressed={active}
                        className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors ${
                            active ? 'text-accent-ink' : 'text-muted hover:text-ink'
                        }`}
                    >
                        {active && (
                            <motion.span
                                layoutId={`${idBase}-active`}
                                className="absolute inset-0 bg-accent rounded-lg"
                                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                        )}
                        <span className="relative flex items-center gap-1.5">
                            <Icon name={o.icon} size={14} />
                            {t(o.label)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

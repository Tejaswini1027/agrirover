import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Polygon, Polyline, CircleMarker, Circle, Tooltip } from 'react-leaflet';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import StatTile from '../components/StatTile';
import Counter from '../components/motion/Counter';
import StatefulButton from '../components/motion/StatefulButton';
import MapController from '../components/MapController';
import MapSurface from '../components/MapSurface';
import CurrentLocationCard from '../components/CurrentLocationCard';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { useT } from '../context/LanguageContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRoverPosition } from '../hooks/useRoverPosition';
import { rover, zones, fieldBoundary, simulatedWalk } from '../data/simulation';
import { areaSqMeters, perimeter, formatArea } from '../utils/geo';

const ACCENT = '#7bd83f'; // lime — device / current location
const AMBER = '#f2a33d'; // amber — Agri Rover position

const ZONE_COLOR = { good: '#7bd83f', warn: '#f2a33d', bad: '#e5484d' };

function SubNav({ sub, setSub, subs }) {
    return (
        <div className="flex items-center gap-1 bg-panel-soft border border-line rounded-2xl p-1 w-full sm:w-fit overflow-x-auto">
            {subs.map((s) => (
                <button
                    key={s.id}
                    onClick={() => setSub(s.id)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors ${
                        sub === s.id ? 'text-accent-ink' : 'text-muted hover:text-ink'
                    }`}
                >
                    {sub === s.id && (
                        <motion.span layoutId="fieldops-sub" className="absolute inset-0 bg-accent rounded-xl" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative flex items-center gap-1.5">
                        <Icon name={s.icon} size={16} />
                        {s.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

function FieldMapView() {
    const t = useT();
    // Device / operator location — real browser GPS, requested on mount.
    const geo = useGeolocation({ immediate: true });
    // Agri Rover position — a separate source (simulated until telemetry lands).
    const roverGps = useRoverPosition();

    const devicePos = geo.position ? [geo.position.lat, geo.position.lng] : null;

    return (
        <RevealGroup className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <RevealItem>
                <Panel as={false} title={t('Field Boundary')} icon="satellite_alt" tight>
                    <MapSurface height={420} center={devicePos || fieldBoundary[0]} zoom={16} switchIdBase="fieldmap-view">
                        {/* Recenters onto the device GPS fix, and again on every
                            explicit "Use Current Location". Base-layer switching
                            leaves these props untouched, so centre + zoom hold. */}
                        <MapController target={devicePos} zoom={16} recenterKey={geo.updatedAt ? geo.updatedAt.getTime() : 0} />

                        <Polygon positions={fieldBoundary} pathOptions={{ color: ACCENT, weight: 3, fillOpacity: 0.12 }} />

                        {/* B — Agri Rover current GPS position (vector overlay,
                            unaffected by the GPS/Satellite tile layer) */}
                        <CircleMarker center={roverGps.latlng} radius={8} pathOptions={{ color: AMBER, fillColor: AMBER, fillOpacity: 1, weight: 2 }}>
                            <Tooltip direction="top" offset={[0, -6]}>
                                {t('Agri Rover')} · {roverGps.source === 'rover' ? t('live telemetry') : t('simulated')}
                            </Tooltip>
                        </CircleMarker>

                        {/* A — device / user current location */}
                        {devicePos && (
                            <>
                                <Circle
                                    center={devicePos}
                                    radius={geo.position.accuracy || 0}
                                    pathOptions={{ color: ACCENT, fillColor: ACCENT, fillOpacity: 0.1, weight: 1 }}
                                />
                                <CircleMarker center={devicePos} radius={7} pathOptions={{ color: '#ffffff', fillColor: ACCENT, fillOpacity: 1, weight: 3 }}>
                                    <Tooltip direction="top" offset={[0, -6]}>{t('Current Location')}</Tooltip>
                                </CircleMarker>
                            </>
                        )}
                    </MapSurface>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-accent" /> {t('Current Location (device GPS)')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber pulse-dot" /> {t('Agri Rover position')} · {roverGps.source === 'rover' ? t('live telemetry') : t('simulated')}
                        </span>
                    </div>
                </Panel>
            </RevealItem>

            <RevealItem className="flex flex-col gap-5">
                <CurrentLocationCard geo={geo} rover={roverGps} />

                <Panel as={false} title={t('Zones')} icon="grid_view">
                    <div className="flex flex-col gap-2.5">
                        {zones.map((z) => (
                            <div key={z.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 font-semibold text-ink">
                                    <span className="w-2 h-2 rounded-full" style={{ background: ZONE_COLOR[z.status] }} />
                                    {z.id}
                                </span>
                                <span className="text-muted text-xs">{z.moisture}% {t('moist')}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </RevealItem>
        </RevealGroup>
    );
}

function RoverControlView() {
    const t = useT();
    const [cmd, setCmd] = useState('STOP');
    const [mode, setMode] = useState(rover.mode);

    const Btn = ({ command, icon, className = '' }) => (
        <motion.button
            onClick={() => setCmd(command)}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden ${
                cmd === command ? 'bg-accent text-accent-ink' : 'bg-panel-soft text-ink hover:bg-line'
            } ${className}`}
        >
            <Icon name={icon} size={24} />
        </motion.button>
    );

    return (
        <RevealGroup className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
            <RevealItem>
                <Panel as={false} title={t('Directional Control')} icon="sports_esports">
                    <div className="flex flex-col items-center gap-5 py-2">
                        <div className="grid grid-cols-3 gap-2.5 place-items-center">
                            <span />
                            <Btn command="FORWARD" icon="keyboard_arrow_up" />
                            <span />
                            <Btn command="LEFT" icon="keyboard_arrow_left" />
                            <Btn command="STOP" icon="pan_tool_alt" className={cmd === 'STOP' ? '!bg-rose !text-white' : ''} />
                            <Btn command="RIGHT" icon="keyboard_arrow_right" />
                            <span />
                            <Btn command="BACK" icon="keyboard_arrow_down" />
                            <span />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted">{t('Last command:')}</span>
                            <motion.span key={cmd} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-mono font-bold text-accent">{cmd}</motion.span>
                        </div>
                        <div className="relative flex items-center gap-2 bg-panel-soft rounded-xl p-1 w-full">
                            <motion.span
                                layout
                                className="absolute top-1 bottom-1 rounded-lg bg-accent"
                                animate={{ left: mode === 'MANUAL' ? '4px' : '50%', right: mode === 'MANUAL' ? '50%' : '4px' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                            {['MANUAL', 'AUTO'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`relative flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === m ? 'text-accent-ink' : 'text-muted'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </Panel>
            </RevealItem>

            <RevealItem>
                <Panel as={false} title={t('Rover Telemetry')} icon="agriculture">
                    <div className="grid grid-cols-2 gap-2.5">
                        <StatTile label={t('Battery')} value={<Counter value={rover.battery} />} unit="%" tone="good" caption={`${rover.voltage}V`} />
                        <StatTile label={t('Current Draw')} value={<Counter value={rover.current} decimals={2} />} unit="A" tone="neutral" />
                        <StatTile label={t('Status')} value={rover.status} tone="good" />
                        <StatTile label={t('Mode')} value={mode} tone="info" />
                    </div>
                    <div className="mt-3 p-3 rounded-xl bg-panel-soft flex items-start gap-2">
                        <Icon name="info" size={16} className="text-muted mt-0.5" />
                        <p className="text-xs text-muted">{t('Simulated command interface — wires directly to the ESP32 motor node when hardware is connected.')}</p>
                    </div>
                </Panel>
            </RevealItem>
        </RevealGroup>
    );
}

function GpsRecorderView() {
    const t = useT();
    const geo = useGeolocation({ immediate: true });
    const roverGps = useRoverPosition();
    const devicePos = geo.position ? [geo.position.lat, geo.position.lng] : null;
    const [points, setPoints] = useState([]);
    const [walking, setWalking] = useState(false);
    const timer = useRef(null);

    const startWalk = () =>
        new Promise((resolve) => {
            setPoints([]);
            setWalking(true);
            let i = 0;
            timer.current = setInterval(() => {
                i += 1;
                setPoints(simulatedWalk.slice(0, i));
                if (i >= simulatedWalk.length) {
                    clearInterval(timer.current);
                    setWalking(false);
                    setPoints([...simulatedWalk, simulatedWalk[0]]);
                    resolve();
                }
            }, 700);
        });

    const reset = () => {
        clearInterval(timer.current);
        setPoints([]);
        setWalking(false);
    };

    useEffect(() => () => clearInterval(timer.current), []);

    const closed = points.length === simulatedWalk.length + 1;
    const area = closed ? formatArea(areaSqMeters(simulatedWalk)) : null;
    const dist = points.length > 1 ? perimeter(points) : 0;

    return (
        <RevealGroup className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <RevealItem>
                <Panel as={false} title={t('Boundary Walk')} icon="my_location" tight>
                    <MapSurface height={380} center={devicePos || fieldBoundary[0]} zoom={16} switchIdBase="gpsrec-view">
                        <MapController target={devicePos} zoom={16} recenterKey={geo.updatedAt ? geo.updatedAt.getTime() : 0} />
                        {points.length > 1 && <Polyline positions={points} pathOptions={{ color: '#3fb0d8', weight: 4 }} />}
                        {points.map((p, i) => (
                            <CircleMarker key={i} center={p} radius={5} pathOptions={{ color: '#3fb0d8', fillColor: '#3fb0d8', fillOpacity: 1 }} />
                        ))}
                        {devicePos && (
                            <>
                                <Circle center={devicePos} radius={geo.position.accuracy || 0} pathOptions={{ color: ACCENT, fillColor: ACCENT, fillOpacity: 0.1, weight: 1 }} />
                                <CircleMarker center={devicePos} radius={7} pathOptions={{ color: '#ffffff', fillColor: ACCENT, fillOpacity: 1, weight: 3 }}>
                                    <Tooltip direction="top" offset={[0, -6]}>{t('Current Location')}</Tooltip>
                                </CircleMarker>
                            </>
                        )}
                    </MapSurface>
                    <div className="flex items-center gap-2.5 mt-3">
                        <StatefulButton
                            onPress={startWalk}
                            idleLabel={t('Simulate Boundary Walk')}
                            loadingLabel={t('Recording…')}
                            successLabel={t('Boundary Saved')}
                            disabled={walking}
                            className="flex-1 py-2.5 rounded-xl text-sm"
                        />
                        <button onClick={reset} className="px-4 py-2.5 rounded-xl bg-panel-soft text-ink text-sm font-semibold">{t('Reset')}</button>
                    </div>
                    <p className="text-[11px] text-muted mt-2">{t('GPS source: simulated (NEO-6M pipeline pending hardware). Points are validated and closed into a polygon on completion.')}</p>
                </Panel>
            </RevealItem>

            <RevealItem className="flex flex-col gap-5">
                <CurrentLocationCard geo={geo} rover={roverGps} />

                <Panel as={false} title={t('Boundary Result')} icon="straighten">
                    <div className="grid grid-cols-2 gap-2.5">
                        <StatTile label={t('Points')} value={<Counter value={points.length} />} tone="neutral" />
                        <StatTile label={t('Walked Dist.')} value={dist ? <Counter value={Math.round(dist)} /> : '—'} unit={dist ? 'm' : ''} tone="info" />
                        <StatTile label={t('Area')} value={area ? <Counter value={parseFloat(area.hectares)} decimals={2} /> : '—'} unit={area ? 'ha' : ''} tone="good" />
                        <StatTile label={t('Area')} value={area ? <Counter value={parseFloat(area.acres)} decimals={2} /> : '—'} unit={area ? 'ac' : ''} tone="good" />
                    </div>
                    <AnimatePresence mode="wait">
                        {!area && (
                            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted mt-3">
                                {t('Complete a walk to calculate the closed-polygon area and perimeter.')}
                            </motion.p>
                        )}
                        {area && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                className="mt-3 p-3 rounded-xl bg-accent-soft flex items-start gap-2"
                            >
                                <Icon name="check_circle" size={16} className="text-accent mt-0.5" fill />
                                <p className="text-xs text-ink">{t('Boundary closed and saved as home position for return-to-base.')}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Panel>
            </RevealItem>
        </RevealGroup>
    );
}

const VIEWS = { map: FieldMapView, rover: RoverControlView, gps: GpsRecorderView };

export default function FieldOps() {
    const t = useT();
    const [sub, setSub] = useState('map');
    const ActiveView = VIEWS[sub];

    const SUBS = [
        { id: 'map', label: t('Field Map'), icon: 'map' },
        { id: 'rover', label: t('Rover Control'), icon: 'sports_esports' },
        { id: 'gps', label: t('GPS Recorder'), icon: 'my_location' },
    ];

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink">{t('Field Ops')}</h1>
                    <p className="text-sm text-muted mt-1">{t('Map, rover command, and boundary recording — one workspace.')}</p>
                </div>
                <SubNav sub={sub} setSub={setSub} subs={SUBS} />
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={sub} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <ActiveView />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

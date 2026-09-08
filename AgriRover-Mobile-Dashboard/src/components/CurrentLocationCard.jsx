import { motion } from 'framer-motion';
import Icon from './Icon';
import Panel from './Panel';
import { useT } from '../context/LanguageContext';
import { GPS_STATUS } from '../hooks/useGeolocation';

const STATUS_UI = {
    [GPS_STATUS.IDLE]: { dot: 'bg-muted', text: 'Getting Location…', tone: 'text-muted' },
    [GPS_STATUS.LOCATING]: { dot: 'bg-amber', text: 'Getting Location…', tone: 'text-amber' },
    [GPS_STATUS.ACTIVE]: { dot: 'bg-accent', text: 'GPS Active', tone: 'text-accent' },
    [GPS_STATUS.UNAVAILABLE]: { dot: 'bg-rose', text: 'GPS Unavailable', tone: 'text-rose' },
};

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span className="font-mono font-semibold text-ink">{value}</span>
        </div>
    );
}

// Device / user current location panel. `geo` is the object returned by
// useGeolocation(). `rover` is optional { position, source, updatedAt } from
// useRoverPosition() — rendered as a clearly separate readout so there is
// never any confusion between the operator's phone and the Agri Rover.
export default function CurrentLocationCard({ geo, rover }) {
    const t = useT();
    const { status, position, error, updatedAt, refresh } = geo;
    const s = STATUS_UI[status] || STATUS_UI[GPS_STATUS.IDLE];
    const locating = status === GPS_STATUS.LOCATING;

    return (
        <Panel as={false} title={t('Current Location')} icon="my_location">
            <div className="flex flex-col gap-3">
                {/* GPS status */}
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.dot} ${locating ? 'pulse-dot' : ''}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${s.tone}`}>
                        {t('GPS')}: {t(s.text)}
                    </span>
                </div>

                {/* Device coordinates */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-panel-soft">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                        {t('Device / User Location')}
                    </p>
                    {position ? (
                        <>
                            <Row label={t('Latitude')} value={position.lat.toFixed(6)} />
                            <Row label={t('Longitude')} value={position.lng.toFixed(6)} />
                            <Row
                                label={t('Accuracy')}
                                value={position.accuracy != null ? `± ${Math.round(position.accuracy)} m` : '—'}
                            />
                            <div className="flex items-center justify-between gap-3 text-[11px] text-muted mt-0.5">
                                <span>{t('Last updated')}</span>
                                <span className="font-mono">
                                    {updatedAt ? updatedAt.toLocaleTimeString() : '—'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="text-[13px] text-muted">
                            {locating ? t('Requesting your location…') : t('No location fix yet.')}
                        </p>
                    )}
                </div>

                {error && (
                    <p className="text-[12px] text-rose flex items-start gap-1.5">
                        <Icon name="error" size={14} className="mt-0.5 shrink-0" />
                        {t(error)}
                    </p>
                )}

                <motion.button
                    onClick={refresh}
                    disabled={locating}
                    whileTap={{ scale: 0.96 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-ink text-sm font-bold disabled:opacity-60"
                >
                    <Icon name={locating ? 'progress_activity' : 'my_location'} size={16} className={locating ? 'animate-spin' : ''} />
                    {locating ? t('Getting Location…') : t('Use Current Location')}
                </motion.button>

                {/* Agri Rover GPS — a distinct source, shown separately */}
                {rover && (
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-panel-soft border-t-2 border-amber/40">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                            {t('Agri Rover GPS')}
                            <span className="text-amber font-semibold normal-case tracking-normal">
                                · {rover.source === 'rover' ? t('live telemetry') : t('simulated')}
                            </span>
                        </p>
                        <Row label={t('Latitude')} value={rover.position.lat.toFixed(6)} />
                        <Row label={t('Longitude')} value={rover.position.lng.toFixed(6)} />
                        {rover.updatedAt && (
                            <div className="flex items-center justify-between gap-3 text-[11px] text-muted mt-0.5">
                                <span>{t('Last updated')}</span>
                                <span className="font-mono">{rover.updatedAt.toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Panel>
    );
}

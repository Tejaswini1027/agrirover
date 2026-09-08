import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import StatTile from '../components/StatTile';
import Gauge from '../components/Gauge';
import GpsGlobe from '../components/GpsGlobe';
import Counter from '../components/motion/Counter';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { useNav } from '../context/NavContext';
import { useT } from '../context/LanguageContext';
import { rover, environment, risk, zones, alerts, gps } from '../data/simulation';

const ZONE_TONE = { good: 'bg-accent', warn: 'bg-amber', bad: 'bg-rose' };

export default function Overview() {
    const { goTo } = useNav();
    const t = useT();
    const topAlerts = alerts.filter((a) => a.severity !== 'info').slice(0, 2);

    return (
        <RevealGroup className="flex flex-col gap-5">
            <RevealItem className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink">{t('Good afternoon, Commander')}</h1>
                    <p className="text-sm text-muted mt-1">{t("Here's what's happening across the field right now.")}</p>
                </div>
            </RevealItem>

            <RevealItem className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                <Panel art="field" as={false} tight glow={false} className="col-span-1 flex flex-col items-center justify-center">
                    <Gauge value={risk.fieldHealth} tone="good" size={72} stroke={6} label={t('Field Health')} />
                </Panel>
                <StatTile art="battery" label={t('Rover Battery')} value={<Counter value={rover.battery} />} unit="%" tone="neutral" caption={`${rover.voltage}V · ${rover.mode}`} />
                <StatTile art="soil" label={t('Soil Moisture')} value={<Counter value={environment.soilMoisture.value} />} unit="%" tone="good" caption={t('Optimal range')} />
                <StatTile art="sun" label={t('Canopy Temp')} value={<Counter value={environment.airTemp.value} decimals={1} />} unit="°C" tone="warn" caption={t('Moderate heat')} />
                <StatTile art="gps" label={t('GPS Fix')} value={<Counter value={gps.satellites} />} unit="sats" tone="info" caption={gps.fix} />
                <Panel art="risk" as={false} tight glow={false} className="col-span-1 flex flex-col items-center justify-center">
                    <Gauge value={risk.aggregate} tone="good" size={72} stroke={6} label={t('Risk Index')} />
                </Panel>
            </RevealItem>

            <RevealItem className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5">
                <Panel as={false} title={t('Sector A · Live Map')} icon="map" action={
                    <button onClick={() => goTo('field')} className="text-xs font-bold text-accent flex items-center gap-1">
                        {t('Open Field Ops')} <Icon name="arrow_forward" size={14} />
                    </button>
                }>
                    <GpsGlobe height={260} />
                </Panel>

                <motion.div
                    whileTap={{ scale: 0.99 }}
                    className="ai-insight-glow rounded-3xl p-5 bg-ink text-canvas flex flex-col relative overflow-hidden"
                    style={{ background: 'linear-gradient(155deg, var(--color-accent-ink), #17250d)' }}
                >
                    <motion.div
                        className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                            <Icon name="auto_awesome" size={17} className="text-accent" />
                        </span>
                        <h3 className="font-display font-bold text-[15px] text-white">{t('AI Insight')}</h3>
                    </div>
                    <p className="relative text-sm text-white/85 leading-relaxed">
                        {t('Water stress detected in Zone A2. Soil moisture is below optimal (26%). Rain probability is low for the next 72 hours.')}
                    </p>
                    <div className="relative mt-4 p-3 rounded-xl bg-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-white/60 mb-1">{t('Recommendation')}</p>
                        <p className="text-sm text-white/90">{t('Inspect Zone A2 and consider targeted irrigation.')}</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => goTo('intel')}
                        className="relative mt-4 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-bold"
                    >
                        {t('View Zone A2 Details')}
                    </motion.button>
                </motion.div>
            </RevealItem>

            <RevealItem className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Panel as={false} title={t('Field Zones')} icon="grid_view" action={
                    <button onClick={() => goTo('field')} className="text-xs font-bold text-muted hover:text-accent">{t('See map')} →</button>
                }>
                    <div className="grid grid-cols-2 gap-2.5">
                        {zones.map((z) => (
                            <motion.div key={z.id} whileTap={{ scale: 0.96 }} className={`accent-bar accent-bar--${z.status} rounded-xl bg-panel-soft p-3 flex items-center gap-2.5`}>
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ZONE_TONE[z.status]}`} />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-ink">{z.id}</p>
                                    <p className="text-[11px] text-muted truncate">{z.health}/100 · {t(z.label)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Panel>

                <Panel as={false} title={t('Priority Alerts')} icon="notifications_active" action={
                    <button onClick={() => goTo('activity')} className="text-xs font-bold text-muted hover:text-accent">{t('View all')} →</button>
                }>
                    <div className="flex flex-col gap-3">
                        {topAlerts.map((a) => (
                            <div key={a.id} className={`accent-bar accent-bar--${a.severity} pl-2.5 flex items-start gap-3`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.severity === 'bad' ? 'bg-rose-soft text-rose' : 'bg-amber-soft text-amber'}`}>
                                    <Icon name={a.icon} size={16} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-ink leading-tight">{t(a.title)}</p>
                                    <p className="text-[11px] text-muted mt-0.5">{a.zone ? `${t('Zone')} ${a.zone} · ` : ''}{a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </RevealItem>
        </RevealGroup>
    );
}

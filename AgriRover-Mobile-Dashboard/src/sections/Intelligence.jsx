import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import StatTile from '../components/StatTile';
import Gauge from '../components/Gauge';
import StatefulButton from '../components/motion/StatefulButton';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { useT } from '../context/LanguageContext';
import { environment, risk, cropIssues, irrigationZones } from '../data/simulation';

const TIER_TONE = { LOW: 'good', OPTIMAL: 'good', MODERATE: 'warn', ELEVATED: 'warn', HIGH: 'bad' };
const SEV_TONE = { good: 'text-accent bg-accent-soft', warn: 'text-amber bg-amber-soft', bad: 'text-rose bg-rose-soft', info: 'text-sky bg-sky-soft' };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function EnvironmentPanel() {
    const t = useT();
    const rows = [
        { label: t('Air Temp'), ...environment.airTemp, icon: 'thermostat' },
        { label: t('Humidity'), ...environment.humidity, icon: 'humidity_percentage' },
        { label: t('Soil Moisture'), ...environment.soilMoisture, icon: 'water_drop' },
        { label: t('Wind'), ...environment.wind, icon: 'air' },
        { label: t('Light'), ...environment.light, icon: 'wb_sunny' },
    ];
    return (
        <Panel as={false} title={t('Environment')} icon="thermostat">
            <div className="flex flex-col divide-y divide-line">
                {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                            <Icon name={r.icon} size={17} className="text-muted" />
                            {r.label}
                        </span>
                        <div className="text-right">
                            <span className="font-mono font-bold text-sm text-ink">{r.value}{r.unit}</span>
                            <p className="text-[10px] text-muted">{r.source} · {r.ts}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function RiskPanel() {
    const t = useT();
    return (
        <Panel as={false} title={t('Risk Intelligence')} icon="warning">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {risk.factors.map((f) => (
                    <div key={f.key} className="flex flex-col items-center gap-1.5">
                        <Gauge value={f.value} tone={TIER_TONE[f.tier]} size={64} stroke={6} />
                        <span className="text-[10px] font-bold text-center text-muted uppercase">{t(f.label)}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-2.5 pt-3 border-t border-line">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t('Why this score')}</p>
                {risk.explain.map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <Icon name={e.icon} size={16} className="text-muted mt-0.5 shrink-0" />
                        <p className="text-xs text-ink leading-relaxed">{t(e.label)}</p>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function CropHealthPanel() {
    const t = useT();
    return (
        <Panel as={false} title={t('Crop Health')} icon="eco">
            <div className="flex flex-col gap-2.5">
                {cropIssues.map((c, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.98 }} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-panel-soft">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{t(c.issue)}</p>
                            <p className="text-[11px] text-muted">{t('Zone')} {c.zone} · {t(c.detected)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 ${SEV_TONE[c.severity]}`}>{c.confidence}%</span>
                    </motion.div>
                ))}
            </div>
        </Panel>
    );
}

function IrrigationPanel() {
    const t = useT();
    const [active, setActive] = useState(new Set(irrigationZones.filter((z) => z.status === 'info').map((z) => z.id)));

    const toggle = async (id) => {
        await wait(700);
        setActive((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <Panel as={false} title={t('Irrigation Control')} icon="water_drop">
            <div className="flex flex-col gap-2.5">
                {irrigationZones.map((z) => {
                    const running = active.has(z.id);
                    return (
                        <div key={z.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-panel-soft">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${running ? 'bg-sky pulse-dot' : z.status === 'good' ? 'bg-accent' : 'bg-rose'}`} />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-ink">{t('Zone')} {z.id}</p>
                                    <p className="text-[11px] text-muted">{z.moisture}% {t('moisture')} · {running ? t('Irrigating') : t(z.label)}</p>
                                </div>
                            </div>
                            <StatefulButton
                                tone={running ? 'rose' : 'accent'}
                                idleLabel={running ? t('Stop') : t('Start')}
                                idleIcon={running ? 'stop' : 'play_arrow'}
                                loadingLabel=""
                                successLabel={running ? t('Stopped') : t('Started')}
                                onPress={() => toggle(z.id)}
                                className="px-3 py-1.5 rounded-lg text-[11px] shrink-0 min-w-[64px]"
                            />
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}

export default function Intelligence() {
    const t = useT();
    return (
        <RevealGroup className="flex flex-col gap-5">
            <RevealItem>
                <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink">{t('Intelligence')}</h1>
                <p className="text-sm text-muted mt-1">{t('Environment, risk, crop health, and irrigation in one place.')}</p>
            </RevealItem>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <RevealItem><RiskPanel /></RevealItem>
                <RevealItem><EnvironmentPanel /></RevealItem>
                <RevealItem><CropHealthPanel /></RevealItem>
                <RevealItem><IrrigationPanel /></RevealItem>
            </div>
        </RevealGroup>
    );
}

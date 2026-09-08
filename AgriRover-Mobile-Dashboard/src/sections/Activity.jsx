import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import BottomSheet from '../components/motion/BottomSheet';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { useT } from '../context/LanguageContext';
import { alerts, roverLog, reports } from '../data/simulation';

const SEV_STYLE = { bad: 'bg-rose-soft text-rose', warn: 'bg-amber-soft text-amber', info: 'bg-sky-soft text-sky', good: 'bg-accent-soft text-accent' };

// Report files are static assets under /public/reports/. BASE_URL keeps this
// correct whether the app is served from '/' or a sub-path.
const reportUrl = (file) => `${import.meta.env.BASE_URL}reports/${file}`;

function ReportsPanel() {
    const t = useT();
    // Per-report status so one download can't be double-clicked and a
    // failure is shown on that row instead of failing silently.
    const [busyId, setBusyId] = useState(null);
    const [errorId, setErrorId] = useState(null);

    const handleDownload = async (report) => {
        if (busyId) return;
        setBusyId(report.id);
        setErrorId(null);
        try {
            const res = await fetch(reportUrl(report.file));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const raw = await res.blob();
            // A dev server / SPA host answers an unknown path with index.html
            // instead of a 404 — catch that so a broken link doesn't save a
            // disguised HTML page.
            if (/^text\/html\b/i.test(raw.type) && report.mime !== 'text/html') {
                throw new Error('file not found (HTML fallback)');
            }
            // Re-wrap with the correct MIME type (a static server may send
            // .xlsx as application/octet-stream).
            const blob = report.mime ? new Blob([raw], { type: report.mime }) : raw;

            // Save as a real file — Blob URL + a synthetic <a download> click,
            // then release the object URL. No new tab, no navigation.
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = report.file;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[reports] download failed:', report.file, err);
            setErrorId(report.id);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Panel as={false} title={t('Reports')} icon="description">
            <div className="flex flex-col gap-2.5">
                {reports.map((r) => {
                    const downloading = busyId === r.id;
                    const failed = errorId === r.id;
                    return (
                        <div key={r.id} className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-panel-soft">
                            <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${SEV_STYLE[r.tone] || 'bg-panel text-muted'}`}>
                                    <Icon name={r.icon} size={16} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-ink truncate">{t(r.name)}</p>
                                    <p className="text-[11px] text-muted truncate">{r.file} · {t(r.time)}</p>
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={() => handleDownload(r)}
                                    disabled={downloading}
                                    whileTap={{ scale: 0.9 }}
                                    aria-busy={downloading}
                                    aria-label={downloading ? t('Downloading…') : `${t('Download')} ${r.file}`}
                                    title={downloading ? t('Downloading…') : t('Download')}
                                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-accent hover:bg-panel disabled:opacity-60 transition-colors"
                                >
                                    <Icon
                                        name={downloading ? 'progress_activity' : 'download'}
                                        size={16}
                                        className={downloading ? 'animate-spin' : ''}
                                    />
                                </motion.button>
                            </div>
                            {failed && (
                                <p className="text-[11px] text-rose pl-11">
                                    {t('Unable to download report. Please try again.')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}

export default function Activity() {
    const t = useT();
    const FILTERS = [
        { id: 'all', label: t('All') },
        { id: 'alerts', label: t('Alerts') },
        { id: 'log', label: t('Rover Log') },
        { id: 'reports', label: t('Reports') },
    ];
    const [filter, setFilter] = useState('all');
    const [openAlert, setOpenAlert] = useState(null);
    const showAlerts = filter === 'all' || filter === 'alerts';
    const showLog = filter === 'all' || filter === 'log';
    const showReports = filter === 'all' || filter === 'reports';
    const single = filter !== 'all';

    const AlertsPanel = (
        <Panel as={false} title={t('Alerts')} icon="notifications_active">
            <div className="flex flex-col gap-3">
                {alerts.map((a) => (
                    <motion.button
                        key={a.id}
                        onClick={() => setOpenAlert(a)}
                        whileTap={{ scale: 0.98 }}
                        className={`accent-bar accent-bar--${a.severity} flex items-start gap-3 p-3 rounded-xl bg-panel-soft text-left`}
                    >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${SEV_STYLE[a.severity]}`}>
                            <Icon name={a.icon} size={17} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-ink truncate">{t(a.title)}</p>
                                <span className="text-[10px] text-muted shrink-0">{t(a.time)}</span>
                            </div>
                            <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{t(a.body)}</p>
                            {a.zone && <span className="inline-block mt-1.5 text-[10px] font-bold text-accent">{t('Zone')} {a.zone}</span>}
                        </div>
                    </motion.button>
                ))}
            </div>
        </Panel>
    );

    const LogPanel = (
        <Panel as={false} title={t('Rover Log')} icon="agriculture">
            <div className="flex flex-col gap-3">
                {roverLog.map((l, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <span className={`mt-0.5 ${l.tone === 'bad' ? 'text-rose' : 'text-sky'}`}>
                            <Icon name={l.icon} size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink">{t(l.title)} <span className="font-normal text-muted">· {l.time}</span></p>
                            <p className="text-xs text-muted">{t(l.detail)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );

    return (
        <RevealGroup className="flex flex-col gap-5">
            <RevealItem className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink">{t('Activity')}</h1>
                    <p className="text-sm text-muted mt-1">{t('Alerts, rover log, and generated reports in one feed.')}</p>
                </div>
                <div className="flex items-center gap-1 bg-panel-soft border border-line rounded-2xl p-1 max-w-full overflow-x-auto">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`relative px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors ${
                                filter === f.id ? 'text-accent-ink' : 'text-muted hover:text-ink'
                            }`}
                        >
                            {filter === f.id && (
                                <motion.span layoutId="activity-filter" className="absolute inset-0 bg-accent rounded-xl" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                            )}
                            <span className="relative">{f.label}</span>
                        </button>
                    ))}
                </div>
            </RevealItem>

            {single ? (
                // A single section reads best as one centred, readable column
                // rather than one card stranded in half of a two-column grid.
                <RevealItem className="w-full max-w-3xl mx-auto flex flex-col gap-5">
                    {showAlerts && AlertsPanel}
                    {showLog && LogPanel}
                    {showReports && <ReportsPanel />}
                </RevealItem>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                    <RevealItem>{AlertsPanel}</RevealItem>
                    <div className="flex flex-col gap-5">
                        <RevealItem>{LogPanel}</RevealItem>
                        <RevealItem><ReportsPanel /></RevealItem>
                    </div>
                </div>
            )}

            <BottomSheet open={!!openAlert} onClose={() => setOpenAlert(null)} title={openAlert ? t(openAlert.title) : ''}>
                {openAlert && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${SEV_STYLE[openAlert.severity]}`}>
                                <Icon name={openAlert.icon} size={20} />
                            </span>
                            <div>
                                {openAlert.zone && <p className="text-xs font-bold text-accent">{t('Zone')} {openAlert.zone}</p>}
                                <p className="text-xs text-muted">{t(openAlert.time)}</p>
                            </div>
                        </div>
                        <p className="text-sm text-ink leading-relaxed">{t(openAlert.body)}</p>
                        <div className="flex gap-2.5">
                            <button onClick={() => setOpenAlert(null)} className="flex-1 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-bold">{t('Acknowledge')}</button>
                            <button onClick={() => setOpenAlert(null)} className="px-4 py-2.5 rounded-xl bg-panel-soft text-ink text-sm font-semibold">{t('Dismiss')}</button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </RevealGroup>
    );
}

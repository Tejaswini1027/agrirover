import TileArt from './TileArt';

const TONE = {
    good: 'text-accent',
    warn: 'text-amber',
    bad: 'text-rose',
    info: 'text-sky',
    neutral: 'text-ink',
};

// `art` is an optional decorative background motif (see TileArt) drawn behind
// the value. Everything else about the tile — size, colours, type, spacing,
// borders — is unchanged; the art layer is purely cosmetic and sits below the
// content.
export default function StatTile({ label, value, unit, caption, tone = 'neutral', art }) {
    return (
        <div className={`relative overflow-hidden isolate bg-panel border border-line rounded-2xl p-4 flex flex-col gap-1 min-w-0 card-lift stat-tile stat-tile--${tone}`}>
            {art && <TileArt name={art} />}
            <span className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-muted truncate">{label}</span>
            <div className="relative z-10 flex items-baseline gap-1">
                <span className={`font-display font-extrabold text-2xl ${TONE[tone]}`}>{value}</span>
                {unit && <span className="text-xs text-muted font-medium">{unit}</span>}
            </div>
            {caption && <span className="relative z-10 text-[11px] text-muted truncate">{caption}</span>}
        </div>
    );
}

import Counter from './motion/Counter';

const toneColor = { good: 'var(--color-accent)', warn: 'var(--color-amber)', bad: 'var(--color-rose)', info: 'var(--color-sky)' };

export default function Gauge({ value, size = 88, stroke = 8, tone = 'good', label }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-panel-soft)" strokeWidth={stroke} />
                    <circle
                        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={toneColor[tone]} strokeWidth={stroke}
                        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.2,0.8,0.2,1)' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Counter value={value} className="font-display font-extrabold text-lg text-ink" />
                </div>
            </div>
            {label && <span className="text-[10px] font-bold uppercase tracking-wide text-muted text-center">{label}</span>}
        </div>
    );
}

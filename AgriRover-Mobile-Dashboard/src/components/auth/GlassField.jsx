import Icon from '../Icon';
import { useT } from '../../context/LanguageContext';

// Marks a field whose value came from the document scan, so the user knows
// exactly what to double-check. Auto-filled fields stay fully editable —
// OCR is a typing shortcut, never a source of truth.
function AutoFilledBadge() {
    const t = useT();
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent/90">
            <Icon name="auto_awesome" size={11} />
            {t('auto-filled')}
        </span>
    );
}

function Label({ label, autoFilled }) {
    if (!label) return null;
    return (
        <span className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-white/60">{label}</span>
            {autoFilled && <AutoFilledBadge />}
        </span>
    );
}

export function GlassInput({ label, error, autoFilled, className = '', ...props }) {
    return (
        <label className="flex flex-col gap-1.5">
            <Label label={label} autoFilled={autoFilled} />
            <input
                {...props}
                className={`w-full px-4 py-3.5 rounded-2xl agv-glass-input text-[16px] placeholder:text-white/35 transition-colors ${className}`}
            />
            {error && <span className="text-[11px] text-rose">{error}</span>}
        </label>
    );
}

export function GlassSelect({ label, error, autoFilled, children, className = '', ...props }) {
    return (
        <label className="flex flex-col gap-1.5">
            <Label label={label} autoFilled={autoFilled} />
            <select
                {...props}
                className={`w-full px-4 py-3.5 rounded-2xl agv-glass-input text-[16px] appearance-none ${className}`}
            >
                {children}
            </select>
            {error && <span className="text-[11px] text-rose">{error}</span>}
        </label>
    );
}

export function GlassTextarea({ label, error, autoFilled, className = '', ...props }) {
    return (
        <label className="flex flex-col gap-1.5">
            <Label label={label} autoFilled={autoFilled} />
            <textarea
                {...props}
                className={`w-full px-4 py-3.5 rounded-2xl agv-glass-input text-[16px] placeholder:text-white/35 resize-none ${className}`}
            />
            {error && <span className="text-[11px] text-rose">{error}</span>}
        </label>
    );
}

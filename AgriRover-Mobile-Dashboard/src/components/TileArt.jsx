// Colourful agricultural illustration that sits BEHIND a metric card's
// number. Three stacked layers keep it vivid AND keep the number readable:
//
//   1. a soft coloured halo in the card's own hue (depth / glow)
//   2. the multi-colour SVG scene, right-aligned, masked to fade left
//   3. a card-coloured "text-safety" gradient over the left ~third
//   ── card content renders above all of this at z-10 ──
//
// Inline SVG only: no image files, no network, nothing to lazy-load. Colours
// are explicit so the scenes stay vibrant on the dark theme; the safety
// gradient uses the panel token so it still adapts to light/dark.

const scene = {
    // FIELD HEALTH — lime field, sprout, soft sun
    field: (
        <g>
            <circle cx="94" cy="28" r="15" fill="#fde68a" opacity="0.75" />
            <path d="M0 120V96Q40 78 78 92T120 84V120Z" fill="#173a1c" />
            <path d="M0 120V104Q45 90 82 102T120 96V120Z" fill="#2f6b2b" />
            <path d="M0 120V112Q52 102 90 110T120 106V120Z" fill="#7bd83f" />
            <path d="M64 106V78" stroke="#3f8f2f" strokeWidth="5" strokeLinecap="round" />
            <path d="M64 90C52 88 46 74 49 64C61 66 68 78 64 90Z" fill="#7bd83f" />
            <path d="M64 98C76 96 84 82 81 72C69 74 61 86 64 98Z" fill="#9ef25a" />
        </g>
    ),
    // ROVER BATTERY — rover carrying a battery, yellow bolt, lime energy
    battery: (
        <g>
            <ellipse cx="64" cy="68" rx="46" ry="20" fill="#a3e635" opacity="0.22" />
            <path d="M20 88h74M26 88l7-25h41l9 25" fill="none" stroke="#9aa08c" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
            <rect x="34" y="60" width="36" height="7" rx="2" fill="#5b6357" />
            <circle cx="38" cy="96" r="9" fill="#1c2113" stroke="#4b5340" strokeWidth="4" />
            <circle cx="84" cy="96" r="9" fill="#1c2113" stroke="#4b5340" strokeWidth="4" />
            <rect x="44" y="36" width="30" height="21" rx="4" fill="#2f6b2b" stroke="#7bd83f" strokeWidth="3" />
            <rect x="74" y="42" width="6" height="9" rx="1.5" fill="#7bd83f" />
            <path d="M58 38L49 51h6l-3 11 13-15h-6z" fill="#facc15" />
        </g>
    ),
    // SOIL MOISTURE — brown soil, roots, green plant, blue droplets
    soil: (
        <g>
            <ellipse cx="64" cy="106" rx="54" ry="12" fill="#7c4a2a" />
            <path d="M12 120q52-22 104 0z" fill="#5b3b23" />
            <path d="M64 96c-6 8-8 14-8 19M64 96c6 7 9 13 9 19M64 94c-13 4-19 10-21 16M64 94c13 4 19 10 21 16" stroke="#4a2f1c" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M64 96V58" stroke="#3f8f2f" strokeWidth="5" strokeLinecap="round" />
            <path d="M64 74C50 72 44 58 47 48C61 50 68 64 64 74Z" fill="#7bd83f" />
            <path d="M64 82C78 80 86 66 83 56C69 58 61 72 64 82Z" fill="#9ef25a" />
            <path d="M32 40c0 6-5 10-5 10s-5-4-5-10a5 5 0 0110 0z" fill="#3fb0d8" />
            <path d="M50 28c0 5-4 8-4 8s-4-3-4-8a4 4 0 018 0z" fill="#6bc9ea" />
            <path d="M94 46c0 6-5 10-5 10s-5-4-5-10a5 5 0 0110 0z" fill="#3fb0d8" />
        </g>
    ),
    // CANOPY TEMP — hot sun upper-right, green crops lower-right
    sun: (
        <g>
            <circle cx="88" cy="32" r="21" fill="#fb923c" />
            <circle cx="88" cy="32" r="12" fill="#fde047" />
            <g stroke="#fb923c" strokeWidth="5" strokeLinecap="round">
                <path d="M88 2V10M88 54V62M56 32H64M112 32H120M65 9l6 6M105 49l6 6M111 9l-6 6M71 49l-6 6" />
            </g>
            <path d="M40 110V72M40 90C28 88 22 74 25 64C37 66 44 80 40 90Z" fill="none" stroke="#3f8f2f" strokeWidth="5" strokeLinecap="round" />
            <path d="M40 98C52 96 60 86 58 76C46 78 38 88 40 98Z" fill="#7bd83f" />
            <path d="M66 110V80C76 78 82 70 80 62" stroke="#3f8f2f" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M66 94C56 92 50 84 52 76C62 78 68 86 66 94Z" fill="#9ef25a" />
        </g>
    ),
    // GPS FIX — cyan sky, satellite, signal waves, location pin
    gps: (
        <g>
            <circle cx="80" cy="44" r="42" fill="#3fb0d8" opacity="0.16" />
            <rect x="54" y="20" width="24" height="17" rx="3" fill="#e0f2fe" stroke="#3fb0d8" strokeWidth="3" />
            <rect x="28" y="22" width="18" height="13" rx="2" fill="#3fb0d8" />
            <rect x="84" y="22" width="18" height="13" rx="2" fill="#3fb0d8" />
            <path d="M66 20V12" stroke="#6bc9ea" strokeWidth="4" strokeLinecap="round" />
            <circle cx="66" cy="10" r="3" fill="#6bc9ea" />
            <path d="M90 64a26 26 0 00-26-26M99 72a38 38 0 00-38-38" stroke="#6bc9ea" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M80 96a15 15 0 10-30 0c0 12 15 28 15 28s15-16 15-28z" fill="#2563eb" />
            <circle cx="65" cy="96" r="6" fill="#ffffff" />
        </g>
    ),
    // RISK INDEX — green field with a compact protective shield, amber accent
    risk: (
        <g>
            <path d="M0 120V98Q38 84 78 96T120 90V120Z" fill="#2f6b2b" />
            <path d="M0 120V110Q46 100 86 108T120 104V120Z" fill="#7bd83f" />
            <path d="M30 116L44 90M52 118V88M74 116L60 90M96 116L84 90" stroke="#1f4d1c" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
            <path d="M84 22L104 30V46C104 64 95 76 84 82C73 76 64 64 64 46V30Z" fill="#3f8f2f" stroke="#9ef25a" strokeWidth="3" />
            <path d="M84 42c-6-1-9-8-7-14c6 1 10 8 7 14z" fill="#9ef25a" />
            <circle cx="104" cy="20" r="4.5" fill="#f59e0b" />
        </g>
    ),
};

// Halo hue per card — a wide, soft radial anchored to the right edge.
const HALO = {
    field: 'rgba(126,216,63,0.20)',
    battery: 'rgba(163,230,53,0.18)',
    soil: 'rgba(90,170,200,0.16)',
    sun: 'rgba(251,146,60,0.22)',
    gps: 'rgba(63,176,216,0.24)',
    risk: 'rgba(126,216,63,0.18)',
};

export default function TileArt({ name, opacity = 0.5, width = '54%', className = '' }) {
    const art = scene[name];
    if (!art) return null;
    return (
        <>
            {/* 1 — coloured halo / depth */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0"
                style={{ background: `radial-gradient(120% 85% at 100% 55%, ${HALO[name] || 'transparent'} 0%, transparent 62%)` }}
            />
            {/* 2 — the illustration */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 right-0 z-0 flex items-center justify-end ${className}`}
                style={{
                    width,
                    opacity,
                    WebkitMaskImage: 'linear-gradient(to left, #000 46%, transparent 92%)',
                    maskImage: 'linear-gradient(to left, #000 46%, transparent 92%)',
                }}
            >
                <svg viewBox="0 0 120 120" className="h-[92%] w-auto max-w-full">{art}</svg>
            </div>
            {/* 3 — text-safety gradient: keeps the number side on clean card colour */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                    background:
                        'linear-gradient(to right, var(--color-panel) 32%, color-mix(in srgb, var(--color-panel) 55%, transparent) 52%, transparent 80%)',
                }}
            />
        </>
    );
}

// Runtime auto-translation via MyMemory's free public API (no key required).
// Every string that flows through here gets cached in localStorage so a
// language, once translated, never needs a network round-trip again.

const STORAGE_KEY = 'agv-i18n-cache-v1';
const ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_CONCURRENT = 4;

export function loadCache() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveCache(cache) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
        // storage full or unavailable — translations just won't persist across reloads
    }
}

let active = 0;
const queue = [];

function runNext() {
    if (active >= MAX_CONCURRENT || queue.length === 0) return;
    active += 1;
    const { text, lang, resolve, reject } = queue.shift();
    const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|${lang}`;

    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            // Pick the best candidate across the primary result and the match
            // list, and reject anything MyMemory itself isn't confident about —
            // the free community engine occasionally returns unrelated text
            // (e.g. a place name) for short, ambiguous source strings.
            const candidates = [
                { text: data?.responseData?.translatedText, quality: Number(data?.responseData?.match) || 0 },
                ...(Array.isArray(data?.matches) ? data.matches.map((m) => ({ text: m.translation, quality: Number(m.match) || 0 })) : []),
            ].filter((c) => typeof c.text === 'string' && c.text.length > 0 && !/MYMEMORY WARNING/i.test(c.text));

            // A translation many times longer than its source is almost always
            // an unrelated database match rather than a real translation —
            // this catches cases a high confidence score alone doesn't.
            const sane = (c) => c.text.length <= Math.max(40, text.length * 4);
            const best = candidates.filter(sane).sort((a, b) => b.quality - a.quality)[0];
            const CONFIDENCE_THRESHOLD = 0.55;
            resolve(best && best.quality >= CONFIDENCE_THRESHOLD ? best.text : text);
        })
        .catch(() => resolve(text))
        .finally(() => {
            active -= 1;
            runNext();
        });

    // fire remaining queued slots
    runNext();
}

export function translateText(text, lang) {
    // Ultra-short strings (abbreviations, codes) are the ones most likely to
    // hit an unrelated high-confidence match in a retrieval-based engine —
    // not worth the round-trip, leave them as-is.
    if (text.trim().length <= 3) return Promise.resolve(text);

    return new Promise((resolve, reject) => {
        queue.push({ text, lang, resolve, reject });
        runNext();
    });
}

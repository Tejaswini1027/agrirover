import { API_URL } from '../config';

// Sends a captured card image to the backend for OCR and field extraction.
//
// The image is transmitted for processing only — the server holds it in
// memory for the duration of the request and never stores it. The response
// contains extracted fields plus a per-field confidence map; the caller uses
// that map to decide what to pre-fill and what to leave for the user.
//
// Returns { ok: true, fields, confidence, extractedCount }
//      or { ok: false, error, fields? }
export async function scanDocument(imageDataUrl) {
    let res;
    try {
        res = await fetch(`${API_URL}/api/ocr/aadhaar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageDataUrl }),
        });
    } catch {
        return { ok: false, error: "We couldn't reach AgriVision. Please check your connection and try again." };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        return {
            ok: false,
            error: data.error || 'Something went wrong while reading the card. Please try again.',
            fields: data.fields,
        };
    }

    return {
        ok: true,
        fields: data.fields,
        confidence: data.confidence,
        extractedCount: data.extractedCount,
    };
}

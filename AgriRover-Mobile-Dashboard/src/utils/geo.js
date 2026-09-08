const R = 6371000; // meters

function haversine([lat1, lng1], [lat2, lng2]) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function perimeter(points) {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) total += haversine(points[i], points[i + 1]);
    return total;
}

// Shoelace formula on an equirectangular projection local to the polygon —
// accurate enough for field-sized (sub-km) boundaries.
export function areaSqMeters(points) {
    if (points.length < 3) return 0;
    const lat0 = points[0][0];
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const xy = points.map(([lat, lng]) => [(lng - points[0][1]) * mPerDegLng, (lat - lat0) * mPerDegLat]);
    let sum = 0;
    for (let i = 0; i < xy.length; i++) {
        const [x1, y1] = xy[i];
        const [x2, y2] = xy[(i + 1) % xy.length];
        sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) / 2;
}

export function formatArea(sqm) {
    return { sqm: Math.round(sqm), hectares: (sqm / 10000).toFixed(2), acres: (sqm / 4046.86).toFixed(2) };
}

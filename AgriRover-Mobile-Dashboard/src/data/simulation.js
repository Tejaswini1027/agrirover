// Simulated telemetry — every figure here is synthetic. The SIMULATION badge
// in the header must stay visible anywhere this data is rendered. Swapping in
// real GPS / weather / CV providers later is a data-source change only.

export const SIMULATION_MODE = true;

export const farm = { name: 'Demo Farm', sector: 'Sector A', home: [34.0537, -118.2412] };

export const rover = {
    id: 'rover-01',
    name: 'AGRIVISION ROVER 01',
    status: 'ONLINE',
    mode: 'MANUAL',
    battery: 74,
    voltage: 7.82,
    current: 1.42,
};

export const gps = {
    lat: 34.0537, lng: -118.2412, fix: 'FIXED', satellites: 9, hdop: 1.2, speed: 0.8, heading: 184, source: 'NEO-6M',
};

export const environment = {
    airTemp: { value: 31.4, unit: '°C', source: 'DHT22', ts: '14:23' },
    humidity: { value: 68, unit: '%', source: 'DHT22', ts: '14:23' },
    soilMoisture: { value: 42, unit: '%', source: 'Soil Sensor', ts: '14:22' },
    wind: { value: 12, unit: 'km/h', source: 'Open-Meteo', ts: '14:22' },
    rain: { detected: false, source: 'Rain Sensor', ts: '14:23' },
    light: { value: 720, unit: 'lux', source: 'LDR', ts: '14:23' },
};

export const risk = {
    aggregate: 18,
    fieldHealth: 87,
    factors: [
        { key: 'heat', label: 'Heat Stress', value: 41, tier: 'ELEVATED' },
        { key: 'water', label: 'Water Stress', value: 37, tier: 'MODERATE' },
        { key: 'drought', label: 'Drought', value: 22, tier: 'LOW' },
        { key: 'veg', label: 'Vegetation Stress', value: 19, tier: 'OPTIMAL' },
    ],
    explain: [
        { icon: 'trending_up', label: 'Temp forecast +4°C above seasonal average, 3 consecutive days.' },
        { icon: 'water_drop', label: 'Zone A2 soil moisture below the 30% threshold.' },
        { icon: 'air', label: 'High solar radiation + wind raising evapotranspiration.' },
        { icon: 'cloud_off', label: 'Rain probability under 20% for the next 72 hours.' },
    ],
};

export const zones = [
    { id: 'A1', health: 92, moisture: 42, status: 'good', label: 'Optimal' },
    { id: 'A2', health: 72, moisture: 26, status: 'bad', label: 'Attention' },
    { id: 'A3', health: 65, moisture: 35, status: 'warn', label: 'Stress' },
    { id: 'B1', health: 80, moisture: 45, status: 'good', label: 'Optimal' },
];

export const cropIssues = [
    { issue: 'Early Blight', zone: 'A3', confidence: 92, severity: 'bad', detected: 'Today 08:30' },
    { issue: 'Aphid Clusters', zone: 'C1', confidence: 78, severity: 'warn', detected: 'Yesterday' },
    { issue: 'Drought Stress', zone: 'B4', confidence: 85, severity: 'warn', detected: 'Oct 28' },
];

export const irrigationZones = [
    { id: 'A1', moisture: 42, status: 'good', label: 'Optimal' },
    { id: 'A2', moisture: 28, status: 'bad', label: 'Needs Water' },
    { id: 'A3', moisture: 55, status: 'info', label: 'Irrigating' },
    { id: 'B1', moisture: 45, status: 'good', label: 'Optimal' },
];

export const alerts = [
    { id: 1, severity: 'bad', icon: 'coronavirus', title: 'Possible disease detected', body: 'AI Vision flagged 92% confidence of leaf rust in Zone A3.', zone: 'A3', time: '10:42 AM' },
    { id: 2, severity: 'warn', icon: 'water_drop', title: 'Low soil moisture', body: 'Moisture dropped to 23% in the secondary growth zone.', zone: 'A2', time: '08:15 AM' },
    { id: 3, severity: 'info', icon: 'agriculture', title: 'Rover completed field scan', body: 'Perimeter and health scan covering 450 acres complete.', time: 'Yesterday, 18:00' },
    { id: 4, severity: 'info', icon: 'sync', title: 'Weather data synchronized', body: 'Local meteorological station merged with central DB.', time: 'Yesterday, 14:30' },
];

export const roverLog = [
    { icon: 'my_location', title: 'Scan started', detail: 'Entering Zone A2', time: '14:20:00' },
    { icon: 'warning', title: 'Anomaly detected', detail: 'Low moisture signature', time: '14:22:15', tone: 'bad' },
    { icon: 'sync', title: 'Telemetry sync', detail: 'Packet received', time: '14:23:05' },
];

// Report files live in /public/reports/ and are served as static assets.
// `mime` is sent through to the download so the browser labels the saved
// file correctly. Swapping in a backend later means changing how the URL is
// built in Activity.jsx (fetch an /api/reports/:id/download endpoint) — the
// data model here already carries a stable `id` for that.
export const reports = [
    { id: 'fhr-q3-2026', name: 'Comprehensive Field Health Report', file: 'Q3_2026_FHR.pdf', mime: 'application/pdf', time: 'Generated 2h ago', icon: 'eco', tone: 'good' },
    { id: 'rov-log-wk42', name: 'Weekly Rover Diagnostics & Path Log', file: 'WK42_ROV_LOG.csv', mime: 'text/csv', time: 'Compiling (45%)…', icon: 'sync', tone: 'neutral' },
    { id: 'pd-incidence-oct', name: 'Pest & Disease Incidence Log', file: 'PD_INCIDENCE_OCT.pdf', mime: 'application/pdf', time: 'Generated 1d ago', icon: 'coronavirus', tone: 'bad' },
    { id: 'irr-audit-24', name: 'Irrigation Efficiency Audit', file: 'IRR_AUDIT_24.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', time: 'Generated Oct 12', icon: 'water_drop', tone: 'info' },
];

export const detections = [
    { label: 'Disease · Zone A3', confidence: 92, icon: 'coronavirus' },
    { label: 'Pest · Zone B1', confidence: 87, icon: 'bug_report' },
    { label: 'Water Stress · Zone A2', confidence: 81, icon: 'water_drop' },
];

// A demo field boundary (closed polygon) + a simulated rover path around it,
// used by the Field Ops map. Mirrors the shape the real GPS pipeline would
// eventually produce (validated / smoothed / closed polygon).
export const fieldBoundary = [
    [34.0552, -118.2432], [34.0555, -118.2398], [34.0533, -118.2392],
    [34.0522, -118.2418], [34.0531, -118.2440], [34.0552, -118.2432],
];

export const simulatedWalk = [
    [34.0552, -118.2432], [34.0555, -118.2398], [34.0533, -118.2392],
    [34.0522, -118.2418], [34.0531, -118.2440],
];

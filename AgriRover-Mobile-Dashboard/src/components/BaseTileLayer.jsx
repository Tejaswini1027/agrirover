import { TileLayer } from 'react-leaflet';

// The two base layers the map can show. Keyed by `mode` so Leaflet swaps the
// tile layer cleanly (old one removed, new one added) without touching the
// map view or any marker/overlay.
const LAYERS = {
    gps: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    },
    // Esri World Imagery — keyless, Leaflet-friendly, attribution shown below.
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19,
    },
};

export default function BaseTileLayer({ mode = 'gps', nonce = 0, onError, onLoad }) {
    const layer = LAYERS[mode] || LAYERS.gps;
    return (
        <TileLayer
            key={`${mode}-${nonce}`}
            url={layer.url}
            attribution={layer.attribution}
            maxZoom={layer.maxZoom}
            eventHandlers={{
                tileerror: () => onError && onError(mode),
                load: () => onLoad && onLoad(mode),
            }}
        />
    );
}

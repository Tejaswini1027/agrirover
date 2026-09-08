import { MapContainer, TileLayer, Polygon, CircleMarker } from 'react-leaflet';
import { fieldBoundary } from '../data/simulation';

export default function MiniMap({ height = 220, interactive = false, roverPos }) {
    const center = fieldBoundary[0];
    return (
        <div className="rounded-2xl overflow-hidden border border-line" style={{ height }}>
            <MapContainer
                center={center}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                zoomControl={interactive}
                dragging={interactive}
                scrollWheelZoom={interactive}
                doubleClickZoom={interactive}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polygon positions={fieldBoundary} pathOptions={{ color: '#7bd83f', weight: 3, fillOpacity: 0.15 }} />
                {roverPos && (
                    <CircleMarker center={roverPos} radius={7} pathOptions={{ color: '#f2a33d', fillColor: '#f2a33d', fillOpacity: 1, weight: 2 }} />
                )}
            </MapContainer>
        </div>
    );
}

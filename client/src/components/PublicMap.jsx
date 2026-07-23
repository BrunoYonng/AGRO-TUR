import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MapPin } from "lucide-react";
import { demoAreas, points } from "../lib/demo-data";

const icon = L.divIcon({
  className: "map-pin",
  html: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/></svg>',
});

export function PublicMap({ areas = demoAreas, compact = false }) {
  return (
    <MapContainer
      center={[-14.8912, 13.4962]}
      zoom={15}
      scrollWheelZoom={false}
      className={compact ? "h-[420px] w-full" : "h-[70vh] min-h-[520px] w-full"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {areas.map((area) => (
        <GeoJSON
          key={area.id}
          data={area.geojson}
          style={{
            color: area.type === "PLANTATION" ? "#378a3b" : area.type === "ANIMALS" ? "#d49b00" : "#3478b5",
            fillOpacity: 0.25,
            weight: 2,
          }}
          onEachFeature={(_, layer) => layer.bindPopup(`<strong>${area.name}</strong><br/>${area.description}`)}
        />
      ))}
      {points.map((point) => (
        <Marker key={point.name} position={point.position} icon={icon}>
          <Popup>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-agro-600">{point.type}</p>
            <h3 className="text-base font-bold">{point.name}</h3>
            <p className="mt-1 text-sm text-stone-600">{point.description}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

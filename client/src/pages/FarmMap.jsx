import L from "leaflet";
import "leaflet-draw";
import { useEffect, useState } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { Chatbot } from "../components/Chatbot";
import { LoginPanel } from "../components/LoginPanel";
import { PublicNav } from "../components/PublicNav";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { canUseDashboard, getStoredUser } from "../lib/auth";
import { demoAreas, points } from "../lib/demo-data";

const labels = { PLANTATION: "Plantação", ANIMALS: "Animais", LEISURE: "Lazer", SERVICE: "Serviço" };
const colors = { PLANTATION: "#378a3b", ANIMALS: "#d49b00", LEISURE: "#3478b5", SERVICE: "#8b5a2b" };
const pointIcon = L.divIcon({ className: "map-pin", html: "●" });

export function FarmMap() {
  const [params] = useSearchParams();
  const admin = params.get("admin") === "1";
  const focus = params.get("focus");
  const [adminUser, setAdminUser] = useState(getStoredUser);
  const [areas, setAreas] = useState(demoAreas);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    api("/areas").then(setAreas).catch(() => {});
  }, []);

  async function saveArea(form) {
    const payload = { ...form, geojson: draft };
    try {
      const saved = await api("/areas", { method: "POST", body: JSON.stringify(payload) });
      setAreas((items) => [...items, saved]);
    } catch {
      setAreas((items) => [...items, { ...payload, id: `local-${Date.now()}` }]);
    }
    setDraft(null);
  }

  const focusedPlace =
    points.find((point) => point.id === focus) ||
    areas.find((area) => area.id === focus);

  const content = (
    <div className={admin ? "grid gap-5 xl:grid-cols-[1fr_300px]" : ""}>
      <div className="relative overflow-hidden rounded-[24px] bg-white shadow-soft">
        <MapCanvas areas={areas} editable={admin} focus={focus} onCreated={setDraft} />
        {!admin && focusedPlace && (
          <div className="absolute left-4 top-4 z-[1000] max-w-[calc(100%-32px)] rounded-2xl bg-agro-900 px-4 py-3 text-white shadow-xl sm:left-6 sm:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-sun">Recomendado pelo assistente</p>
            <p className="mt-1 font-bold">{focusedPlace.name}</p>
            <p className="mt-1 max-w-sm text-xs text-white/65">{focusedPlace.description}</p>
          </div>
        )}
        {!admin && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 sm:left-6 sm:right-auto">
            {Object.entries(labels).map(([type, label]) => (
              <span key={type} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold shadow-lg">
                <i className="size-2 rounded-full" style={{ backgroundColor: colors[type] }} /> {label}
              </span>
            ))}
          </div>
        )}
      </div>
      {admin && (
        <aside className="rounded-2xl bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-agro-600">Camadas da fazenda</p>
          <h2 className="mt-2 text-xl font-bold">Áreas cadastradas</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">Use os controlos no mapa para desenhar um polígono. Depois identifique a nova área.</p>
          <div className="mt-6 divide-y">
            {areas.map((area) => (
              <div key={area.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{area.name}</p>
                  <Badge tone={area.type === "ANIMALS" ? "yellow" : "green"}>{labels[area.type]}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{area.description}</p>
              </div>
            ))}
          </div>
        </aside>
      )}
      {draft && <AreaForm onCancel={() => setDraft(null)} onSave={saveArea} />}
    </div>
  );

  if (admin) {
    if (!localStorage.getItem("agrotur_token") || !adminUser) {
      return <LoginPanel onLogin={setAdminUser} />;
    }
    if (adminUser && !canUseDashboard(adminUser)) {
      return (
        <main className="grid min-h-screen place-items-center bg-cream px-5 text-center">
          <div className="max-w-md">
            <h1 className="font-display text-4xl">Mapa administrativo restrito.</h1>
            <p className="mt-4 text-sm text-stone-600">Entre como gestor ou fazendeiro para desenhar e guardar áreas GIS.</p>
            <Link to="/mapa"><Button className="mt-6">Abrir mapa público</Button></Link>
          </div>
        </main>
      );
    }
    return (
      <AdminShell user={adminUser} title="Mapa GIS" subtitle="Desenhe e organize as áreas da fazenda">
        {content}
      </AdminShell>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <PublicNav />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-agro-600">Mapa interativo</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h1 className="max-w-3xl font-display text-4xl leading-tight sm:text-6xl">Descubra cada canto da fazenda.</h1>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500">Toque nos pontos e áreas para conhecer o curral, a horta, o lago e o restaurante antes de chegar.</p>
        </div>
        <div className="mt-10">{content}</div>
      </section>
      <Chatbot />
    </main>
  );
}

function MapCanvas({ areas, editable, focus, onCreated }) {
  return (
    <MapContainer center={[-14.8912, 13.4962]} zoom={15} className="h-[calc(100vh-210px)] min-h-[540px] w-full" scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {areas.map((area) => (
        <GeoJSON
          key={area.id}
          data={area.geojson}
          style={{
            color: colors[area.type] || "#4CAF50",
            fillOpacity: area.id === focus ? 0.42 : 0.25,
            weight: area.id === focus ? 5 : 2,
          }}
          onEachFeature={(_, layer) => layer.bindPopup(`<strong>${area.name}</strong><br/>${area.description}`)}
        />
      ))}
      {points.map((point) => (
        <Marker key={point.name} position={point.position} icon={pointIcon}>
          <Popup><strong>{point.name}</strong><br />{point.description}</Popup>
        </Marker>
      ))}
      <MapFocus focus={focus} areas={areas} />
      {editable && <DrawControl onCreated={onCreated} />}
    </MapContainer>
  );
}

function MapFocus({ focus, areas }) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;
    const point = points.find((item) => item.id === focus);
    if (point) {
      map.flyTo(point.position, 18, { duration: 1.1 });
      return;
    }
    const area = areas.find((item) => item.id === focus);
    if (area) {
      const bounds = L.geoJSON(area.geojson).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
    }
  }, [areas, focus, map]);

  return null;
}

function DrawControl({ onCreated }) {
  const map = useMap();
  useEffect(() => {
    const layers = new L.FeatureGroup();
    map.addLayer(layers);
    const control = new L.Control.Draw({
      position: "topright",
      edit: { featureGroup: layers, edit: false, remove: true },
      draw: {
        polygon: { allowIntersection: false, shapeOptions: { color: "#4CAF50", fillOpacity: 0.25 } },
        rectangle: { shapeOptions: { color: "#4CAF50", fillOpacity: 0.25 } },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
    });
    map.addControl(control);
    const created = (event) => {
      layers.clearLayers();
      layers.addLayer(event.layer);
      onCreated(event.layer.toGeoJSON());
    };
    map.on(L.Draw.Event.CREATED, created);
    return () => {
      map.off(L.Draw.Event.CREATED, created);
      map.removeControl(control);
      map.removeLayer(layers);
    };
  }, [map, onCreated]);
  return null;
}

function AreaForm({ onCancel, onSave }) {
  const [form, setForm] = useState({ name: "", type: "PLANTATION", description: "", public: true });
  return (
    <div className="fixed inset-0 z-[4000] grid place-items-end bg-black/45 sm:place-items-center sm:p-5">
      <form
        className="w-full max-w-md rounded-t-[28px] bg-white p-6 sm:rounded-[28px]"
        onSubmit={(event) => { event.preventDefault(); onSave(form); }}
      >
        <h2 className="text-xl font-bold">Identificar nova área</h2>
        <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-stone-500">Nome</label>
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-agro-500" placeholder="Ex.: Pomar norte" />
        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-stone-500">Tipo</label>
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 h-11 w-full rounded-xl border bg-white px-3 outline-none focus:ring-2 focus:ring-agro-500">
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-stone-500">Descrição</label>
        <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-agro-500" />
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
          <Button className="flex-1">Guardar área</Button>
        </div>
      </form>
    </div>
  );
}

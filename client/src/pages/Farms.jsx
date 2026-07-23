import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  ArrowRight,
  Leaf,
  LocateFixed,
  MapPin,
  Navigation,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Chatbot } from "../components/Chatbot";
import { PublicNav } from "../components/PublicNav";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";

const filters = [
  { id: "nearby", label: "Mais próximas", icon: Navigation },
  { id: "price", label: "Melhor preço", icon: Tags },
  { id: "sustainability", label: "Sustentáveis", icon: Leaf },
  { id: "comfort", label: "Mais conforto", icon: Sparkles },
];

const farmIcon = L.divIcon({
  className: "farm-map-pin",
  html: '<span aria-hidden="true">●</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export function Farms() {
  const [params, setParams] = useSearchParams();
  const [preference, setPreference] = useState("nearby");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const focusedFarm = params.get("focus");

  useEffect(() => {
    const query = new URLSearchParams({ preference });
    if (location) {
      query.set("lat", location.latitude);
      query.set("lng", location.longitude);
    }
    setLoading(true);
    api(`/farms?${query}`)
      .then((data) => setFarms(data.farms))
      .finally(() => setLoading(false));
  }, [location, preference]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationStatus("ready");
        setPreference("nearby");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 },
    );
  }

  const selected = useMemo(
    () => farms.find((farm) => farm.id === focusedFarm) || farms[0],
    [farms, focusedFarm],
  );

  return (
    <main className="min-h-screen bg-cream">
      <PublicNav />
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="grid gap-7 border-b border-black/10 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-agro-600">Descobrir fazendas</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight sm:text-6xl">
              A melhor experiência começa perto de si.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Compare distância, preço, conforto e compromisso ambiental. O recomendador explica por que cada lugar combina consigo.
            </p>
          </div>
          <div className="lg:text-right">
            <Button onClick={useMyLocation} disabled={locationStatus === "loading"}>
              <LocateFixed className={`size-4 ${locationStatus === "loading" ? "animate-pulse" : ""}`} />
              {locationStatus === "loading"
                ? "A localizar…"
                : locationStatus === "ready"
                  ? "Localização ativa"
                  : "Usar a minha localização"}
            </Button>
            {locationStatus === "denied" && (
              <p className="mt-2 max-w-xs text-xs text-stone-500">Sem permissão. Pode continuar a comparar todas as fazendas.</p>
            )}
          </div>
        </div>

        <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setPreference(filter.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  preference === filter.id
                    ? "bg-agro-900 text-white"
                    : "border border-black/10 bg-white text-stone-600 hover:border-agro-500"
                }`}
              >
                <Icon className="size-4" />
                {filter.id === "nearby" && !location ? "Recomendadas" : filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.82fr)]">
          <div className="divide-y divide-black/10">
            {loading && <p className="py-12 text-sm font-semibold text-stone-500">A preparar recomendações…</p>}
            {!loading &&
              farms.map((farm, index) => (
                <article
                  key={farm.id}
                  className={`group grid gap-5 py-7 sm:grid-cols-[180px_1fr] ${
                    farm.id === selected?.id ? "text-agro-900" : ""
                  }`}
                >
                  <button
                    onClick={() => setParams({ focus: farm.id })}
                    className="relative h-44 overflow-hidden rounded-[22px] text-left sm:h-full sm:min-h-44"
                  >
                    <img
                      src={farm.imageUrl}
                      alt={`Paisagem de ${farm.name}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur">
                      {farm.recommendationReason}
                    </span>
                  </button>
                  <div className="flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-500">
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-agro-500" />{farm.location}</span>
                      <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-sun text-sun" />{farm.rating}</span>
                      {farm.distanceKm !== null && <span>{farm.distanceKm.toFixed(1)} km</span>}
                    </div>
                    <h2 className="mt-2 font-display text-3xl">{farm.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{farm.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {farm.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-agro-50 px-2.5 py-1 text-[10px] font-bold text-agro-800">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p><span className="text-xs text-stone-500">A partir de</span><br /><strong>{farm.startingPriceKz.toLocaleString("pt-AO")} Kz</strong></p>
                      <Link to={`/fazendas?focus=${farm.id}`}>
                        <Button variant="outline" size="sm">Ver no mapa <ArrowRight className="size-4" /></Button>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          <div className="h-[480px] overflow-hidden rounded-[26px] shadow-soft lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:min-h-[560px]">
            {farms.length > 0 && (
              <MapContainer center={[farms[0].latitude, farms[0].longitude]} zoom={9} className="size-full" scrollWheelZoom>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {farms.map((farm) => (
                  <Marker key={farm.id} position={[farm.latitude, farm.longitude]} icon={farmIcon} eventHandlers={{ click: () => setParams({ focus: farm.id }) }}>
                    <Popup><strong>{farm.name}</strong><br />{farm.recommendationReason}</Popup>
                  </Marker>
                ))}
                <FarmFocus farm={selected} />
              </MapContainer>
            )}
          </div>
        </div>
      </section>
      <Chatbot />
    </main>
  );
}

function FarmFocus({ farm }) {
  const map = useMap();
  useEffect(() => {
    if (farm) map.flyTo([farm.latitude, farm.longitude], 12, { duration: 0.9 });
  }, [farm, map]);
  return null;
}

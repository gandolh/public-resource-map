import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import type { MetaFunction } from "react-router";
import { MapPin, Clock, Phone, Globe, Navigation, ChevronRight, Accessibility } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { CategoryBadge } from "~/components/ui/CategoryBadge";
import { Button } from "~/components/ui/Button";
import type { Resource } from "@public-resource-map/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const meta: MetaFunction = () => [
  { title: "Resource — CivicMap" },
];

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/resources/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<Resource>;
      })
      .then(setResource)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (resource) document.title = `${resource.name} — CivicMap`;
    return () => { document.title = "CivicMap"; };
  }, [resource]);

  if (loading) return <LoadingSkeleton />;
  if (error || !resource) return <NotFound />;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-10 pt-20 pb-10 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-cm-on-surface-variant">
        <Link to="/map" className="hover:text-cm-primary transition-colors">Map</Link>
        <ChevronRight size={14} />
        <span className="text-cm-on-background">{resource.name}</span>
      </nav>

      {/* Hero */}
      <section className="relative rounded-xl overflow-hidden bg-cm-surface-container border border-cm-outline-variant shadow-sm">
        <div className="h-64 md:h-96 bg-gradient-to-br from-cm-surface-container to-cm-surface-container-high" />
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <CategoryBadge category={resource.category} className="mb-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{resource.name}</h1>
              <div className="flex items-center gap-1 text-white/90 text-sm">
                <MapPin size={14} />
                {resource.address}
              </div>
            </div>
            <Button size="lg" className="shrink-0">
              <Navigation size={16} />
              Get Directions
            </Button>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description + map */}
        <div className="lg:col-span-2 space-y-6">
          {resource.description && (
            <div className="bg-cm-surface rounded-xl border border-cm-outline-variant p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-cm-on-background mb-4">About</h2>
              <p className="text-base text-cm-on-surface-variant leading-relaxed">{resource.description}</p>
            </div>
          )}

          <div className="bg-cm-surface rounded-xl border border-cm-outline-variant overflow-hidden shadow-sm h-[300px]">
            <MapContainer
              center={[resource.coordinates.lat, resource.coordinates.lng]}
              zoom={15}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer url={LIGHT_TILES} attribution={CARTO_ATTR} />
              <CircleMarker
                center={[resource.coordinates.lat, resource.coordinates.lng]}
                radius={10}
                pathOptions={{ color: "#1c6090", fillColor: "#1c6090", fillOpacity: 0.8, weight: 2 }}
              />
            </MapContainer>
          </div>
        </div>

        {/* Right: info sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-cm-surface rounded-xl border border-cm-outline-variant p-6 shadow-sm">
            <h3 className="text-base font-semibold text-cm-on-background mb-4">Contact</h3>
            <ul className="space-y-4">
              {resource.phone && (
                <li className="flex items-center gap-3">
                  <IconCircle><Phone size={16} /></IconCircle>
                  <a href={`tel:${resource.phone}`} className="text-sm text-cm-on-surface-variant hover:text-cm-primary transition-colors">
                    {resource.phone}
                  </a>
                </li>
              )}
              {resource.website && (
                <li className="flex items-center gap-3">
                  <IconCircle><Globe size={16} /></IconCircle>
                  <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-sm text-cm-on-surface-variant hover:text-cm-primary transition-colors truncate">
                    {resource.website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
              {!resource.phone && !resource.website && (
                <li className="text-sm text-cm-on-surface-variant">No contact info available</li>
              )}
            </ul>
          </div>

          {/* Hours */}
          {resource.openingHours && (
            <div className="bg-cm-surface rounded-xl border border-cm-outline-variant p-6 shadow-sm">
              <h3 className="text-base font-semibold text-cm-on-background mb-4">Hours</h3>
              <HoursDisplay raw={resource.openingHours} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function HoursDisplay({ raw }: { raw: string }) {
  let entries: [string, string][] = [];
  try {
    const parsed = JSON.parse(raw);
    entries = Object.entries(parsed) as [string, string][];
  } catch {
    return <p className="text-sm text-cm-on-surface-variant whitespace-pre-line">{raw}</p>;
  }
  return (
    <ul className="space-y-1">
      {entries.map(([day, hours]) => (
        <li key={day} className="flex justify-between text-sm py-1 border-b border-cm-outline-variant/30 last:border-0">
          <span className="text-cm-on-surface-variant">{day}</span>
          <span className={`font-medium ${hours === "Closed" ? "text-cm-outline" : "text-cm-on-background"}`}>{hours}</span>
        </li>
      ))}
    </ul>
  );
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-full bg-cm-surface-container flex items-center justify-center text-cm-primary flex-shrink-0">
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-10 pt-20 pb-10 space-y-6 animate-pulse">
      <div className="h-4 bg-cm-surface-container-high rounded w-48" />
      <div className="h-80 bg-cm-surface-container-high rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-48 bg-cm-surface-container-high rounded-xl" />
        <div className="h-48 bg-cm-surface-container-high rounded-xl" />
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-10 pt-20 pb-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold text-cm-on-surface mb-2">Resource not found</h2>
      <p className="text-sm text-cm-on-surface-variant mb-6">This resource may have been removed or doesn't exist.</p>
      <Link to="/map">
        <Button>Back to Map</Button>
      </Link>
    </main>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";

type Faction = "axis" | "allied" | "neutral";
type CountryProperties = Record<string, unknown>;
type LatLng = [number, number];
type TimelineSnapshot = {
  date: string;
  title: string;
  description: string;
  baseControl: Record<string, Faction>;
};

const COUNTRY_DATA_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.0.0/geojson/ne_110m_admin_0_countries.geojson";

const SOVIET_OCCUPIED_POLYGONS: Record<number, LatLng[]> = {
  2: [
    [70, 28],
    [59.5, 23.5],
    [58.5, 25],
    [56.5, 25],
    [54, 26],
    [51.5, 25.5],
    [48, 27.5],
    [46.5, 29.5],
    [42, 29.5],
    [42, 28],
    [70, 28],
  ],
  3: [
    [70, 30],
    [59.93, 30.31],
    [58.5, 32.5],
    [56.85, 35.9],
    [56.33, 36.72],
    [54.19, 37.61],
    [52.8, 38],
    [51.67, 39.18],
    [48.8, 40.2],
    [47.23, 39.7],
    [46.5, 37.5],
    [42, 33.5],
    [42, 28],
    [70, 28],
  ],
  4: [
    [70, 30],
    [59.93, 30.31],
    [57, 33.5],
    [56, 34.5],
    [53, 35],
    [51.5, 36.5],
    [48.7, 44.51],
    [43.6, 42],
    [42, 42],
    [42, 28],
    [70, 28],
  ],
  5: [
    [70, 28],
    [59.5, 28],
    [56, 29],
    [55, 30.5],
    [53.5, 30],
    [50.4, 30.5],
    [47.8, 35.1],
    [46.5, 32.5],
    [42, 33.5],
    [42, 28],
    [70, 28],
  ],
  6: [
    [70, 27.8],
    [59.4, 27.8],
    [57, 27],
    [55, 28],
    [53, 28.5],
    [51, 27],
    [48.5, 25.5],
    [42, 28],
    [42, 25],
    [70, 25],
  ],
};

const TIMELINE_SNAPSHOTS: TimelineSnapshot[] = [
  {
    date: "1939-09-01",
    title: "1. Sept 1, 1939 — Outbreak of WWII in Europe",
    description: "Germany invades Poland. Western Allies declare war.",
    baseControl: { DEU: "axis", POL: "axis", FRA: "allied", GBR: "allied" },
  },
  {
    date: "1940-06-15",
    title: "2. June 15, 1940 — Fall of France",
    description:
      "Wehrmacht occupies France, Low Countries, Denmark, and Norway.",
    baseControl: {
      DEU: "axis",
      POL: "axis",
      BEL: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      FRA: "axis",
      ITA: "axis",
      AUT: "axis",
      GBR: "allied",
    },
  },
  {
    date: "1941-06-22",
    title: "3. June 22, 1941 — Operation Barbarossa Launch",
    description:
      "Axis forces invade USSR. Frontline pushes past the western border.",
    baseControl: {
      DEU: "axis",
      POL: "axis",
      FRA: "axis",
      BEL: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      AUT: "axis",
      HUN: "axis",
      ROU: "axis",
      BGR: "axis",
      GRC: "axis",
      YUG: "axis",
      ITA: "axis",
      FIN: "axis",
      GBR: "allied",
      RUS: "allied",
      BLR: "axis",
      UKR: "axis",
      EST: "axis",
      LVA: "axis",
      LTU: "axis",
      MDA: "axis",
    },
  },
  {
    date: "1941-12-05",
    title: "4. Dec 5, 1941 — Peak Axis Penetration into Russia",
    description:
      "Wehrmacht reaches Leningrad ring, Moscow outskirts, and Rostov.",
    baseControl: {
      DEU: "axis",
      POL: "axis",
      FRA: "axis",
      BEL: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      AUT: "axis",
      HUN: "axis",
      ROU: "axis",
      BGR: "axis",
      GRC: "axis",
      YUG: "axis",
      ITA: "axis",
      FIN: "axis",
      GBR: "allied",
      RUS: "allied",
      BLR: "axis",
      UKR: "axis",
      EST: "axis",
      LVA: "axis",
      LTU: "axis",
      MDA: "axis",
    },
  },
  {
    date: "1942-11-18",
    title: "5. Nov 18, 1942 — Battle of Stalingrad & Caucasus Push",
    description:
      "Axis forces reach Stalingrad on the Volga River and enter the Caucasus.",
    baseControl: {
      DEU: "axis",
      POL: "axis",
      FRA: "axis",
      BEL: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      AUT: "axis",
      HUN: "axis",
      ROU: "axis",
      BGR: "axis",
      GRC: "axis",
      YUG: "axis",
      ITA: "axis",
      FIN: "axis",
      GBR: "allied",
      RUS: "allied",
      BLR: "axis",
      UKR: "axis",
      EST: "axis",
      LVA: "axis",
      LTU: "axis",
      MDA: "axis",
    },
  },
  {
    date: "1943-12-01",
    title: "6. Dec 1, 1943 — Soviet Dnieper River Offensives",
    description: "Red Army pushes Axis troops back across Ukraine and Belarus.",
    baseControl: {
      DEU: "axis",
      POL: "axis",
      FRA: "axis",
      BEL: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      AUT: "axis",
      HUN: "axis",
      ROU: "axis",
      BGR: "axis",
      GRC: "axis",
      YUG: "axis",
      FIN: "axis",
      ITA: "allied",
      GBR: "allied",
      RUS: "allied",
      BLR: "axis",
      EST: "axis",
      LVA: "axis",
      LTU: "axis",
      MDA: "axis",
    },
  },
  {
    date: "1944-06-06",
    title: "7. June 6, 1944 — D-Day Normandy Landings",
    description:
      "Western Allies land in Normandy; Eastern Front sits near Baltic borders.",
    baseControl: {
      DEU: "axis",
      POL: "axis",
      FRA: "axis",
      BEL: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      AUT: "axis",
      HUN: "axis",
      ROU: "axis",
      BGR: "axis",
      GRC: "axis",
      YUG: "axis",
      FIN: "axis",
      ITA: "allied",
      GBR: "allied",
      RUS: "allied",
      BLR: "axis",
      EST: "axis",
      LVA: "axis",
      LTU: "axis",
      MDA: "axis",
    },
  },
  {
    date: "1944-08-25",
    title: "8. Aug 25, 1944 — Liberation of Soviet Lands",
    description: "Axis forces driven completely out of Soviet territory.",
    baseControl: {
      DEU: "axis",
      NLD: "axis",
      DNK: "axis",
      NOR: "axis",
      AUT: "axis",
      HUN: "axis",
      GRC: "axis",
      POL: "allied",
      FRA: "allied",
      BEL: "allied",
      ROU: "allied",
      BGR: "allied",
      YUG: "allied",
      ITA: "allied",
      GBR: "allied",
      RUS: "allied",
      UKR: "allied",
      BLR: "allied",
      EST: "allied",
      LVA: "allied",
      LTU: "allied",
      MDA: "allied",
    },
  },
  {
    date: "1945-05-08",
    title: "9. May 8, 1945 — Victory in Europe (V-E Day)",
    description: "Nazi Germany surrenders unconditionally.",
    baseControl: {
      DEU: "allied",
      POL: "allied",
      FRA: "allied",
      BEL: "allied",
      NLD: "allied",
      DNK: "allied",
      NOR: "allied",
      AUT: "allied",
      HUN: "allied",
      ROU: "allied",
      BGR: "allied",
      GRC: "allied",
      YUG: "allied",
      ITA: "allied",
      GBR: "allied",
      RUS: "allied",
      UKR: "allied",
      BLR: "allied",
      EST: "allied",
      LVA: "allied",
      LTU: "allied",
      MDA: "allied",
    },
  },
];

const FACTION_COLORS: Record<Faction, string> = {
  axis: "#ef4444",
  allied: "#3b82f6",
  neutral: "#475569",
};

export default function App() {
  const [snapshotIndex, setSnapshotIndex] = useState(3);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<
    Geometry,
    CountryProperties
  > | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(COUNTRY_DATA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(
            `Unable to load country boundaries (${response.status}).`,
          );
        return response.json() as Promise<
          FeatureCollection<Geometry, CountryProperties>
        >;
      })
      .then(setGeoJsonData)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error("GeoJSON fetch error:", error);
      });

    return () => controller.abort();
  }, []);

  const currentSnapshot = TIMELINE_SNAPSHOTS[snapshotIndex];
  const occupiedFrontline = useMemo(
    () => SOVIET_OCCUPIED_POLYGONS[snapshotIndex],
    [snapshotIndex],
  );

  const getFaction = useCallback(
    (properties?: CountryProperties): Faction => {
      if (!properties) return "neutral";
      const possibleKeys = [
        properties.ISO_A3,
        properties.ISO_A3_EH,
        properties.NAME,
        properties.ADMIN,
      ];
      for (const key of possibleKeys) {
        if (typeof key === "string" && currentSnapshot.baseControl[key])
          return currentSnapshot.baseControl[key];
      }
      return "neutral";
    },
    [currentSnapshot],
  );

  const styleCountry = useCallback(
    (feature?: Feature<Geometry, CountryProperties>): PathOptions => {
      const faction = getFaction(feature?.properties);
      return {
        fillColor: FACTION_COLORS[faction],
        color: "#0f172a",
        weight: 0.8,
        opacity: 1,
        fillOpacity: faction === "neutral" ? 0.35 : 0.85,
      };
    },
    [getFaction],
  );

  const onEachCountry = useCallback(
    (feature: Feature<Geometry, CountryProperties>, layer: Layer) => {
      const name =
        typeof feature.properties?.NAME === "string"
          ? feature.properties.NAME
          : typeof feature.properties?.ADMIN === "string"
            ? feature.properties.ADMIN
            : "Region";
      layer.bindTooltip(
        `<b>${name}</b><br/>Control: ${getFaction(feature.properties).toUpperCase()}`,
        { sticky: true },
      );
    },
    [getFaction],
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white flex flex-col items-center justify-between">
      <header className="my-2 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-wide text-slate-100">
          WWII European Theater Map
        </h1>
        <div className="mt-2 text-xl font-semibold text-blue-400">
          {currentSnapshot.title}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {currentSnapshot.description}
        </p>
      </header>
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl"
        style={{ height: 520, minHeight: 520 }}
      >
        {geoJsonData ? (
          <MapContainer
            center={[58, 45]}
            zoom={3}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Canvas Dark Gray"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            />
            <GeoJSON
              key={snapshotIndex}
              data={geoJsonData}
              style={styleCountry}
              onEachFeature={onEachCountry}
            />
            {occupiedFrontline && (
              <Polygon
                positions={occupiedFrontline}
                pathOptions={{
                  fillColor: "#ef4444",
                  fillOpacity: 0.85,
                  color: "#991b1b",
                  weight: 1.5,
                }}
              >
                <Tooltip sticky>
                  <b>Russia / USSR</b>
                  <br />
                  Control: AXIS OCCUPIED
                </Tooltip>
              </Polygon>
            )}
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-slate-400">
            Loading Map Data...
          </div>
        )}
        <div className="absolute bottom-4 left-4 z-[1000] flex gap-4 rounded-lg border border-slate-700 bg-slate-900/90 p-3 text-xs shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Axis Occupation
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            Allied Control / USSR
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-500" />
            Neutral
          </div>
        </div>
      </div>
      <div className="mt-4 w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <label
            htmlFor="snapshot-slider"
            className="text-sm font-semibold text-slate-300"
          >
            European Theater Timeline (1939 – 1945)
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300">
              Stage {snapshotIndex + 1} of {TIMELINE_SNAPSHOTS.length}
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 font-mono text-xs font-bold text-blue-400">
              {currentSnapshot.date}
            </span>
          </div>
        </div>
        <input
          id="snapshot-slider"
          type="range"
          min={0}
          max={TIMELINE_SNAPSHOTS.length - 1}
          value={snapshotIndex}
          onChange={(event) => setSnapshotIndex(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
        />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import { Check, Undo2, X } from "lucide-react";
import { useI18n } from "~/lib/i18n";
import { MIN_AREA_VERTICES, type AreaRing } from "~/lib/area";
import { useAppStore, type DrawMode } from "~/stores/appStore";
import { Segmented } from "~/components/ui/Segmented";
import { Button } from "~/components/ui/Button";

/** Freehand samples closer than this many pixels add nothing to the shape. */
const SAMPLE_PX = 3;
/** Douglas–Peucker tolerance for a freehand stroke, in pixels. */
const SIMPLIFY_PX = 2;
/** A polygon click this close to its first corner closes it. */
const CLOSE_PX = 12;

/**
 * Only a press on the map itself draws, never one on the zoom buttons or the
 * draw bar, which also live inside the map container.
 */
function onMapSurface(target: EventTarget | null, container: HTMLElement): boolean {
  return target === container || (target instanceof Element && target.closest(".leaflet-pane") !== null);
}

const toRing = (latlngs: L.LatLng[]): AreaRing => latlngs.map((ll) => [ll.lat, ll.lng]);

/** While drawing, the map holds still: a drag draws, it does not pan (brief 15). */
function useLockedMap(map: L.Map, locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const handlers = [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.scrollWheelZoom,
      map.boxZoom,
      map.keyboard,
    ];
    const wasEnabled = handlers.map((h) => h.enabled());
    handlers.forEach((h) => h.disable());
    const container = map.getContainer();
    container.classList.add("is-drawing");
    return () => {
      handlers.forEach((h, i) => wasEnabled[i] && h.enable());
      container.classList.remove("is-drawing");
    };
  }, [map, locked]);
}

/**
 * Freehand: press, drag around the area, release. The stroke is sampled in
 * screen space and simplified with Leaflet's own Douglas–Peucker, so a slow
 * wobbly hand does not become a thousand-vertex ring.
 */
function useFreehand(map: L.Map, active: boolean, onDone: (ring: AreaRing) => void) {
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!active) return;
    const container = map.getContainer();
    let pointerId: number | null = null;
    let points: L.Point[] = [];
    let stroke: L.Polyline | null = null;

    const pointAt = (e: PointerEvent) => map.mouseEventToContainerPoint(e as unknown as MouseEvent);
    const reset = () => {
      pointerId = null;
      points = [];
      stroke?.remove();
      stroke = null;
    };

    const down = (e: PointerEvent) => {
      if (pointerId !== null || e.button !== 0 || !onMapSurface(e.target, container)) return;
      pointerId = e.pointerId;
      try {
        // Keeps the stroke going when the pointer leaves the map mid-drag.
        container.setPointerCapture(e.pointerId);
      } catch {
        // Not an active pointer (a synthetic event): draw without capture.
      }
      points = [pointAt(e)];
      stroke = L.polyline([map.containerPointToLatLng(points[0])], {
        className: "cm-area-draft",
        interactive: false,
      }).addTo(map);
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId || !stroke) return;
      const p = pointAt(e);
      if (p.distanceTo(points[points.length - 1]) < SAMPLE_PX) return;
      points.push(p);
      stroke.addLatLng(map.containerPointToLatLng(p));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const simple = L.LineUtil.simplify(points, SIMPLIFY_PX);
      reset();
      // A tap or a short scratch is not an area; stay in the mode and let the
      // user try again.
      if (simple.length >= MIN_AREA_VERTICES) {
        doneRef.current(toRing(simple.map((p) => map.containerPointToLatLng(p))));
      }
    };
    const cancel = (e: PointerEvent) => {
      if (e.pointerId === pointerId) reset();
    };

    container.addEventListener("pointerdown", down);
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);
    container.addEventListener("pointercancel", cancel);
    return () => {
      container.removeEventListener("pointerdown", down);
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerup", up);
      container.removeEventListener("pointercancel", cancel);
      reset();
    };
  }, [map, active]);
}

/**
 * Polygon: tap the corners; tap the first corner again, or press Done, to
 * close. Returns the corner count (Done needs three), an undo for the last
 * corner, and a finish for the Done button.
 */
function usePolygon(map: L.Map, active: boolean, onDone: (ring: AreaRing) => void) {
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  const verticesRef = useRef<L.LatLng[]>([]);
  const redrawRef = useRef<() => void>(() => {});
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const container = map.getContainer();
    const layer = L.layerGroup().addTo(map);
    const outline = L.polyline([], { className: "cm-area-draft", interactive: false }).addTo(layer);
    const rubber = L.polyline([], {
      className: "cm-area-draft cm-area-rubber",
      interactive: false,
    }).addTo(layer);
    const corners = L.layerGroup().addTo(layer);
    verticesRef.current = [];

    const redraw = () => {
      const vertices = verticesRef.current;
      outline.setLatLngs(vertices);
      corners.clearLayers();
      vertices.forEach((ll, i) =>
        L.circleMarker(ll, {
          // The first corner is larger: it is also the way to close the shape.
          radius: i === 0 ? 6 : 4,
          className: "cm-area-corner",
          interactive: false,
        }).addTo(corners),
      );
      if (vertices.length === 0) rubber.setLatLngs([]);
      setCount(vertices.length);
    };
    redrawRef.current = redraw;

    const click = (e: L.LeafletMouseEvent) => {
      if (!onMapSurface(e.originalEvent.target, container)) return;
      const vertices = verticesRef.current;
      if (
        vertices.length >= MIN_AREA_VERTICES &&
        map.latLngToContainerPoint(vertices[0]).distanceTo(e.containerPoint) <= CLOSE_PX
      ) {
        doneRef.current(toRing(vertices));
        return;
      }
      vertices.push(e.latlng);
      redraw();
    };
    const move = (e: L.LeafletMouseEvent) => {
      const vertices = verticesRef.current;
      if (vertices.length > 0) rubber.setLatLngs([vertices[vertices.length - 1], e.latlng]);
    };

    map.on("click", click);
    map.on("mousemove", move);
    return () => {
      map.off("click", click);
      map.off("mousemove", move);
      layer.remove();
      verticesRef.current = [];
      redrawRef.current = () => {};
      setCount(0);
    };
  }, [map, active]);

  return {
    count,
    undo: () => {
      verticesRef.current.pop();
      redrawRef.current();
    },
    finish: () => {
      if (verticesRef.current.length >= MIN_AREA_VERTICES) {
        doneRef.current(toRing(verticesRef.current));
      }
    },
  };
}

/** The bar shown while drawing: what to do, which tool, and the ways out. */
function DrawBar({
  mode,
  corners,
  onUndo,
  onFinish,
}: {
  mode: DrawMode;
  corners: number;
  onUndo: () => void;
  onFinish: () => void;
}) {
  const { t } = useI18n();
  const setDrawMode = useAppStore((s) => s.setDrawMode);
  const ref = useRef<HTMLDivElement>(null);

  // The bar lives inside the map container: without this, pressing Done would
  // also land on the map as a polygon corner.
  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawMode(null);
      if (e.key === "Enter" && mode === "polygon") onFinish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onFinish, setDrawMode]);

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-x-2 top-2 z-[450] mx-auto flex w-fit max-w-[calc(100%-1rem)] flex-col items-center gap-2 rounded-xl border border-line bg-surface p-2.5 shadow-e3 md:top-3"
    >
      <p role="status" className="px-1 text-center text-[13px] text-fg">
        {mode === "freehand" ? t("area.hintFreehand") : t("area.hintPolygon")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Segmented
          value={mode}
          options={[
            { value: "freehand" as DrawMode, label: t("area.freehand") },
            { value: "polygon" as DrawMode, label: t("area.polygon") },
          ]}
          onChange={setDrawMode}
          label={t("area.tool")}
          size="sm"
        />
        {mode === "polygon" && (
          <>
            <Button variant="ghost" size="sm" onClick={onUndo} disabled={corners === 0}>
              <Undo2 size={14} strokeWidth={2.2} />
              {t("area.undo")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onFinish}
              disabled={corners < MIN_AREA_VERTICES}
            >
              <Check size={14} strokeWidth={2.4} />
              {t("area.done")}
            </Button>
          </>
        )}
        <Button variant="secondary" size="sm" onClick={() => setDrawMode(null)}>
          <X size={14} strokeWidth={2.4} />
          {t("area.cancel")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Draw-to-filter (brief 15), mounted inside the map: the drawn area's outline,
 * and while a draw mode is on, the locked map, the tool and its bar. The
 * filtering itself is `inArea` over places the page already has.
 */
export function AreaDraw() {
  const map = useMap();
  const area = useAppStore((s) => s.area);
  const drawMode = useAppStore((s) => s.drawMode);
  const setArea = useAppStore((s) => s.setArea);

  useLockedMap(map, drawMode !== null);
  useFreehand(map, drawMode === "freehand", setArea);
  const polygon = usePolygon(map, drawMode === "polygon", setArea);

  return (
    <>
      {area && drawMode === null && (
        <Polygon positions={area} pathOptions={{ className: "cm-area" }} interactive={false} />
      )}
      {drawMode && (
        <DrawBar
          mode={drawMode}
          corners={polygon.count}
          onUndo={polygon.undo}
          onFinish={polygon.finish}
        />
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Drop a pin on a map and get coordinates back.
 *
 * Built directly on Leaflet rather than react-leaflet: this is one map with
 * one marker and one event, and the wrapper's component tree would be more
 * code than the thing it wraps.
 *
 * OpenStreetMap tiles, so there is no API key to provision, rotate, or have
 * expire on a Saturday — and no per-view billing on a screen an admin opens
 * a handful of times a month.
 *
 * Deliberately paired with, not a replacement for, the "latitude, longitude"
 * text field beside it. The two are different jobs: someone who already has
 * the coordinates pastes them, and someone who only knows where the place *is*
 * finds it here. Removing the text field would make the common case (paste
 * from Google Maps) slower to serve the rarer one.
 */
export function MapLocationPicker({
  latitude,
  longitude,
  onPick,
  className,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Read through a ref inside the map's own handlers so the map is built once
  // and never torn down just because the parent re-rendered with a new
  // closure. Assigned in an effect, not during render — a ref written while
  // rendering is a value React is allowed to discard.
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  /**
   * Sri Lanka, framed whole. A branch is somewhere on this island, so opening
   * on it saves every admin the same first two gestures — and opening on a
   * world map would make the first click a mis-click.
   */
  const fallbackCenter = useMemo<L.LatLngExpression>(() => [7.8731, 80.7718], []);

  /**
   * Where to open, captured once.
   *
   * Read through a ref rather than a dependency: the map is built in an effect
   * whose cleanup destroys it, so listing the live coordinates there would
   * tear the map down and rebuild it on every click — throwing away the zoom
   * and pan the admin just set, at the exact moment they are refining a pin.
   */
  const initialView = useRef({ latitude, longitude });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const { latitude: lat0, longitude: lng0 } = initialView.current;
    const hasPin = lat0 != null && lng0 != null;
    const map = L.map(containerRef.current, {
      center: hasPin ? [lat0, lng0] : fallbackCenter,
      zoom: hasPin ? 16 : 7,
      // A map inside a scrollable dialog that eats the wheel traps the page.
      // Ctrl+wheel still zooms, and the +/- control always works.
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      // Six decimals is ~11cm — past the point where more digits describe
      // anything real, and it keeps the value readable in the field beside it.
      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));
      onPickRef.current(lat, lng);
    });

    mapRef.current = map;

    // The dialog animates in, so the map measures itself against a container
    // that has not finished sizing — leaving grey gutters where tiles should
    // be until something else forces a redraw.
    const settle = setTimeout(() => map.invalidateSize(), 120);

    return () => {
      clearTimeout(settle);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [fallbackCenter]);

  // Keep the marker in step with whatever the form holds — including a
  // coordinate pasted into the text field, which should move the pin here too.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (latitude == null || longitude == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const position: L.LatLngExpression = [latitude, longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position, {
        draggable: true,
        // Leaflet's default marker images resolve relative to the CSS, which
        // a bundler rewrites — so the icon 404s and the pin is invisible.
        // An inline SVG has no such dependency and cannot break on a deploy.
        icon: L.divIcon({
          className: "",
          html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
                   <path d="M13 0C5.8 0 0 5.8 0 13c0 9.8 13 21 13 21s13-11.2 13-21C26 5.8 20.2 0 13 0z" fill="#dc2626"/>
                   <circle cx="13" cy="13" r="5" fill="#fff"/>
                 </svg>`,
          iconSize: [26, 34],
          iconAnchor: [13, 34],
        }),
      }).addTo(map);

      // Dragging is the correction gesture: clicking places it roughly, then
      // you nudge it onto the doorway.
      markerRef.current.on("dragend", () => {
        const { lat, lng } = markerRef.current!.getLatLng();
        onPickRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });
    }
  }, [latitude, longitude]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-md border"
        // Leaflet needs a real height before it can lay tiles out, and a
        // Tailwind class alone is not applied early enough on first paint.
        style={{ height: "16rem" }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Click the map to place the branch, then drag the pin to fine-tune it.
      </p>
    </div>
  );
}

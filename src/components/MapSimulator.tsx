import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Flame, 
  Compass, 
  LocateFixed, 
  Zap, 
  Car, 
  Bike, 
  Plus, 
  Minus, 
  Route as RouteIcon, 
  Sun, 
  Moon, 
  Map as MapIcon
} from 'lucide-react';
import { HeatmapZone, RideRequest, TripStep, VehicleType, LatLng } from '../types';
import { 
  interpolateCoordinates, 
  calculateBearing, 
  openGoogleMapsTurnByTurn,
  getActiveNavigationTarget,
  getGoogleMapsNavigationUrl
} from '../utils/navigation';

interface MapSimulatorProps {
  isOnline: boolean;
  activeTripStep: TripStep;
  currentRide: RideRequest | null;
  heatmapZones: HeatmapZone[];
  vehicleType: VehicleType;
  captainProgress: number; // 0 to 100%
  onSimulateRideTrigger?: () => void;
}

type TileStyle = 'night' | 'day' | 'hot';

const TILE_LAYERS: Record<TileStyle, { url: string; attribution: string; name: string; tileClass: string }> = {
  night: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Night Navigation',
    tileClass: 'leaflet-tile-night'
  },
  day: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Day Streets (OSM)',
    tileClass: 'leaflet-tile-light'
  },
  hot: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
    name: 'Detailed Road Network (HOT)',
    tileClass: 'leaflet-tile-light'
  }
};

export const MapSimulator: React.FC<MapSimulatorProps> = ({
  isOnline,
  activeTripStep,
  currentRide,
  heatmapZones,
  vehicleType,
  captainProgress,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const surgeCirclesRef = useRef<L.Circle[]>([]);

  const [tileStyle, setTileStyle] = useState<TileStyle>('day');
  const [showHeatmaps, setShowHeatmaps] = useState(true);
  const [mapHeading, setMapHeading] = useState(24);

  // Default Bangalore coordinates
  const baseCaptainLocation: LatLng = { lat: 12.9352, lng: 77.6245 }; // Koramangala

  // Live computed current driver coordinates
  const currentCaptainCoords = React.useMemo<LatLng>(() => {
    if (!currentRide) return baseCaptainLocation;

    if (activeTripStep === 'navigating_pickup' || activeTripStep === 'arrived_pickup' || activeTripStep === 'verifying_otp') {
      return interpolateCoordinates(baseCaptainLocation, currentRide.pickupCoords, captainProgress);
    } else if (activeTripStep === 'on_trip') {
      return interpolateCoordinates(currentRide.pickupCoords, currentRide.dropCoords, captainProgress);
    }
    return baseCaptainLocation;
  }, [currentRide, activeTripStep, captainProgress]);

  // Compute bearing / heading for driver icon orientation
  useEffect(() => {
    if (currentRide) {
      if (activeTripStep === 'navigating_pickup') {
        const brng = calculateBearing(baseCaptainLocation, currentRide.pickupCoords);
        setMapHeading(Math.round(brng));
      } else if (activeTripStep === 'on_trip') {
        const brng = calculateBearing(currentRide.pickupCoords, currentRide.dropCoords);
        setMapHeading(Math.round(brng));
      }
    }
  }, [currentRide, activeTripStep]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [baseCaptainLocation.lat, baseCaptainLocation.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    const activeTile = TILE_LAYERS[tileStyle];
    const layer = L.tileLayer(activeTile.url, {
      maxZoom: 19,
      subdomains: 'abcd',
      className: activeTile.tileClass,
      attribution: activeTile.attribution
    }).addTo(map);

    tileLayerRef.current = layer;
    mapInstanceRef.current = map;

    // Handle container resize cleanly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Change Tile Styles on demand (Night / Day / HOT)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeTile = TILE_LAYERS[tileStyle];
    tileLayerRef.current = L.tileLayer(activeTile.url, {
      maxZoom: 19,
      subdomains: 'abcd',
      className: activeTile.tileClass,
      attribution: activeTile.attribution
    }).addTo(map);
  }, [tileStyle]);

  // 3. Render and Update Live Markers & Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Helper: Driver Marker Custom DivIcon
    const vehicleIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 48px; height: 48px;">
        <div class="absolute inset-0 rounded-full ${isOnline ? 'bg-amber-400/25 animate-ping' : 'bg-zinc-600/20'}"></div>
        <div class="relative w-10 h-10 rounded-full bg-zinc-950 border-2 ${isOnline ? 'border-amber-400' : 'border-zinc-600'} shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-center justify-center text-amber-400 transform transition-transform duration-500" style="transform: rotate(${mapHeading}deg);">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        </div>
      </div>
    `;

    const driverIcon = L.divIcon({
      html: vehicleIconHtml,
      className: 'driver-gps-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([currentCaptainCoords.lat, currentCaptainCoords.lng], {
        icon: driverIcon,
        zIndexOffset: 1000
      }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng([currentCaptainCoords.lat, currentCaptainCoords.lng]);
      driverMarkerRef.current.setIcon(driverIcon);
    }

    // 4. Pickup Marker
    if (currentRide && (activeTripStep === 'navigating_pickup' || activeTripStep === 'arrived_pickup' || activeTripStep === 'verifying_otp')) {
      const pickupIconHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 40px; height: 40px;">
          <div class="absolute inset-0 rounded-full bg-amber-400/30 animate-pulse"></div>
          <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-zinc-950 font-black text-xs">
            P
          </div>
        </div>
      `;
      const pickupIcon = L.divIcon({
        html: pickupIconHtml,
        className: 'pickup-spot-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker([currentRide.pickupCoords.lat, currentRide.pickupCoords.lng], {
          icon: pickupIcon,
          zIndexOffset: 900
        }).addTo(map);
        pickupMarkerRef.current.bindPopup(`<b>Pickup:</b><br/>${currentRide.pickupAddress}`);
      } else {
        pickupMarkerRef.current.setLatLng([currentRide.pickupCoords.lat, currentRide.pickupCoords.lng]);
        if (!map.hasLayer(pickupMarkerRef.current)) {
          pickupMarkerRef.current.addTo(map);
        }
      }
    } else if (pickupMarkerRef.current && map.hasLayer(pickupMarkerRef.current)) {
      map.removeLayer(pickupMarkerRef.current);
    }

    // 5. Drop Destination Marker
    if (currentRide && activeTripStep === 'on_trip') {
      const dropIconHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style="width: 44px; height: 44px;">
          <div class="absolute inset-0 rounded-full bg-sky-400/30 animate-pulse"></div>
          <div class="w-8 h-8 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs">
            D
          </div>
        </div>
      `;
      const dropIcon = L.divIcon({
        html: dropIconHtml,
        className: 'drop-spot-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      if (!dropMarkerRef.current) {
        dropMarkerRef.current = L.marker([currentRide.dropCoords.lat, currentRide.dropCoords.lng], {
          icon: dropIcon,
          zIndexOffset: 900
        }).addTo(map);
        dropMarkerRef.current.bindPopup(`<b>Destination:</b><br/>${currentRide.dropAddress}`);
      } else {
        dropMarkerRef.current.setLatLng([currentRide.dropCoords.lat, currentRide.dropCoords.lng]);
        if (!map.hasLayer(dropMarkerRef.current)) {
          dropMarkerRef.current.addTo(map);
        }
      }
    } else if (dropMarkerRef.current && map.hasLayer(dropMarkerRef.current)) {
      map.removeLayer(dropMarkerRef.current);
    }

    // 6. Draw Optimized Road Polyline
    if (polylineRef.current && map.hasLayer(polylineRef.current)) {
      map.removeLayer(polylineRef.current);
    }

    if (currentRide) {
      let latlngs: [number, number][] = [];

      if (activeTripStep === 'navigating_pickup' || activeTripStep === 'arrived_pickup' || activeTripStep === 'verifying_otp') {
        const midLat = (currentCaptainCoords.lat + currentRide.pickupCoords.lat) / 2 + 0.0018;
        const midLng = (currentCaptainCoords.lng + currentRide.pickupCoords.lng) / 2 - 0.0012;
        latlngs = [
          [currentCaptainCoords.lat, currentCaptainCoords.lng],
          [midLat, midLng],
          [currentRide.pickupCoords.lat, currentRide.pickupCoords.lng]
        ];

        polylineRef.current = L.polyline(latlngs, {
          color: '#facc15',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);

      } else if (activeTripStep === 'on_trip') {
        const midLat = (currentCaptainCoords.lat + currentRide.dropCoords.lat) / 2 - 0.0015;
        const midLng = (currentCaptainCoords.lng + currentRide.dropCoords.lng) / 2 + 0.0015;
        latlngs = [
          [currentCaptainCoords.lat, currentCaptainCoords.lng],
          [midLat, midLng],
          [currentRide.dropCoords.lat, currentRide.dropCoords.lng]
        ];

        polylineRef.current = L.polyline(latlngs, {
          color: '#38bdf8',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);
      }
    }

    // 7. Render Heatmap Surge Circles
    surgeCirclesRef.current.forEach(c => {
      if (map.hasLayer(c)) map.removeLayer(c);
    });
    surgeCirclesRef.current = [];

    if (isOnline && showHeatmaps && activeTripStep === 'idle') {
      heatmapZones.forEach(zone => {
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius || 450,
          color: zone.surge >= 1.8 ? '#ef4444' : '#f59e0b',
          fillColor: zone.surge >= 1.8 ? '#ef4444' : '#f59e0b',
          fillOpacity: 0.22,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);

        circle.bindTooltip(`🔥 <b>${zone.name}</b> (${zone.surge}x Surge)`, {
          permanent: false,
          direction: 'top',
          className: 'surge-leaflet-tooltip'
        });

        surgeCirclesRef.current.push(circle);
      });
    }

    // Pan map smoothly to track captain
    map.panTo([currentCaptainCoords.lat, currentCaptainCoords.lng], { animate: true });

  }, [currentCaptainCoords, currentRide, activeTripStep, isOnline, showHeatmaps, vehicleType, mapHeading, heatmapZones]);

  // Recenter GPS Handler
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentCaptainCoords.lat, currentCaptainCoords.lng], 15, { animate: true });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const toggleTileStyle = () => {
    setTileStyle(curr => {
      if (curr === 'day') return 'night';
      if (curr === 'night') return 'hot';
      return 'day';
    });
  };

  // Active navigation destination helper
  const activeNav = currentRide ? getActiveNavigationTarget(currentRide, activeTripStep) : null;
  const activeGoogleMapsUrl = activeNav ? getGoogleMapsNavigationUrl(activeNav.coords) : '#';

  return (
    <div id="map-simulator-container" className="relative w-full h-full min-h-[360px] sm:min-h-[400px] bg-zinc-950 overflow-hidden select-none border-b border-zinc-800/80">
      
      {/* 1. REAL OPENSTREETMAP / LEAFLET TILES MAP CONTAINER */}
      <div 
        ref={mapContainerRef} 
        id="leaflet-map-canvas"
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* 2. SURGE DEMAND OVERLAYS (When Online & Idle) */}
      {isOnline && showHeatmaps && activeTripStep === 'idle' && (
        <>
          <div className="absolute top-[28%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-zinc-900/90 border border-amber-500/60 rounded-full shadow-lg backdrop-blur-md text-xs font-bold text-amber-400 animate-bounce pointer-events-none z-10">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>1.8x Koramangala Surge</span>
          </div>

          <div className="absolute top-[18%] right-[14%] flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900/80 border border-yellow-500/40 rounded-full text-[11px] font-semibold text-yellow-300 pointer-events-none z-10">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>1.5x Indiranagar</span>
          </div>
        </>
      )}

      {/* 3. ACTIVE NAVIGATION FLOATING HUD CARD (TOP OVERLAY) */}
      {currentRide && (activeTripStep === 'navigating_pickup' || activeTripStep === 'arrived_pickup' || activeTripStep === 'verifying_otp' || activeTripStep === 'on_trip') && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between p-3 bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-2xl backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                <RouteIcon className="w-3 h-3" />
                {activeTripStep === 'on_trip' ? 'Destination Route' : 'Pickup Route'}
              </p>
              <p className="text-sm font-bold text-zinc-100 truncate max-w-[170px] sm:max-w-[210px]">
                {activeTripStep === 'on_trip' ? currentRide.dropAddress : currentRide.pickupAddress}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="text-right">
              <p className="text-sm font-extrabold text-amber-400">
                {activeTripStep === 'on_trip'
                  ? `${Math.max(0.1, currentRide.distanceKm * (1 - captainProgress/100)).toFixed(1)} km`
                  : `${Math.max(0.2, currentRide.distanceKm * (1 - captainProgress/100)).toFixed(1)} km`}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium">
                {Math.max(1, Math.round(currentRide.estimatedTimeMin * (1 - captainProgress/100)))} mins
              </p>
            </div>

            {/* Direct Google Maps Deep-Link launch button on HUD */}
            <a
              id="btn-hud-google-maps-link"
              href={activeGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                if (activeNav) openGoogleMapsTurnByTurn(activeNav.coords);
              }}
              title="Open Google Maps Turn-by-Turn"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center"
            >
              <Compass className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE MAP CONTROLS (RIGHT DOCK) */}
      <div className="absolute right-3 bottom-4 flex flex-col gap-2 z-20">
        
        {/* Layer Tile Style Toggle (Day Streets / Night Navigation / Humanitarian Detailed) */}
        <button
          id="btn-toggle-tile-layer"
          onClick={toggleTileStyle}
          title={`Active Map: ${TILE_LAYERS[tileStyle].name} (Click to switch)`}
          className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200 backdrop-blur-md shadow-md active:scale-95 flex items-center justify-center"
        >
          {tileStyle === 'night' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : tileStyle === 'day' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <MapIcon className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Heatmaps toggle */}
        <button
          id="btn-toggle-heatmaps"
          onClick={() => setShowHeatmaps(!showHeatmaps)}
          title="Toggle High Demand Surge Heatmaps"
          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md active:scale-95 ${
            showHeatmaps 
              ? 'bg-amber-400/20 border-amber-400/70 text-amber-300' 
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Flame className="w-4 h-4" />
        </button>

        {/* Zoom In (+) */}
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-zinc-200 backdrop-blur-md shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out (-) */}
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-zinc-200 backdrop-blur-md shadow-md active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Recenter GPS */}
        <button
          id="btn-recenter-gps"
          onClick={handleRecenter}
          title="Recenter Live GPS Location"
          className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-zinc-200 backdrop-blur-md shadow-md active:scale-95"
        >
          <LocateFixed className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* 5. OPENSTREETMAP / CARTO ATTRIBUTION BADGE & GPS TELEMETRY (BOTTOM LEFT) */}
      <div className="absolute left-3 bottom-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold">GPS: {currentCaptainCoords.lat.toFixed(4)}, {currentCaptainCoords.lng.toFixed(4)}</span>
          <span className="text-zinc-500 font-mono">| OSM</span>
        </div>
      </div>

      {/* 6. OFFLINE WATERMARK BADGE */}
      {!isOnline && (
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3 text-zinc-400 shadow-lg">
            {vehicleType === 'bike' ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />}
          </div>
          <h4 className="text-base font-bold text-zinc-200 mb-1">Captain Duty is Offline</h4>
          <p className="text-xs text-zinc-400 max-w-[260px]">
            Turn on duty switch below to start receiving instant bike taxi, auto & cab ride bookings.
          </p>
        </div>
      )}
    </div>
  );
};

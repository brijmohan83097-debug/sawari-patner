import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Compass, 
  LocateFixed, 
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
  heatmapZones?: HeatmapZone[];
  vehicleType: VehicleType;
  captainProgress: number; // 0 to 100%
  onSimulateRideTrigger?: () => void;
}

type TileStyle = 'night' | 'day' | 'hot';

// Default fallback coordinates: Hyderabad central hub (Begumpet / Ameerpet)
const HYDERABAD_DEFAULT: LatLng = { lat: 17.4572, lng: 78.4502 };

// Retrieve cached coordinates from localStorage or fallback to [17.4572, 78.4502]
const getInitialCaptainLocation = (): LatLng => {
  if (typeof window === 'undefined') return HYDERABAD_DEFAULT;
  try {
    const saved = localStorage.getItem('sawari_captain_lat_lng');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return { lat: parsed.lat, lng: parsed.lng };
      }
      if (Array.isArray(parsed) && parsed.length >= 2 && typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
        return { lat: parsed[0], lng: parsed[1] };
      }
    }
  } catch (err) {
    console.debug('Failed to parse cached captain coordinates:', err);
  }
  return HYDERABAD_DEFAULT;
};

const TILE_LAYERS: Record<TileStyle, { url: string; attribution: string; name: string; tileClass: string }> = {
  night: {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Night Navigation',
    tileClass: 'leaflet-tile-night'
  },
  day: {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Day Streets (OSM)',
    tileClass: 'leaflet-tile-light'
  },
  hot: {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Detailed Roads (OSM)',
    tileClass: 'leaflet-tile-light'
  }
};

export const MapSimulator: React.FC<MapSimulatorProps> = ({
  isOnline,
  activeTripStep,
  currentRide,
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

  const [tileStyle, setTileStyle] = useState<TileStyle>('day');
  const [mapHeading, setMapHeading] = useState(24);
  const [liveLocation, setLiveLocation] = useState<LatLng>(getInitialCaptainLocation);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const hasInitialGpsCentered = useRef<boolean>(false);

  // Cache position to localStorage whenever liveLocation updates
  useEffect(() => {
    if (liveLocation && typeof liveLocation.lat === 'number' && typeof liveLocation.lng === 'number') {
      try {
        localStorage.setItem('sawari_captain_lat_lng', JSON.stringify(liveLocation));
      } catch (e) {
        console.debug('Failed to cache captain position:', e);
      }
    }
  }, [liveLocation]);

  // 1. Real Device GPS (navigator.geolocation.watchPosition)
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by this browser environment');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;
        const coords: LatLng = { lat: latitude, lng: longitude };
        setLiveLocation(coords);
        setGpsActive(true);

        // Cache current position immediately to localStorage
        try {
          localStorage.setItem('sawari_captain_lat_lng', JSON.stringify(coords));
        } catch {
          // ignore storage error
        }

        // If device provides orientation/heading, update marker heading
        if (heading !== null && !isNaN(heading) && heading >= 0) {
          setMapHeading(Math.round(heading));
        }

        // Center map on real device location with smooth map.flyTo instead of sudden snapping
        if (mapInstanceRef.current) {
          const currentZoom = mapInstanceRef.current.getZoom() || 16;
          if (!hasInitialGpsCentered.current) {
            mapInstanceRef.current.flyTo([latitude, longitude], 16, { 
              duration: 1.5,
              easeLinearity: 0.25 
            });
            hasInitialGpsCentered.current = true;
          } else if (activeTripStep === 'idle') {
            mapInstanceRef.current.flyTo([latitude, longitude], currentZoom, {
              duration: 1.2,
              easeLinearity: 0.25
            });
          }
        }
      },
      (error) => {
        setGpsActive(false);
        if (error.code !== 1) {
          console.debug('Live GPS watchPosition info:', error.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeTripStep]);

  // Live computed current driver coordinates using real device GPS
  const currentCaptainCoords = React.useMemo<LatLng>(() => {
    if (!currentRide) return liveLocation;

    if (activeTripStep === 'navigating_pickup' || activeTripStep === 'arrived_pickup' || activeTripStep === 'verifying_otp') {
      return interpolateCoordinates(liveLocation, currentRide.pickupCoords, captainProgress);
    } else if (activeTripStep === 'on_trip') {
      return interpolateCoordinates(currentRide.pickupCoords, currentRide.dropCoords, captainProgress);
    }
    return liveLocation;
  }, [currentRide, activeTripStep, captainProgress, liveLocation]);

  // Compute bearing / heading for driver icon orientation during active rides
  useEffect(() => {
    if (currentRide) {
      if (activeTripStep === 'navigating_pickup') {
        const brng = calculateBearing(liveLocation, currentRide.pickupCoords);
        setMapHeading(Math.round(brng));
      } else if (activeTripStep === 'on_trip') {
        const brng = calculateBearing(currentRide.pickupCoords, currentRide.dropCoords);
        setMapHeading(Math.round(brng));
      }
    }
  }, [currentRide, activeTripStep, liveLocation]);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [liveLocation.lat, liveLocation.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    const activeTile = TILE_LAYERS[tileStyle];
    const layer = L.tileLayer(activeTile.url, {
      maxZoom: 19,
      className: activeTile.tileClass,
      attribution: activeTile.attribution
    }).addTo(map);

    tileLayerRef.current = layer;
    mapInstanceRef.current = map;

    // Handle container resize cleanly
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (mapInstanceRef.current && mapInstanceRef.current.getContainer()) {
          map.invalidateSize();
        }
      } catch {
        // ignore
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Change Tile Styles on demand (Night / Day / HOT)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeTile = TILE_LAYERS[tileStyle];
    tileLayerRef.current = L.tileLayer(activeTile.url, {
      maxZoom: 19,
      className: activeTile.tileClass,
      attribution: activeTile.attribution
    }).addTo(map);
  }, [tileStyle]);

  // 4. Render and Update Live Markers & Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Driver Marker Custom DivIcon with real-time GPS telemetry
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

    // Pickup Marker (During active ride)
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

    // Drop Destination Marker (During active ride)
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

    // Draw Optimized Road Polyline
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

    // Pan map smoothly to track captain location
    map.panTo([currentCaptainCoords.lat, currentCaptainCoords.lng], { animate: true });

  }, [currentCaptainCoords, currentRide, activeTripStep, isOnline, vehicleType, mapHeading]);

  // Recenter GPS Handler to device live location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentCaptainCoords.lat, currentCaptainCoords.lng], 16, {
        duration: 1.2,
        easeLinearity: 0.25
      });
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
        key="clean-map-v1"
        ref={mapContainerRef} 
        id="leaflet-map-canvas"
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* 2. ACTIVE NAVIGATION FLOATING HUD CARD (TOP OVERLAY) */}
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

      {/* 3. INTERACTIVE MAP CONTROLS (RIGHT DOCK) */}
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

        {/* Recenter Live GPS */}
        <button
          id="btn-recenter-gps"
          onClick={handleRecenter}
          title="Recenter Live GPS Location"
          className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-zinc-200 backdrop-blur-md shadow-md active:scale-95 group"
        >
          <LocateFixed className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* 4. REAL LIVE GPS TELEMETRY BADGE (BOTTOM LEFT) */}
      <div className="absolute left-3 bottom-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 backdrop-blur-md shadow-sm">
          <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span className="font-bold">
            {gpsActive ? 'LIVE GPS' : 'GPS (Hyderabad)'}: {currentCaptainCoords.lat.toFixed(4)}, {currentCaptainCoords.lng.toFixed(4)}
          </span>
          <span className="text-zinc-500 font-mono">| OSM</span>
        </div>
      </div>

      {/* 5. OFFLINE WATERMARK BADGE */}
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

import React, { useState, useEffect, useRef } from 'react';
import { 
  SharedRide, 
  VehicleType 
} from '../types';
import { 
  createRideRequest, 
  subscribeToRide, 
  cancelSharedRide, 
  rateCompletedRide 
} from '../services/ridesService';
import { 
  Bike, 
  Phone, 
  MessageSquare, 
  Star, 
  Compass, 
  Layers, 
  X, 
  Banknote, 
  Send 
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import confetti from 'canvas-confetti';

interface PassengerAppViewProps {
  onSwitchToCaptainApp?: () => void;
  onOpenSplitView?: () => void;
  activeRideId?: string | null;
  onRideCreated?: (ride: SharedRide) => void;
}

const BANGALORE_PRESETS = [
  {
    name: 'Koramangala 5th Block',
    address: '80 Feet Rd, 5th Block, Koramangala, Bengaluru',
    coords: { lat: 12.9352, lng: 77.6245 }
  },
  {
    name: 'Indiranagar 100ft Road',
    address: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru',
    coords: { lat: 12.9716, lng: 77.6412 }
  },
  {
    name: 'HSR Layout Sector 1',
    address: '27th Main Rd, Sector 1, HSR Layout, Bengaluru',
    coords: { lat: 12.9121, lng: 77.6446 }
  },
  {
    name: 'MG Road Metro Station',
    address: 'Mahatma Gandhi Rd, Bengaluru',
    coords: { lat: 12.9756, lng: 77.6066 }
  },
  {
    name: 'Bellandur EcoSpace',
    address: 'Outer Ring Rd, Bellandur, Bengaluru',
    coords: { lat: 12.9260, lng: 77.6833 }
  }
];

export const PassengerAppView: React.FC<PassengerAppViewProps> = ({
  onSwitchToCaptainApp,
  onOpenSplitView,
  activeRideId: initialRideId,
  onRideCreated
}) => {
  const [pickup, setPickup] = useState(BANGALORE_PRESETS[0]);
  const [drop, setDrop] = useState(BANGALORE_PRESETS[1]);
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [activeRide, setActiveRide] = useState<SharedRide | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingTimer, setSearchingTimer] = useState(60);

  // Rating Modal
  const [selectedRating, setSelectedRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Passenger quick chat modal
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'passenger' | 'captain'; text: string; time: string }[]>([
    { sender: 'captain', text: 'Hi! I am heading towards your pickup location.', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Fares calculation
  const distanceKm = 5.4;
  const fares: Record<VehicleType, { fare: number; timeMin: number; name: string; icon: string }> = {
    bike: { fare: 48, timeMin: 14, name: 'Sawari Bike', icon: '🛵' },
    auto: { fare: 72, timeMin: 18, name: 'Sawari Auto', icon: '🛺' },
    cab: { fare: 145, timeMin: 16, name: 'Sawari Cab', icon: '🚗' }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [pickup.coords.lat, pickup.coords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // 100% Free OpenStreetMap tile layer (0 API Key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Sync Map Markers with Active Ride & Coords
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
    if (dropMarkerRef.current) dropMarkerRef.current.remove();
    if (polylineRef.current) polylineRef.current.remove();

    const pCoords = activeRide ? activeRide.pickupCoords : pickup.coords;
    const dCoords = activeRide ? activeRide.dropCoords : drop.coords;

    // Pickup Marker (Amber Pin)
    const pickupIcon = L.divIcon({
      className: 'custom-pickup-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background-color: #f59e0b; color: #09090b; font-weight: 900; font-size: 11px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 2px solid #ffffff; white-space: nowrap;">
            📍 Pickup
          </div>
          <div style="width: 12px; height: 12px; background-color: #f59e0b; border: 2px solid #ffffff; border-radius: 50%; margin-top: -3px; box-shadow: 0 0 10px #f59e0b;"></div>
        </div>
      `,
      iconSize: [0, 0]
    });
    pickupMarkerRef.current = L.marker([pCoords.lat, pCoords.lng], { icon: pickupIcon }).addTo(map);

    // Drop Marker (Emerald Pin)
    const dropIcon = L.divIcon({
      className: 'custom-drop-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background-color: #10b981; color: #ffffff; font-weight: 900; font-size: 11px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 2px solid #ffffff; white-space: nowrap;">
            🏁 Destination
          </div>
          <div style="width: 12px; height: 12px; background-color: #10b981; border: 2px solid #ffffff; border-radius: 50%; margin-top: -3px; box-shadow: 0 0 10px #10b981;"></div>
        </div>
      `,
      iconSize: [0, 0]
    });
    dropMarkerRef.current = L.marker([dCoords.lat, dCoords.lng], { icon: dropIcon }).addTo(map);

    // Route Polyline
    polylineRef.current = L.polyline([
      [pCoords.lat, pCoords.lng],
      [dCoords.lat, dCoords.lng]
    ], {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([
      [pCoords.lat, pCoords.lng],
      [dCoords.lat, dCoords.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [pickup, drop, activeRide?.pickupCoords, activeRide?.dropCoords]);

  // 3. Driver Live Marker Tracking & Dynamic Heading
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeRide && activeRide.driverLocation && (activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED' || activeRide.status === 'IN_PROGRESS')) {
      const { lat, lng } = activeRide.driverLocation;
      const heading = activeRide.driverHeading || 0;
      const vIcon = activeRide.vehicleType === 'bike' ? '🛵' : activeRide.vehicleType === 'auto' ? '🛺' : '🚗';

      const driverHtml = `
        <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
          <div style="position: absolute; inset: -8px; background-color: rgba(245, 158, 11, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 42px; height: 42px; background-color: #18181b; border: 2.5px solid #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.6); transform: rotate(${heading}deg); transition: transform 0.4s ease;">
            <span style="font-size: 20px;">${vIcon}</span>
          </div>
          <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background-color: #09090b; color: #f59e0b; border: 1px solid #f59e0b; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; white-space: nowrap;">
            ${activeRide.captainName?.split(' ')[0] || 'Captain'}
          </div>
        </div>
      `;

      const driverDivIcon = L.divIcon({
        className: 'custom-driver-live-marker',
        html: driverHtml,
        iconSize: [0, 0]
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([lat, lng]);
        driverMarkerRef.current.setIcon(driverDivIcon);
      } else {
        driverMarkerRef.current = L.marker([lat, lng], { icon: driverDivIcon }).addTo(map);
      }
    } else {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
    }
  }, [activeRide?.driverLocation, activeRide?.driverHeading, activeRide?.status, activeRide?.vehicleType]);

  // 4. Real-time Subscription to Active Ride
  useEffect(() => {
    if (!activeRide?.id) return;

    const unsubscribe = subscribeToRide(activeRide.id, (updated) => {
      if (updated) {
        setActiveRide(updated);
        if (updated.status === 'ACCEPTED' || updated.status === 'ARRIVED' || updated.status === 'IN_PROGRESS') {
          setIsSearching(false);
        }
        if (updated.status === 'COMPLETED' && !ratingSubmitted) {
          try {
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
          } catch {
            // ignore
          }
        }
      }
    });

    return () => unsubscribe();
  }, [activeRide?.id, ratingSubmitted]);

  // 5. Searching Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSearching && searchingTimer > 0) {
      timer = setInterval(() => {
        setSearchingTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSearching, searchingTimer]);

  // Handle Book Ride Action
  const handleBookRide = async () => {
    setIsSearching(true);
    setSearchingTimer(60);

    const generatedOtp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedFare = fares[vehicleType].fare;

    const ridePayload: Omit<SharedRide, 'id' | 'status' | 'createdAt'> = {
      passengerId: `PASS-${Math.floor(10000 + Math.random() * 90000)}`,
      passengerName: 'Rahul Sharma',
      passengerPhone: '+91 98765 43210',
      passengerRating: 4.9,
      pickupAddress: pickup.name + ', ' + pickup.address,
      pickupCoords: pickup.coords,
      dropAddress: drop.name + ', ' + drop.address,
      dropCoords: drop.coords,
      fare: selectedFare,
      captainEarning: selectedFare, // 0% commission!
      distanceKm: distanceKm,
      estimatedTimeMin: fares[vehicleType].timeMin,
      vehicleType: vehicleType,
      otp: generatedOtp,
      paymentMode: 'CASH',
      expiresInSeconds: 60,
      note: 'Please arrive at the main gate'
    };

    const created = await createRideRequest(ridePayload);
    setActiveRide(created);
    if (onRideCreated) {
      onRideCreated(created);
    }
  };

  // Handle Cancel Ride
  const handleCancelRide = async () => {
    if (activeRide) {
      await cancelSharedRide(activeRide.id, 'Cancelled by passenger');
    }
    setIsSearching(false);
    setActiveRide(null);
  };

  // Handle Star Rating Submit
  const handleSubmitRating = async () => {
    if (activeRide) {
      await rateCompletedRide(activeRide.id, selectedRating, feedbackText);
      setRatingSubmitted(true);
      setTimeout(() => {
        setActiveRide(null);
        setRatingSubmitted(false);
        setFeedbackText('');
      }, 2000);
    }
  };

  // Handle Send Chat
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'passenger', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-400/20">
            <span>🛵</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-zinc-100">SAWARI</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                PASSENGER APP
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Affordable rides • 0% Commission Direct</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSplitView && (
            <button
              onClick={onOpenSplitView}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              title="View Passenger & Captain apps side-by-side on same screen"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Split Screen</span>
            </button>
          )}

          {onSwitchToCaptainApp && (
            <button
              onClick={onSwitchToCaptainApp}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Driver Partner</span>
              <span>⚡</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAP VIEWPORT & FLOATING OVERLAYS */}
      <main className="flex-1 flex flex-col max-w-lg w-full mx-auto relative pb-8">
        
        {/* Real-time OpenStreetMap canvas */}
        <div className="w-full h-[320px] sm:h-[360px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          
          {/* Realtime Live Sync Status Badge */}
          <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-zinc-900/90 border border-zinc-700 rounded-full text-[11px] font-bold text-zinc-200 flex items-center gap-2 backdrop-blur-md shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Firestore Live Sync</span>
          </div>

          {/* Recenter Map Button */}
          <button
            onClick={() => {
              if (mapInstanceRef.current && activeRide?.pickupCoords) {
                mapInstanceRef.current.setView([activeRide.pickupCoords.lat, activeRide.pickupCoords.lng], 15);
              }
            }}
            className="absolute bottom-3 right-3 z-10 p-2.5 bg-zinc-900/90 border border-zinc-700 rounded-xl text-zinc-200 backdrop-blur-md shadow-md hover:bg-zinc-800 active:scale-95"
          >
            <Compass className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* 3. DYNAMIC BOTTOM DISPATCH PANEL */}
        <div className="p-3.5 space-y-3 -mt-3 relative z-20">
          
          {/* STATE A: IDLE / BOOKING FORM */}
          {!activeRide && !isSearching && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-4">
              
              {/* Pickup & Destination Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Pickup Point</p>
                    <select
                      value={pickup.name}
                      onChange={(e) => {
                        const found = BANGALORE_PRESETS.find(p => p.name === e.target.value);
                        if (found) setPickup(found);
                      }}
                      className="w-full bg-transparent text-xs font-bold text-zinc-100 outline-none cursor-pointer"
                    >
                      {BANGALORE_PRESETS.map(p => (
                        <option key={p.name} value={p.name} className="bg-zinc-900 text-zinc-100">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Drop Location</p>
                    <select
                      value={drop.name}
                      onChange={(e) => {
                        const found = BANGALORE_PRESETS.find(p => p.name === e.target.value);
                        if (found) setDrop(found);
                      }}
                      className="w-full bg-transparent text-xs font-bold text-zinc-100 outline-none cursor-pointer"
                    >
                      {BANGALORE_PRESETS.map(p => (
                        <option key={p.name} value={p.name} className="bg-zinc-900 text-zinc-100">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Options Grid */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">Select Ride Category</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['bike', 'auto', 'cab'] as VehicleType[]).map((v) => {
                    const item = fares[v];
                    const isSelected = vehicleType === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setVehicleType(v)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10'
                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="mt-1.5">
                          <p className={`text-xs font-black ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">{item.timeMin} min away</p>
                          <p className="text-xs font-extrabold text-zinc-100 mt-1">₹{item.fare}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method & Guarantee */}
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/40 border border-zinc-800 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Cash / UPI on Trip Completion</span>
                </div>
                <span className="text-[11px] font-bold text-amber-400">0% Comm Direct</span>
              </div>

              {/* Action Button: Book Ride */}
              <button
                id="btn-book-sawari-ride"
                onClick={handleBookRide}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm rounded-xl shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Book {fares[vehicleType].name}</span>
                <span className="px-2 py-0.5 bg-zinc-950 text-amber-400 text-xs rounded-md">₹{fares[vehicleType].fare}</span>
              </button>
            </div>
          )}

          {/* STATE B: SEARCHING FOR NEARBY CAPTAINS */}
          {activeRide?.status === 'SEARCHING' && (
            <div className="bg-zinc-900 border border-amber-400/50 rounded-2xl p-5 shadow-2xl space-y-4 text-center animate-in fade-in duration-300">
              <div className="relative flex items-center justify-center py-4">
                <div className="w-20 h-20 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
                <div className="absolute text-3xl">
                  {fares[activeRide.vehicleType].icon}
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-100">Connecting with Nearby Captains...</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Broadcasting your ride request to active {activeRide.vehicleType} captains in {pickup.name.split(',')[0]}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs">
                <span className="text-zinc-400">Dispatch Timeout:</span>
                <span className="font-mono font-black text-amber-400">{searchingTimer}s remaining</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancelRide}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700"
                >
                  Cancel Request
                </button>
                {onSwitchToCaptainApp && (
                  <button
                    onClick={onSwitchToCaptainApp}
                    className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow active:scale-95"
                  >
                    Accept in Captain App ⚡
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STATE C: CAPTAIN ASSIGNED & EN ROUTE / ARRIVED / ON TRIP */}
          {activeRide && (activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED' || activeRide.status === 'IN_PROGRESS') && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-3 duration-200">
              
              {/* Trip Phase Banner */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                activeRide.status === 'ARRIVED'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : activeRide.status === 'IN_PROGRESS'
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {activeRide.status === 'ARRIVED' ? '📍' : activeRide.status === 'IN_PROGRESS' ? '🚀' : '🛵'}
                  </span>
                  <div>
                    <p className="text-xs font-black">
                      {activeRide.status === 'ARRIVED' 
                        ? 'Captain Arrived at Pickup Point!'
                        : activeRide.status === 'IN_PROGRESS'
                        ? 'Trip in Progress • Heading to Destination'
                        : 'Captain Assigned & On the Way'}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {activeRide.status === 'ARRIVED'
                        ? 'Meet Captain at the pickup location with your OTP'
                        : activeRide.status === 'IN_PROGRESS'
                        ? `ETA ~${activeRide.estimatedTimeMin} mins`
                        : 'Reaching in ~3-4 mins'}
                    </p>
                  </div>
                </div>

                {/* Secure Start OTP Badge */}
                <div className="text-right">
                  <p className="text-[9px] text-zinc-400 uppercase font-black">START OTP</p>
                  <p className="text-sm font-black font-mono tracking-widest text-amber-400 bg-zinc-950 px-2 py-0.5 rounded-lg border border-amber-400/40">
                    {activeRide.otp}
                  </p>
                </div>
              </div>

              {/* Captain Profile Details Card */}
              <div className="flex items-center justify-between p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={activeRide.captainAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={activeRide.captainName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-400"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-zinc-100">{activeRide.captainName || 'Arun Kumar'}</h4>
                      <span className="flex items-center text-[10px] font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-current inline mr-0.5" />
                        {activeRide.captainRating || 4.9}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {activeRide.vehicleModel || 'Honda Activa 6G'} • <span className="text-zinc-200 font-mono font-bold">{activeRide.vehicleNumber || 'KA 01 EK 8821'}</span>
                    </p>
                  </div>
                </div>

                {/* Call & Chat Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChatModal(true)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl border border-zinc-700 shadow active:scale-95"
                    title="Chat with Captain"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <a
                    href={`tel:${activeRide.captainPhone || '+919876543210'}`}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl border border-emerald-500/40 shadow active:scale-95"
                    title="Call Captain"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Ride Route Addresses */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2 text-zinc-300">
                  <span className="text-amber-400 mt-0.5">●</span>
                  <p className="truncate text-[11px]"><span className="text-zinc-500 font-semibold">Pickup:</span> {activeRide.pickupAddress}</p>
                </div>
                <div className="flex items-start gap-2 text-zinc-300">
                  <span className="text-emerald-400 mt-0.5">●</span>
                  <p className="truncate text-[11px]"><span className="text-zinc-500 font-semibold">Drop:</span> {activeRide.dropAddress}</p>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
                <span className="text-zinc-400">Total Payable Fare (0% Comm):</span>
                <span className="text-sm font-black text-zinc-100">₹{activeRide.fare}</span>
              </div>
            </div>
          )}

          {/* STATE D: RIDE COMPLETED & RATING MODAL */}
          {activeRide?.status === 'COMPLETED' && (
            <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-2xl text-emerald-400 shadow-lg shadow-emerald-500/20">
                🎉
              </div>

              <div>
                <h3 className="text-base font-black text-zinc-100">You have Reached Destination!</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Hope you had a comfortable ride with {activeRide.captainName || 'Captain'}</p>
              </div>

              {/* Bill Receipt Card */}
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1.5 text-left text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Ride Fare ({activeRide.distanceKm} km):</span>
                  <span className="text-zinc-200 font-bold">₹{activeRide.fare}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Platform Fee (Zero Commission):</span>
                  <span className="text-emerald-400 font-bold">₹0</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-zinc-800 text-sm font-black text-zinc-100">
                  <span>Total Amount Paid:</span>
                  <span className="text-amber-400">₹{activeRide.fare}</span>
                </div>
              </div>

              {/* 5-Star Rating Selector */}
              {!ratingSubmitted ? (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase text-zinc-300">Rate your Captain</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        className={`p-2 rounded-xl transition-all ${
                          star <= selectedRating ? 'text-amber-400 scale-110' : 'text-zinc-600'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${star <= selectedRating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Leave optional compliment or feedback..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-amber-400"
                  />

                  <button
                    onClick={handleSubmitRating}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow active:scale-95 transition-all"
                  >
                    Submit Rating & Done
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
                  ✓ Rating submitted successfully! Thank you.
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* CHAT WITH CAPTAIN MODAL */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-zinc-100">Chat with {activeRide?.captainName || 'Captain'}</h3>
              </div>
              <button onClick={() => setShowChatModal(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-48 overflow-y-auto space-y-2 p-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'passenger' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                      msg.sender === 'passenger'
                        ? 'bg-amber-400 text-zinc-950 font-bold rounded-tr-none'
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type message to Captain..."
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSendChat}
                className="p-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl font-bold active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

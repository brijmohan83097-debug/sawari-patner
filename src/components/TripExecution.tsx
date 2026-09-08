import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldAlert, 
  Check, 
  KeyRound, 
  Gauge, 
  Clock, 
  ChevronRight,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  Flame,
  Compass,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { RideRequest, TripStep } from '../types';
import { getActiveNavigationTarget, openGoogleMapsTurnByTurn, getGoogleMapsNavigationUrl } from '../utils/navigation';

interface TripExecutionProps {
  ride: RideRequest;
  tripStep: TripStep;
  captainProgress: number;
  onArrivedAtPickup: () => void;
  onOpenOtpModal: () => void;
  onCompleteRide: () => void;
  onOpenCall: () => void;
  onOpenChat: () => void;
  onToggleSimulateDrive: () => void;
  isSimulatingDrive: boolean;
}

export const TripExecution: React.FC<TripExecutionProps> = ({
  ride,
  tripStep,
  captainProgress,
  onArrivedAtPickup,
  onOpenOtpModal,
  onCompleteRide,
  onOpenCall,
  onOpenChat,
  onToggleSimulateDrive,
  isSimulatingDrive
}) => {
  const [waitingTimer, setWaitingTimer] = useState(0);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [simSpeed, setSimSpeed] = useState(36);

  const navTarget = getActiveNavigationTarget(ride, tripStep);
  const googleMapsUrl = getGoogleMapsNavigationUrl(navTarget.coords);

  // Speed oscillation during movement
  useEffect(() => {
    if (isSimulatingDrive) {
      const speedInterval = setInterval(() => {
        setSimSpeed(Math.floor(32 + Math.random() * 18));
      }, 1500);
      return () => clearInterval(speedInterval);
    } else {
      setSimSpeed(0);
    }
  }, [isSimulatingDrive]);

  // Waiting timer at pickup
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tripStep === 'arrived_pickup' || tripStep === 'verifying_otp') {
      timer = setInterval(() => {
        setWaitingTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [tripStep]);

  const formatWaiting = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLaunchGoogleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    openGoogleMapsTurnByTurn(navTarget.coords);
  };

  return (
    <div id="trip-execution-card" className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5">
      
      {/* 0. TRIP STEP MULTI-STAGE STEPPER INDICATOR */}
      <div className="flex items-center justify-between px-1 text-xs">
        {/* Step 1: Navigating / Arrived */}
        <div className={`flex items-center gap-1.5 font-bold transition-colors ${
          tripStep === 'navigating_pickup' || tripStep === 'arrived_pickup' || tripStep === 'verifying_otp'
            ? 'text-amber-400'
            : 'text-emerald-400'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            tripStep === 'on_trip' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' 
              : 'bg-amber-400 text-zinc-950 font-black'
          }`}>
            {tripStep === 'on_trip' ? '✓' : '1'}
          </div>
          <span>Pickup</span>
        </div>

        <div className={`flex-1 h-[2px] mx-2 rounded ${
          tripStep === 'on_trip' ? 'bg-emerald-500/60' : 'bg-zinc-800'
        }`} />

        {/* Step 2: OTP Verification */}
        <div className={`flex items-center gap-1.5 font-bold transition-colors ${
          tripStep === 'verifying_otp' || tripStep === 'arrived_pickup'
            ? 'text-amber-400 animate-pulse'
            : tripStep === 'on_trip'
              ? 'text-emerald-400'
              : 'text-zinc-500'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            tripStep === 'on_trip'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
              : tripStep === 'arrived_pickup' || tripStep === 'verifying_otp'
                ? 'bg-amber-400 text-zinc-950 font-black'
                : 'bg-zinc-800 text-zinc-500'
          }`}>
            {tripStep === 'on_trip' ? '✓' : '2'}
          </div>
          <span>Start OTP</span>
        </div>

        <div className={`flex-1 h-[2px] mx-2 rounded ${
          tripStep === 'on_trip' ? 'bg-amber-400/80' : 'bg-zinc-800'
        }`} />

        {/* Step 3: Destination & Cash Collection */}
        <div className={`flex items-center gap-1.5 font-bold transition-colors ${
          tripStep === 'on_trip' ? 'text-amber-400' : 'text-zinc-500'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            tripStep === 'on_trip'
              ? 'bg-amber-400 text-zinc-950 font-black ring-2 ring-amber-400/40'
              : 'bg-zinc-800 text-zinc-500'
          }`}>
            3
          </div>
          <span>Drop & Fare</span>
        </div>
      </div>

      {/* 1. TOP NAVIGATION INSTRUCTION BANNER WITH GOOGLE MAPS SHORTCUT */}
      <div className="flex items-center justify-between p-3 bg-zinc-950/90 border border-zinc-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black flex-shrink-0 shadow-md">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-1">
              {tripStep === 'navigating_pickup' && 'Heading to Passenger Pickup'}
              {tripStep === 'arrived_pickup' && 'Arrived at Pickup Location'}
              {tripStep === 'verifying_otp' && 'Waiting for Rider Start OTP'}
              {tripStep === 'on_trip' && 'In Transit to Destination'}
            </p>
            <p className="text-sm font-bold text-zinc-100 truncate max-w-[200px] sm:max-w-[240px]">
              {navTarget.label}
            </p>
          </div>
        </div>

        {/* Live GPS Speedometer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-right">
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <span className="text-xs font-mono font-extrabold text-zinc-100">{simSpeed}</span>
            <span className="text-[9px] text-zinc-500 block leading-tight">km/h</span>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT "NAVIGATE VIA GOOGLE MAPS" DEEP-LINK ACTION BUTTON */}
      <div className="bg-gradient-to-r from-blue-950/60 via-zinc-900 to-indigo-950/60 border border-blue-500/40 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30 flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-300">Google Maps Navigation</span>
                <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 text-[9px] font-bold rounded-full uppercase">
                  {navTarget.stepName === 'pickup' ? 'To Pickup' : 'To Drop'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate max-w-[170px] sm:max-w-[220px]">
                {navTarget.subLabel}
              </p>
            </div>
          </div>

          {/* Deep-link button */}
          <a
            id="btn-navigate-google-maps-native"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLaunchGoogleMaps}
            className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap"
            title="Open Turn-by-Turn in Google Maps app"
          >
            <span>Navigate</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </a>
        </div>
      </div>

      {/* 3. CUSTOMER INFO & CONTACT CONTROLS */}
      <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400 text-amber-400 flex items-center justify-center font-bold text-sm">
            {ride.customerName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-extrabold text-zinc-100">{ride.customerName}</h4>
              <span className="text-[11px] font-semibold text-amber-400">★ {ride.customerRating}</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {ride.paymentMode === 'CASH' ? '💵 Cash on Drop' : '⚡ Paid Online (UPI)'} • Net: <span className="text-emerald-400 font-bold">₹{ride.captainEarning}</span>
            </p>
          </div>
        </div>

        {/* Quick Call and Chat Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-trip-customer-chat"
            onClick={onOpenChat}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded-xl transition-transform active:scale-95 shadow-sm"
            title="Chat with Rider"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            id="btn-trip-customer-call"
            onClick={onOpenCall}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl transition-transform active:scale-95 shadow-md shadow-amber-400/20"
            title="Call Rider"
          >
            <Phone className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* 4. SIMULATOR CONTROLS BAR (For seamless demo testing) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/40 border border-zinc-800/50 rounded-xl text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSimulateDrive}
            className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors ${
              isSimulatingDrive ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {isSimulatingDrive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isSimulatingDrive ? 'Simulating GPS Driving...' : 'Simulate Drive'}</span>
          </button>
          <span>Progress: {Math.round(captainProgress)}%</span>
        </div>

        {/* Waiting timer indicator if at pickup */}
        {(tripStep === 'arrived_pickup' || tripStep === 'verifying_otp') && (
          <div className="flex items-center gap-1 text-amber-400 font-mono text-[11px] font-bold">
            <Clock className="w-3 h-3" />
            <span>Waiting: {formatWaiting(waitingTimer)}</span>
          </div>
        )}
      </div>

      {/* 5. PRIMARY STATE-BASED ACTION BUTTONS (STEP 1 -> STEP 2 -> STEP 3) */}
      
      {/* Step 1: Navigating to pickup -> "Arrived at Pickup" */}
      {tripStep === 'navigating_pickup' && (
        <div className="space-y-2">
          <button
            id="btn-arrived-at-pickup"
            onClick={onArrivedAtPickup}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl font-black text-base transition-all shadow-[0_0_25px_rgba(250,204,21,0.35)] flex items-center justify-center gap-2 active:scale-98"
          >
            <MapPin className="w-5 h-5 fill-current" />
            <span>STEP 1: ARRIVED AT PICKUP</span>
          </button>
          <p className="text-[11px] text-center text-zinc-400">
            Click when you have reached customer's pickup spot.
          </p>
        </div>
      )}

      {/* Step 2: Arrived at pickup -> "Enter Start OTP" */}
      {(tripStep === 'arrived_pickup' || tripStep === 'verifying_otp') && (
        <div className="space-y-2">
          <button
            id="btn-enter-start-otp"
            onClick={onOpenOtpModal}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl font-black text-base transition-all shadow-[0_0_25px_rgba(250,204,21,0.35)] flex items-center justify-center gap-2 active:scale-98 animate-pulse"
          >
            <KeyRound className="w-5 h-5" />
            <span>STEP 2: START RIDE (ENTER OTP: {ride.otp})</span>
          </button>
          <p className="text-[11px] text-center text-zinc-400">
            Ask customer for the 4-digit code (<span className="text-amber-400 font-mono font-bold">{ride.otp}</span>) to start trip.
          </p>
        </div>
      )}

      {/* Step 3: On Trip -> "Complete Ride & Collect Cash/UPI" */}
      {tripStep === 'on_trip' && (
        <div className="space-y-2">
          <button
            id="btn-complete-ride-final"
            onClick={onCompleteRide}
            className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-2xl font-black text-base transition-all shadow-[0_0_25px_rgba(52,211,153,0.35)] flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>STEP 3: COMPLETE RIDE & COLLECT ₹{ride.captainEarning}</span>
          </button>
          
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span className="truncate max-w-[200px]">Dest: {ride.dropAddress.split(',')[0]}</span>
            <button
              onClick={() => setShowSosConfirm(true)}
              className="text-rose-400 font-bold flex items-center gap-1 hover:text-rose-300"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS Emergency</span>
            </button>
          </div>
        </div>
      )}

      {/* Emergency SOS confirmation dialog */}
      {showSosConfirm && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Captain SOS Emergency Helpline</span>
          </div>
          <p className="text-zinc-300 text-[11px]">
            Dialing Sawari 24x7 Safety Response Team and alerting nearby police control room.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { alert('Connecting to Sawari 24x7 Emergency Safety Dispatch...'); setShowSosConfirm(false); }}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
            >
              Call Police / Dispatch
            </button>
            <button
              onClick={() => setShowSosConfirm(false)}
              className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-xl font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

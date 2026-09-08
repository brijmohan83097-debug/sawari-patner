import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Flame, 
  Check, 
  X, 
  Clock, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Bike,
  Car
} from 'lucide-react';
import { RideRequest } from '../types';
import { soundManager } from '../utils/audio';

interface IncomingRideModalProps {
  request: RideRequest;
  onAccept: (request: RideRequest) => void;
  onReject: (requestId: string) => void;
}

export const IncomingRideModal: React.FC<IncomingRideModalProps> = ({
  request,
  onAccept,
  onReject
}) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const totalTime = 15;

  useEffect(() => {
    // Play radar sound when incoming request arrives
    soundManager.playIncomingAlert();
    const soundTimer = setInterval(() => {
      soundManager.playIncomingAlert();
    }, 3000);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(soundTimer);
          onReject(request.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(soundTimer);
    };
  }, [request.id, onReject]);

  const progressPercent = (timeLeft / totalTime) * 100;
  const strokeDashoffset = 100 - progressPercent;

  const handleAccept = () => {
    soundManager.playAcceptChime();
    onAccept(request);
  };

  const handleReject = () => {
    soundManager.playDutyOffline();
    onReject(request.id);
  };

  return (
    <div id="incoming-ride-modal" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-zinc-900 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(250,204,21,0.35)] backdrop-blur-xl">
        
        {/* Top Header: Guaranteed Fare + Radial Timer */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {/* Circular Countdown Progress */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3.5"
                  strokeDasharray="100"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute text-sm font-black text-amber-400 font-mono">
                {timeLeft}s
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Guaranteed Fare</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold rounded">
                  0% Commission
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-3xl font-black text-amber-400 tracking-tight">
                  ₹{request.captainEarning}
                </h3>
                {request.surgeBonus > 0 && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 rounded-md text-[10px] font-extrabold text-red-400">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    +{request.surgeBonus} Surge
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Type & Payment Badge */}
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-200 uppercase mb-1">
              {request.vehicleType === 'bike' ? '🛵 Bike Taxi' : request.vehicleType === 'auto' ? '🛺 Auto' : '🚗 Cab'}
            </span>
            <div className="flex items-center justify-end gap-1 text-[11px] text-zinc-400">
              {request.paymentMode === 'CASH' ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Banknote className="w-3.5 h-3.5" /> Cash
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sky-400 font-semibold">
                  <CreditCard className="w-3.5 h-3.5" /> Online UPI
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Distance & Trip Time overview */}
        <div className="flex items-center justify-between py-2.5 text-xs text-zinc-300 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-400/10 text-amber-300 font-bold rounded-md border border-amber-400/20">
              Pickup 0.6 km (2 min away)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span>Trip: {request.distanceKm} km</span>
            <span>•</span>
            <span>~{request.estimatedTimeMin} mins</span>
          </div>
        </div>

        {/* Pickup and Drop Route Points */}
        <div className="py-3 space-y-3">
          {/* Pickup */}
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pickup Location</p>
                <span className="text-[10px] text-zinc-400">★ {request.customerRating} rider</span>
              </div>
              <p className="text-sm font-bold text-zinc-100 truncate">{request.pickupAddress}</p>
              {request.pickupLandmark && (
                <p className="text-xs text-zinc-400 truncate">{request.pickupLandmark}</p>
              )}
            </div>
          </div>

          {/* Drop */}
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-sky-400">Drop Location</p>
              <p className="text-sm font-bold text-zinc-100 truncate">{request.dropAddress}</p>
              {request.dropLandmark && (
                <p className="text-xs text-zinc-400 truncate">{request.dropLandmark}</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Note if any */}
        {request.note && (
          <div className="mb-3 px-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 italic">
            "{request.note}"
          </div>
        )}

        {/* Action Buttons: Big Accept & Clear Reject */}
        <div className="grid grid-cols-5 gap-2.5 pt-1">
          <button
            id="btn-reject-ride"
            onClick={handleReject}
            className="col-span-2 py-3.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Pass</span>
          </button>

          <button
            id="btn-accept-ride"
            onClick={handleAccept}
            className="col-span-3 py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl font-black text-base transition-all shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>ACCEPT RIDE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

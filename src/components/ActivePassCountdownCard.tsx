import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  ChevronRight,
  Lock
} from 'lucide-react';
import { DailyPass, VehicleType, DAILY_PASS_PRICES } from '../types';

interface ActivePassCountdownCardProps {
  activePass: DailyPass | null;
  selectedVehicle: VehicleType;
  onOpenRechargeModal: () => void;
}

export const ActivePassCountdownCard: React.FC<ActivePassCountdownCardProps> = ({
  activePass,
  selectedVehicle,
  onOpenRechargeModal
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [percentRemaining, setPercentRemaining] = useState<number>(100);

  useEffect(() => {
    const calculateTime = () => {
      if (!activePass) {
        setIsExpired(true);
        setTimeLeftStr('No Active Pass');
        setPercentRemaining(0);
        return;
      }

      const now = Date.now();
      const diff = activePass.expiresAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeftStr('Pass Expired');
        setPercentRemaining(0);
      } else {
        setIsExpired(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeftStr(`${hours} hrs ${minutes} mins`);
        } else if (minutes > 0) {
          setTimeLeftStr(`${minutes} mins ${seconds}s`);
        } else {
          setTimeLeftStr(`${seconds}s`);
        }

        const totalDuration = (activePass.hoursTotal || 24) * 60 * 60 * 1000;
        const pct = Math.max(0, Math.min(100, (diff / totalDuration) * 100));
        setPercentRemaining(pct);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activePass]);

  const vehicleInfo = DAILY_PASS_PRICES[selectedVehicle || 'bike'];

  // Case 1: Active Pass
  if (activePass && !isExpired) {
    return (
      <div 
        id="active-pass-banner"
        className="w-full bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/40 rounded-2xl p-3.5 shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active 24-Hr Daily Pass (0% Comm)
                </span>
                <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded">
                  ₹{activePass.price} Paid
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs text-zinc-400">Valid for:</span>
                <span className="text-sm sm:text-base font-black text-zinc-100 font-mono tracking-tight">
                  {timeLeftStr}
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-extend-daily-pass"
            onClick={onOpenRechargeModal}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 active:scale-95 flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Extend</span>
          </button>
        </div>

        {/* Progress Bar of remaining time */}
        <div className="mt-2.5 w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800/80">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>
    );
  }

  // Case 2: No Pass or Expired Pass (Locked "GO ONLINE" notification)
  return (
    <div 
      id="expired-pass-banner"
      onClick={onOpenRechargeModal}
      className="w-full bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/50 rounded-2xl p-3.5 shadow-lg cursor-pointer hover:border-amber-400 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Daily Pass Required to Go Online
              </span>
              <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 text-[10px] font-black rounded uppercase">
                ₹{vehicleInfo.price} / Day
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Recharge for 24-hr unlimited bookings at <strong className="text-emerald-400">0% Commission</strong>.
            </p>
          </div>
        </div>

        <button
          id="btn-recharge-pass-banner"
          onClick={(e) => { e.stopPropagation(); onOpenRechargeModal(); }}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md group-hover:shadow-amber-400/20 active:scale-95 transition-all flex-shrink-0"
        >
          <span>BUY PASS</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

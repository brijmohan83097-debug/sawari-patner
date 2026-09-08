import React from 'react';
import { Power, Sparkles, Radio, Shield, AlertTriangle, Lock, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { VehicleType, DAILY_PASS_PRICES } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DutyToggleProps {
  isOnline: boolean;
  isKycVerified: boolean;
  hasActivePass: boolean;
  selectedVehicle: VehicleType;
  onToggle: (nextState: boolean) => void;
  onOpenKyc: () => void;
  onOpenDailyPass: () => void;
}

export const DutyToggle: React.FC<DutyToggleProps> = ({
  isOnline,
  isKycVerified,
  hasActivePass,
  selectedVehicle,
  onToggle,
  onOpenKyc,
  onOpenDailyPass
}) => {
  const { t } = useLanguage();
  const currentPassPrice = DAILY_PASS_PRICES[selectedVehicle || 'bike'].price;

  const handleToggle = () => {
    // 1. If not KYC verified, route to KYC
    if (!isKycVerified) {
      onOpenKyc();
      return;
    }

    // 2. If turning ON but no active pass, prompt Daily Pass recharge modal
    if (!isOnline && !hasActivePass) {
      soundManager.playIncomingAlert();
      onOpenDailyPass();
      return;
    }

    const next = !isOnline;
    if (next) {
      soundManager.playDutyOnline();
    } else {
      soundManager.playDutyOffline();
    }
    onToggle(next);
  };

  return (
    <div id="duty-toggle-container" className="w-full">
      <div className={`relative overflow-hidden rounded-2xl p-1.5 transition-all duration-300 border ${
        isOnline 
          ? 'bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-900 border-amber-400/80 shadow-[0_0_25px_rgba(250,204,21,0.25)]' 
          : hasActivePass
            ? 'bg-zinc-900/90 border-zinc-800 shadow-md'
            : 'bg-zinc-900/80 border-amber-500/30'
      }`}>
        <button
          id="btn-duty-toggle-main"
          onClick={handleToggle}
          className={`w-full relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl font-bold transition-all active:scale-[0.99] ${
            isOnline 
              ? 'bg-amber-400 text-zinc-950 shadow-lg' 
              : hasActivePass
                ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200'
                : 'bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300'
          }`}
        >
          {/* Status Left Indicator */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform ${
              isOnline 
                ? 'bg-zinc-950 text-amber-400 shadow-md animate-pulse' 
                : hasActivePass
                  ? 'bg-zinc-900 text-zinc-400'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {isOnline ? (
                <Power className="w-6 h-6 stroke-[2.5]" />
              ) : hasActivePass ? (
                <Power className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Lock className="w-5 h-5 text-amber-400" />
              )}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-lg font-black tracking-tight ${
                  isOnline ? 'text-zinc-950' : 'text-zinc-100'
                }`}>
                  {isOnline ? t('you_are_online') : hasActivePass ? t('go_online') : t('pass_required')}
                </span>
                {isOnline && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-700"></span>
                  </span>
                )}
                {!isOnline && !hasActivePass && (
                  <span className="px-1.5 py-0.5 bg-amber-400 text-zinc-950 rounded text-[9px] font-black uppercase">
                    ₹{currentPassPrice}
                  </span>
                )}
              </div>
              <p className={`text-xs font-medium ${
                isOnline ? 'text-zinc-900/80' : 'text-zinc-400'
              }`}>
                {isOnline 
                  ? t('searching_rides')
                  : hasActivePass
                    ? t('ready_to_accept')
                    : `Tap to buy Daily Pass (₹${currentPassPrice}/day) & unlock unlimited rides`
                }
              </p>
            </div>
          </div>

          {/* Right Status Indicator Switch */}
          <div className="flex items-center gap-2">
            <div className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
              isOnline ? 'bg-zinc-950' : hasActivePass ? 'bg-zinc-700' : 'bg-amber-950 border border-amber-500/40'
            }`}>
              <div className={`w-6 h-6 rounded-full bg-amber-400 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                isOnline 
                  ? 'translate-x-6 bg-amber-400 text-zinc-950' 
                  : hasActivePass
                    ? 'translate-x-0 bg-zinc-400 text-zinc-800'
                    : 'translate-x-0 bg-amber-400 text-zinc-950'
              }`}>
                {isOnline ? (
                  <Radio className="w-3 h-3 text-zinc-950" />
                ) : hasActivePass ? (
                  <Power className="w-3 h-3 text-zinc-900" />
                ) : (
                  <Zap className="w-3 h-3 text-zinc-950 fill-current" />
                )}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* KYC Warning if pending */}
      {!isKycVerified && (
        <div 
          onClick={onOpenKyc}
          className="mt-2 flex items-center justify-between p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl cursor-pointer hover:bg-amber-500/25 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Driver Verification incomplete. Complete KYC to go online.</span>
          </div>
          <span className="text-xs font-bold text-amber-400 underline underline-offset-2">Verify</span>
        </div>
      )}

      {/* Pass warning if verified but no active pass */}
      {isKycVerified && !hasActivePass && (
        <div 
          onClick={onOpenDailyPass}
          className="mt-2 flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl cursor-pointer hover:bg-amber-500/20 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 fill-amber-400" />
            <span>0% Commission Model: Buy 24-Hr Pass (₹{currentPassPrice}) to Go Online.</span>
          </div>
          <span className="text-xs font-black text-amber-400 underline underline-offset-2">Recharge</span>
        </div>
      )}
    </div>
  );
};

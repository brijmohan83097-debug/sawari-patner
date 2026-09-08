import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Star, 
  Award, 
  TrendingUp, 
  Settings, 
  Phone, 
  Globe, 
  X, 
  Check, 
  Sparkles, 
  Bike, 
  Car,
  BellRing,
  HelpCircle,
  LogOut,
  Zap,
  Wallet,
  Plus
} from 'lucide-react';
import { DriverProfile, VehicleType } from '../types';

interface DriverProfileModalProps {
  driver: DriverProfile;
  walletBalance?: number;
  onOpenWallet?: () => void;
  onOpenAddMoney?: () => void;
  onUpdateDriver: (updated: Partial<DriverProfile>) => void;
  onOpenKyc: () => void;
  onTriggerTestRide: () => void;
  onLogout?: () => void;
  onClose: () => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  driver,
  walletBalance = 0,
  onOpenWallet,
  onOpenAddMoney,
  onUpdateDriver,
  onOpenKyc,
  onTriggerTestRide,
  onLogout,
  onClose
}) => {
  const [selectedLang, setSelectedLang] = useState('English');
  const [safetyGearActive, setSafetyGearActive] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [imgError, setImgError] = useState(false);

  const languages = ['English', 'हिंदी (Hindi)', 'ಕನ್ನಡ (Kannada)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)'];

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div id="driver-profile-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 p-5 border-b border-zinc-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="relative">
              {driver.avatar && !imgError ? (
                <img
                  src={driver.avatar}
                  alt={driver.name}
                  onError={() => setImgError(true)}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 text-zinc-950 font-black text-xl flex items-center justify-center shadow-md">
                  {getInitials(driver.name)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-zinc-950 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 fill-current" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-zinc-100">{driver.name}</h3>
                <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-md text-[10px] font-black text-amber-300 uppercase">
                  Captain
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">{driver.phone} • ID: {driver.id}</p>
              <p className="text-xs text-zinc-300 mt-1 font-semibold">
                {driver.vehicleModel} ({driver.vehicleNumber})
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Captain Performance Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-extrabold text-base">{driver.rating}</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Captain Rating</p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="font-extrabold text-base">{driver.acceptanceRate}%</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Acceptance Rate</p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-sky-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="font-extrabold text-base">{driver.totalTrips}</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Lifetime Trips</p>
            </div>
          </div>

          {/* Dedicated Sawari Wallet Card */}
          <div className="p-3.5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/30 border border-amber-400/40 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Sawari Wallet Balance</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black text-amber-400 font-mono">
                    ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenAddMoney && (
                <button
                  id="btn-profile-add-money"
                  onClick={() => {
                    onClose();
                    onOpenAddMoney();
                  }}
                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Money</span>
                </button>
              )}

              {onOpenWallet && (
                <button
                  id="btn-profile-open-wallet"
                  onClick={() => {
                    onClose();
                    onOpenWallet();
                  }}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors"
                >
                  Passbook
                </button>
              )}
            </div>
          </div>

          {/* Quick Trigger Demo Ride Button */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Test Ride Simulator</span>
              </div>
              <p className="text-[11px] text-zinc-400">Trigger immediate incoming booking</p>
            </div>

            <button
              id="btn-profile-trigger-test-ride"
              onClick={() => {
                onTriggerTestRide();
                onClose();
              }}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl font-black text-xs shadow-md active:scale-95 transition-transform"
            >
              Simulate Request 🛵
            </button>
          </div>

          {/* Captain Preferences & Toggles */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Driver Preferences</h4>

            {/* Auto Accept Switch */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-200">Auto-Accept Rides</p>
                <p className="text-[11px] text-zinc-500">Automatically accept high-rated rides</p>
              </div>
              <button
                onClick={() => setAutoAccept(!autoAccept)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${autoAccept ? 'bg-amber-400' : 'bg-zinc-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${autoAccept ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Safety Helmet / Seatbelt Verified */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <div>
                <p className="font-bold text-zinc-200">Safety Gear Active</p>
                <p className="text-[11px] text-zinc-500">Dual helmets & sanitizer available</p>
              </div>
              <button
                onClick={() => setSafetyGearActive(!safetyGearActive)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${safetyGearActive ? 'bg-emerald-500' : 'bg-zinc-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-zinc-950 transition-transform ${safetyGearActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* App Voice / Display Language Selector */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Driver Navigation Language</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                    selectedLang === lang 
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Verification & KYC Portal Link */}
          <button
            onClick={() => {
              onClose();
              onOpenKyc();
            }}
            className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl font-bold flex items-center justify-between px-4 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Manage Documents & KYC</span>
            </div>
            <span className="text-emerald-400 font-extrabold text-[11px]">VERIFIED ✓</span>
          </button>

          {/* Captain Sign Out */}
          {onLogout && (
            <button
              id="btn-profile-logout"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch Account</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

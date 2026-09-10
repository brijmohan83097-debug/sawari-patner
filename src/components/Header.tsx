import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  Wallet, 
  Volume2, 
  VolumeX, 
  Bike, 
  Car, 
  Clock, 
  Award, 
  Lock, 
  LogIn, 
  LogOut, 
  Settings
} from 'lucide-react';
import { DriverProfile, VehicleType } from '../types';
import { MASTER_ADMIN_PHONE } from '../data/mockData';
import { soundManager } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  driver: DriverProfile;
  isOnline: boolean;
  walletBalance: number;
  selectedVehicle: VehicleType;
  onVehicleChange: (type: VehicleType) => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenKyc: () => void;
  onOpenIdCard: () => void;
  onOpenDailyPass: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
  onOpenPassengerApp?: () => void;
  onOpenSplitView?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  driver,
  isOnline,
  walletBalance,
  selectedVehicle,
  onVehicleChange,
  onOpenProfile,
  onOpenWallet,
  onOpenKyc,
  onOpenIdCard,
  onOpenDailyPass,
  onOpenAdmin,
  onOpenAuth,
  onOpenSettings,
  onOpenPassengerApp,
  onOpenSplitView,
  onLogout
}) => {
  const { t, currentLanguageInfo } = useLanguage();
  const [soundEnabled, setSoundEnabled] = React.useState(soundManager.isEnabled());
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [driver?.avatar]);

  const handleToggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
  };

  const isApproved = driver.kycStatus === 'approved';
  const isPending = driver.kycStatus === 'pending';
  const isRejected = driver.kycStatus === 'rejected';
  const isSuperAdmin = driver?.phone?.replace(/\D/g, '').includes(MASTER_ADMIN_PHONE) || 
                       driver?.email === 'brijmohan83097@gmail.com' ||
                       driver?.id === 'super-admin-01';

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/95 border-b border-zinc-800/80 backdrop-blur-md px-2.5 sm:px-4 py-2">
      <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto">
        
        {/* Brand & Driver Quick Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 py-0.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-400/25">
              <span className="text-base font-black tracking-tighter">S</span>
            </div>
            <div className="hidden min-[360px]:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-zinc-100 tracking-tight">SAWARI</span>
                <span className="px-1.5 py-0.2 bg-amber-400/15 border border-amber-400/30 text-[9px] font-black text-amber-300 rounded uppercase">
                  Captain
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
                <span>•</span>
                <span className="font-mono text-zinc-300">{driver.badgeId || 'SW-CAPTAIN'}</span>
              </div>
            </div>
          </div>

          {/* Quick ID Card badge button */}
          <button
            id="btn-header-id-card"
            onClick={onOpenIdCard}
            title="View Driver ID Card"
            className="hidden lg:flex items-center gap-1 px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg text-[11px] font-bold text-amber-300 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>ID: {driver.badgeId}</span>
          </button>

          {/* Quick Pass Status Button */}
          <button
            id="btn-header-daily-pass"
            onClick={onOpenDailyPass}
            title="Daily Active Pass (0% Commission)"
            className={`hidden sm:flex items-center gap-1 px-2 py-1 border rounded-lg text-[11px] font-black transition-colors ${
              driver.activePass && driver.activePass.expiresAt > Date.now()
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-400/40 text-amber-300 animate-pulse'
            }`}
          >
            <span className="text-xs">⚡</span>
            <span>{driver.activePass && driver.activePass.expiresAt > Date.now() ? t('pass_active') : t('buy_pass')}</span>
          </button>
        </div>

        {/* Center: Vehicle Mode Selector */}
        <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-800">
          <button
            id="btn-select-bike"
            onClick={() => onVehicleChange('bike')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              selectedVehicle === 'bike'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('bike')}</span>
          </button>
          
          <button
            id="btn-select-auto"
            onClick={() => onVehicleChange('auto')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              selectedVehicle === 'auto'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-xs">🛺</span>
            <span className="hidden sm:inline">{t('auto')}</span>
          </button>

          <button
            id="btn-select-cab"
            onClick={() => onVehicleChange('cab')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              selectedVehicle === 'cab'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('cab')}</span>
          </button>
        </div>

        {/* Right Controls: Profile Avatar (Replaces balance), Wallet, Settings, Sound, Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Passenger App Mode Switcher */}
          {onOpenPassengerApp && (
            <button
              id="btn-header-passenger-app"
              onClick={onOpenPassengerApp}
              title="Switch to Passenger Rider App"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-400/40 hover:border-amber-400 rounded-xl text-xs font-black text-amber-300 transition-all active:scale-95 shadow-sm"
            >
              <span>📱</span>
              <span className="hidden md:inline">{t('passenger_app')}</span>
            </button>
          )}

          {/* Split Screen Dual Test Switcher */}
          {onOpenSplitView && (
            <button
              id="btn-header-split-view"
              onClick={onOpenSplitView}
              title="Live Dual Device Split Screen (Passenger & Captain)"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-all active:scale-95 shadow-sm"
            >
              <span>⚡</span>
              <span>{t('split_view')}</span>
            </button>
          )}
          
          {/* Admin Dashboard Trigger - Strictly visible only to Master Super Admin */}
          {isSuperAdmin && (
            <button
              id="btn-header-admin-dashboard"
              onClick={onOpenAdmin}
              title="Open Master Super Admin Operations Dashboard"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 rounded-xl text-xs font-black text-amber-300 hover:text-amber-200 transition-all active:scale-95 shadow-sm shadow-amber-400/10"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{t('admin_panel')}</span>
            </button>
          )}

          {/* Dedicated Captain Wallet Button */}
          <button
            id="btn-header-wallet"
            onClick={onOpenWallet}
            title="Sawari Captain Wallet & Passbook"
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 text-amber-400 hover:text-amber-300 transition-all flex items-center justify-center active:scale-95 shadow-sm"
          >
            <Wallet className="w-4 h-4" />
          </button>

          {/* Profile & Account Avatar Button (Replaced hardcoded balance badge) */}
          <button
            id="btn-header-profile-avatar"
            onClick={onOpenProfile}
            title={`${driver.name || 'Captain'} - View Profile & Account`}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all text-left group active:scale-95"
          >
            <div className="relative">
              {driver.avatar && !imgError ? (
                <img 
                  src={driver.avatar} 
                  alt={driver.name || 'Captain Profile'} 
                  onError={() => setImgError(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-amber-400 group-hover:border-amber-300 transition-all shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black text-xs flex items-center justify-center border-2 border-amber-300 shadow-sm">
                  {getInitials(driver.name)}
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
              }`} />
            </div>

            <div className="hidden min-[480px]:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors truncate max-w-[80px] sm:max-w-[110px]">
                  {driver.name ? driver.name.split(' ')[0] : 'Captain'}
                </span>
                {isApproved ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
                ) : isPending ? (
                  <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-rose-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <span className="font-semibold text-amber-400">★ {driver.rating || 5.0}</span>
                <span>•</span>
                <span className="text-[10px] text-zinc-400 uppercase">Profile</span>
              </div>
            </div>
          </button>

          {/* Dedicated Settings Button with Language Indicator */}
          {onOpenSettings && (
            <button
              id="btn-header-settings"
              onClick={onOpenSettings}
              title={`Settings / ${t('change_language')}`}
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 hover:border-amber-400/80 text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-bold text-zinc-200">
                {currentLanguageInfo.nativeName}
              </span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={handleToggleSound}
            title={soundEnabled ? 'Mute Alert Sounds' : 'Unmute Alert Sounds'}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
              soundEnabled 
                ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:border-amber-400/40' 
                : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Switch User / Auth modal */}
          <button
            id="btn-header-auth-switch"
            onClick={onOpenAuth}
            title="Switch Captain or Login"
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
          </button>

          {/* Direct Logout Button */}
          {onLogout && (
            <button
              id="btn-header-logout"
              onClick={onLogout}
              title="Log Out of Captain Account"
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

        </div>
      </div>
    </header>
  );
};


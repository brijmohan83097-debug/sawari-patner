import React, { useState } from 'react';
import { 
  Settings, 
  Languages, 
  User, 
  Car, 
  Sliders, 
  Navigation, 
  HelpCircle, 
  LogOut, 
  Check, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Award, 
  Phone, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  X,
  Radio,
  Save,
  LogIn
} from 'lucide-react';
import { DriverProfile, VehicleType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';
import { soundManager } from '../utils/audio';
import { captainStorageService } from '../services/captainStorageService';

interface SettingsModalProps {
  isOpen: boolean;
  driver: DriverProfile;
  onUpdateDriver: (updated: Partial<DriverProfile>) => void;
  onOpenIdCard: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onClose: () => void;
}

type SettingsTab = 'language' | 'profile' | 'preferences' | 'navigation' | 'help';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  driver,
  onUpdateDriver,
  onOpenIdCard,
  onLogout,
  onOpenAuth,
  onClose
}) => {
  const { 
    language, 
    setLanguage, 
    languages, 
    t, 
    theme, 
    setTheme, 
    soundEnabled, 
    setSoundEnabled,
    defaultNavigation,
    setDefaultNavigation
  } = useLanguage();

  const [activeTab, setActiveTab] = useState<SettingsTab>('language');

  // Profile Form State
  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [vehicleNumber, setVehicleNumber] = useState(driver.vehicleNumber);
  const [vehicleModel, setVehicleModel] = useState(driver.vehicleModel);
  const [vehicleType, setVehicleType] = useState<VehicleType>(driver.vehicleType || 'bike');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
    soundManager.playButtonClick();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updated: Partial<DriverProfile> = {
      name: name.trim() || driver.name,
      phone: phone.trim() || driver.phone,
      vehicleNumber: vehicleNumber.trim().toUpperCase() || driver.vehicleNumber,
      vehicleModel: vehicleModel.trim() || driver.vehicleModel,
      vehicleType
    };

    try {
      // Persist to captain storage
      await captainStorageService.saveCaptainProfile({
        ...driver,
        ...updated
      });
      onUpdateDriver(updated);
      soundManager.playOtpSuccess();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save captain profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSound = () => {
    soundManager.playRideAlert();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="settings-modal-card"
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-zinc-100">{t('settings')}</h2>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-400 text-[10px] font-bold rounded-full">
                  Sawari Partner
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {t('change_language')} • {t('preferences')}
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 p-2 bg-zinc-950/60 border-b border-zinc-800/60 overflow-x-auto no-scrollbar text-xs">
          <button
            id="tab-settings-language"
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'language'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>भाषा / Language</span>
          </button>

          <button
            id="tab-settings-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('profile')} & {t('vehicle')}</span>
          </button>

          <button
            id="tab-settings-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t('preferences')}</span>
          </button>

          <button
            id="tab-settings-navigation"
            onClick={() => setActiveTab('navigation')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'navigation'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>{t('navigation')}</span>
          </button>

          <button
            id="tab-settings-help"
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'help'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t('help_support')}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">

          {/* ========================================================
              TAB 1: MULTI-LANGUAGE SELECTION (ALL 13 MAJOR INDIAN LANGUAGES)
             ======================================================== */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/30 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-lg flex-shrink-0">
                  अ/A
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">
                    {t('change_language')}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Select your preferred regional language. UI will adapt instantly and remain saved.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {languages.map((item) => {
                  const isSelected = item.code === language;
                  return (
                    <button
                      key={item.code}
                      id={`btn-lang-${item.code}`}
                      type="button"
                      onClick={() => handleSelectLanguage(item.code)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400 shadow-md shadow-amber-400/10'
                          : 'bg-zinc-950/70 hover:bg-zinc-800/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black uppercase ${
                          isSelected
                            ? 'bg-amber-400 text-zinc-950'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}>
                          {item.code}
                        </div>
                        <div className="truncate">
                          <p className={`text-sm font-black truncate ${
                            isSelected ? 'text-amber-300' : 'text-zinc-200'
                          }`}>
                            {item.nativeName}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {item.name} • {item.region}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-bold flex-shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: PROFILE & VEHICLE SETTINGS
             ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              
              {/* Smart Captain ID Summary Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={driver.avatar} 
                    alt={driver.name} 
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 flex-shrink-0"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-zinc-100 truncate">{driver.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md">
                        {driver.badgeId}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      {driver.phone} • {driver.vehicleNumber}
                    </p>
                  </div>
                </div>

                <button
                  id="btn-settings-view-id-card"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenIdCard();
                  }}
                  className="px-3 py-2 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{t('view_id_card')}</span>
                </button>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{t('saved_successfully')}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 block">
                      {t('full_name')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Registered Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 block">
                      {t('phone_number')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Vehicle Number (RC) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 block">
                      {t('vehicle_number')}
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono tracking-wider focus:border-amber-400 focus:outline-none"
                      placeholder="KA 01 AB 1234"
                      required
                    />
                  </div>

                  {/* Vehicle Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 block">
                      {t('vehicle_model')}
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                      placeholder="e.g. Hero Splendor Plus / Bajaj RE"
                    />
                  </div>
                </div>

                {/* Vehicle Type Selection */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-zinc-300 block">
                    {t('vehicle_type')}
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['bike', 'auto', 'cab'] as VehicleType[]).map((vType) => (
                      <button
                        key={vType}
                        type="button"
                        onClick={() => setVehicleType(vType)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          vehicleType === vType
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-black'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 font-bold'
                        }`}
                      >
                        <span className="text-base block mb-1">
                          {vType === 'bike' ? '🏍️' : vType === 'auto' ? '🛺' : '🚗'}
                        </span>
                        <span className="text-xs capitalize">{t(vType)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : t('save_changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              TAB 3: APP PREFERENCES (THEME, SOUND, AUDIO)
             ======================================================== */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">

              {/* Theme Settings */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{t('theme_mode')}</h4>
                    <p className="text-[11px] text-zinc-400">Choose between high-contrast dark or clean light mode</p>
                  </div>
                  <span className="text-xs font-mono text-amber-400 uppercase font-bold">
                    {theme}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                      theme === 'dark'
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-xs">{t('dark_mode')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                      theme === 'light'
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="text-xs">{t('light_mode')}</span>
                  </button>
                </div>
              </div>

              {/* Notification Audio Alerts */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">{t('sound_alerts')}</h4>
                      <p className="text-[11px] text-zinc-400">{t('sound_alerts_desc')}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
                      soundEnabled ? 'bg-amber-400 justify-end' : 'bg-zinc-800 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-950 shadow-md" />
                  </button>
                </div>

                {/* Sound Test Button */}
                <div className="pt-1 flex items-center justify-between border-t border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400">Preview ringtone volume</span>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('test_sound')}</span>
                  </button>
                </div>
              </div>

              {/* GPS Tracking Mode */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">{t('high_accuracy_gps')}</h4>
                  <p className="text-[11px] text-zinc-400">High frequency GPS telemetry for real-time ride tracking</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md">
                  Active (High Acc)
                </span>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: NAVIGATION SETTINGS (DEFAULT MAP CHOICE)
             ======================================================== */}
          {activeTab === 'navigation' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1">
                  {t('default_map')}
                </h3>
                <p className="text-xs text-zinc-400">
                  Select how turn-by-turn navigation should be triggered when accepting rides and arriving at pickup/drop points.
                </p>
              </div>

              <div className="space-y-3">
                {/* Choice 1: Google Maps External */}
                <button
                  type="button"
                  onClick={() => setDefaultNavigation('google_maps')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    defaultNavigation === 'google_maps'
                      ? 'bg-blue-500/15 border-blue-500 text-zinc-100 shadow-md shadow-blue-500/10'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-300">{t('google_maps')}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        {t('google_maps_desc')}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded">
                        Recommended for on-road captains
                      </span>
                    </div>
                  </div>

                  {defaultNavigation === 'google_maps' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Choice 2: In-App Map Simulator */}
                <button
                  type="button"
                  onClick={() => setDefaultNavigation('in_app')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    defaultNavigation === 'in_app'
                      ? 'bg-amber-400/15 border-amber-400 text-zinc-100 shadow-md shadow-amber-400/10'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">{t('in_app_map')}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        {t('in_app_map_desc')}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded">
                        No external app switching
                      </span>
                    </div>
                  </div>

                  {defaultNavigation === 'in_app' && (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: HELP & SUPPORT
             ======================================================== */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-100">Sawari Captain Care</h4>
                  <p className="text-[11px] text-zinc-400">Zero commission platform with dedicated 24x7 driver assistance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Helpline Phone */}
                <a
                  href="tel:18008907890"
                  className="p-3.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-400/50 rounded-2xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-amber-300">{t('helpline_247')}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">1800-890-7890 (Toll Free)</p>
                  </div>
                </a>

                {/* WhatsApp Support */}
                <a
                  href="https://wa.me/919052931129?text=Hello%20Sawari%20Captain%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300">{t('whatsapp_support')}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">+91 90529 31129</p>
                  </div>
                </a>

                {/* Email Support */}
                <a
                  href="mailto:support@sawari.in?subject=Captain%20Assistance%20Ticket"
                  className="p-3.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/50 rounded-2xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-blue-300">{t('email_support')}</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">support@sawari.in</p>
                  </div>
                </a>

                {/* Emergency Safety Desk */}
                <a
                  href="tel:112"
                  className="p-3.5 bg-zinc-950 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-500/50 rounded-2xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-rose-400">{t('safety_emergency')}</p>
                    <p className="text-[11px] text-rose-400 font-mono">112 / Instant SOS Desk</p>
                  </div>
                </a>
              </div>

              {/* Zero Commission Model Info */}
              <div className="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-amber-300">0% Commission Promise:</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Sawari Partner charges zero commission on every single ride. 100% of the customer fare goes directly into your pocket or bank account via UPI.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer: Switch Account & Logout Buttons */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
          {/* Switch Account */}
          <button
            id="btn-settings-switch-account"
            type="button"
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('switch_account')}</span>
          </button>

          {/* Logout Button */}
          <button
            id="btn-settings-logout"
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

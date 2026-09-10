import React, { useState } from 'react';
import { Headphones, Check, Globe } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';
import { useLanguage } from '../context/LanguageContext';
import { HelpBottomSheet } from './HelpBottomSheet';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
}

// User specified order: తెలుగు, हिन्दी, ಕನ್ನಡ, English, मराठी, മലയാളം, বাংলা, தமிழ்
const RAPIDO_LANGUAGES: LanguageOption[] = [
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra Pradesh & Telangana' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'All India' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'en', name: 'English', nativeName: 'English', region: 'India & Global' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Maharashtra' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Kerala' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'West Bengal' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu' }
];

interface LanguageSelectionScreenProps {
  onConfirm: () => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({ onConfirm }) => {
  const { language, setLanguage } = useLanguage();
  
  // Default to current context language if supported in list, otherwise default to Telugu or Hindi
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    if (RAPIDO_LANGUAGES.some(l => l.code === language)) {
      return language;
    }
    return 'te';
  });

  const [showHelpSheet, setShowHelpSheet] = useState(false);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setSelectedLang(code);
  };

  const handleConfirm = () => {
    // 1. Save language choice to context and localStorage
    setLanguage(selectedLang);
    try {
      localStorage.setItem('sawari_language', selectedLang);
      localStorage.setItem('sawari_language_selected', 'true');
    } catch {
      // ignore storage limitations
    }

    // 2. Move to Onboarding/Login screen
    onConfirm();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-80 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/5 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Bar */}
      <header className="w-full max-w-md mx-auto pt-4 px-4 flex items-center justify-between z-10">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-zinc-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-400/25">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-zinc-100">Sawari</span>
              <span className="bg-amber-400 text-zinc-950 font-black text-[10px] px-1.5 py-0.5 rounded-md tracking-wider">
                CAPTAIN
              </span>
            </div>
            <p className="text-[10px] font-bold text-amber-400/90 flex items-center gap-1">
              Zero Commission Partner
            </p>
          </div>
        </div>

        {/* Rapido Captain "🎧 Help" Pill Button */}
        <button
          id="btn-language-help"
          onClick={() => setShowHelpSheet(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400/60 rounded-full text-xs font-bold text-zinc-100 transition-all shadow-sm active:scale-95 group"
        >
          <Headphones className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Help</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto px-4 py-4 z-10 flex-1 flex flex-col justify-center">
        {/* Title and Subtitle */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
              Select App Language
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Choose your preferred language for navigation, alerts & earnings
          </p>
        </div>

        {/* Language Options Grid with Radio Buttons */}
        <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1 py-1 scrollbar-thin">
          {RAPIDO_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;

            return (
              <div
                key={lang.code}
                id={`radio-lang-${lang.code}`}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                  isSelected
                    ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10'
                    : 'bg-zinc-900/90 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-850'
                }`}
              >
                {/* Language Labels */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                    isSelected 
                      ? 'bg-amber-400 text-zinc-950 font-black shadow-sm' 
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {lang.nativeName.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`text-base font-bold leading-tight ${isSelected ? 'text-amber-300' : 'text-zinc-100'}`}>
                      {lang.nativeName}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {lang.name} <span className="text-[10px] text-zinc-500">• {lang.region}</span>
                    </p>
                  </div>
                </div>

                {/* Rapido Style Radio Button Indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-400' 
                    : 'border-zinc-600 bg-transparent'
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Rapido-Style Confirm CTA */}
      <div className="w-full max-w-md mx-auto p-4 z-10">
        <button
          id="btn-confirm-language"
          onClick={handleConfirm}
          className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/25 active:scale-98"
        >
          <span>Confirm</span>
          <Check className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Reusable Help Bottom Sheet */}
      <HelpBottomSheet
        isOpen={showHelpSheet}
        onClose={() => setShowHelpSheet(false)}
        title="Language & Support Help"
        subtitle="Need help choosing your language or logging in?"
      />
    </div>
  );
};

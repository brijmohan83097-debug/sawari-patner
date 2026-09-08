import React from 'react';
import { PassengerAppView } from './PassengerAppView';
import { ArrowLeft, Monitor, Smartphone, Layers, Sparkles, Radio } from 'lucide-react';

interface SplitScreenCompanionProps {
  onBackToDriver: () => void;
  renderDriverApp: () => React.ReactNode;
}

export const SplitScreenCompanion: React.FC<SplitScreenCompanionProps> = ({
  onBackToDriver,
  renderDriverApp
}) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Banner Control Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between shadow-md z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDriver}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-400/20 text-amber-400 rounded-lg text-xs font-black">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-zinc-100">
                Live Dual-Device Dispatch Bridge (Passenger & Captain)
              </h2>
              <p className="text-[10px] text-zinc-400 hidden sm:block">
                Both apps synchronize via real-time Firestore database & instant broadcast events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firestore Linked</span>
          </div>

          <button
            onClick={onBackToDriver}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black shadow active:scale-95"
          >
            Exit Split Mode
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Viewport Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 bg-zinc-950 overflow-y-auto">
        
        {/* LEFT COLUMN: PASSENGER APP */}
        <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 relative">
          <div className="sticky top-0 z-20 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-black text-amber-400 flex items-center gap-1.5">
              <span>📱</span> Sawari Passenger View
            </span>
            <span className="text-[10px] text-zinc-400">Book rides & track Captain</span>
          </div>
          <div className="flex-1">
            <PassengerAppView onSwitchToCaptainApp={onBackToDriver} />
          </div>
        </div>

        {/* RIGHT COLUMN: CAPTAIN DRIVER APP */}
        <div className="flex flex-col h-full bg-zinc-950 relative">
          <div className="sticky top-0 z-20 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-black text-amber-300 flex items-center gap-1.5">
              <span>⚡</span> Sawari Partner Captain View
            </span>
            <span className="text-[10px] text-zinc-400">Receive requests & drive</span>
          </div>
          <div className="flex-1">
            {renderDriverApp()}
          </div>
        </div>

      </div>
    </div>
  );
};

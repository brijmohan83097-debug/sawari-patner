import React from 'react';
import { 
  Headphones, 
  PhoneCall, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  HelpCircle, 
  X 
} from 'lucide-react';

interface HelpBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const HelpBottomSheet: React.FC<HelpBottomSheetProps> = ({
  isOpen,
  onClose,
  title = 'Captain Help & Support',
  subtitle = '24x7 Assistance for Sawari Captains'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop dismiss */}
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      {/* Bottom Sheet Drawer */}
      <div className="relative w-full max-w-md bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
        {/* Drag Handle indicator */}
        <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-100">{title}</h3>
              <p className="text-xs text-zinc-400">{subtitle}</p>
            </div>
          </div>

          <button
            id="btn-close-help-sheet"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Helpline and WhatsApp Support Options */}
        <div className="space-y-3 mb-5">
          {/* Option 1: Direct Toll-Free Phone Helpline */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  Support Helpline
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">24x7</span>
                </h4>
                <p className="text-xs font-mono font-bold text-emerald-400">1800-890-7799</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Toll-free • Telugu, Hindi, Kannada & English</p>
              </div>
            </div>

            <a
              href="tel:18008907799"
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all flex-shrink-0"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Call</span>
            </a>
          </div>

          {/* Option 2: WhatsApp Chat Support */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  WhatsApp Support
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Fast Reply</span>
                </h4>
                <p className="text-xs font-mono font-bold text-emerald-400">+91 80 6900 7700</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Vehicle RC, KYC queries & account help</p>
              </div>
            </div>

            <a
              href="https://wa.me/918069007700?text=Hi%20Sawari%20Support%2C%20I%20am%20a%20Captain%20needing%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Chat</span>
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Quick Help & Guidelines
          </h4>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-1">
            <p className="font-bold text-zinc-200">How to upload Vehicle RC?</p>
            <p className="text-zinc-400 text-[11px]">
              Ensure all four corners of your RC book/smart card are clearly visible without flash glare or blur. Front side must show registration number and chassis number.
            </p>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-1">
            <p className="font-bold text-zinc-200">What if my Road Tax is paid separately?</p>
            <p className="text-zinc-400 text-[11px]">
              Toggle to the "Road Tax" option on the vehicle details screen to upload your commercial road tax receipt copy.
            </p>
          </div>
        </div>

        {/* Emergency Police Helpline Notice */}
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center text-xs text-rose-300">
          🚨 <strong className="font-bold">On-duty Emergency?</strong> Dial <span className="font-black text-white">112</span> for National Police Assistance or <span className="font-black text-white">108</span> for Ambulance.
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

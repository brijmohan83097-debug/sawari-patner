import React, { useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  X, 
  Download, 
  Share2, 
  QrCode, 
  Bike, 
  Car, 
  Award, 
  Sparkles,
  Phone,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { DriverProfile } from '../types';
import { INITIAL_DRIVER } from '../data/mockData';

interface DriverIdCardModalProps {
  driver?: DriverProfile | null;
  onClose: () => void;
}

export const DriverIdCardModal: React.FC<DriverIdCardModalProps> = ({
  driver: rawDriver,
  onClose
}) => {
  const driver = rawDriver || INITIAL_DRIVER;
  const isApproved = driver.kycStatus === 'approved';
  const isPending = driver.kycStatus === 'pending';
  const isRejected = driver.kycStatus === 'rejected';

  const handleDownload = () => {
    alert(`Downloading Sawari Captain ID Card for ${driver.name} (${driver.badgeId})`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Sawari Partner ID - ${driver.name}`,
        text: `Sawari Verified Captain ID: ${driver.badgeId} (${driver.vehicleNumber})`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Sawari Partner ID: ${driver.badgeId} | Captain: ${driver.name} | ${driver.vehicleNumber}`);
      alert('Driver ID details copied to clipboard!');
    }
  };

  return (
    <div id="driver-id-card-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wide">Official Captain ID Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital ID Card Canvas */}
        <div className="p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 border-2 border-amber-400/80 shadow-2xl p-5 text-zinc-100">
            
            {/* Holographic Top Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center text-zinc-950 font-black text-xs shadow-md">
                  S
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wider text-amber-400">SAWARI PARTNER</h4>
                  <p className="text-[9px] text-zinc-400 uppercase font-mono">5% Lowest Commission</p>
                </div>
              </div>

              {/* ID Badge Tag */}
              <div className="text-right">
                <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/50 rounded-md text-[10px] font-black text-amber-300 font-mono">
                  {driver.badgeId || driver.id}
                </span>
              </div>
            </div>

            {/* Photo & Main Details */}
            <div className="flex items-center gap-4 my-4">
              <div className="relative flex-shrink-0">
                <img
                  src={driver.avatar}
                  alt={driver.name}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
                <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-zinc-950 border border-amber-400">
                  {isApproved ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  ) : isPending ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-zinc-100 truncate">{driver.name}</h3>
                <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <span>★ {driver.rating}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300 capitalize">{driver.vehicleType} Captain</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{driver.phone}</p>
                <p className="text-[10px] text-zinc-500 truncate">{driver.email}</p>
              </div>
            </div>

            {/* Vehicle & Blood Group Info Grid */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Vehicle Reg</span>
                <span className="font-mono font-black text-amber-300 text-xs">{driver.vehicleNumber}</span>
                <span className="text-[10px] text-zinc-400 block truncate">{driver.vehicleModel}</span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Blood Group & City</span>
                <span className="font-semibold text-zinc-200 text-xs">{driver.bloodGroup || 'O+ Positive'}</span>
                <span className="text-[10px] text-zinc-400 block">{driver.city || 'Bengaluru'}</span>
              </div>
            </div>

            {/* Verification Status & QR Code Stamp */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Verification Status</span>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED CAPTAIN
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> KYC UNDER REVIEW
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" /> REJECTED / RESUBMIT
                  </span>
                )}
                <span className="text-[9px] text-zinc-500 block">Joined: {driver.joinedDate}</span>
              </div>

              {/* QR Code Graphic Mock */}
              <div className="p-1.5 bg-white rounded-xl flex items-center justify-center shadow-inner">
                <QrCode className="w-10 h-10 text-zinc-950" />
              </div>
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="py-3 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share ID</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-3 px-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Card</span>
          </button>
        </div>

      </div>
    </div>
  );
};

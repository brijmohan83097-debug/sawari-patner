import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  Star, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Receipt,
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RideRequest } from '../types';
import { soundManager } from '../utils/audio';

interface TripSummaryModalProps {
  ride: RideRequest;
  onFinishAndReady: () => void;
}

export const TripSummaryModal: React.FC<TripSummaryModalProps> = ({
  ride,
  onFinishAndReady
}) => {
  const [cashCollected, setCashCollected] = useState(ride.paymentMode !== 'CASH');
  const [rating, setRating] = useState(5);
  const [feedbackTags, setFeedbackTags] = useState<string[]>(['Polite Rider', 'On-time at pickup']);

  const availableTags = ['Polite Rider', 'On-time at pickup', 'Accurate Location', 'Great Tip', 'Pleasant Ride'];

  useEffect(() => {
    // Sound & Confetti celebration
    soundManager.playCashEarned();
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}
  }, []);

  const toggleTag = (tag: string) => {
    if (feedbackTags.includes(tag)) {
      setFeedbackTags(feedbackTags.filter(t => t !== tag));
    } else {
      setFeedbackTags([...feedbackTags, tag]);
    }
  };

  return (
    <div id="trip-summary-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-b from-amber-500/20 via-zinc-900 to-zinc-900 p-5 text-center border-b border-zinc-800">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-2 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ride Completed Successfully</p>
          <h2 className="text-3xl font-black text-amber-400 mt-1">
            +₹{ride.captainEarning}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Net Captain Take-Home Added to Wallet</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Cash Collection Banner if payment mode is Cash */}
          {ride.paymentMode === 'CASH' ? (
            <div className="p-4 bg-amber-500/15 border-2 border-amber-400 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-sm text-zinc-100 uppercase">Collect Cash from Rider</span>
                </div>
                <span className="text-xl font-black text-amber-400 font-mono">₹{ride.fareTotal}</span>
              </div>
              <p className="text-[11px] text-zinc-300 mb-3">
                Please collect exact cash from {ride.customerName} before departure. 100% of this fare belongs to you (Zero Commission model).
              </p>
              
              <button
                id="btn-confirm-cash-collected"
                onClick={() => setCashCollected(!cashCollected)}
                className={`w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  cashCollected 
                    ? 'bg-emerald-500 text-zinc-950 shadow-md' 
                    : 'bg-zinc-800 text-amber-400 border border-amber-400/50 hover:bg-zinc-750'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{cashCollected ? 'Cash Collected & Verified ✓' : 'Tap to Confirm Cash Received'}</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-zinc-200">Paid Online via UPI</p>
                  <p className="text-[11px] text-zinc-400">Auto-settled to your Sawari Wallet</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400 px-2.5 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/40">
                PAID ✓
              </span>
            </div>
          )}

          {/* Detailed Fare Breakdown */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3" /> Fare Breakdown
              </span>
              <span>Ride #{ride.id}</span>
            </div>

            <div className="flex justify-between text-zinc-300">
              <span>Base Fare & Distance ({ride.distanceKm} km)</span>
              <span className="font-medium">₹{Math.round(ride.fareTotal / (ride.surgeBonus > 0 ? 1.4 : 1))}</span>
            </div>

            {ride.surgeBonus > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Peak Surge Incentive Bonus</span>
                <span className="font-bold">+₹{ride.surgeBonus}</span>
              </div>
            )}

            {ride.tips > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Customer Tip</span>
                <span className="font-bold">+₹{ride.tips}</span>
              </div>
            )}

            <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-800">
              <span>Customer Gross Bill</span>
              <span className="font-semibold text-zinc-200">₹{ride.fareTotal}</span>
            </div>

            <div className="flex justify-between text-zinc-400 items-center">
              <span className="flex items-center gap-1">
                <span>Sawari Platform Fee (0% Comm)</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-bold">Zero Commission</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold">₹0</span>
            </div>

            <div className="flex justify-between text-amber-400 font-extrabold text-sm pt-2 border-t border-zinc-700">
              <span>Your Final Take-Home (100% + Tips)</span>
              <span className="font-mono text-base text-emerald-400">₹{ride.captainEarning}</span>
            </div>
          </div>

          {/* Rate Rider Section */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-center">
            <p className="text-xs font-bold text-zinc-300 mb-2">Rate your experience with {ride.customerName}</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-125"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                </button>
              ))}
            </div>

            {/* Quick Feedback Chips */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                    feedbackTags.includes(tag)
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
          <button
            id="btn-ready-for-next-ride"
            onClick={onFinishAndReady}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-base rounded-2xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 active:scale-98"
          >
            <span>READY FOR NEXT RIDE</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};

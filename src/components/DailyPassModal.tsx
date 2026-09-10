import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Wallet, 
  AlertCircle, 
  X, 
  Bike, 
  Car, 
  ArrowRight,
  Check
} from 'lucide-react';
import { DailyPass, VehicleType, DAILY_PASS_PRICES, DriverProfile } from '../types';
import { INITIAL_DRIVER } from '../data/mockData';
import { soundManager } from '../utils/audio';

export interface DailyPassModalProps {
  isOpen?: boolean;
  driver?: DriverProfile;
  walletBalance?: number;
  selectedVehicle?: VehicleType;
  vehicleType?: VehicleType;
  driverUpi?: string;
  onOpenAddMoney?: () => void;
  onPurchasePass?: (pass: DailyPass, paymentMethod: 'UPI' | 'WALLET') => void;
  onPurchase?: (pass: DailyPass, paymentMethod: 'upi' | 'wallet') => void;
  onClose: () => void;
}

export const DailyPassModal: React.FC<DailyPassModalProps> = ({
  isOpen = true,
  driver = INITIAL_DRIVER,
  walletBalance = 0,
  selectedVehicle: initialVehicle,
  vehicleType,
  driverUpi,
  onOpenAddMoney,
  onPurchasePass,
  onPurchase,
  onClose
}) => {
  if (isOpen === false) return null;

  const effectiveDriver = driver || INITIAL_DRIVER;
  const preferredVehicle = vehicleType || initialVehicle || effectiveDriver?.vehicleType || 'bike';
  const [vehicle, setVehicle] = useState<VehicleType>(preferredVehicle);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'WALLET'>(
    walletBalance >= (DAILY_PASS_PRICES[preferredVehicle]?.price || 15) ? 'WALLET' : 'UPI'
  );
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const currentPassInfo = DAILY_PASS_PRICES[vehicle] || DAILY_PASS_PRICES['bike'];
  const passPrice = currentPassInfo.price;
  const isWalletSufficient = walletBalance >= passPrice;

  const handleActivatePass = () => {
    if (paymentMethod === 'WALLET' && !isWalletSufficient) {
      setError(`Insufficient wallet balance (₹${walletBalance}). Please use UPI or recharge wallet.`);
      return;
    }

    setError('');
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      soundManager.playCashEarned();

      const newPass: DailyPass = {
        id: `PASS-${Math.floor(100000 + Math.random() * 900000)}`,
        driverId: effectiveDriver?.id || 'DRV-1',
        driverName: effectiveDriver?.name || 'Captain',
        vehicleType: vehicle,
        price: passPrice,
        purchasedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 Hours valid
        paymentMethod,
        status: 'active',
        hoursTotal: 24
      };

      if (onPurchasePass) {
        onPurchasePass(newPass, paymentMethod);
      } else if (onPurchase) {
        onPurchase(newPass, paymentMethod.toLowerCase() as 'upi' | 'wallet');
      }
      onClose();
    }, 900);
  };

  return (
    <div id="daily-pass-modal-overlay" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border-2 border-amber-400 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.25)] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400 text-zinc-950 rounded-md font-black text-[11px] uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>0% Commission Model</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Buy Daily Active Pass
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Activate your 24-Hour Unlimited Rides pass to switch <span className="text-amber-400 font-bold">ONLINE</span>.
            </p>
          </div>

          <button 
            id="btn-close-daily-pass-modal"
            onClick={onClose} 
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-400 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle Plan Cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Select Vehicle Pass Plan (24-Hour Unlimited Rides)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(DAILY_PASS_PRICES) as VehicleType[]).map((vType) => {
                const info = DAILY_PASS_PRICES[vType];
                const isSelected = vehicle === vType;
                return (
                  <button
                    key={vType}
                    onClick={() => {
                      setVehicle(vType);
                      if (walletBalance < info.price) {
                        setPaymentMethod('UPI');
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all relative ${
                      isSelected 
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]' 
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-zinc-950 stroke-[3]" />
                      </span>
                    )}

                    <div className="p-2 rounded-xl bg-zinc-900 mb-2">
                      {vType === 'bike' && <Bike className="w-6 h-6 text-amber-400" />}
                      {vType === 'auto' && <span className="text-2xl leading-none">🛺</span>}
                      {vType === 'cab' && <Car className="w-6 h-6 text-amber-400" />}
                    </div>

                    <span className="font-bold text-xs capitalize text-zinc-300 mb-1">
                      {info.name}
                    </span>

                    <div className="text-lg font-black text-zinc-100 font-mono">
                      ₹{info.price}
                    </div>
                    <span className="text-[10px] text-zinc-400">/ 24 Hours</span>

                    <div className="mt-2 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      0% Commission
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Proposition Box */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Why Buy Sawari Daily Pass?</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Unlimited rides for 24 continuous hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Keep 100% of customer fare & tips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Zero commission deducted per trip</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Instant UPI withdrawal anytime</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Select Payment Method
            </label>

            <div className="space-y-2">
              {/* Option 1: Instant UPI */}
              <label 
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'UPI' 
                    ? 'bg-amber-400/10 border-amber-400 shadow-md' 
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-amber-400">
                    {paymentMethod === 'UPI' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-100">Instant UPI Payment</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Fastest
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Pay via Google Pay, PhonePe, Paytm, BHIM UPI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-amber-400">₹{passPrice}</span>
                </div>
              </label>

              {/* Option 2: Wallet Balance */}
              <label 
                onClick={() => {
                  if (isWalletSufficient) {
                    setPaymentMethod('WALLET');
                  }
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  !isWalletSufficient 
                    ? 'opacity-60 bg-zinc-950/50 border-zinc-800/60 cursor-not-allowed' 
                    : paymentMethod === 'WALLET'
                      ? 'bg-amber-400/10 border-amber-400 shadow-md cursor-pointer' 
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isWalletSufficient ? 'border-amber-400' : 'border-zinc-700'
                  }`}>
                    {paymentMethod === 'WALLET' && isWalletSufficient && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-100">Deduct from Captain Wallet</span>
                      <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Available Balance: <strong className="text-zinc-200 font-mono">₹{walletBalance.toFixed(2)}</strong></span>
                      {!isWalletSufficient && <span className="text-rose-400 font-bold">(Insufficient)</span>}
                      {onOpenAddMoney && (
                        <button
                          type="button"
                          id="btn-pass-recharge-wallet"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onOpenAddMoney();
                          }}
                          className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-[10px] font-black transition-colors"
                        >
                          + Add Money
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-zinc-300">₹{passPrice}</span>
              </label>
            </div>
          </div>

          {/* UPI App Selection if UPI is selected */}
          {paymentMethod === 'UPI' && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-zinc-400 block">Select Installed UPI App:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp('gpay')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedUpiApp === 'gpay' 
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>Google Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp('phonepe')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedUpiApp === 'phonepe' 
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>PhonePe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUpiApp('paytm')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedUpiApp === 'paytm' 
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>Paytm UPI</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Action Button Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">Total Amount</span>
            <span className="text-xl font-black text-amber-400 font-mono leading-tight">₹{passPrice}</span>
          </div>

          <button
            id="btn-confirm-activate-pass"
            onClick={handleActivatePass}
            disabled={isProcessing}
            className="flex-1 py-3.5 px-5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Activating 24-Hour Pass...</span>
              </div>
            ) : (
              <>
                <span>PAY ₹{passPrice} & GO ONLINE NOW</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

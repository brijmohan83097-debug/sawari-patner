import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';

interface AddMoneyModalProps {
  isOpen: boolean;
  currentBalance: number;
  driverUpiId?: string;
  initialAmount?: number;
  onAddMoney: (amount: number, paymentMethod: string) => Promise<void> | void;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  currentBalance,
  driverUpiId = 'captain@upi',
  initialAmount,
  onAddMoney,
  onClose
}) => {
  const [amount, setAmount] = useState<string>(initialAmount ? initialAmount.toString() : '200');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState(driverUpiId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount);

  const handleSelectPreset = (preset: number) => {
    setAmount(preset.toString());
    setError(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    setError(null);
  };

  const handleProceed = async () => {
    if (isNaN(numAmount) || numAmount < 10) {
      setError('Please enter a minimum amount of ₹10');
      return;
    }
    if (numAmount > 50000) {
      setError('Maximum wallet recharge limit is ₹50,000 per transaction');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Simulate swift UPI authorization and approval
      await new Promise(res => setTimeout(res, 850));

      const paymentMethodName = 
        selectedUpiApp === 'gpay' ? 'Google Pay' :
        selectedUpiApp === 'phonepe' ? 'PhonePe' :
        selectedUpiApp === 'paytm' ? 'Paytm' :
        selectedUpiApp === 'bhim' ? 'BHIM UPI' :
        `UPI (${customUpiId})`;

      await onAddMoney(numAmount, paymentMethodName);
      
      setIsProcessing(false);
      setIsSuccess(true);
      soundManager.playCashEarned();

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      // Auto close after 1.8s or user clicks Done
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1900);
    } catch (err) {
      setIsProcessing(false);
      setError('Payment authorization failed. Please try again.');
    }
  };

  return (
    <div 
      id="add-money-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200"
    >
      <div 
        id="add-money-modal-card" 
        className="w-full max-w-md bg-zinc-900 border-2 border-amber-400/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-100 flex items-center gap-1.5">
                <span>Add Money to Wallet</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400">Instant UPI Top-up • 0% Platform Fee</p>
            </div>
          </div>

          <button
            id="btn-close-add-money-modal"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        {!isSuccess ? (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Current Balance Banner */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Current Wallet Balance:</span>
              <span className="text-sm font-black text-amber-400 font-mono">
                ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label htmlFor="recharge-amount-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Enter Amount to Add (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-amber-400">
                  ₹
                </span>
                <input
                  id="recharge-amount-input"
                  type="number"
                  min="10"
                  max="50000"
                  step="10"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="e.g. 500"
                  autoFocus
                  className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-amber-400 rounded-2xl pl-10 pr-4 py-3.5 text-2xl font-black text-zinc-100 font-mono tracking-tight focus:outline-none transition-colors"
                />
              </div>
              {error && (
                <p className="text-xs text-rose-400 mt-1 font-semibold">{error}</p>
              )}
            </div>

            {/* Preset Amount Chips */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Quick Select Amount
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_AMOUNTS.map((preset) => {
                  const isSelected = numAmount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      id={`btn-preset-amount-${preset}`}
                      onClick={() => handleSelectPreset(preset)}
                      className={`py-2 px-1 rounded-xl text-xs font-extrabold font-mono transition-all border ${
                        isSelected
                          ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md shadow-amber-400/20 scale-[1.02]'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                      }`}
                    >
                      +₹{preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI Payment Source Selection */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Select UPI Payment Mode
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-upi-gpay"
                  onClick={() => setSelectedUpiApp('gpay')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedUpiApp === 'gpay'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm">🔵</span>
                  <span>Google Pay</span>
                </button>

                <button
                  type="button"
                  id="btn-upi-phonepe"
                  onClick={() => setSelectedUpiApp('phonepe')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedUpiApp === 'phonepe'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm">🟣</span>
                  <span>PhonePe</span>
                </button>

                <button
                  type="button"
                  id="btn-upi-paytm"
                  onClick={() => setSelectedUpiApp('paytm')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedUpiApp === 'paytm'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm">🔷</span>
                  <span>Paytm</span>
                </button>
              </div>

              {/* Custom UPI ID / BHIM */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-upi-bhim"
                  onClick={() => setSelectedUpiApp('bhim')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedUpiApp === 'bhim'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>🇮🇳 BHIM UPI</span>
                </button>

                <button
                  type="button"
                  id="btn-upi-custom"
                  onClick={() => setSelectedUpiApp('custom')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedUpiApp === 'custom'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Enter UPI ID</span>
                </button>
              </div>

              {selectedUpiApp === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    id="input-custom-upi"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Zero Fee Assurance Banner */}
            <div className="p-3 bg-amber-400/10 border border-amber-400/25 rounded-2xl flex items-center gap-2 text-xs text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Instant Credit • Zero convenience fee • Use for Daily Pass or Withdraw</span>
            </div>

            {/* Proceed Button */}
            <button
              id="btn-confirm-add-money"
              type="button"
              onClick={handleProceed}
              disabled={isProcessing || !numAmount || numAmount < 10}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                isProcessing || !numAmount || numAmount < 10
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-400/25'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to UPI Gateway...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ADD ₹{numAmount || 0} TO WALLET</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-xl font-black text-zinc-100">Wallet Recharge Successful!</h4>
              <p className="text-sm text-emerald-400 font-bold mt-1">
                ₹{numAmount.toFixed(2)} added to your Sawari Wallet
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                New Balance: <span className="text-zinc-100 font-mono font-bold">₹{(currentBalance + numAmount).toFixed(2)}</span>
              </p>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono">
              Txn Ref: UPI-REC-{Math.floor(10000000 + Math.random() * 90000000)}
            </p>

            <button
              id="btn-recharge-success-done"
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-2xl text-xs transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

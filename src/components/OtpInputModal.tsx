import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, Check, X, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface OtpInputModalProps {
  correctOtp: string;
  customerName: string;
  onVerifySuccess: () => void;
  onClose: () => void;
}

export const OtpInputModal: React.FC<OtpInputModalProps> = ({
  correctOtp,
  customerName,
  onVerifySuccess,
  onClose
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null)
  ];

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(null);

    // Auto advance
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto submit if all 4 entered
    const combined = newDigits.join('');
    if (combined.length === 4) {
      validateOtp(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const validateOtp = (entered: string) => {
    if (entered === correctOtp) {
      soundManager.playOtpSuccess();
      onVerifySuccess();
    } else {
      setError('Incorrect Start OTP. Please ask rider for 4-digit code shown on their app.');
      // Auto clear after brief shake
      setTimeout(() => {
        setDigits(['', '', '', '']);
        inputRefs[0].current?.focus();
      }, 800);
    }
  };

  const handleQuickFill = () => {
    setDigits(correctOtp.split(''));
    setTimeout(() => {
      soundManager.playOtpSuccess();
      onVerifySuccess();
    }, 200);
  };

  return (
    <div id="otp-input-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border-2 border-amber-400/80 rounded-3xl p-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-extrabold text-zinc-100">Enter Start OTP</h3>
          </div>
          <button
            id="btn-close-otp"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 text-center">
          <p className="text-xs text-zinc-300 mb-1">
            Ask <span className="font-bold text-amber-400">{customerName}</span> for the 4-digit ride OTP
          </p>
          <p className="text-[11px] text-zinc-400 mb-5">
            This verifies the customer and ensures captain safety insurance.
          </p>

          {/* 4 Digit Inputs */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="tel"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-13 h-14 text-center text-2xl font-black rounded-2xl bg-zinc-950 border-2 font-mono transition-all focus:outline-none ${
                  error 
                    ? 'border-rose-500 text-rose-400 animate-shake' 
                    : digit 
                      ? 'border-amber-400 text-amber-400 bg-amber-400/10' 
                      : 'border-zinc-700 text-zinc-100 focus:border-amber-400'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-400 mb-3 animate-pulse">{error}</p>
          )}

          {/* Captain Demo Helper button */}
          <div className="mt-2 p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-400">Rider's OTP: <span className="font-mono font-bold text-amber-400">{correctOtp}</span></span>
            <button
              id="btn-auto-fill-otp"
              onClick={handleQuickFill}
              className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold rounded-lg transition-colors active:scale-95"
            >
              Auto-Fill & Start
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="btn-verify-otp-submit"
          onClick={() => validateOtp(digits.join(''))}
          disabled={digits.join('').length !== 4}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
            digits.join('').length === 4
              ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-400/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>START RIDE NOW</span>
        </button>
      </div>
    </div>
  );
};

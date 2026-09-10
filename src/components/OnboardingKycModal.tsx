import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Car, 
  Bike, 
  Phone, 
  X, 
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DriverProfile, VehicleType, KycDoc } from '../types';
import { INITIAL_DRIVER } from '../data/mockData';
import { soundManager } from '../utils/audio';

interface OnboardingKycModalProps {
  driver?: DriverProfile;
  onUpdateDriver: (updated: Partial<DriverProfile>) => void;
  onClose: () => void;
}

export const OnboardingKycModal: React.FC<OnboardingKycModalProps> = ({
  driver = INITIAL_DRIVER,
  onUpdateDriver,
  onClose
}) => {
  const effectiveDriver = driver || INITIAL_DRIVER;
  const [step, setStep] = useState<'status' | 'phone_otp' | 'vehicle_edit'>('status');
  const [phoneInput, setPhoneInput] = useState((effectiveDriver?.phone || '').replace('+91 ', ''));
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>(effectiveDriver?.vehicleType || 'bike');
  const [vehicleReg, setVehicleReg] = useState(effectiveDriver?.vehicleNumber || '');
  const [vehicleModel, setVehicleModel] = useState(effectiveDriver?.vehicleModel || '');
  const [kycDocs, setKycDocs] = useState<KycDoc[]>(effectiveDriver?.kycDocs || []);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const handleSimulateDocUpload = (docId: string) => {
    setUploadingDocId(docId);
    setTimeout(() => {
      setKycDocs(prev => prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: 'verified',
            verifiedOn: 'Verified Just Now'
          };
        }
        return doc;
      }));
      setUploadingDocId(null);
      soundManager.playOtpSuccess();
    }, 1000);
  };

  const handleSaveVehicle = () => {
    onUpdateDriver({
      vehicleType: selectedVehicleType,
      vehicleModel,
      vehicleNumber: vehicleReg
    });
    setStep('status');
  };

  const handlePhoneVerify = () => {
    if (!otpSent) {
      setOtpSent(true);
    } else {
      onUpdateDriver({
        phone: `+91 ${phoneInput}`,
        isKycVerified: true
      });
      soundManager.playOtpSuccess();
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {}
      setStep('status');
    }
  };

  const allDocsVerified = kycDocs.every(d => d.status === 'verified');

  return (
    <div id="onboarding-kyc-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-100">Driver Partner Verification</h3>
              <p className="text-[11px] text-zinc-400">KYC & Vehicle Onboarding Portal</p>
            </div>
          </div>

          <button
            id="btn-close-kyc-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* VIEW: MAIN KYC STATUS CHECKLIST */}
          {step === 'status' && (
            <>
              {/* Overall Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                allDocsVerified 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    allDocsVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {allDocsVerified ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-100">
                      {allDocsVerified ? 'Captain Account Active & Verified' : 'Action Required: Pending Verification'}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {allDocsVerified ? 'You are eligible to take Bike, Auto & Cab rides.' : 'Upload required documents to start driving.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Registration Card */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{driver.vehicleType === 'bike' ? '🛵' : driver.vehicleType === 'auto' ? '🛺' : '🚗'}</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 uppercase">Registered Vehicle</h4>
                      <p className="text-xs font-extrabold text-amber-400">{driver.vehicleNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('vehicle_edit')}
                    className="text-xs text-amber-400 font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-2">{driver.vehicleModel}</p>
              </div>

              {/* Document List Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Identity & Vehicle Documents</h4>
                
                {kycDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        doc.status === 'verified' 
                          ? 'bg-emerald-500/15 text-emerald-400' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-zinc-100">{doc.title}</h5>
                        <p className="text-[11px] text-zinc-400 font-mono">{doc.docNumber}</p>
                        {doc.verifiedOn && (
                          <span className="text-[10px] text-emerald-400">● {doc.verifiedOn}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {doc.status === 'verified' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[10px] font-black text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulateDocUpload(doc.id)}
                          disabled={uploadingDocId === doc.id}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          {uploadingDocId === doc.id ? (
                            <span>Verifying...</span>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Login OTP Screen Shortcut */}
              <div className="pt-2">
                <button
                  onClick={() => setStep('phone_otp')}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Login Phone & OTP</span>
                </button>
              </div>
            </>
          )}

          {/* VIEW: PHONE NUMBER OTP LOGIN */}
          {step === 'phone_otp' && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-100">Captain Phone Verification</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {otpSent ? `Enter the 4-digit code sent to +91 ${phoneInput}` : 'Enter your 10-digit mobile number for OTP login'}
                </p>
              </div>

              {!otpSent ? (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Mobile Number</label>
                  <div className="flex gap-2 mt-1">
                    <span className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">4-Digit Verification OTP</label>
                    <input
                      type="tel"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1 2 3 4"
                      className="w-full mt-1 text-center bg-zinc-950 border border-amber-400 rounded-xl py-3 text-2xl font-black text-amber-400 font-mono tracking-widest focus:outline-none"
                    />
                  </div>
                  <p className="text-center text-xs text-zinc-500">
                    Demo OTP code: <span className="font-mono text-amber-400 font-bold">1234</span>
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('status')}
                  className="w-1/3 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhoneVerify}
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20"
                >
                  <span>{otpSent ? 'VERIFY & SIGN IN' : 'SEND OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW: VEHICLE SELECTION & REGISTRATION */}
          {step === 'vehicle_edit' && (
            <div className="space-y-4 py-2">
              <h4 className="text-sm font-extrabold text-zinc-100">Vehicle Category & Details</h4>
              
              {/* Category selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedVehicleType('bike')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    selectedVehicleType === 'bike' 
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Bike className="w-6 h-6" />
                  <span>Bike Taxi</span>
                </button>

                <button
                  onClick={() => setSelectedVehicleType('auto')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    selectedVehicleType === 'auto' 
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xl">🛺</span>
                  <span>Auto</span>
                </button>

                <button
                  onClick={() => setSelectedVehicleType('cab')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                    selectedVehicleType === 'cab' 
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Car className="w-6 h-6" />
                  <span>Cab</span>
                </button>
              </div>

              {/* Number and Model inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Registration Number (Number Plate)</label>
                  <input
                    type="text"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                    placeholder="KA 05 EQ 4821"
                    className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono text-amber-400 font-bold uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase">Make & Model</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Hero Splendor Plus / Bajaj RE Auto"
                    className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('status')}
                  className="w-1/3 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVehicle}
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20"
                >
                  Save Vehicle Details
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

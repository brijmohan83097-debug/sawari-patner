import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Headphones, 
  Camera, 
  Upload, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Fuel, 
  Bike, 
  FileText, 
  Trash2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { DriverProfile, VehicleType, KycDoc } from '../types';
import { captainStorageService } from '../services/captainStorageService';
import { soundManager } from '../utils/audio';
import { HelpBottomSheet } from './HelpBottomSheet';

interface VehicleDetailsScreenProps {
  onBack: () => void;
  onSubmitSuccess: (driver: DriverProfile) => void;
}

export type DocumentTypeChoice = 'rc' | 'road_tax';
export type FuelTypeChoice = 'Petrol/Diesel' | 'Petrol' | 'CNG' | 'Electric';

// Sample mock RC photos for rapid instant testing in preview
const DEMO_RC_FRONT = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80';
const DEMO_RC_BACK = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80';

export const VehicleDetailsScreen: React.FC<VehicleDetailsScreenProps> = ({
  onBack,
  onSubmitSuccess
}) => {
  // 1. Document Type Pill Toggle
  const [docType, setDocType] = useState<DocumentTypeChoice>('rc');

  // 2. Vehicle Category (Bike / Auto / Cab)
  const [vehicleCategory, setVehicleCategory] = useState<VehicleType>('bike');

  // 3. Fuel Type Selection
  const [fuelType, setFuelType] = useState<FuelTypeChoice>('Petrol');

  // 4. RC Photos
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [backPhoto, setBackPhoto] = useState<string>('');

  // 5. RC Number
  const [rcNumber, setRcNumber] = useState<string>('');

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  // Hidden file input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Handle RC Number input with uppercase and standard formatting
  const handleRcNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    setRcNumber(raw);
    if (errorMsg) setErrorMsg('');
  };

  // Convert uploaded image file to data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 8MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 'front') {
        setFrontPhoto(dataUrl);
      } else {
        setBackPhoto(dataUrl);
      }
      setErrorMsg('');
      soundManager.playButtonClick();
    };
    reader.readAsDataURL(file);
  };

  // Auto-fill sample documents for quick evaluation
  const handleQuickDemoFill = () => {
    setRcNumber('TS 08 EZ 1234');
    setFrontPhoto(DEMO_RC_FRONT);
    setBackPhoto(DEMO_RC_BACK);
    setFuelType('Petrol');
    setErrorMsg('');
    soundManager.playOtpSuccess();
  };

  // Form validity check
  const cleanedRc = rcNumber.trim().replace(/\s+/g, '');
  const isFormValid = cleanedRc.length >= 8 && !!frontPhoto && !!backPhoto && !!fuelType;

  // Handle submission
  const handleSubmit = async () => {
    if (!isFormValid) {
      setErrorMsg('Please complete all required fields and upload front & back RC photos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Build KYC docs array
      const now = Date.now();
      const kycDocs: KycDoc[] = [
        {
          id: 'rc-front',
          title: `${docType === 'rc' ? 'Vehicle RC' : 'Road Tax'} (Front)`,
          docNumber: rcNumber.trim(),
          status: 'pending',
          fileUrl: frontPhoto,
          frontImage: frontPhoto,
          uploadedAt: now
        },
        {
          id: 'rc-back',
          title: `${docType === 'rc' ? 'Vehicle RC' : 'Road Tax'} (Back)`,
          docNumber: rcNumber.trim(),
          status: 'pending',
          fileUrl: backPhoto,
          backImage: backPhoto,
          uploadedAt: now
        }
      ];

      // Auto-generate realistic Captain profile
      const newCaptainId = `DRV-${cleanedRc.slice(-4)}`;
      const newCaptain: DriverProfile = {
        id: newCaptainId,
        badgeId: `SW-${cleanedRc.slice(-4)}`,
        name: `Captain ${cleanedRc.slice(0, 4)}`,
        email: `captain.${cleanedRc.toLowerCase()}@sawari.in`,
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        vehicleType: vehicleCategory,
        vehicleModel: `${fuelType} Commercial`,
        vehicleNumber: rcNumber.trim(),
        city: 'Hyderabad',
        rating: 5.0,
        totalTrips: 0,
        acceptanceRate: 100,
        cancellationRate: 0,
        isKycVerified: false,
        kycStatus: 'pending',
        joinedDate: 'Today',
        kycDocs,
        walletBalance: 0,
        upiId: `captain.${cleanedRc.toLowerCase()}@okhdfcbank`,
        bankAccount: {
          accountNumber: '987654321012',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank'
        }
      };

      // Persist in storage service
      await captainStorageService.saveCaptainProfile(newCaptain);
      soundManager.playOtpSuccess();
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      setErrorMsg('Failed to submit vehicle details. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Hidden file inputs */}
      <input
        ref={frontInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'front')}
      />
      <input
        ref={backInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'back')}
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-850 z-20 w-full">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          {/* Back Arrow & Title */}
          <div className="flex items-center gap-3">
            <button
              id="btn-vehicle-back"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-zinc-100 tracking-tight">
                Vehicle Details
              </h1>
              <p className="text-[11px] text-zinc-400">
                Step 1 • RC & Fuel Verification
              </p>
            </div>
          </div>

          {/* Rapido Captain "🎧 Help" Pill Button */}
          <button
            id="btn-vehicle-help"
            onClick={() => setShowHelpSheet(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400/60 rounded-full text-xs font-bold text-zinc-100 transition-all shadow-sm active:scale-95 group"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Help</span>
          </button>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="w-full max-w-md mx-auto px-4 py-4 z-10 flex-1 space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Demo Pre-fill helper */}
        <div className="p-2.5 bg-amber-400/10 border border-amber-400/25 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300">Fast Evaluator Mode</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-[11px] rounded-lg transition-all active:scale-95"
          >
            Auto-fill Sample RC
          </button>
        </div>

        {/* SECTION 1: Document Type Toggle Pills */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-4 space-y-2.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Document Type
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="pill-doc-rc"
              onClick={() => setDocType('rc')}
              className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 ${
                docType === 'rc'
                  ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Vehicle RC</span>
              {docType === 'rc' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <button
              type="button"
              id="pill-doc-road-tax"
              onClick={() => setDocType('road_tax')}
              className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 ${
                docType === 'road_tax'
                  ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Road Tax</span>
              {docType === 'road_tax' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>
        </div>

        {/* SECTION 2: Fuel Type Dropdown */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-4 space-y-2.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Fuel Type
          </label>

          <div className="relative">
            <select
              id="select-fuel-type"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelTypeChoice)}
              className="w-full appearance-none bg-zinc-950 border border-zinc-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="Petrol/Diesel">Petrol / Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric (EV)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <p className="text-[11px] text-zinc-400">
            Electric & CNG vehicles qualify for special green zero-emission perks
          </p>
        </div>

        {/* SECTION 3: RC Photo Upload Boxes (Front & Back) */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              RC Document Photos
            </label>
            <span className="text-[11px] text-amber-400 font-medium">Both sides required</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Front Side Upload Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-300 block">
                Front side of your RC
              </span>

              {frontPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border border-amber-400/60 bg-zinc-950 h-32 flex items-center justify-center group shadow-md">
                  <img
                    src={frontPhoto}
                    alt="RC Front"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => frontInputRef.current?.click()}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg text-xs font-bold"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrontPhoto('')}
                      className="p-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-zinc-950 p-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-upload-rc-front"
                  onClick={() => frontInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-zinc-700 hover:border-amber-400 rounded-2xl bg-zinc-950/70 hover:bg-zinc-950 flex flex-col items-center justify-center p-3 text-center transition-all group active:scale-98"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 group-hover:bg-amber-400/20 text-zinc-400 group-hover:text-amber-400 flex items-center justify-center mb-1.5 transition-colors">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-200 group-hover:text-amber-300">
                    Upload Front
                  </span>
                  <span className="text-[9px] text-zinc-500">Tap to capture / upload</span>
                </button>
              )}
            </div>

            {/* Back Side Upload Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-300 block">
                Back side of your RC
              </span>

              {backPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border border-amber-400/60 bg-zinc-950 h-32 flex items-center justify-center group shadow-md">
                  <img
                    src={backPhoto}
                    alt="RC Back"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg text-xs font-bold"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackPhoto('')}
                      className="p-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-zinc-950 p-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-upload-rc-back"
                  onClick={() => backInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-zinc-700 hover:border-amber-400 rounded-2xl bg-zinc-950/70 hover:bg-zinc-950 flex flex-col items-center justify-center p-3 text-center transition-all group active:scale-98"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 group-hover:bg-amber-400/20 text-zinc-400 group-hover:text-amber-400 flex items-center justify-center mb-1.5 transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-200 group-hover:text-amber-300">
                    Upload Back
                  </span>
                  <span className="text-[9px] text-zinc-500">Tap to capture / upload</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: RC Number Input Field */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-4 space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            RC Number
          </label>

          <div className="relative">
            <input
              id="input-rc-number"
              type="text"
              maxLength={13}
              value={rcNumber}
              onChange={handleRcNumberChange}
              placeholder="e.g. TS 08 EZ 1234"
              className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 rounded-2xl px-4 py-3.5 text-base font-mono font-bold text-zinc-100 tracking-wider uppercase focus:outline-none transition-all placeholder:text-zinc-600 placeholder:font-normal"
            />
          </div>

          {/* Sample Number Plate Guide Graphic */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-zinc-400 block mb-1.5">
              Sample Number Plate Guide:
            </span>

            {/* High-Security Registration Plate (HSRP) Graphic */}
            <div className="bg-zinc-950 border-2 border-zinc-700 rounded-xl p-2.5 shadow-inner flex flex-col gap-1.5">
              {/* Actual Indian Number Plate Illustration */}
              <div className="bg-white border-2 border-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between text-zinc-950 font-black shadow-sm select-none">
                {/* Blue IND Strip */}
                <div className="flex items-center gap-1 bg-blue-700 text-white px-1.5 py-0.5 rounded text-[10px] tracking-tight">
                  <span>🇮🇳</span>
                  <span>IND</span>
                </div>

                {/* Bold Embossed Plate Text */}
                <span className="font-mono text-base tracking-widest text-zinc-950 font-black">
                  {rcNumber.trim() || 'TS 08 EZ 1234'}
                </span>

                {/* Hologram Stamp icon */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-sky-400 opacity-80" />
              </div>

              {/* Explanatory callouts */}
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-zinc-400 font-mono pt-1">
                <div className="bg-zinc-900/80 p-1 rounded">
                  <span className="text-amber-400 font-bold block">TS</span>
                  <span className="text-[9px] text-zinc-500">State</span>
                </div>
                <div className="bg-zinc-900/80 p-1 rounded">
                  <span className="text-amber-400 font-bold block">08</span>
                  <span className="text-[9px] text-zinc-500">RTO Dist</span>
                </div>
                <div className="bg-zinc-900/80 p-1 rounded">
                  <span className="text-amber-400 font-bold block">EZ</span>
                  <span className="text-[9px] text-zinc-500">Series</span>
                </div>
                <div className="bg-zinc-900/80 p-1 rounded">
                  <span className="text-amber-400 font-bold block">1234</span>
                  <span className="text-[9px] text-zinc-500">Unique</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Sticky "Submit" CTA */}
      <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-850 p-4 z-20 w-full">
        <div className="max-w-md mx-auto">
          <button
            id="btn-submit-vehicle-details"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/25 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Verifying & Submitting...</span>
              </div>
            ) : (
              <>
                <span>Submit</span>
                <Check className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-zinc-100">
                RC Submitted Successfully!
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Your vehicle RC (<strong className="text-amber-400 font-mono">{rcNumber}</strong>) is under review. You can now start test rides and explore the captain console!
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Document:</span>
                <span className="font-bold text-zinc-200">{docType === 'rc' ? 'Vehicle RC' : 'Road Tax'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fuel Type:</span>
                <span className="font-bold text-zinc-200">{fuelType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="font-bold text-amber-400">KYC Under Review</span>
              </div>
            </div>

            <button
              id="btn-proceed-to-console"
              onClick={async () => {
                setShowSuccessModal(false);
                const captain = await captainStorageService.getCaptainById(`DRV-${cleanedRc.slice(-4)}`);
                if (captain) {
                  onSubmitSuccess(captain);
                } else {
                  onBack();
                }
              }}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-sm transition-all shadow-md active:scale-98"
            >
              Continue to Captain Console
            </button>
          </div>
        </div>
      )}

      {/* Reusable Help Bottom Sheet */}
      <HelpBottomSheet
        isOpen={showHelpSheet}
        onClose={() => setShowHelpSheet(false)}
        title="Vehicle RC Help"
        subtitle="Need help uploading RC or checking registration status?"
      />
    </div>
  );
};

import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Bike, 
  Car, 
  CheckCircle2, 
  Clock, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Award, 
  AlertCircle,
  Camera,
  Trash2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DriverProfile, VehicleType, KycDoc } from '../types';
import { soundManager } from '../utils/audio';
import { CameraCaptureModal } from './CameraCaptureModal';
import { DocumentPhotoUploader, DocumentItem } from './DocumentPhotoUploader';
import { captainStorageService } from '../services/captainStorageService';

interface DriverRegistrationModalProps {
  onRegisterComplete: (newDriver: DriverProfile) => void;
  onClose: () => void;
  onOpenIdCard: (driver: DriverProfile) => void;
}

export const DriverRegistrationModal: React.FC<DriverRegistrationModalProps> = ({
  onRegisterComplete,
  onClose,
  onOpenIdCard
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string>(''); // Required live selfie / uploaded driver photo
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [city, setCity] = useState('Bengaluru');
  const [bloodGroup, setBloodGroup] = useState('O+ Positive');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Vehicle State
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Documents State - 4 Real Documents with front & back upload
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc_dl',
      title: 'Commercial Driving License',
      docNumber: 'DL-' + Math.floor(100000000000 + Math.random() * 900000000000),
      requiresBack: true
    },
    {
      id: 'doc_rc',
      title: 'Vehicle Registration Certificate (RC)',
      docNumber: '',
      requiresBack: false
    },
    {
      id: 'doc_aadhaar',
      title: 'Aadhaar Card UIDAI',
      docNumber: '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
      requiresBack: true
    },
    {
      id: 'doc_ins',
      title: 'Commercial Vehicle Insurance Policy',
      docNumber: 'POL-' + Math.floor(10000 + Math.random() * 90000) + '-B4',
      requiresBack: false
    }
  ]);

  // Created Driver Profile state
  const [createdDriver, setCreatedDriver] = useState<DriverProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Validation
  const handleProceedToStep2 = () => {
    if (!avatar) {
      setErrorMsg('Live driver selfie/photo is strictly required. Please take a selfie or upload photo.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter your full legal name');
      return;
    }
    if (phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg('');
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleProceedToStep3 = () => {
    if (!vehicleNumber.trim()) {
      setErrorMsg('Please enter vehicle registration number (number plate)');
      return;
    }
    if (!vehicleModel.trim()) {
      setErrorMsg('Please enter vehicle make and model');
      return;
    }

    // Sync vehicle number to RC document
    setDocuments(prev => prev.map(doc => {
      if (doc.id === 'doc_rc') {
        return { ...doc, docNumber: vehicleNumber.toUpperCase().trim() };
      }
      return doc;
    }));

    setErrorMsg('');
    setCurrentStep(3);
  };

  // Step 3 Submission & Real Persistence
  const handleSubmitRegistration = async () => {
    // Strictly validate all required KYC document photos
    const dlDoc = documents.find(d => d.id === 'doc_dl');
    if (!dlDoc?.frontImage || !dlDoc?.backImage) {
      setErrorMsg('Driving License requires both Front AND Back photo uploads before proceeding.');
      return;
    }

    const rcDoc = documents.find(d => d.id === 'doc_rc');
    if (!rcDoc?.frontImage) {
      setErrorMsg('Vehicle Registration Certificate (RC) photo is required.');
      return;
    }

    const aadhaarDoc = documents.find(d => d.id === 'doc_aadhaar');
    if (!aadhaarDoc?.frontImage || !aadhaarDoc?.backImage) {
      setErrorMsg('Aadhaar Card requires both Front AND Back photo uploads before proceeding.');
      return;
    }

    const insDoc = documents.find(d => d.id === 'doc_ins');
    if (!insDoc?.frontImage) {
      setErrorMsg('Vehicle Insurance Policy photo is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const randomBadgeNum = Math.floor(100 + Math.random() * 900);
      const newBadgeId = `SW-DRV-${randomBadgeNum}`;
      const newDriverId = `DRV-${Math.floor(10000 + Math.random() * 90000)}`;

      const kycDocs: KycDoc[] = documents.map(d => ({
        id: d.id,
        title: d.title,
        docNumber: d.docNumber,
        status: 'pending',
        frontImage: d.frontImage,
        backImage: d.backImage,
        uploadedAt: Date.now()
      }));

      const newDriver: DriverProfile = {
        id: newDriverId,
        badgeId: newBadgeId,
        name: name.trim(),
        email: email.trim(),
        phone: `+91 ${phone.replace('+91', '').trim()}`,
        avatar,
        vehicleType,
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        city,
        rating: 5.0,
        totalTrips: 0,
        acceptanceRate: 100,
        cancellationRate: 0,
        isKycVerified: false,
        kycStatus: 'pending',
        joinedDate: 'Today',
        upiId: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sawari`,
        bankAccount: {
          accountNumber: '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
          ifsc: 'HDFC0001890',
          bankName: 'HDFC Bank Ltd.'
        },
        bloodGroup,
        emergencyContact: emergencyContact || '+91 98765 00000 (Family)',
        currentDutyStatus: 'offline',
        currentLocation: { lat: 12.9352, lng: 77.6245 },
        kycDocs
      };

      // Persist to IndexedDB (full-fidelity images) & Firestore cloud
      await captainStorageService.saveCaptainProfile(newDriver);

      setCreatedDriver(newDriver);
      onRegisterComplete(newDriver);
      setCurrentStep(4);
      soundManager.playCashEarned();

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      console.error('Registration persistence error:', err);
      setErrorMsg('Failed to save registration profile: ' + (err.message || 'Storage error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="driver-registration-modal" className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md">
              S
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-100">Captain Onboarding</h3>
              <p className="text-[11px] text-zinc-400">Step {currentStep} of 4 • 5% Lowest Commission</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-zinc-950/60 border-b border-zinc-800/80">
          {[
            { num: 1, label: 'Personal' },
            { num: 2, label: 'Vehicle' },
            { num: 3, label: 'Documents' },
            { num: 4, label: 'Captain ID' }
          ].map(s => (
            <div
              key={s.num}
              className={`py-1 px-2 rounded-lg text-center text-[10px] font-bold transition-all ${
                currentStep === s.num
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : currentStep > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-500 bg-zinc-900'
              }`}
            >
              {s.num}. {s.label}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PERSONAL DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <h4 className="text-sm font-extrabold text-zinc-100 mb-1">Personal & Contact Details</h4>
                <p className="text-zinc-400 text-[11px]">As printed on your Government ID / Driving License</p>
              </div>

              {/* Real Driver Selfie / Photo Capture */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-zinc-100 flex items-center gap-1.5">
                      <span>Driver Selfie / Profile Photo</span>
                      <span className="text-rose-400 font-bold text-[10px]">* Required</span>
                    </label>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Clear front-facing portrait photo without sunglasses or mask
                    </p>
                  </div>
                  {avatar && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Captured
                    </span>
                  )}
                </div>

                {avatar ? (
                  <div className="flex items-center gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <img 
                      src={avatar} 
                      alt="Driver Selfie" 
                      className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-xs font-bold text-zinc-200 truncate">Official Captain Photo</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCameraModal(true)}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="w-full py-4 px-3 bg-zinc-900 hover:bg-zinc-850 border-2 border-dashed border-amber-400/50 hover:border-amber-400 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center active:scale-98 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-amber-300">
                      Take Live Selfie or Upload Photo
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Supports direct device camera or gallery file upload
                    </span>
                  </button>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Verma"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Mobile Number (WhatsApp Enabled)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">🇮🇳 +91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-16 pr-3 py-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Email Address</label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@example.com"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* City & Blood Group */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Operating City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="O+ Positive">O+ Positive</option>
                    <option value="A+ Positive">A+ Positive</option>
                    <option value="B+ Positive">B+ Positive</option>
                    <option value="AB+ Positive">AB+ Positive</option>
                    <option value="O- Negative">O- Negative</option>
                    <option value="A- Negative">A- Negative</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Emergency Contact (SOS)</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. +91 98450 11223 (Brother)"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                >
                  <span>PROCEED TO VEHICLE DETAILS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VEHICLE DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="text-sm font-extrabold text-zinc-100 mb-1">Vehicle Details & Category</h4>
                <p className="text-zinc-400 text-[11px]">Select your vehicle type and enter registration info</p>
              </div>

              {/* Category selector */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('bike');
                    setVehicleModel('Hero Splendor / Honda Activa');
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    vehicleType === 'bike'
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Bike className="w-6 h-6" />
                  <span className="text-xs font-bold">Bike Taxi</span>
                  <span className="text-[10px] opacity-80">2-Wheeler</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('auto');
                    setVehicleModel('Bajaj Compact RE 4S');
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    vehicleType === 'auto'
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-2xl">🛺</span>
                  <span className="text-xs font-bold">Auto</span>
                  <span className="text-[10px] opacity-80">3-Wheeler</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('cab');
                    setVehicleModel('Maruti Suzuki Dzire Tour');
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    vehicleType === 'cab'
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Car className="w-6 h-6" />
                  <span className="text-xs font-bold">Cab Taxi</span>
                  <span className="text-[10px] opacity-80">4-Wheeler</span>
                </button>
              </div>

              {/* Registration Number */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Vehicle Registration Number (RC Number Plate)</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA 05 EQ 4821"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono text-amber-400 font-bold uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Vehicle Model & Color */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Vehicle Make, Model & Color</label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. TVS Jupiter 125 (Matte Blue)"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Commission Highlight Pill */}
              <div className="p-3 bg-zinc-950 border border-amber-400/30 rounded-2xl flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Sawari promises strict 5% commission on all {vehicleType} rides. You keep 95%!</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-1/3 py-3.5 bg-zinc-800 text-zinc-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToStep3}
                  className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  <span>UPLOAD KYC DOCUMENTS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REAL DOCUMENT PHOTO UPLOADS (FRONT & BACK) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <DocumentPhotoUploader
                documents={documents}
                onDocumentChange={(updated) => {
                  setDocuments(updated);
                  setErrorMsg('');
                }}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-1/3 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitRegistration}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SAVING & ENCRYPTING...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>SUBMIT DOCUMENTS & CREATE CAPTAIN ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REGISTRATION SUCCESS & ID BADGE GENERATION */}
          {currentStep === 4 && createdDriver && (
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-black text-zinc-100">Application Submitted!</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Your Driver ID has been generated successfully</p>
              </div>

              {/* Status Tracker Banner */}
              <div className="p-4 bg-zinc-950 border border-amber-500/40 rounded-2xl text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Document Verification</span>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-md text-[10px] font-black text-amber-300 uppercase">
                    Verification Pending ⏳
                  </span>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Application & Details Recorded</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Admin KYC Document Review in Progress</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Clock className="w-4 h-4" />
                    <span>Ready for Duty Activation</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                  Tip: Use the <span className="text-amber-400 font-bold">Admin Management Panel</span> to approve this registration instantly for testing!
                </p>
              </div>

              {/* Generated ID Badge preview pill */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <img src={createdDriver.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-amber-400 object-cover" />
                  <div>
                    <p className="text-xs font-black text-zinc-100">{createdDriver.name}</p>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">{createdDriver.badgeId}</p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenIdCard(createdDriver)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>View ID Card</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-xs shadow-md"
                >
                  <span>GO TO CAPTAIN DASHBOARD</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Live Selfie / Photo Camera Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(img) => {
          setAvatar(img);
          setShowCameraModal(false);
          setErrorMsg('');
        }}
        title="Captain Profile Selfie"
        subtitle="Ensure your face is centered, well-lit, and clearly visible for your verified Driver ID"
      />
    </div>
  );
};

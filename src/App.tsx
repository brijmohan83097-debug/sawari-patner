import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  DutyToggle 
} from './components/DutyToggle';
import { 
  TodayOverviewCard 
} from './components/TodayOverviewCard';
import { 
  MapSimulator 
} from './components/MapSimulator';
import { 
  IncomingRideModal 
} from './components/IncomingRideModal';
import { 
  TripExecution 
} from './components/TripExecution';
import { 
  OtpInputModal 
} from './components/OtpInputModal';
import { 
  TripSummaryModal 
} from './components/TripSummaryModal';
import { 
  WalletEarningsView 
} from './components/WalletEarningsView';
import { 
  AddMoneyModal 
} from './components/AddMoneyModal';
import { 
  OnboardingKycModal 
} from './components/OnboardingKycModal';
import { 
  DriverProfileModal 
} from './components/DriverProfileModal';
import { 
  CustomerChatCallModal 
} from './components/CustomerChatCallModal';
import { 
  AuthModal 
} from './components/AuthModal';
import { 
  DriverRegistrationModal 
} from './components/DriverRegistrationModal';
import { 
  DriverIdCardModal 
} from './components/DriverIdCardModal';
import { 
  AdminDashboard 
} from './components/AdminDashboard';
import { 
  LoginScreen 
} from './components/LoginScreen';
import { 
  LanguageSelectionScreen 
} from './components/LanguageSelectionScreen';
import { 
  VehicleDetailsScreen 
} from './components/VehicleDetailsScreen';
import { 
  DailyPassModal 
} from './components/DailyPassModal';
import { 
  ActivePassCountdownCard 
} from './components/ActivePassCountdownCard';
import { 
  PassengerAppView 
} from './components/PassengerAppView';
import { 
  SplitScreenCompanion 
} from './components/SplitScreenCompanion';
import { 
  SettingsModal 
} from './components/SettingsModal';
import { 
  ErrorBoundary 
} from './components/ErrorBoundary';
import { 
  LanguageProvider 
} from './context/LanguageContext';
import {
  subscribeToSearchingRides,
  subscribeToCompletedRides,
  acceptRideRequest,
  updateCaptainLiveGPS,
  markCaptainArrived,
  startRideWithOtpVerification,
  completeSharedRide
} from './services/ridesService';
import { 
  INITIAL_DRIVER, 
  HEATMAP_ZONES, 
  INITIAL_COMPLETED_TRIPS, 
  WEEKLY_EARNINGS_DATA,
  INITIAL_ADMIN_STATS,
  generateRandomRide 
} from './data/mockData';
import { isSuperAdminUser, SUPER_ADMIN_PHONE } from './utils/adminAuth';
import { captainStorageService, isMockOrDummyDriver } from './services/captainStorageService';
import { 
  DriverProfile, 
  RideRequest, 
  SharedRide, 
  TripStep, 
  VehicleType, 
  CompletedTripRecord, 
  WalletTransaction, 
  DailyEarningData,
  AdminStats,
  AppViewMode,
  DailyPass
} from './types';
import { 
  Zap,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { soundManager } from './utils/audio';

function AppContent() {
  // App View Mode (Driver App vs Central Admin Operations)
  const [appMode, setAppMode] = useState<AppViewMode>('driver');

  // Authentication State (Default: restore from localStorage if exists or false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sawari_auth_session');
      return saved ? JSON.parse(saved).isAuthenticated : false;
    } catch {
      return false;
    }
  });

  // Language Selection Screen State (Shows on first app launch)
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('sawari_language_selected');
    } catch {
      return false;
    }
  });
  const [showLanguageScreen, setShowLanguageScreen] = useState<boolean>(false);

  // Rapido-style Vehicle Details & KYC Onboarding Screen
  const [showVehicleDetailsScreen, setShowVehicleDetailsScreen] = useState<boolean>(false);

  // Drivers Fleet State
  const [allDrivers, setAllDrivers] = useState<DriverProfile[]>([]);

  // Load and subscribe to real registered captains from persistent storage on startup
  useEffect(() => {
    const unsubscribe = captainStorageService.subscribeToCaptains((stored) => {
      setAllDrivers(stored || []);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  const [driver, setDriver] = useState<DriverProfile>(() => {
    try {
      const saved = localStorage.getItem('sawari_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.driver && parsed.driver.id && !isMockOrDummyDriver(parsed.driver)) {
          return { ...INITIAL_DRIVER, ...parsed.driver };
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_DRIVER;
  });
  const [isOnline, setIsOnline] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('bike');
  
  // Dynamic wallet balance (starts strictly at ₹0.00 for new accounts)
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const savedSession = localStorage.getItem('sawari_auth_session');
      let driverId = INITIAL_DRIVER.id;
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.driver?.id) driverId = parsed.driver.id;
      }
      const savedBal = localStorage.getItem(`sawari_wallet_balance_${driverId}`);
      if (savedBal !== null) {
        const val = parseFloat(savedBal);
        return isNaN(val) ? 0 : val;
      }
    } catch {}
    return 0; // Strictly starts at ₹0.00 for new accounts
  });

  const [todayEarnings, setTodayEarnings] = useState(0);
  const [completedTripsCount, setCompletedTripsCount] = useState(0);
  const [onlineHours, setOnlineHours] = useState(0);

  // Admin Metrics State (Strictly reset to 0, dynamically derived from real records)
  const [adminStats, setAdminStats] = useState<AdminStats>(INITIAL_ADMIN_STATS);

  // Trip state
  const [tripStep, setTripStep] = useState<TripStep>('idle');
  const [incomingRide, setIncomingRide] = useState<RideRequest | null>(null);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [captainProgress, setCaptainProgress] = useState(0); // 0 to 100%
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(true);

  // Historical data
  const [tripHistory, setTripHistory] = useState<CompletedTripRecord[]>(INITIAL_COMPLETED_TRIPS);

  // Real-time listener for completed rides from Firestore for Admin & Driver stats
  useEffect(() => {
    const unsubscribe = subscribeToCompletedRides((rides) => {
      if (rides && rides.length > 0) {
        const mappedRecords: CompletedTripRecord[] = rides.map(r => ({
          id: `TRIP-${r.id}`,
          rideId: r.id,
          date: 'Today',
          time: new Date(r.completedAt || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customerName: r.passengerName,
          pickupAddress: r.pickupAddress,
          dropAddress: r.dropAddress,
          distanceKm: r.distanceKm,
          durationMin: r.estimatedTimeMin,
          grossFare: r.fare,
          platformFee: 0,
          captainEarning: r.captainEarning || r.fare,
          paymentMode: r.paymentMode,
          vehicleType: r.vehicleType,
          customerRating: r.rating || 5,
          status: 'completed'
        }));
        setTripHistory(mappedRecords);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Synchronize dynamic admin metrics strictly with real fleet & rides
  useEffect(() => {
    const onlineCount = allDrivers.filter(d => d.currentDutyStatus === 'online').length;
    const pendingKyc = allDrivers.filter(d => d.kycStatus === 'pending').length;
    const grossVolume = tripHistory.reduce((acc, t) => acc + (t.grossFare || 0), 0);
    setAdminStats(prev => ({
      ...prev,
      totalRides: tripHistory.length,
      totalGrossVolume: grossVolume,
      activeOnlineDrivers: onlineCount,
      pendingKycApprovals: pendingKyc
    }));
  }, [allDrivers, tripHistory]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const savedSession = localStorage.getItem('sawari_auth_session');
      let driverId = INITIAL_DRIVER.id;
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.driver?.id) driverId = parsed.driver.id;
      }
      const savedTxns = localStorage.getItem(`sawari_wallet_transactions_${driverId}`);
      if (savedTxns) {
        const parsed = JSON.parse(savedTxns);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return []; // Starts strictly empty for new accounts
  });
  const [weeklyData, setWeeklyData] = useState<DailyEarningData[]>(WEEKLY_EARNINGS_DATA);

  // Modals state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showDailyPassModal, setShowDailyPassModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [idCardDriver, setIdCardDriver] = useState<DriverProfile | null>(null);
  const [contactModalMode, setContactModalMode] = useState<'call' | 'chat' | null>(null);

  // Synchronize dynamic wallet and transactions when active driver changes
  useEffect(() => {
    if (!driver?.id) return;
    try {
      const savedBal = localStorage.getItem(`sawari_wallet_balance_${driver.id}`);
      if (savedBal !== null) {
        const val = parseFloat(savedBal);
        setWalletBalance(isNaN(val) ? 0 : val);
      } else if (typeof driver.walletBalance === 'number') {
        setWalletBalance(driver.walletBalance);
      } else {
        setWalletBalance(0); // Strictly starts at ₹0.00
      }

      const savedTxns = localStorage.getItem(`sawari_wallet_transactions_${driver.id}`);
      if (savedTxns) {
        const parsed = JSON.parse(savedTxns);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
          return;
        }
      }
      setTransactions([]);
    } catch (e) {
      console.warn('Error reading cached driver wallet:', e);
      setWalletBalance(0);
      setTransactions([]);
    }
  }, [driver?.id]);

  // Synchronize driver vehicle type with selected vehicle
  useEffect(() => {
    if (driver?.vehicleType) {
      setSelectedVehicle(driver.vehicleType);
    }
  }, [driver?.id, driver?.vehicleType]);

  // Real-time listener for incoming SEARCHING rides from Firestore & BroadcastChannel
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const hasActivePass = Boolean(driver?.activePass && driver.activePass.expiresAt > Date.now());

    if (appMode === 'driver' && isOnline && tripStep === 'idle' && !incomingRide && driver?.kycStatus === 'approved' && hasActivePass) {
      unsubscribe = subscribeToSearchingRides((rides) => {
        if (rides.length > 0 && !incomingRide && tripStep === 'idle') {
          const firstRide = rides[0];
          // Transform SharedRide to RideRequest
          const mappedRequest: RideRequest = {
            id: firstRide.id,
            customerName: firstRide.passengerName,
            customerPhone: firstRide.passengerPhone || '+91 98765 43210',
            customerRating: firstRide.passengerRating || 4.9,
            pickupAddress: firstRide.pickupAddress,
            pickupCoords: firstRide.pickupCoords,
            dropAddress: firstRide.dropAddress,
            dropCoords: firstRide.dropCoords,
            distanceKm: firstRide.distanceKm,
            estimatedTimeMin: firstRide.estimatedTimeMin,
            fareTotal: firstRide.fare,
            platformFee: 0,
            captainEarning: firstRide.captainEarning || firstRide.fare,
            surgeBonus: 0,
            tollFee: 0,
            tips: 0,
            paymentMode: firstRide.paymentMode || 'CASH',
            vehicleType: firstRide.vehicleType,
            otp: firstRide.otp || '4821',
            createdAt: firstRide.createdAt,
            expiresInSeconds: firstRide.expiresInSeconds || 45,
            note: firstRide.note
          };
          setIncomingRide(mappedRequest);
          soundManager.playIncomingAlert();
          showToast(`🔔 New Ride Request from ${firstRide.passengerName}!`, 'info');
        }
      }, selectedVehicle);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [appMode, isOnline, tripStep, incomingRide, selectedVehicle, driver?.kycStatus, driver?.activePass]);

  // Automated GPS driving simulation progress and Firestore live location sync
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    if (isSimulatingDrive && activeRide && (tripStep === 'navigating_pickup' || tripStep === 'on_trip')) {
      progressTimer = setInterval(() => {
        setCaptainProgress(prev => {
          const nextVal = prev >= 98 ? 100 : prev + 2.5;

          // Calculate interpolated LatLng
          const startPt = tripStep === 'navigating_pickup' ? { lat: 12.9280, lng: 77.6200 } : activeRide.pickupCoords;
          const endPt = tripStep === 'navigating_pickup' ? activeRide.pickupCoords : activeRide.dropCoords;
          const ratio = Math.min(1, Math.max(0, nextVal / 100));

          const curLat = startPt.lat + (endPt.lat - startPt.lat) * ratio;
          const curLng = startPt.lng + (endPt.lng - startPt.lng) * ratio;
          const heading = (startPt.lng < endPt.lng) ? 45 : 225;

          // Stream GPS coordinates to Firestore & Passenger app
          updateCaptainLiveGPS(activeRide.id, { lat: curLat, lng: curLng }, heading, nextVal);

          if (prev >= 98) {
            // Auto reach state
            if (tripStep === 'navigating_pickup') {
              setTripStep('arrived_pickup');
              markCaptainArrived(activeRide.id);
            }
            return 100;
          }
          return nextVal;
        });
      }, 500);
    }
    return () => clearInterval(progressTimer);
  }, [isSimulatingDrive, tripStep, activeRide]);

  // Manual Trigger for incoming ride (test button)
  const handleTriggerTestRide = () => {
    if (driver.kycStatus !== 'approved') {
      setShowKycModal(true);
      return;
    }
    const hasActivePass = Boolean(driver.activePass && driver.activePass.expiresAt > Date.now());
    if (!hasActivePass) {
      setShowDailyPassModal(true);
      return;
    }
    if (!isOnline) {
      setIsOnline(true);
    }
    const newRide = generateRandomRide(selectedVehicle);
    setIncomingRide(newRide);
  };

  // Daily Pass Purchase Handler
  const handlePurchaseDailyPass = async (pass: DailyPass, paymentSource: 'upi' | 'wallet' | 'UPI' | 'WALLET') => {
    let newBal = walletBalance;
    if (String(paymentSource).toLowerCase() === 'wallet') {
      newBal = Math.max(0, Number((walletBalance - pass.price).toFixed(2)));
      setWalletBalance(newBal);
    }

    // Set active pass for current driver
    setDriver(prev => ({
      ...prev,
      activePass: pass
    }));

    setAllDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, activePass: pass } : d));

    // Update Platform Admin Metrics for subscription revenue
    setAdminStats(prev => ({
      ...prev,
      totalPassRevenue: (prev.totalPassRevenue || 0) + pass.price,
      totalPassesSold: (prev.totalPassesSold || 0) + 1,
      passSalesByVehicle: {
        bike: (prev.passSalesByVehicle?.bike || 0) + (pass.vehicleType === 'bike' ? 1 : 0),
        auto: (prev.passSalesByVehicle?.auto || 0) + (pass.vehicleType === 'auto' ? 1 : 0),
        cab: (prev.passSalesByVehicle?.cab || 0) + (pass.vehicleType === 'cab' ? 1 : 0)
      }
    }));

    // Record wallet transaction
    const passTxn: WalletTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Daily Pass Recharge (${pass.vehicleType.toUpperCase()} - 24H 0% Comm)`,
      type: 'pass_subscription',
      amount: -pass.price,
      date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'success',
      referenceId: `PASS-${Math.floor(10000000 + Math.random() * 90000000)}`
    };
    const updatedTxns = [passTxn, ...transactions];
    setTransactions(updatedTxns);

    if (driver?.id) {
      try {
        if (String(paymentSource).toLowerCase() === 'wallet') {
          localStorage.setItem(`sawari_wallet_balance_${driver.id}`, newBal.toString());
          await captainStorageService.updateCaptainWalletBalance(driver.id, newBal);
        }
        localStorage.setItem(`sawari_wallet_transactions_${driver.id}`, JSON.stringify(updatedTxns));
      } catch (e) {
        console.warn('Pass purchase persistence notice:', e);
      }
    }

    // Automatically enable duty online!
    setIsOnline(true);
    setShowDailyPassModal(false);
  };

  // Notification toast
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setActiveToast({ id: `${Date.now()}`, message, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  };

  // Strictly protected Admin navigation handler - only for +919052931129
  const handleOpenAdmin = () => {
    if (!isSuperAdminUser(driver)) {
      showToast('Access Restricted to Super Admin (+919052931129)', 'error');
      setAppMode('driver');
      return;
    }
    setAppMode('admin');
  };

  // Strict Super Admin Access Guard: Any unauthorized access is immediately blocked and redirected
  useEffect(() => {
    if (appMode === 'admin' && !isSuperAdminUser(driver)) {
      setAppMode('driver');
      showToast('Access Restricted to Super Admin (+919052931129)', 'error');
    }
  }, [appMode, driver]);

  // Ride Acceptance (Driver -> Passenger sync)
  const handleAcceptRide = async (ride: RideRequest) => {
    setIncomingRide(null);
    setActiveRide(ride);
    setCaptainProgress(15);
    setTripStep('navigating_pickup');
    setIsSimulatingDrive(true);
    soundManager.playAcceptChime();
    showToast(`Ride Accepted! Navigating to ${ride.pickupAddress.split(',')[0]}`, 'success');

    // Sync to Firestore & Passenger app
    await acceptRideRequest(ride.id, driver, { lat: 12.9280, lng: 77.6200 });
  };

  // Ride Rejection
  const handleRejectRide = () => {
    setIncomingRide(null);
  };

  // Step 1: Arrived at customer location
  const handleArrivedAtPickup = async () => {
    if (!activeRide) return;
    setCaptainProgress(100);
    setTripStep('arrived_pickup');
    soundManager.playAcceptChime();
    showToast('📍 Arrived at Pickup! Passenger notified on app.', 'info');

    // Update Firestore status to 'ARRIVED'
    await markCaptainArrived(activeRide.id);
  };

  // Step 2: Start OTP verification succeeded
  const handleOtpVerifiedSuccess = async () => {
    if (!activeRide) return;
    setShowOtpModal(false);
    setCaptainProgress(10);
    setTripStep('on_trip');
    setIsSimulatingDrive(true);
    soundManager.playOtpSuccess();
    showToast('🚀 Start OTP Verified! Navigating to Drop Destination.', 'success');

    // Update Firestore status to 'IN_PROGRESS'
    await startRideWithOtpVerification(activeRide.id, activeRide.otp);
  };

  // Step 3: Complete Ride & Show Summary with 0% Commission (100% Net Fare to Captain)
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    setTripStep('trip_summary');
    setIsSimulatingDrive(false);
    showToast(`🎉 Ride Completed! ₹${activeRide.captainEarning} added to your wallet (0% Commission).`, 'success');

    // Update Firestore status to 'COMPLETED'
    await completeSharedRide(activeRide.id);

    // Update financial state (100% of ride fare + tips)
    const netTakeHome = activeRide.captainEarning;
    setWalletBalance(b => b + netTakeHome);
    setTodayEarnings(t => t + netTakeHome);
    setCompletedTripsCount(c => c + 1);

    // Update Platform Admin Metrics
    setAdminStats(prev => ({
      ...prev,
      totalRides: prev.totalRides + 1,
      totalGrossVolume: prev.totalGrossVolume + activeRide.fareTotal
    }));

    // Log trip record (0% platform fee)
    const newTripRecord: CompletedTripRecord = {
      id: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
      rideId: activeRide.id,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: activeRide.customerName,
      pickupAddress: activeRide.pickupAddress,
      dropAddress: activeRide.dropAddress,
      distanceKm: activeRide.distanceKm,
      durationMin: activeRide.estimatedTimeMin,
      grossFare: activeRide.fareTotal,
      platformFee: 0, // 0% Commission
      captainEarning: activeRide.captainEarning, // 100% + tips
      paymentMode: activeRide.paymentMode,
      vehicleType: activeRide.vehicleType,
      customerRating: 5,
      status: 'completed'
    };

    setTripHistory(prev => [newTripRecord, ...prev]);

    // Log transaction
    const newTxn: WalletTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Ride Earning #${activeRide.id} (100% Fare - 0% Comm)`,
      type: 'ride_credit',
      amount: netTakeHome,
      date: `Today, ${newTripRecord.time}`,
      time: newTripRecord.time,
      status: 'success',
      referenceId: `UPI-${Math.floor(100000000 + Math.random() * 900000000)}`,
      breakdown: {
        grossFare: activeRide.fareTotal,
        platformFee: 0,
        tip: activeRide.tips
      }
    };

    const updatedTxns = [newTxn, ...transactions];
    setTransactions(updatedTxns);

    if (driver?.id) {
      try {
        const newBal = Number((walletBalance + netTakeHome).toFixed(2));
        localStorage.setItem(`sawari_wallet_balance_${driver.id}`, newBal.toString());
        localStorage.setItem(`sawari_wallet_transactions_${driver.id}`, JSON.stringify(updatedTxns));
        await captainStorageService.updateCaptainWalletBalance(driver.id, newBal);
      } catch (e) {
        console.warn('Trip fare credit persistence notice:', e);
      }
    }
  };

  // Ready for next ride from summary
  const handleFinishSummary = () => {
    setActiveRide(null);
    setTripStep('idle');
    setCaptainProgress(0);
  };

  // Instant UPI Payout withdrawal
  const handleInstantWithdrawal = async (amount: number, upi: string) => {
    const newBal = Math.max(0, Number((walletBalance - amount).toFixed(2)));
    setWalletBalance(newBal);

    const withdrawalTxn: WalletTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Instant Payout to ${upi.split('@')[0]}`,
      type: 'withdrawal',
      amount: -amount,
      date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'success',
      referenceId: `PAY-${Math.floor(10000000 + Math.random() * 90000000)}`,
      upiId: upi
    };

    const updatedTxns = [withdrawalTxn, ...transactions];
    setTransactions(updatedTxns);

    if (driver?.id) {
      try {
        localStorage.setItem(`sawari_wallet_balance_${driver.id}`, newBal.toString());
        localStorage.setItem(`sawari_wallet_transactions_${driver.id}`, JSON.stringify(updatedTxns));
        await captainStorageService.updateCaptainWalletBalance(driver.id, newBal);
      } catch (e) {
        console.warn('Withdrawal persistence notice:', e);
      }
    }

    showToast(`Instant Payout of ₹${amount} initiated to ${upi}`, 'success');
  };

  // Add Money / Recharge Wallet (Dynamic, Instant UPI, and Persisted)
  const handleAddMoney = async (amount: number, paymentMethod: string) => {
    const newBal = Number((walletBalance + amount).toFixed(2));
    setWalletBalance(newBal);

    const rechargeTxn: WalletTransaction = {
      id: `TXN-REC-${Date.now()}`,
      title: `Wallet Recharge via ${paymentMethod}`,
      type: 'wallet_recharge',
      amount: amount,
      date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'success',
      referenceId: `UPI-REC-${Math.floor(10000000 + Math.random() * 90000000)}`,
      upiId: driver.upiId,
      breakdown: { grossFare: amount }
    };

    const updatedTxns = [rechargeTxn, ...transactions];
    setTransactions(updatedTxns);

    if (driver?.id) {
      try {
        localStorage.setItem(`sawari_wallet_balance_${driver.id}`, newBal.toString());
        localStorage.setItem(`sawari_wallet_transactions_${driver.id}`, JSON.stringify(updatedTxns));
        await captainStorageService.updateCaptainWalletBalance(driver.id, newBal);
      } catch (e) {
        console.warn('Recharge persistence notice:', e);
      }
    }

    // Exact requested toast notification:
    showToast(`₹${amount} added to your Sawari Wallet successfully!`, 'success');
  };

  // Admin Approval Actions
  const handleApproveDriver = async (driverId: string) => {
    try {
      await captainStorageService.updateCaptainStatus(driverId, 'approved');
    } catch (e) {
      console.warn('Error syncing captain approval:', e);
    }

    setAllDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          isKycVerified: true,
          kycStatus: 'approved',
          rejectionReason: undefined,
          kycDocs: d.kycDocs?.map(doc => ({ ...doc, status: 'verified' as const }))
        };
      }
      return d;
    }));

    if (driver.id === driverId) {
      setDriver(prev => ({
        ...prev,
        isKycVerified: true,
        kycStatus: 'approved',
        rejectionReason: undefined,
        kycDocs: prev.kycDocs?.map(doc => ({ ...doc, status: 'verified' as const }))
      }));
    }
  };

  // Admin Rejection Action
  const handleRejectDriver = async (driverId: string, reason: string) => {
    try {
      await captainStorageService.updateCaptainStatus(driverId, 'rejected', reason);
    } catch (e) {
      console.warn('Error syncing captain rejection:', e);
    }

    setAllDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          isKycVerified: false,
          kycStatus: 'rejected',
          rejectionReason: reason
        };
      }
      return d;
    }));

    if (driver.id === driverId) {
      setDriver(prev => ({
        ...prev,
        isKycVerified: false,
        kycStatus: 'rejected',
        rejectionReason: reason
      }));
      setIsOnline(false);
    }
  };

  // Switch to Driver App
  const handleSwitchToDriverApp = (selectedDriver?: DriverProfile) => {
    if (selectedDriver) {
      setDriver(selectedDriver);
      setSelectedVehicle(selectedDriver.vehicleType);
      setIsOnline(selectedDriver.kycStatus === 'approved');
    }
    setIsAuthenticated(true);
    setAppMode('driver');
  };

  // Open Driver ID Card
  const handleOpenIdCardModal = (targetDriver?: DriverProfile) => {
    setIdCardDriver(targetDriver || driver);
    setShowIdCardModal(true);
  };

  // New Driver Registration Completed (Starts strictly at ₹0.00)
  const handleDriverRegistrationComplete = (newDriver: DriverProfile) => {
    const driverWithZeroWallet: DriverProfile = {
      ...newDriver,
      walletBalance: 0
    };
    setAllDrivers(prev => [driverWithZeroWallet, ...prev]);
    setDriver(driverWithZeroWallet);
    setSelectedVehicle(driverWithZeroWallet.vehicleType);
    setWalletBalance(0); // Strictly starts at ₹0.00 for new accounts
    setTransactions([]); // Strictly empty for new accounts
    try {
      localStorage.setItem(`sawari_wallet_balance_${driverWithZeroWallet.id}`, '0');
      localStorage.setItem(`sawari_wallet_transactions_${driverWithZeroWallet.id}`, JSON.stringify([]));
    } catch {}
    setIsOnline(false);
  };

  // Authentication Login Success
  const handleAuthLoginSuccess = (loggedInDriver: DriverProfile) => {
    setDriver(loggedInDriver);
    setSelectedVehicle(loggedInDriver.vehicleType);
    setIsAuthenticated(true);
    setShowAuthModal(false);

    try {
      localStorage.setItem('sawari_auth_session', JSON.stringify({
        isAuthenticated: true,
        driver: loggedInDriver,
        timestamp: Date.now()
      }));
    } catch {
      // ignore
    }
    
    // If logging in strictly as Super Admin (+919052931129), automatically open Super Admin Dashboard
    if (isSuperAdminUser(loggedInDriver)) {
      setAppMode('admin');
      showToast('Welcome Super Admin (+919052931129)', 'success');
      return;
    }

    setIsOnline(loggedInDriver.kycStatus === 'approved');
    setAppMode('driver');
  };

  // Captain Logout Action
  const handleLogout = () => {
    soundManager.playDutyOffline();
    setIsAuthenticated(false);
    setIsOnline(false);
    setActiveRide(null);
    setIncomingRide(null);
    setTripStep('idle');
    setCaptainProgress(0);
    setShowProfileModal(false);
    try {
      localStorage.removeItem('sawari_auth_session');
    } catch {
      // ignore
    }
  };

  // ----------------------------------------------------
  // RENDER ADMIN DASHBOARD MODE (STRICTLY LOCKED TO +919052931129)
  // ----------------------------------------------------
  if (appMode === 'admin') {
    // Immediate unauthorized gate check
    if (!isSuperAdminUser(driver)) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-zinc-100 mb-2">Access Restricted to Super Admin</h2>
          <p className="text-xs text-zinc-400 max-w-xs mb-6 leading-relaxed">
            Admin operations panel is restricted strictly to the verified super admin phone number ({SUPER_ADMIN_PHONE}).
          </p>
          <button
            onClick={() => {
              setAppMode('driver');
              showToast('Access Restricted to Super Admin (+919052931129)', 'error');
            }}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-all"
          >
            Return to Captain Duty
          </button>
        </div>
      );
    }

    return (
      <ErrorBoundary 
        fallbackTitle="Admin Console Error" 
        fallbackMessage="An unexpected error occurred in the Admin Dashboard. You can reset and return to the main app."
        onReset={() => setAppMode('driver')}
      >
        <AdminDashboard
          drivers={allDrivers}
          onApproveDriver={handleApproveDriver}
          onRejectDriver={handleRejectDriver}
          onSwitchToDriverApp={handleSwitchToDriverApp}
          onViewDriverIdCard={(d) => handleOpenIdCardModal(d)}
          onOpenSettings={() => setShowSettingsModal(true)}
          stats={adminStats}
          completedTrips={tripHistory}
        />
        {/* Settings Modal in Admin Mode */}
        {showSettingsModal && (
          <SettingsModal
            isOpen={showSettingsModal}
            driver={driver}
            onUpdateDriver={(updated) => {
              setDriver(d => ({ ...d, ...updated }));
              setAllDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, ...updated } : d));
            }}
            onOpenIdCard={() => handleOpenIdCardModal(driver)}
            onLogout={handleLogout}
            onOpenAuth={() => setShowAuthModal(true)}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
        {/* Driver ID Card Modal in Admin Mode */}
        {showIdCardModal && idCardDriver && (
          <DriverIdCardModal
            driver={idCardDriver}
            onClose={() => setShowIdCardModal(false)}
          />
        )}
      </ErrorBoundary>
    );
  }

  // ----------------------------------------------------
  // RENDER PASSENGER RIDER APP VIEW
  // ----------------------------------------------------
  if (appMode === 'passenger') {
    return (
      <ErrorBoundary 
        fallbackTitle="Passenger View Error" 
        fallbackMessage="An error occurred in the Passenger Companion. Returning to Captain Duty."
        onReset={() => {
          setIsAuthenticated(true);
          setAppMode('driver');
        }}
      >
        <PassengerAppView
          onSwitchToCaptainApp={() => {
            setIsAuthenticated(true);
            setAppMode('driver');
          }}
          onOpenSplitView={() => setAppMode('split')}
        />
      </ErrorBoundary>
    );
  }

  // ----------------------------------------------------
  // 0. FIRST APP LAUNCH: RENDER LANGUAGE SELECTION SCREEN
  // ----------------------------------------------------
  if (!hasSelectedLanguage || showLanguageScreen) {
    return (
      <ErrorBoundary 
        fallbackTitle="Language Settings" 
        fallbackMessage="Could not load language preferences. Resetting to English."
        onReset={() => {
          setHasSelectedLanguage(true);
          setShowLanguageScreen(false);
        }}
      >
        <LanguageSelectionScreen
          onConfirm={() => {
            setHasSelectedLanguage(true);
            setShowLanguageScreen(false);
          }}
        />
      </ErrorBoundary>
    );
  }

  // ----------------------------------------------------
  // 0.5. VEHICLE DETAILS & KYC ONBOARDING SCREEN
  // ----------------------------------------------------
  if (showVehicleDetailsScreen) {
    return (
      <ErrorBoundary 
        fallbackTitle="Vehicle KYC Error" 
        fallbackMessage="An error occurred while uploading vehicle details. Tap reset to try again."
        onReset={() => setShowVehicleDetailsScreen(false)}
      >
        <VehicleDetailsScreen
          onBack={() => setShowVehicleDetailsScreen(false)}
          onSubmitSuccess={(newDriver) => {
            handleDriverRegistrationComplete(newDriver);
            setShowVehicleDetailsScreen(false);
            setIsAuthenticated(true);
          }}
        />
      </ErrorBoundary>
    );
  }

  // ----------------------------------------------------
  // RENDER FULL-SCREEN LOGIN / WELCOME SCREEN (DEFAULT ENTRY ON OPEN)
  // ----------------------------------------------------
  if (!isAuthenticated && appMode !== 'split') {
    return (
      <ErrorBoundary 
        fallbackTitle="Login Screen Error" 
        fallbackMessage="An error occurred loading the Captain Login screen. Tap Reset to reload."
        onReset={() => window.location.reload()}
      >
        <LoginScreen
          onLoginSuccess={handleAuthLoginSuccess}
          onOpenRegister={() => setShowVehicleDetailsScreen(true)}
          onOpenAdmin={handleOpenAdmin}
          onOpenPassengerApp={() => setAppMode('passenger')}
          onOpenSplitView={() => {
            setIsAuthenticated(true);
            setAppMode('split');
          }}
          onOpenSettings={() => setShowLanguageScreen(true)}
        />

        {/* Settings Modal in Login Screen */}
        {showSettingsModal && (
          <SettingsModal
            isOpen={showSettingsModal}
            driver={driver}
            onUpdateDriver={(updated) => {
              setDriver(d => ({ ...d, ...updated }));
              setAllDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, ...updated } : d));
            }}
            onOpenIdCard={() => handleOpenIdCardModal(driver)}
            onLogout={handleLogout}
            onOpenAuth={() => setShowAuthModal(true)}
            onClose={() => setShowSettingsModal(false)}
          />
        )}

        {/* New Driver Partner Registration & KYC Modal */}
        {showRegisterModal && (
          <DriverRegistrationModal
            onRegisterComplete={(newDriver) => {
              handleDriverRegistrationComplete(newDriver);
              setIsAuthenticated(true);
            }}
            onOpenIdCard={(d) => {
              setShowRegisterModal(false);
              handleOpenIdCardModal(d);
            }}
            onClose={() => setShowRegisterModal(false)}
          />
        )}

        {/* Driver ID Card Modal */}
        {showIdCardModal && idCardDriver && (
          <DriverIdCardModal
            driver={idCardDriver}
            onClose={() => setShowIdCardModal(false)}
          />
        )}
      </ErrorBoundary>
    );
  }

  // ----------------------------------------------------
  // DRIVER PARTNER APP VIEW (MAIN CONTENT)
  // ----------------------------------------------------
  const renderDriverMainView = () => (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      
      {/* 1. STICKY TOP HEADER */}
      <Header
        driver={driver}
        isOnline={isOnline}
        walletBalance={walletBalance}
        selectedVehicle={selectedVehicle}
        onVehicleChange={(type) => {
          setSelectedVehicle(type);
          setDriver(d => ({ ...d, vehicleType: type }));
        }}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenIdCard={() => handleOpenIdCardModal(driver)}
        onOpenDailyPass={() => setShowDailyPassModal(true)}
      />

      {/* 2. MAIN APP VIEWPORT */}
      <main className="flex-1 flex flex-col max-w-lg w-full mx-auto relative pb-10">
        
        {/* Floating Real-time Trip Notification Toast */}
        {activeToast && (
          <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-top-4 duration-200 flex items-center gap-2.5 ${
            activeToast.type === 'error'
              ? 'bg-zinc-950/95 border-rose-500/80 text-rose-200 shadow-rose-950/50'
              : 'bg-zinc-900/95 border-amber-400/60 text-zinc-100'
          }`}>
            <span className="text-sm font-bold text-amber-400">{activeToast.type === 'error' ? '🚫' : '⚡'}</span>
            <p className="text-xs font-semibold flex-1 leading-snug">{activeToast.message}</p>
          </div>
        )}

        {/* Verification Status Warning Pill if not approved */}
        {driver.kycStatus !== 'approved' && (
          <div className="mx-3.5 mt-2 p-3 bg-zinc-900/90 border border-amber-500/40 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                {driver.kycStatus === 'pending' ? '⏳' : '⚠️'}
              </span>
              <div>
                <p className="text-xs font-black text-zinc-100">
                  {driver.kycStatus === 'pending' ? 'KYC Verification Under Review' : 'KYC Documents Rejected'}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {driver.kycStatus === 'pending'
                    ? 'Documents under admin review. Duty locked.'
                    : 'Please review and resubmit documents.'}
                </p>
              </div>
            </div>

            {/* Super Admin testing shortcut: only rendered if user is verified +919052931129 */}
            {isSuperAdminUser(driver) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleOpenAdmin}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg text-[10px] font-black"
                >
                  Admin
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Interactive Map Section */}
        <div className="w-full h-[360px] sm:h-[400px] relative">
          <MapSimulator
            isOnline={isOnline}
            activeTripStep={tripStep}
            currentRide={activeRide}
            heatmapZones={HEATMAP_ZONES}
            vehicleType={selectedVehicle}
            captainProgress={captainProgress}
            onSimulateRideTrigger={handleTriggerTestRide}
          />
        </div>

        {/* Dynamic Bottom Controls Section */}
        <div className="p-3.5 space-y-3.5 -mt-3 relative z-20">
          
          {/* A. If IDLE: Show Duty Toggle & Today's Earnings Overview */}
          {tripStep === 'idle' && (
            <>
              {/* Duty Toggle Switch with Daily Pass Subscription Gate */}
              <DutyToggle
                isOnline={isOnline}
                isKycVerified={driver.kycStatus === 'approved'}
                hasActivePass={Boolean(driver.activePass && driver.activePass.expiresAt > Date.now())}
                selectedVehicle={selectedVehicle}
                onToggle={(next) => {
                  if (next && driver.kycStatus !== 'approved') {
                    setShowKycModal(true);
                    return;
                  }
                  const hasPass = Boolean(driver.activePass && driver.activePass.expiresAt > Date.now());
                  if (next && !hasPass) {
                    setShowDailyPassModal(true);
                    return;
                  }
                  setIsOnline(next);
                }}
                onOpenKyc={() => setShowKycModal(true)}
                onOpenDailyPass={() => setShowDailyPassModal(true)}
              />

              {/* Active Daily Pass Countdown Timer & Status */}
              {driver.activePass && driver.activePass.expiresAt > Date.now() ? (
                <ActivePassCountdownCard
                  activePass={driver.activePass}
                  selectedVehicle={selectedVehicle}
                  onOpenRechargeModal={() => setShowDailyPassModal(true)}
                />
              ) : (
                <div 
                  onClick={() => setShowDailyPassModal(true)}
                  className="p-3 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl p-1 bg-amber-400/20 rounded-xl">⚡</span>
                    <div>
                      <p className="text-xs font-black text-amber-300">0% Commission Pass Needed</p>
                      <p className="text-[10px] text-zinc-400">Recharge daily pass ({selectedVehicle === 'bike' ? '₹15' : selectedVehicle === 'auto' ? '₹20' : '₹40'}) to go online & keep 100% fare</p>
                    </div>
                  </div>
                  <button 
                    id="btn-buy-pass-prompt"
                    onClick={(e) => { e.stopPropagation(); setShowDailyPassModal(true); }}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow active:scale-95"
                  >
                    Buy Pass
                  </button>
                </div>
              )}

              {/* Today's Earnings Card */}
              <TodayOverviewCard
                todayEarnings={todayEarnings}
                completedTripsCount={completedTripsCount}
                onlineHours={onlineHours}
                targetTrips={20}
                targetReward={250}
                onOpenWallet={() => setShowWalletModal(true)}
              />

              {/* Quick Demo Simulator Trigger Bar */}
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-zinc-100">Live Driver Dispatch Simulator</p>
                    <p className="text-[11px] text-zinc-400">Generate instant 0% commission {selectedVehicle} ride</p>
                  </div>
                </div>

                <button
                  id="btn-simulate-ride-direct"
                  onClick={handleTriggerTestRide}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Request Ride</span>
                </button>
              </div>
            </>
          )}

          {/* B. If ACTIVE TRIP: Show Step-by-Step Navigation & Actions */}
          {activeRide && tripStep !== 'idle' && tripStep !== 'trip_summary' && (
            <TripExecution
              ride={activeRide}
              tripStep={tripStep}
              captainProgress={captainProgress}
              onArrivedAtPickup={handleArrivedAtPickup}
              onOpenOtpModal={() => setShowOtpModal(true)}
              onCompleteRide={handleCompleteRide}
              onOpenCall={() => setContactModalMode('call')}
              onOpenChat={() => setContactModalMode('chat')}
              onToggleSimulateDrive={() => setIsSimulatingDrive(!isSimulatingDrive)}
              isSimulatingDrive={isSimulatingDrive}
            />
          )}

        </div>

      </main>

      {/* 3. MODALS & POP-UPS */}

      {/* Incoming Ride 15-second Alert Modal */}
      {incomingRide && (
        <IncomingRideModal
          request={incomingRide}
          onAccept={handleAcceptRide}
          onReject={handleRejectRide}
        />
      )}

      {/* 4-Digit Start OTP Modal */}
      {showOtpModal && activeRide && (
        <OtpInputModal
          correctOtp={activeRide.otp}
          customerName={activeRide.customerName}
          onVerifySuccess={handleOtpVerifiedSuccess}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {/* Customer Call & Chat Simulation Modal */}
      {contactModalMode && activeRide && (
        <CustomerChatCallModal
          ride={activeRide}
          initialMode={contactModalMode}
          onClose={() => setContactModalMode(null)}
        />
      )}

      {/* Trip Completed & Earnings Summary Modal */}
      {tripStep === 'trip_summary' && activeRide && (
        <TripSummaryModal
          ride={activeRide}
          onFinishAndReady={handleFinishSummary}
        />
      )}

      {/* Captain Wallet, Passbook & UPI Payout Modal */}
      {showWalletModal && (
        <WalletEarningsView
          walletBalance={walletBalance}
          transactions={transactions}
          tripHistory={tripHistory}
          weeklyData={weeklyData}
          upiId={driver.upiId}
          onInstantWithdrawal={handleInstantWithdrawal}
          onAddMoney={handleAddMoney}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {/* Driver Onboarding & KYC Verification Modal */}
      {showKycModal && (
        <OnboardingKycModal
          driver={driver}
          onUpdateDriver={(updated) => {
            setDriver(d => ({ ...d, ...updated }));
            setAllDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, ...updated } : d));
          }}
          onClose={() => setShowKycModal(false)}
        />
      )}

      {/* Driver Profile, Performance Stats & Settings Modal */}
      {showProfileModal && (
        <DriverProfileModal
          driver={driver}
          walletBalance={walletBalance}
          onOpenWallet={() => {
            setShowProfileModal(false);
            setShowWalletModal(true);
          }}
          onOpenAddMoney={() => setShowAddMoneyModal(true)}
          onUpdateDriver={(updated) => {
            setDriver(d => ({ ...d, ...updated }));
            setAllDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, ...updated } : d));
          }}
          onOpenKyc={() => { setShowProfileModal(false); setShowKycModal(true); }}
          onTriggerTestRide={handleTriggerTestRide}
          onLogout={handleLogout}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Driver ID Card Modal */}
      {showIdCardModal && idCardDriver && (
        <DriverIdCardModal
          driver={idCardDriver}
          onClose={() => setShowIdCardModal(false)}
        />
      )}

      {/* Daily Pass Recharge / Subscription Modal (0% Commission) */}
      {showDailyPassModal && (
        <DailyPassModal
          isOpen={showDailyPassModal}
          driver={driver}
          vehicleType={selectedVehicle}
          walletBalance={walletBalance}
          driverUpi={driver?.upiId}
          onOpenAddMoney={() => setShowAddMoneyModal(true)}
          onPurchasePass={handlePurchaseDailyPass}
          onClose={() => setShowDailyPassModal(false)}
        />
      )}

      {/* Dedicated Add Money / Recharge Wallet Modal */}
      <AddMoneyModal
        isOpen={showAddMoneyModal}
        currentBalance={walletBalance}
        driverUpiId={driver?.upiId}
        onAddMoney={handleAddMoney}
        onClose={() => setShowAddMoneyModal(false)}
      />

      {/* Google & Mobile OTP Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onLoginSuccess={handleAuthLoginSuccess}
        onAdminLogin={() => {
          setShowAuthModal(false);
          setAppMode('admin');
        }}
        onOpenRegister={() => {
          setShowAuthModal(false);
          setShowRegisterModal(true);
        }}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Dedicated Settings & Multi-Language Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        driver={driver}
        onUpdateDriver={(updated) => {
          setDriver(d => ({ ...d, ...updated }));
          setAllDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, ...updated } : d));
        }}
        onOpenIdCard={() => handleOpenIdCardModal(driver)}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* New Driver Partner Registration & KYC Modal */}
      {showRegisterModal && (
        <DriverRegistrationModal
          onRegisterComplete={(newDriver) => {
            handleDriverRegistrationComplete(newDriver);
          }}
          onOpenIdCard={(d) => {
            setShowRegisterModal(false);
            handleOpenIdCardModal(d);
          }}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

    </div>
  );

  // ----------------------------------------------------
  // RENDER SPLIT SCREEN DUAL VIEW (PASSENGER + CAPTAIN)
  // ----------------------------------------------------
  if (appMode === 'split') {
    return (
      <ErrorBoundary
        fallbackTitle="Split Companion Error"
        fallbackMessage="An error occurred in Split Screen Companion mode."
        onReset={() => setAppMode('driver')}
      >
        <SplitScreenCompanion
          onBackToDriver={() => setAppMode('driver')}
          renderDriverApp={() => renderDriverMainView()}
        />
      </ErrorBoundary>
    );
  }

  // ----------------------------------------------------
  // RENDER STANDARD DRIVER PARTNER VIEW
  // ----------------------------------------------------
  return (
    <ErrorBoundary
      fallbackTitle="Sawari Partner Duty Error"
      fallbackMessage="An unexpected error occurred on the captain duty view."
      onReset={() => window.location.reload()}
    >
      {renderDriverMainView()}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ErrorBoundary>
  );
}

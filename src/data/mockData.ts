import { DriverProfile, HeatmapZone, CompletedTripRecord, WalletTransaction, DailyEarningData, RideRequest, VehicleType, AdminStats } from '../types';

export const MASTER_ADMIN_PHONE = '9052931129';

export const SUPER_ADMIN_DRIVER: DriverProfile = {
  id: 'DRV-ADMIN-001',
  badgeId: 'SW-ADM-905',
  name: 'Brijmohan (Super Admin)',
  email: 'brijmohan83097@gmail.com',
  phone: '9052931129',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  vehicleType: 'bike',
  vehicleModel: 'Hero Electric Optima / Royal Enfield 350',
  vehicleNumber: 'KA 01 SA 9052',
  city: 'Bengaluru',
  rating: 5.0,
  totalTrips: 3420,
  acceptanceRate: 99,
  cancellationRate: 0.1,
  isKycVerified: true,
  kycStatus: 'approved',
  joinedDate: 'Founding Partner',
  upiId: 'brijmohan@okhdfcbank',
  bankAccount: {
    accountNumber: '•••• •••• 9052',
    ifsc: 'HDFC0001245',
    bankName: 'HDFC Bank Ltd.'
  },
  bloodGroup: 'O+ Positive',
  emergencyContact: '+91 90529 31129 (Direct)',
  currentDutyStatus: 'online',
  currentLocation: { lat: 12.9352, lng: 77.6245 },
  activePass: {
    id: 'PASS-ADMIN-VIP',
    driverId: 'DRV-ADMIN-001',
    driverName: 'Brijmohan',
    vehicleType: 'bike',
    price: 0,
    purchasedAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    paymentMethod: 'WALLET',
    status: 'active',
    hoursTotal: 8760
  },
  kycDocs: [
    {
      id: 'doc_dl',
      title: 'Master Driving License (Admin)',
      docNumber: 'DL-0420190090529',
      status: 'verified',
      verifiedOn: 'Direct Admin Clear',
      expiryDate: '12 Nov 2040'
    },
    {
      id: 'doc_rc',
      title: 'Vehicle Registration (RC)',
      docNumber: 'KA01SA9052',
      status: 'verified',
      verifiedOn: 'Direct Admin Clear'
    },
    {
      id: 'doc_aadhaar',
      title: 'Aadhaar Card UIDAI',
      docNumber: '•••• •••• 9052',
      status: 'verified',
      verifiedOn: 'Direct Admin Clear'
    },
    {
      id: 'doc_ins',
      title: 'Commercial Vehicle Insurance',
      docNumber: 'POL-ADMIN-VIP',
      status: 'verified',
      expiryDate: '28 Feb 2030'
    }
  ]
};

export const INITIAL_DRIVER: DriverProfile = SUPER_ADMIN_DRIVER;

// All mock/dummy captain profiles (Rajesh Kumar, Suresh Gowda, Mohammed Farooq, Priya Sundaram) have been deleted.
// Real captains are added dynamically via the live Onboarding flow and persisted in IndexedDB & Firestore.
export const MOCK_DRIVERS: DriverProfile[] = [];

export const HEATMAP_ZONES: HeatmapZone[] = [
  {
    id: 'zone_1',
    name: 'Koramangala 5th Block Hub',
    lat: 12.9352,
    lng: 77.6245,
    surge: 1.8,
    demandLevel: 'surge_peak',
    radius: 70,
    activeRiders: 42
  },
  {
    id: 'zone_2',
    name: 'Indiranagar 100ft Road',
    lat: 12.9719,
    lng: 77.6412,
    surge: 1.5,
    demandLevel: 'very_high',
    radius: 65,
    activeRiders: 35
  },
  {
    id: 'zone_3',
    name: 'HSR Layout Sector 1 & 2',
    lat: 12.9121,
    lng: 77.6446,
    surge: 1.3,
    demandLevel: 'high',
    radius: 60,
    activeRiders: 28
  },
  {
    id: 'zone_4',
    name: 'Tech Village Outer Ring Rd',
    lat: 12.9260,
    lng: 77.6820,
    surge: 2.2,
    demandLevel: 'surge_peak',
    radius: 80,
    activeRiders: 58
  },
  {
    id: 'zone_5',
    name: 'MG Road Metro Station',
    lat: 12.9756,
    lng: 77.6066,
    surge: 1.4,
    demandLevel: 'high',
    radius: 55,
    activeRiders: 31
  }
];

// Calculated strictly with Sawari 0% Commission + Daily Pass Subscription model:
// Platform Fee = ₹0 (Zero Commission)
// Captain Take-Home = 100% of gross bill + 100% of tips
export const INITIAL_COMPLETED_TRIPS: CompletedTripRecord[] = [
  {
    id: 'TRIP-9901',
    rideId: 'SW-83921',
    date: 'Today',
    time: '18:42',
    customerName: 'Ananya Sharma',
    pickupAddress: 'Nexus Mall, Koramangala',
    dropAddress: 'HSR BDA Complex, 5th Main',
    distanceKm: 4.8,
    durationMin: 16,
    grossFare: 120,
    platformFee: 0, // ₹0 Commission
    captainEarning: 120, // 100% of 120
    paymentMode: 'ONLINE_UPI',
    vehicleType: 'bike',
    customerRating: 5,
    status: 'completed'
  },
  {
    id: 'TRIP-9902',
    rideId: 'SW-83918',
    date: 'Today',
    time: '17:15',
    customerName: 'Vikram Mehta',
    pickupAddress: 'Sony World Junction, 80ft Rd',
    dropAddress: 'Embassy GolfLinks Tech Park',
    distanceKm: 6.2,
    durationMin: 22,
    grossFare: 160,
    platformFee: 0, // ₹0 Commission
    captainEarning: 160, // 100% of 160
    paymentMode: 'CASH',
    vehicleType: 'bike',
    customerRating: 5,
    status: 'completed'
  },
  {
    id: 'TRIP-9903',
    rideId: 'SW-83904',
    date: 'Today',
    time: '15:50',
    customerName: 'Pooja Iyer',
    pickupAddress: 'Forum South Mall, Hosur Rd',
    dropAddress: 'Silk Board Flyover Metro Jn',
    distanceKm: 3.5,
    durationMin: 12,
    grossFare: 90,
    platformFee: 0, // ₹0 Commission
    captainEarning: 90, // 100% of 90
    paymentMode: 'ONLINE_UPI',
    vehicleType: 'bike',
    customerRating: 4,
    status: 'completed'
  },
  {
    id: 'TRIP-9894',
    rideId: 'SW-83860',
    date: 'Yesterday',
    time: '20:10',
    customerName: 'Karan Malhotra',
    pickupAddress: 'Brigade Metropolis, Whitefield',
    dropAddress: 'Phoenix Marketcity Mall',
    distanceKm: 5.1,
    durationMin: 18,
    grossFare: 140,
    platformFee: 0,
    captainEarning: 140,
    paymentMode: 'ONLINE_UPI',
    vehicleType: 'bike',
    customerRating: 5,
    status: 'completed'
  },
  {
    id: 'TRIP-9890',
    rideId: 'SW-83842',
    date: 'Yesterday',
    time: '18:25',
    customerName: 'Sanjay Reddy',
    pickupAddress: 'Sarjapur Main Road, Bellandur',
    dropAddress: 'Green Glen Layout',
    distanceKm: 2.9,
    durationMin: 10,
    grossFare: 70,
    platformFee: 0,
    captainEarning: 70,
    paymentMode: 'CASH',
    vehicleType: 'bike',
    customerRating: 5,
    status: 'completed'
  }
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'TXN-9012',
    title: 'Ride Earning #SW-83921 (100% Net Fare)',
    type: 'ride_credit',
    amount: 120,
    date: 'Today, 18:42',
    time: '18:42',
    status: 'success',
    referenceId: 'UPI-849204128',
    breakdown: {
      grossFare: 120,
      platformFee: 0,
      tip: 0
    }
  },
  {
    id: 'TXN-9011',
    title: '24-Hour Bike Daily Pass Recharge (0% Comm)',
    type: 'pass_subscription',
    amount: -15,
    date: 'Today, 06:00',
    time: '06:00',
    status: 'success',
    referenceId: 'PASS-849201',
    breakdown: {
      passCost: 15
    }
  },
  {
    id: 'TXN-9010',
    title: 'Instant Payout to HDFC Bank UPI',
    type: 'withdrawal',
    amount: -850,
    date: 'Today, 14:00',
    time: '14:00',
    status: 'success',
    referenceId: 'PAY-89214710',
    upiId: 'rajesh.sawari@okhdfcbank'
  },
  {
    id: 'TXN-9009',
    title: 'Peak Hour 5-Ride Target Bonus',
    type: 'incentive_bonus',
    amount: 150,
    date: 'Yesterday, 21:00',
    time: '21:00',
    status: 'success',
    referenceId: 'INC-772910'
  },
  {
    id: 'TXN-9008',
    title: 'Ride Earning #SW-83860 (100% Net Fare)',
    type: 'ride_credit',
    amount: 140,
    date: 'Yesterday, 20:10',
    time: '20:10',
    status: 'success',
    referenceId: 'UPI-772184',
    breakdown: {
      grossFare: 140,
      platformFee: 0,
      tip: 0
    }
  }
];

export const WEEKLY_EARNINGS_DATA: DailyEarningData[] = [
  { day: 'Mon', date: '25 Aug', earnings: 1450, trips: 14, hours: 7.5 },
  { day: 'Tue', date: '26 Aug', earnings: 1620, trips: 16, hours: 8.2 },
  { day: 'Wed', date: '27 Aug', earnings: 1250, trips: 12, hours: 6.0 },
  { day: 'Thu', date: '28 Aug', earnings: 1760, trips: 17, hours: 8.5 },
  { day: 'Fri', date: '29 Aug', earnings: 2150, trips: 21, hours: 9.2 },
  { day: 'Sat', date: '30 Aug', earnings: 2550, trips: 24, hours: 10.0 },
  { day: 'Sun (Today)', date: '31 Aug', earnings: 1560, trips: 15, hours: 6.8 }
];

export const MONTHLY_EARNINGS_DATA = [
  { week: 'Week 1', earnings: 11400, trips: 112 },
  { week: 'Week 2', earnings: 12700, trips: 128 },
  { week: 'Week 3', earnings: 13300, trips: 135 },
  { week: 'Week 4', earnings: 12100, trips: 119 }
];

export const INITIAL_ADMIN_STATS: AdminStats = {
  totalRides: 4892,
  totalGrossVolume: 648500,
  totalPassRevenue: 48650, // Total revenue from Daily Passes sold
  totalPassesSold: 2640,
  passSalesByVehicle: {
    bike: 1480, // 1480 * 15 = 22200
    auto: 720,  // 720 * 20 = 14400
    cab: 440    // 440 * 40 = 17600
  },
  pendingDriverPayouts: 18450,
  activeOnlineDrivers: 142,
  pendingKycApprovals: 3
};

// Pre-defined sample ride requests pool to pick or generate from
export const SAMPLE_RIDE_POOL = [
  {
    customerName: 'Amit Verma',
    customerPhone: '+91 98234 11290',
    customerRating: 4.9,
    pickupAddress: 'Koramangala 4th Block, 17th Main',
    pickupLandmark: 'Opposite Third Wave Coffee',
    dropAddress: 'Indiranagar 12th Main, HAL 2nd Stage',
    dropLandmark: 'Near Toit Pub',
    distanceKm: 5.4,
    estimatedTimeMin: 18,
    baseFare: 45,
    distanceRate: 14,
    surgeMultiplier: 1.4,
    paymentMode: 'ONLINE_UPI' as const,
    note: 'Will be waiting near main gate with yellow bag'
  },
  {
    customerName: 'Sneha Roy',
    customerPhone: '+91 97412 88301',
    customerRating: 4.8,
    pickupAddress: 'HSR Layout Sector 3, 27th Main',
    pickupLandmark: 'Beside Agara Lake Viewpoint',
    dropAddress: 'Bellandur EcoSpace Tech Park Gate 2',
    dropLandmark: 'Building 4A Visitor Entrance',
    distanceKm: 4.1,
    estimatedTimeMin: 14,
    baseFare: 40,
    distanceRate: 14,
    surgeMultiplier: 1.8,
    paymentMode: 'CASH' as const,
    note: 'Please bring helmet for passenger'
  },
  {
    customerName: 'Rahul Deshmukh',
    customerPhone: '+91 99120 77412',
    customerRating: 5.0,
    pickupAddress: 'Jyoti Nivas College Road',
    pickupLandmark: 'Near Empire Restaurant',
    dropAddress: 'St. John’s Hospital Main Gate, Hosur Rd',
    dropLandmark: 'OPD Reception Area',
    distanceKm: 2.6,
    estimatedTimeMin: 9,
    baseFare: 35,
    distanceRate: 13,
    surgeMultiplier: 1.2,
    paymentMode: 'ONLINE_UPI' as const,
    note: 'Need urgent ride for doctor appointment'
  },
  {
    customerName: 'Kavita Nair',
    customerPhone: '+91 98801 44921',
    customerRating: 4.7,
    pickupAddress: 'Domlur Flyover Bus Stop',
    pickupLandmark: 'Near EGL Back Gate',
    dropAddress: 'Koramangala Sony World Signal',
    dropLandmark: 'Near Croma Electronics',
    distanceKm: 4.9,
    estimatedTimeMin: 16,
    baseFare: 45,
    distanceRate: 14,
    surgeMultiplier: 1.5,
    paymentMode: 'SAWARI_WALLET' as const,
    note: 'Have exact cash or UPI'
  },
  {
    customerName: 'Deepak Sharma',
    customerPhone: '+91 98450 66320',
    customerRating: 4.95,
    pickupAddress: 'Tavarekere Main Road, BTM 1st Stage',
    pickupLandmark: 'Near Forum South Mall Flyover',
    dropAddress: 'Electronic City Phase 1, Toll Gate',
    dropLandmark: 'Infosys Gate 1',
    distanceKm: 9.8,
    estimatedTimeMin: 28,
    baseFare: 60,
    distanceRate: 15,
    surgeMultiplier: 1.6,
    paymentMode: 'ONLINE_UPI' as const,
    note: 'Highway route preferred'
  }
];

export function generateRandomRide(vehicleType: VehicleType): RideRequest {
  const template = SAMPLE_RIDE_POOL[Math.floor(Math.random() * SAMPLE_RIDE_POOL.length)];
  const rideId = `SW-${Math.floor(10000 + Math.random() * 90000)}`;
  const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

  let vehicleMultiplier = 1.0;
  if (vehicleType === 'auto') vehicleMultiplier = 1.6;
  if (vehicleType === 'cab') vehicleMultiplier = 2.8;

  const rawFare = (template.baseFare + template.distanceKm * template.distanceRate) * template.surgeMultiplier * vehicleMultiplier;
  const fareTotal = Math.round(rawFare); // Gross ride fare
  
  // 0% COMMISSION SAWARI MODEL:
  const platformFee = 0; // ₹0 Platform Commission
  const tips = Math.random() > 0.65 ? 20 : 0; // 100% to captain
  const captainEarning = fareTotal + tips; // 100% of gross fare + 100% tip
  const surgeBonus = Math.round((template.surgeMultiplier - 1.0) * fareTotal * 0.5);

  return {
    id: rideId,
    customerName: template.customerName,
    customerPhone: template.customerPhone,
    customerRating: template.customerRating,
    pickupAddress: template.pickupAddress,
    pickupLandmark: template.pickupLandmark,
    pickupCoords: {
      lat: 12.9352 + (Math.random() - 0.5) * 0.02,
      lng: 77.6245 + (Math.random() - 0.5) * 0.02
    },
    dropAddress: template.dropAddress,
    dropLandmark: template.dropLandmark,
    dropCoords: {
      lat: 12.9719 + (Math.random() - 0.5) * 0.03,
      lng: 77.6412 + (Math.random() - 0.5) * 0.03
    },
    distanceKm: template.distanceKm,
    estimatedTimeMin: template.estimatedTimeMin,
    fareTotal,
    captainEarning,
    platformFee,
    surgeBonus,
    tollFee: 0,
    tips,
    paymentMode: template.paymentMode,
    vehicleType,
    otp,
    createdAt: Date.now(),
    expiresInSeconds: 15,
    note: template.note
  };
}


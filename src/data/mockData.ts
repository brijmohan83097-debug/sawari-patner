import { DriverProfile, HeatmapZone, CompletedTripRecord, WalletTransaction, DailyEarningData, RideRequest, VehicleType, AdminStats } from '../types';

export const MASTER_ADMIN_PHONE = '9052931129';

// Default clean captain profile (no mock data or dummy credentials)
export const INITIAL_DRIVER: DriverProfile = {
  id: 'DRV-NEW',
  badgeId: 'SW-NEW',
  name: 'New Captain',
  email: '',
  phone: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  vehicleType: 'bike',
  vehicleModel: '',
  vehicleNumber: '',
  city: 'Bengaluru',
  rating: 5.0,
  totalTrips: 0,
  acceptanceRate: 100,
  cancellationRate: 0,
  isKycVerified: false,
  kycStatus: 'pending',
  joinedDate: 'Today',
  upiId: '',
  bankAccount: {
    accountNumber: '',
    ifsc: '',
    bankName: ''
  },
  bloodGroup: '',
  emergencyContact: '',
  currentDutyStatus: 'offline',
  currentLocation: { lat: 17.3850, lng: 78.4867 },
  kycDocs: []
};

// All mock/dummy captain profiles and fallback arrays have been completely purged.
// Real captains are loaded exclusively from live Firestore and persistent IndexedDB records.
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
export const INITIAL_COMPLETED_TRIPS: CompletedTripRecord[] = [];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

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
  totalRides: 0,
  totalGrossVolume: 0,
  totalPassRevenue: 0,
  totalPassesSold: 0,
  passSalesByVehicle: {
    bike: 0,
    auto: 0,
    cab: 0
  },
  pendingDriverPayouts: 0,
  activeOnlineDrivers: 0,
  pendingKycApprovals: 0
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


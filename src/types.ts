export type VehicleType = 'bike' | 'auto' | 'cab';

export type DutyStatus = 'offline' | 'online' | 'busy';

export type DriverKycStatus = 'approved' | 'pending' | 'rejected';

export type AppViewMode = 'driver' | 'admin' | 'passenger' | 'split';

export type RideStatus = 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SharedRide {
  id: string;
  status: RideStatus;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerRating: number;
  pickupAddress: string;
  pickupLandmark?: string;
  pickupCoords: LatLng;
  dropAddress: string;
  dropLandmark?: string;
  dropCoords: LatLng;
  fare: number;
  captainEarning: number;
  distanceKm: number;
  estimatedTimeMin: number;
  vehicleType: VehicleType;
  otp: string;
  paymentMode: PaymentMode;
  createdAt: number;
  expiresInSeconds?: number;
  note?: string;
  // Captain details once assigned
  captainId?: string;
  captainName?: string;
  captainPhone?: string;
  captainAvatar?: string;
  captainRating?: number;
  vehicleModel?: string;
  vehicleNumber?: string;
  driverLocation?: LatLng;
  driverHeading?: number;
  driverProgress?: number;
  // Lifecycle timestamps
  acceptedAt?: number;
  arrivedAt?: number;
  startedAt?: number;
  completedAt?: number;
  rating?: number;
  feedback?: string;
}

export type TripStep = 
  | 'idle' 
  | 'incoming_request' 
  | 'navigating_pickup' 
  | 'arrived_pickup' 
  | 'verifying_otp' 
  | 'on_trip' 
  | 'trip_summary';

export type PaymentMode = 'CASH' | 'ONLINE_UPI' | 'SAWARI_WALLET';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DailyPass {
  id: string;
  driverId: string;
  driverName?: string;
  vehicleType: VehicleType;
  price: number; // ₹15 (Bike), ₹20 (Auto), ₹40 (Cab)
  purchasedAt: number; // timestamp
  expiresAt: number; // timestamp (24 hours)
  paymentMethod: 'UPI' | 'WALLET';
  status: 'active' | 'expired';
  hoursTotal: number;
}

export const DAILY_PASS_PRICES: Record<VehicleType, { price: number; name: string; icon: string; description: string }> = {
  bike: {
    price: 15,
    name: 'Bike Taxi Daily Pass',
    icon: '🛵',
    description: '24-Hour Unlimited Rides at 0% Commission'
  },
  auto: {
    price: 20,
    name: 'Auto Daily Pass',
    icon: '🛺',
    description: '24-Hour Unlimited Rides at 0% Commission'
  },
  cab: {
    price: 40,
    name: 'Car / Cab Daily Pass',
    icon: '🚗',
    description: '24-Hour Unlimited Rides at 0% Commission'
  }
};

export interface HeatmapZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  surge: number;
  demandLevel: 'high' | 'very_high' | 'surge_peak';
  radius: number;
  activeRiders: number;
}

export interface KycDoc {
  id: string;
  title: string;
  docNumber: string;
  status: 'verified' | 'pending' | 'rejected';
  verifiedOn?: string;
  expiryDate?: string;
  fileUrl?: string;
  frontImage?: string;
  backImage?: string;
  uploadedAt?: number;
  rejectionReason?: string;
}

export interface DriverProfile {
  id: string;
  badgeId: string; // e.g. SW-DRV-108
  name: string;
  email: string;
  phone: string;
  avatar: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
  city: string;
  rating: number;
  totalTrips: number;
  acceptanceRate: number;
  cancellationRate: number;
  isKycVerified: boolean;
  kycStatus: DriverKycStatus;
  rejectionReason?: string;
  joinedDate: string;
  kycDocs: KycDoc[];
  upiId: string;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  bloodGroup?: string;
  emergencyContact?: string;
  currentDutyStatus?: DutyStatus;
  currentLocation?: LatLng;
  activePass?: DailyPass | null;
  walletBalance?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: 'driver' | 'admin';
  driverId?: string;
  adminEmail?: string;
}

export interface RideRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerRating: number;
  pickupAddress: string;
  pickupLandmark?: string;
  pickupCoords: LatLng;
  dropAddress: string;
  dropLandmark?: string;
  dropCoords: LatLng;
  distanceKm: number;
  estimatedTimeMin: number;
  fareTotal: number; // Gross customer fare
  captainEarning: number; // 100% of gross fare + 100% tips (0% commission)
  platformFee: number; // Always ₹0 (Zero Commission)
  surgeBonus: number;
  tollFee: number;
  tips: number;
  paymentMode: PaymentMode;
  vehicleType: VehicleType;
  otp: string;
  createdAt: number;
  expiresInSeconds: number;
  note?: string;
}

export interface CompletedTripRecord {
  id: string;
  rideId: string;
  date: string;
  time: string;
  customerName: string;
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  durationMin: number;
  grossFare: number;
  platformFee: number; // ₹0 (Zero Commission)
  captainEarning: number; // 100% take-home + tips
  paymentMode: PaymentMode;
  vehicleType: VehicleType;
  customerRating: number;
  status: 'completed' | 'cancelled';
}

export interface WalletTransaction {
  id: string;
  title: string;
  type: 'ride_credit' | 'withdrawal' | 'incentive_bonus' | 'toll_reimbursement' | 'commission_fee' | 'pass_subscription' | 'wallet_recharge' | 'add_money';
  amount: number;
  date: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
  referenceId: string;
  upiId?: string;
  breakdown?: {
    grossFare?: number;
    platformFee?: number;
    tip?: number;
    passCost?: number;
  };
}

export interface DailyEarningData {
  day: string;
  date: string;
  earnings: number;
  trips: number;
  hours: number;
}

export interface AdminStats {
  totalRides: number;
  totalGrossVolume: number;
  totalPassRevenue: number; // Revenue from Daily Pass subscriptions
  totalPassesSold: number;
  passSalesByVehicle: {
    bike: number;
    auto: number;
    cab: number;
  };
  pendingDriverPayouts: number;
  activeOnlineDrivers: number;
  pendingKycApprovals: number;
}


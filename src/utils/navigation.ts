import { LatLng, RideRequest, TripStep } from '../types';

/**
 * Generates the official Google Maps Turn-by-Turn Navigation deep-link URL.
 * Used for one-click native app navigation for driver captains.
 */
export function getGoogleMapsNavigationUrl(
  destination: LatLng,
  origin?: LatLng
): string {
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
  if (origin) {
    url += `&origin=${origin.lat},${origin.lng}`;
  }
  return url;
}

/**
 * Determines current target coordinates and label for turn-by-turn navigation
 * based on the active ride trip step.
 */
export function getActiveNavigationTarget(
  ride: RideRequest,
  tripStep: TripStep
): {
  coords: LatLng;
  label: string;
  subLabel: string;
  stepName: 'pickup' | 'drop';
} {
  if (tripStep === 'on_trip') {
    return {
      coords: ride.dropCoords,
      label: ride.dropAddress,
      subLabel: ride.dropLandmark ? `Near ${ride.dropLandmark}` : 'Customer Destination',
      stepName: 'drop'
    };
  }

  // Navigating to pickup or waiting at pickup
  return {
    coords: ride.pickupCoords,
    label: ride.pickupAddress,
    subLabel: ride.pickupLandmark ? `Near ${ride.pickupLandmark}` : 'Customer Pickup Point',
    stepName: 'pickup'
  };
}

/**
 * Triggers one-click deep-link opening to the Google Maps native mobile app or web.
 */
export function openGoogleMapsTurnByTurn(
  destination: LatLng,
  origin?: LatLng
): void {
  const url = getGoogleMapsNavigationUrl(destination, origin);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Interpolates between two LatLng points based on percentage (0 - 100)
 */
export function interpolateCoordinates(
  start: LatLng,
  end: LatLng,
  progressPercentage: number
): LatLng {
  const t = Math.max(0, Math.min(100, progressPercentage)) / 100;
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t
  };
}

/**
 * Computes bearing angle in degrees between two GPS coordinates
 */
export function calculateBearing(start: LatLng, end: LatLng): number {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

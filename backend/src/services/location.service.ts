import { calculateDistance } from '../utils/distance';

export class LocationService {
  /**
   * Validates if the user's login location is within the allowed radius
   * of the office location.
   *
   * @returns true if within radius, false otherwise
   */
  static isWithinRadius(
    officeLatitude: number,
    officeLongitude: number,
    userLatitude: number,
    userLongitude: number,
    radiusMeters: number,
  ): boolean {
    const distance = calculateDistance(
      officeLatitude,
      officeLongitude,
      userLatitude,
      userLongitude,
    );
    return distance <= radiusMeters;
  }
}

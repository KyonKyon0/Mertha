export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    // Convert to meters
    const meters = Math.round(distanceInKm * 1000);
    return `${meters} m`;
  }
  // Format with one decimal and Indonesian locale comma
  return `${distanceInKm.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

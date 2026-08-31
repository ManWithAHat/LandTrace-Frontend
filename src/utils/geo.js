/** Great-circle distance in metres between two [lng, lat] points. */
export function haversineDistance([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** [lng, lat] -> react-native-maps' {latitude, longitude}. */
export const toLatLng = ([lon, lat]) => ({ latitude: lat, longitude: lon });

/** A GeoJSON Polygon's outer ring (array of [lng, lat]) -> react-native-maps coordinates. */
export function ringToLatLngs(ring) {
  return ring.map(toLatLng);
}

/** Fits a MapView region around one or more rings of [lng, lat] points. */
export function regionForRings(rings, paddingFactor = 0.4) {
  const points = rings.flat();
  const lats = points.map(([, lat]) => lat);
  const lons = points.map(([lon]) => lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat, 0.0005) * (1 + paddingFactor),
    longitudeDelta: Math.max(maxLon - minLon, 0.0005) * (1 + paddingFactor),
  };
}

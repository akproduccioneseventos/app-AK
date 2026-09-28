/**
 * Cálculo geodésico de distancias y extracción de coordenadas de mapas.
 */

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas usando la fórmula de Haversine.
 * Retorna los metros redondeados al entero más cercano.
 */
export function calcularDistanciaMetros(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
): number {
  const R = 6371000; // Radio medio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Extrae latitud y longitud de un enlace de Google Maps (@lat,lng o ?q=lat,lng).
 */
export function extraerCoordenadasDeUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') return null;

  // 1) Enlace con @lat,lng (ej: https://www.google.com/maps/@-34.9056,-56.1861,17z)
  const matchAt = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (matchAt) {
    const lat = parseFloat(matchAt[1]);
    const lng = parseFloat(matchAt[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 2) Parámetro q=lat,lng o ll=lat,lng (ej: https://maps.google.com/?q=-34.9056,-56.1861)
  const matchQ = url.match(/[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (matchQ) {
    const lat = parseFloat(matchQ[1]);
    const lng = parseFloat(matchQ[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 3) Enlace de búsqueda o destino directo (ej: maps/place/-34.9056,-56.1861)
  const matchSearch = url.match(/(?:place|search|destination)\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (matchSearch) {
    const lat = parseFloat(matchSearch[1]);
    const lng = parseFloat(matchSearch[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

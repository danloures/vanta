interface GeocodeInput { location?: string; city?: string; state?: string; }
let lastRequestTime = 0; const THROTTLE_MS = 1100;
export async function geocodeEventAddress(input: GeocodeInput): Promise<{ latitude: number; longitude: number; query: string } | null> {
  const { city, state } = input; if (!city || !state) return null;
  const now = Date.now(); const waitTime = Math.max(0, THROTTLE_MS - (now - lastRequestTime));
  if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime));
  lastRequestTime = Date.now();
  try {
    const q = `${input.location ? input.location + ', ' : ''}${city}, ${state}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Vanta-Lifestyle-App/1.0' } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon), query: q };
    return null;
  } catch { return null; }
}
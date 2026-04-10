import Constants from 'expo-constants';

// On a physical device, localhost points to the phone — resolve the Mac's
// LAN IP from whichever Expo manifest field is available in this SDK version.
const devHost: string =
  (Constants as any).expoGoConfig?.debuggerHost?.split(':')[0] ??
  Constants.expoConfig?.hostUri?.split(':')[0] ??
  (Constants as any).manifest?.debuggerHost?.split(':')[0] ??
  (Constants as any).manifest2?.extra?.expoGo?.debuggerHost?.split(':')[0] ??
  'localhost';

export const API_BASE_URL = __DEV__
  ? `http://${devHost}:3000`
  : 'https://api.trano.mg';

// Pre-filled WhatsApp message in Malagasy
export const WHATSAPP_PREFILL = (listingTitle: string) =>
  `Salama! Mahafinaritra ahy ny antsoinao momba ny lisitry ny: ${listingTitle}`;

export const COLORS = {
  // Brand — desaturated slate-green palette
  primary:       '#1A2B24', // dark slate green — header, CTAs, dark sections
  primaryMid:    '#2C4238', // muted forest green — accents, active states
  primaryLight:  '#4A7260', // sage green — tags, verified badges
  accent:        '#E8A000', // warm amber — price highlights, badges

  // Neutrals
  background:    '#F5F5F0', // warm off-white — screen backgrounds
  surface:       '#FFFFFF', // pure white — cards, modals
  border:        '#E8E8E3', // subtle warm border
  divider:       '#F0F0EC', // very light divider

  // Text
  text:          '#111111', // near-black primary text
  textSecondary: '#555550', // secondary text
  textMuted:     '#999990', // muted / placeholder

  // Semantic
  danger:        '#D94040',
  whatsapp:      '#25D366',
};

// Madagascar bounding box — if user is outside this, default to Antananarivo
export const MADAGASCAR_BOUNDS = {
  minLat: -25.6,
  maxLat: -11.9,
  minLng:  43.2,
  maxLng:  50.5,
};

export const isInMadagascar = (lat: number, lng: number): boolean =>
  lat >= MADAGASCAR_BOUNDS.minLat &&
  lat <= MADAGASCAR_BOUNDS.maxLat &&
  lng >= MADAGASCAR_BOUNDS.minLng &&
  lng <= MADAGASCAR_BOUNDS.maxLng;

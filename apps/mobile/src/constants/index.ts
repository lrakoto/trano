export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.trano.mg';

// Pre-filled WhatsApp message in Malagasy
export const WHATSAPP_PREFILL = (listingTitle: string) =>
  `Salama! Mahafinaritra ahy ny antsoinao momba ny lisitry ny: ${listingTitle}`;

export const COLORS = {
  // Brand
  primary:       '#0F2D1F', // very deep green — header, CTAs
  primaryMid:    '#1B4332', // mid green — accents, active states
  primaryLight:  '#40916C', // light green — tags, verified badges
  accent:        '#F0A500', // warm amber — price highlights, badges

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

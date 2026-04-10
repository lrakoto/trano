export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.trano.mg';

// Pre-filled WhatsApp message in Malagasy
export const WHATSAPP_PREFILL = (listingTitle: string) =>
  `Salama! Mahafinaritra ahy ny antsoinao momba ny lisitry ny: ${listingTitle}`;

export const COLORS = {
  primary:    '#1B4332', // deep green — evokes Madagascar's lush landscape
  secondary:  '#40916C',
  accent:     '#D4A017', // warm gold
  background: '#F9F9F9',
  text:       '#1A1A1A',
  textMuted:  '#666666',
  border:     '#E0E0E0',
  white:      '#FFFFFF',
  danger:     '#E53E3E',
  whatsapp:   '#25D366',
};

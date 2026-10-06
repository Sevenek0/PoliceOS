import type { AccentColor } from '../types';

export const ACCENTS: { key: AccentColor; hex: string; label: string }[] = [
  { key: 'navy', hex: '#4A78C8', label: 'Granatowy (LSPD)' },
  { key: 'brown', hex: '#B08A5B', label: 'Brązowy' },
  { key: 'gold', hex: '#C9A227', label: 'Złoty' },
  { key: 'burgundy', hex: '#B8475E', label: 'Bordowy' },
  { key: 'green', hex: '#3E9B72', label: 'Zielony' },
];

export const POSITIONS = [
  'Kadet',
  'Officer I',
  'Officer II',
  'Officer III',
  'Senior Lead Officer',
  'Sergeant I',
  'Sergeant II',
  'Detective',
  'Lieutenant',
  'Captain',
  'Commander',
  'Deputy Chief',
  'Chief of Police',
];

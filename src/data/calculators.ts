import type { CalculatorConfig, CalcResult } from '../types';
import { MAX_FINE, MAX_SENTENCE_MONTHS, MINUTES_PER_MONTH, formatMoney } from './penalCode';

const num = (v: number | string | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : NaN;
};

function result(value: string, label: string, interpretation: string, color: CalcResult['color']): CalcResult {
  return { value, label, interpretation, color };
}

/** Okoliczności do kalkulatora wyroku — procentowa zmiana kary bazowej. */
export const MITIGATING: { key: string; label: string; percent: number }[] = [
  { key: 'confession', label: 'Przyznanie się do winy', percent: -20 },
  { key: 'cooperation', label: 'Współpraca z organami ścigania', percent: -25 },
  { key: 'firstTime', label: 'Pierwszy konflikt z prawem', percent: -10 },
  { key: 'restitution', label: 'Naprawienie szkody', percent: -15 },
  { key: 'plea', label: 'Porozumienie procesowe (plea deal)', percent: -30 },
];

export const AGGRAVATING: { key: string; label: string; percent: number }[] = [
  { key: 'recidivism', label: 'Recydywa', percent: 25 },
  { key: 'group', label: 'Działanie w zorganizowanej grupie', percent: 15 },
  { key: 'weapon', label: 'Użycie broni', percent: 20 },
  { key: 'officer', label: 'Czyn wobec funkcjonariusza', percent: 20 },
  { key: 'vulnerable', label: 'Ofiara bezbronna / nieletnia', percent: 15 },
  { key: 'noRemorse', label: 'Brak skruchy, utrudnianie postępowania', percent: 10 },
];

/** Łączny mnożnik z zaznaczonych okoliczności, ograniczony do przedziału 0,5–2,0. */
export function sentenceMultiplier(selected: Set<string>): number {
  const sum = [...MITIGATING, ...AGGRAVATING].filter((m) => selected.has(m.key)).reduce((s, m) => s + m.percent, 0);
  return Math.min(2, Math.max(0.5, 1 + sum / 100));
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h} godz. ${m} min` : `${m} min`;
}

export const CALCULATORS: CalculatorConfig[] = [
  {
    id: 'taryfikator', title: 'Kalkulator zatrzymania', subtitle: 'Odsiadka i grzywna z taryfikatora z okolicznościami', icon: 'siren',
    category: 'critical', custom: 'sentence', fields: [],
    compute: () => null,
  },

  {
    id: 'mandat-predkosc', title: 'Mandat za prędkość', subtitle: 'Grzywna i środki za przekroczenie dozwolonej prędkości', icon: 'gauge',
    category: 'critical',
    fields: [
      { key: 'limit', label: 'Ograniczenie prędkości', unit: 'mph', type: 'select', defaultValue: '50', options: [
        { label: 'Teren zabudowany — 50 mph', value: '50' },
        { label: 'Drogi poza miastem — 70 mph', value: '70' },
        { label: 'Autostrada — 90 mph', value: '90' },
      ] },
      { key: 'speed', label: 'Zmierzona prędkość', unit: 'mph', type: 'number', placeholder: 'np. 95' },
      { key: 'repeat', label: 'Recydywa (w tym samym dniu)', type: 'select', defaultValue: '1', options: [
        { label: 'Nie', value: '1' }, { label: 'Tak (×2)', value: '2' },
      ] },
    ],
    referenceTable: { title: 'Przekroczenie', rows: [
      { label: 'do 10 mph', range: '250 $', color: 'success' },
      { label: '11–20 mph', range: '500 $', color: 'success' },
      { label: '21–30 mph', range: '1 000 $', color: 'warning' },
      { label: '31–50 mph', range: '2 500 $ + zatrzymanie prawa jazdy', color: 'warning' },
      { label: 'ponad 50 mph', range: '5 000 $ + zatrzymanie, art. o niebezpiecznej jeździe', color: 'danger' },
    ] },
    compute: (v) => {
      const limit = num(v.limit);
      const speed = num(v.speed);
      if (!Number.isFinite(speed) || !Number.isFinite(limit)) return null;
      const over = Math.round(speed - limit);
      if (over <= 0) return result('0 $', 'brak wykroczenia', `Prędkość w normie (limit ${limit} mph).`, 'success');
      const tiers: [number, number, string, CalcResult['color']][] = [
        [10, 250, 'Pouczenie lub mandat.', 'success'],
        [20, 500, 'Mandat karny.', 'success'],
        [30, 1000, 'Mandat karny.', 'warning'],
        [50, 2500, 'Mandat karny i zatrzymanie prawa jazdy.', 'warning'],
        [Infinity, 5000, 'Zatrzymanie prawa jazdy — rozważ zatrzymanie kierowcy za niebezpieczną jazdę.', 'danger'],
      ];
      const [, fine, note, color] = tiers.find(([max]) => over <= max)!;
      const total = Math.min(MAX_FINE, fine * (num(v.repeat) || 1));
      return result(formatMoney(total), `grzywny za +${over} mph`, note, color);
    },
  },

  {
    id: 'przelicznik-odsiadki', title: 'Przelicznik czasu odsiadki', subtitle: `Miesiące RP ↔ minuty w grze (1 mies. = ${MINUTES_PER_MONTH} min)`, icon: 'timer',
    category: 'standard',
    fields: [
      { key: 'direction', label: 'Kierunek', type: 'select', defaultValue: 'toMinutes', options: [
        { label: 'Miesiące RP → minuty w grze', value: 'toMinutes' },
        { label: 'Minuty w grze → miesiące RP', value: 'toMonths' },
      ] },
      { key: 'amount', label: 'Wartość', type: 'number', placeholder: 'np. 45' },
      { key: 'credit', label: 'Zaliczony areszt (mies.)', type: 'number', defaultValue: 0 },
    ],
    referenceTable: { title: 'Zasady', rows: [
      { label: '1 miesiąc RP', range: `${MINUTES_PER_MONTH} min odsiadki w grze`, color: 'accent' },
      { label: 'Limit kary', range: `${MAX_SENTENCE_MONTHS} mies. (${MAX_SENTENCE_MONTHS * MINUTES_PER_MONTH} min)`, color: 'warning' },
      { label: 'Zaliczony areszt', range: 'odejmowany od kary', color: 'muted' },
    ] },
    compute: (v) => {
      const amount = num(v.amount);
      if (!Number.isFinite(amount) || amount < 0) return null;
      const credit = Math.max(0, num(v.credit) || 0);
      if (v.direction === 'toMonths') {
        const months = amount / MINUTES_PER_MONTH;
        return result(`${Math.round(months * 10) / 10} mies.`, 'kary RP', `${amount} min odsiadki w grze to ${Math.round(months * 10) / 10} mies. kary RP.`, 'accent');
      }
      const months = Math.min(amount, MAX_SENTENCE_MONTHS);
      const toServe = Math.max(0, months - credit);
      const minutes = toServe * MINUTES_PER_MONTH;
      const capped = amount > MAX_SENTENCE_MONTHS ? ` Kara obcięta do limitu ${MAX_SENTENCE_MONTHS} mies.` : '';
      const creditNote = credit > 0 ? ` Po zaliczeniu ${credit} mies. aresztu.` : '';
      return result(formatDuration(minutes), 'do odbycia w grze', `${toServe} mies. kary do odbycia.${creditNote}${capped}`, toServe === 0 ? 'success' : 'accent');
    },
  },
];

export { MAX_FINE, MAX_SENTENCE_MONTHS };

import type { AtlasConfig, AtlasEntry } from '../types';
import { CATEGORY_LABELS, CHAPTERS, PENAL_CODE, formatMoney, formatMonths } from './penalCode';
import { PROCEDURE_CATEGORIES, PROCEDURE_ENTRIES } from './procedures';
import { RADIO_CATEGORIES, RADIO_ENTRIES } from './radioCodes';

const CATEGORY_BADGE = { wykroczenie: 'success', przestepstwo: 'warning', zbrodnia: 'danger' } as const;
const CHAPTER_LABEL: Record<string, string> = Object.fromEntries(CHAPTERS.map((c) => [c.key, c.label]));

const PENAL_ENTRIES: AtlasEntry[] = PENAL_CODE.map((art) => ({
  id: art.id,
  name: art.title,
  subtitle: art.article,
  category: art.chapter,
  categoryLabel: CHAPTER_LABEL[art.chapter],
  domain: art.category,
  domainLabel: CATEGORY_LABELS[art.category],
  badgeLabel: CATEGORY_LABELS[art.category],
  badgeColor: CATEGORY_BADGE[art.category],
  stats: [
    { label: 'Kara więzienia', value: formatMonths(art.months) },
    { label: 'Grzywna', value: formatMoney(art.fine) },
    { label: 'Kaucja', value: art.noBail ? 'Niedopuszczalna' : 'Dopuszczalna' },
  ],
  tabs: [
    { label: 'Opis czynu', content: art.description },
    ...(art.notes ? [{ label: 'Uwagi', content: art.notes }] : []),
  ],
}));

export const ATLAS_KODEKS: AtlasConfig = {
  id: 'kodeks-karny',
  title: 'Kodeks karny (taryfikator)',
  icon: 'book-bookmark',
  description: 'Artykuły kodeksu karnego Stanu San Andreas — kary, grzywny i kategorie czynów.',
  searchPlaceholder: 'Szukaj artykułu lub czynu...',
  itemNounSingular: 'artykuł',
  entries: PENAL_ENTRIES,
  categories: CHAPTERS,
  domains: [
    { key: 'all', label: 'Wszystkie' },
    { key: 'wykroczenie', label: 'Wykroczenia' },
    { key: 'przestepstwo', label: 'Przestępstwa' },
    { key: 'zbrodnia', label: 'Zbrodnie' },
  ],
  detailKind: 'sections',
};

export const ATLAS_PROCEDUR: AtlasConfig = {
  id: 'procedury',
  title: 'Procedury policyjne',
  icon: 'clipboard-list',
  description: 'Zatrzymanie, przeszukanie, kontrola drogowa, pościg, użycie siły i przekazanie sprawy do DOJ.',
  searchPlaceholder: 'Szukaj procedury...',
  itemNounSingular: 'procedura',
  entries: PROCEDURE_ENTRIES,
  categories: PROCEDURE_CATEGORIES,
  detailKind: 'sections',
};

export const ATLAS_KODY: AtlasConfig = {
  id: 'kody-radiowe',
  title: 'Kody radiowe',
  icon: 'radio',
  description: '10-codes, statusy jednostek i kody odpowiedzi używane na kanale LSPD.',
  searchPlaceholder: 'Szukaj kodu...',
  itemNounSingular: 'kod',
  entries: RADIO_ENTRIES,
  categories: RADIO_CATEGORIES,
  detailKind: 'sections',
};

export const ATLASES: AtlasConfig[] = [ATLAS_KODEKS, ATLAS_PROCEDUR, ATLAS_KODY];

export function getAtlasById(id: string): AtlasConfig | undefined {
  return ATLASES.find((a) => a.id === id);
}

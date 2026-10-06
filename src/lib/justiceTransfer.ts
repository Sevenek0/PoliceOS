// Przekazanie dokumentu do JusticeOS — kod do wklejenia w formularzu DOJ („Importuj z PoliceOS”).
// Kod to `POS1.` + JSON w base64url; format musi zgadzać się z `src/lib/policeImport.ts` w JusticeOS.
import type { SavedDocument } from '../types';

export interface TransferPayload {
  v: 1;
  docNumber: string;
  docType: string;
  date: string;
  officer: { name: string; position: string; badge: string; unit: string };
  person: { name: string; dob: string; id: string; address: string } | null;
  charges: { article: string; description: string; category: string }[];
  place: string;
  eventDate: string;
  facts: string;
  evidence: string;
}

type Row = Record<string, unknown>;
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const lines = (...parts: string[]) => parts.filter(Boolean).join('\n\n');

/** Prefiks pól osoby, której dotyczy dokument, np. `detainee` → detaineeName, detaineeDob… */
const PERSON_PREFIX: Record<string, string> = {
  'protokol-zatrzymania': 'detainee',
  'mandat-karny': 'offender',
  'protokol-przeszukania': 'searched',
  'raport-uzycia-sily': 'subject',
  'wniosek-o-nakaz': 'target',
  'list-gonczy': 'wanted',
  'protokol-kolizji': 'driverA',
};

export const TRANSFERABLE = new Set([...Object.keys(PERSON_PREFIX), 'raport-interwencji', 'protokol-dowodow', 'raport-poscigu']);

function personOf(doc: SavedDocument): TransferPayload['person'] {
  const v = doc.values;
  const prefix = PERSON_PREFIX[doc.generatorId];
  if (prefix && text(v[`${prefix}Name`])) {
    return { name: text(v[`${prefix}Name`]), dob: text(v[`${prefix}Dob`]), id: text(v[`${prefix}Id`]), address: text(v[`${prefix}Address`]) };
  }
  // Raport z interwencji: pierwszy podejrzany z listy uczestników.
  const suspect = rows(v.involved).find((r) => r.role === 'Podejrzany');
  return suspect ? { name: text(suspect.name), dob: '', id: '', address: '' } : null;
}

function evidenceOf(v: Row): string {
  const items = rows(v.evidenceItems).map((r) =>
    [text(r.item), text(r.quantity) && `ilość: ${text(r.quantity)}`, text(r.location), text(r.evidenceNo) && `nr ${text(r.evidenceNo)}`]
      .filter(Boolean).join(', '));
  return lines(items.length ? `Zabezpieczone przedmioty:\n- ${items.join('\n- ')}` : '', text(v.confiscated), text(v.evidenceSummary));
}

export function buildPayload(doc: SavedDocument): TransferPayload {
  const v = doc.values;
  const charges = doc.generatorId === 'mandat-karny'
    ? rows(v.offensesList).map((r) => ({ article: text(r.article), description: text(r.description), category: 'Wykroczenie' }))
    : rows(v.charges).map((r) => ({ article: text(r.article), description: text(r.description), category: text(r.category) }));

  return {
    v: 1,
    docNumber: doc.docNumber,
    docType: doc.generatorTitle,
    date: doc.date,
    officer: { name: text(v.issuerName), position: text(v.issuerPosition), badge: text(v.issuerBadge), unit: doc.unit },
    person: personOf(doc),
    charges: charges.filter((c) => c.article || c.description),
    place: text(v.arrestPlace) || text(v.incidentPlace) || text(v.offensePlace) || text(v.searchPlace)
      || text(v.forcePlace) || text(v.eventPlace) || text(v.scene) || text(v.startPlace),
    eventDate: text(v.arrestDate) || text(v.incidentDate) || text(v.offenseDate) || text(v.searchDate)
      || text(v.forceDate) || text(v.eventDate) || text(v.securedAt) || text(v.startTime),
    facts: lines(
      text(v.narrative), text(v.reason) && `Podstawa zatrzymania: ${text(v.reason)}`, text(v.actions), text(v.notes),
      text(v.probableCause), text(v.chargesText), text(v.justification), text(v.description), text(v.searchNotes),
    ),
    evidence: evidenceOf(v),
  };
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeTransfer(doc: SavedDocument): string {
  return `POS1.${toBase64Url(JSON.stringify(buildPayload(doc)))}`;
}

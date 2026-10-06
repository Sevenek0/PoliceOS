// Kartoteka MDT — klient PoliceOS API (/api/mdt).
import { apiCall } from './api';
import type { SavedDocument } from '../types';

export interface MdtPerson {
  id: string;
  name: string;
  dob: string;
  ssn: string;
  phone: string;
  address: string;
  description: string;
  /** Licencje oddzielone przecinkami, np. „Prawo jazdy, Broń”. */
  licenses: string;
  wanted: boolean;
  wantedReason: string;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface MdtVehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  ownerId: string | null;
  ownerName: string;
  stolen: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type RecordKind = 'notatka' | 'mandat' | 'zatrzymanie' | 'poszukiwanie' | 'inne';

export interface MdtRecord {
  id: string;
  personId: string;
  kind: RecordKind;
  title: string;
  content: string;
  fine: number;
  jailMonths: number;
  docNumber: string;
  author: string;
  authorId: string;
  createdAt: string;
}

export type PersonInput = Omit<MdtPerson, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'> & { id?: string };
export type VehicleInput = Pick<MdtVehicle, 'plate' | 'model' | 'color' | 'ownerId' | 'stolen' | 'notes'> & { id?: string };
export type RecordInput = Pick<MdtRecord, 'kind' | 'title' | 'content' | 'fine' | 'jailMonths' | 'docNumber'>;

export interface SearchResult {
  persons: MdtPerson[];
  vehicles: MdtVehicle[];
  wanted: MdtPerson[];
  stolen: MdtVehicle[];
}

export const EMPTY_PERSON: PersonInput = {
  name: '', dob: '', ssn: '', phone: '', address: '', description: '', licenses: '', wanted: false, wantedReason: '',
};

export const EMPTY_VEHICLE: VehicleInput = { plate: '', model: '', color: '', ownerId: null, stolen: false, notes: '' };

export const EMPTY_RECORD: RecordInput = { kind: 'notatka', title: '', content: '', fine: 0, jailMonths: 0, docNumber: '' };

export const RECORD_KINDS: Record<RecordKind, { label: string; icon: string; className: string }> = {
  notatka: { label: 'Notatka', icon: 'sticky-note', className: 'bg-surface-3 text-ink-muted' },
  mandat: { label: 'Mandat', icon: 'receipt', className: 'bg-warning-soft text-warning' },
  zatrzymanie: { label: 'Zatrzymanie', icon: 'link-2', className: 'bg-danger-soft text-danger' },
  poszukiwanie: { label: 'Poszukiwanie', icon: 'siren', className: 'bg-danger-soft text-danger' },
  inne: { label: 'Inne', icon: 'file-text', className: 'bg-accent-soft text-accent-ink' },
};

export const LICENSES = ['Prawo jazdy', 'Prawo jazdy (ciężarowe)', 'Licencja na broń', 'Licencja pilota', 'Licencja łowiecka'];

export const searchMdt = (query: string) => apiCall<SearchResult>('mdt', { action: 'search', query });

export const getPerson = (id: string) =>
  apiCall<{ person: MdtPerson; records: MdtRecord[]; vehicles: MdtVehicle[] }>('mdt', { action: 'getPerson', id });

export const savePerson = (person: PersonInput) => apiCall<{ id: string }>('mdt', { action: 'savePerson', person });
export const deletePerson = (id: string) => apiCall('mdt', { action: 'deletePerson', id });

export const getVehicle = (id: string) => apiCall<{ vehicle: MdtVehicle }>('mdt', { action: 'getVehicle', id });
export const saveVehicle = (vehicle: VehicleInput) => apiCall<{ id: string }>('mdt', { action: 'saveVehicle', vehicle });
export const deleteVehicle = (id: string) => apiCall('mdt', { action: 'deleteVehicle', id });

export const addRecord = (personId: string, record: RecordInput) => apiCall<{ id: string }>('mdt', { action: 'addRecord', personId, record });
export const deleteRecord = (id: string) => apiCall('mdt', { action: 'deleteRecord', id });

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function formatDbDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}

const num = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

type Row = Record<string, unknown>;
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

/** Wpis do kartoteki na podstawie zapisanego dokumentu (zatrzymanie, mandat, raport…). */
export function recordFromDocument(doc: SavedDocument): RecordInput {
  const v = doc.values;
  const base = { docNumber: doc.docNumber, fine: 0, jailMonths: 0 };
  switch (doc.generatorId) {
    case 'protokol-zatrzymania': {
      const charges = rows(v.charges).map((c) => `${text(c.article)} ${text(c.description)}`.trim()).filter(Boolean);
      return {
        ...base, kind: 'zatrzymanie', title: `Zatrzymanie — ${text(v.arrestPlace) || doc.date}`,
        content: [charges.length ? `Zarzuty: ${charges.join('; ')}` : '', text(v.reason) && `Podstawa: ${text(v.reason)}`, text(v.notes)]
          .filter(Boolean).join('\n'),
        fine: num(v.fine), jailMonths: num(v.jailMonths),
      };
    }
    case 'mandat-karny': {
      const offenses = rows(v.offensesList).map((o) => `${text(o.article)} ${text(o.description)}`.trim()).filter(Boolean);
      return {
        ...base, kind: 'mandat', title: `Mandat — ${text(v.offensePlace) || doc.date}`,
        content: [offenses.join('; '), v.accepted === 'odmowa' ? 'Odmowa przyjęcia — sprawa skierowana do sądu.' : '']
          .filter(Boolean).join('\n'),
        fine: num(v.total),
      };
    }
    case 'list-gonczy':
      return { ...base, kind: 'poszukiwanie', title: 'List gończy', content: text(v.chargesText) };
    default:
      return { ...base, kind: 'notatka', title: doc.generatorTitle, content: text(v.narrative) || text(v.content) };
  }
}

/** Imię i nazwisko osoby, której dotyczy dokument — do dopasowania z kartoteką. */
export function documentSubject(doc: SavedDocument): string {
  const v = doc.values;
  return text(v.detaineeName) || text(v.offenderName) || text(v.wantedName) || text(v.searchedName) || text(v.subjectName);
}

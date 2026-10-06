// ---------- Shared domain types ----------

export interface AtlasTab {
  label: string;
  content: string;
}

export interface AtlasEntry {
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  categoryLabel: string;
  domain?: string;
  domainLabel?: string;
  tabs: AtlasTab[];
  /** Short badge shown next to the title, e.g. "Zbrodnia", "Wykroczenie" */
  badgeLabel?: string;
  badgeColor?: 'danger' | 'warning' | 'success' | 'accent';
  /** Alternate names/abbreviations line */
  synonyms?: string;
  /** Small stat chips shown in a row (kodeks: kara, grzywna, kategoria) */
  stats?: { label: string; value: string }[];
}

export type AtlasCategoryColor = 'danger' | 'warning' | 'success' | 'accent' | 'purple' | 'pink';

export interface AtlasCategoryMeta {
  key: string;
  label: string;
  domain?: string;
  color?: AtlasCategoryColor;
}

export interface AtlasDomainMeta {
  key: string;
  label: string;
}

export type AtlasDetailKind = 'tabs' | 'sections';

export interface AtlasConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
  searchPlaceholder: string;
  itemNounSingular: string;
  entries: AtlasEntry[];
  categories: AtlasCategoryMeta[];
  domains?: AtlasDomainMeta[];
  /** How the detail panel renders: switchable tabs or stacked labeled sections. */
  detailKind?: AtlasDetailKind;
}

// ---------- Generators (document forms) ----------

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'date'
  | 'number'
  | 'checkbox'
  | 'repeat';

export type PreviewKind = 'kv' | 'paragraph' | 'result' | 'repeat' | 'hidden';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  unit?: string;
  options?: SelectOption[];
  defaultValue?: string | number | boolean;
  previewKind?: PreviewKind;
  /** For type === 'repeat': the shape of one row */
  subFields?: FormField[];
  /** For previewKind 'result': values considered "positive/good" -> green, others -> red */
  resultGoodValues?: string[];
  fullWidth?: boolean;
}

export interface FormSection {
  key: string;
  title: string;
  icon: string;
  fields: FormField[];
}

export type AccentVariant = 'default' | 'success' | 'danger' | 'warning';

export interface GeneratorConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  docPrefix: string;
  docTypeLabel: string;
  /** Optional solemn line printed under the document title, e.g. "W imieniu Stanu San Andreas". */
  preamble?: string;
  accentVariant?: AccentVariant;
  category: 'priority' | 'standard';
  sections: FormSection[];
}

// ---------- Calculators ----------

export interface CalcField {
  key: string;
  label: string;
  unit?: string;
  placeholder?: string;
  type?: 'number' | 'select';
  options?: SelectOption[];
  defaultValue?: number | string;
}

export interface CalcRefRow {
  label: string;
  range: string;
  color: string; // 'success' | 'warning' | 'danger' | 'accent' | 'muted'
}

export interface CalcResult {
  value: string;
  label: string;
  interpretation: string;
  color: 'success' | 'warning' | 'danger' | 'accent';
}

export interface CalculatorConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'critical' | 'standard';
  /** 'sentence' renders the dedicated multi-article sentence calculator instead of the generic form. */
  custom?: 'sentence';
  fields: CalcField[];
  referenceTable?: { title: string; rows: CalcRefRow[] };
  compute: (values: Record<string, number | string>) => CalcResult | null;
}

// ---------- Penal code ----------

export type OffenseCategory = 'wykroczenie' | 'przestepstwo' | 'zbrodnia';

export interface PenalArticle {
  id: string;
  /** e.g. "Art. 112" */
  article: string;
  title: string;
  chapter: string;
  category: OffenseCategory;
  /** Prison time in RP months (1 month = 1 minute in game). */
  months: number;
  /** Fine in $. */
  fine: number;
  description: string;
  notes: string;
  /** No bail allowed for this offense. */
  noBail?: boolean;
}

// ---------- Officer profile / activity ----------

export type AccentColor = 'brown' | 'navy' | 'gold' | 'burgundy' | 'green';

export interface OfficerProfile {
  name: string;
  /** Sędzia / Prokurator / Adwokat / Urzędnik ... */
  position: string;
  /** Numer odznaki / legitymacji służbowej */
  badge: string;
  /** Jednostka, np. Sąd Okręgowy w Los Santos */
  unit: string;
  accent: AccentColor;
  theme: 'dark' | 'light';
  onboarded: boolean;
}

export interface ActivityEntry {
  id: string;
  kind: 'doc' | 'calc' | 'atlas';
  label: string;
  count: number;
  lastOpened: number;
}

// ---------- Saved documents ----------

export interface SavedDocument {
  id: string;
  generatorId: string;
  generatorTitle: string;
  generatorIcon: string;
  docNumber: string;
  date: string;
  unit: string;
  values: Record<string, unknown>;
  savedAt: number;
  /** Discord ID of the account that saved it (local cache only). */
  ownerId?: string;
  /** False while the document exists only in this browser and still waits to be uploaded. */
  synced?: boolean;
}

// ---------- Discord auth ----------

export interface DiscordUser {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
}

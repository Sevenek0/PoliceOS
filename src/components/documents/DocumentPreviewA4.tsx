import type { GeneratorConfig, FormField, FormSection } from '../../types';
import { SignatureBlock } from './SignatureBlock';
import { INSTITUTION_CITY, INSTITUTION_NAME, INSTITUTION_STATE } from '../../config';

const BANNER_COLORS: Record<string, string> = {
  default: '#1F3F7A',
  success: '#2F6B4F',
  danger: '#8E2C2C',
  warning: '#8A6516',
};

// Plain hex colors only in this subtree — html2canvas cannot parse Tailwind v4's
// oklch()-based color utilities, so exported PDF/PNG snapshots would fail silently.
const GRAY = { 900: '#111827', 800: '#27272a', 500: '#6b7280', 400: '#9ca3af', 300: '#d1d5db', 200: '#e5e7eb', 100: '#f3f4f6' };

/** Issuer data goes to the signature block, not into the document body. */
const ISSUER_KEYS = new Set(['issuerName', 'issuerPosition', 'issuerBadge', 'unit']);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface DocumentPreviewA4Props {
  config: GeneratorConfig;
  values: Record<string, unknown>;
  docNumber: string;
  date: string;
  unit: string;
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
}

function formatValue(field: FormField, v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Tak' : 'Nie';
  const raw = String(v);
  if (field.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${d}.${m}.${y}`;
  }
  if (field.type === 'select') {
    return field.options?.find((o) => o.value === raw)?.label ?? raw;
  }
  if (field.type === 'number' && field.unit === '$') {
    const n = Number(raw);
    return Number.isFinite(n) ? `${n.toLocaleString('pl-PL')} $` : raw;
  }
  return field.unit ? `${raw} ${field.unit}` : raw;
}

function visibleParts(section: FormSection, values: Record<string, unknown>) {
  const kvFields = section.fields.filter(
    (f) => (f.previewKind ?? 'kv') === 'kv' && !ISSUER_KEYS.has(f.key) && !isEmpty(values[f.key])
  );
  const paragraphFields = section.fields.filter((f) => f.previewKind === 'paragraph' && !isEmpty(values[f.key]));
  const repeatFields = section.fields.filter(
    (f) => f.previewKind === 'repeat' && Array.isArray(values[f.key]) && (values[f.key] as unknown[]).length > 0
  );
  return { kvFields, paragraphFields, repeatFields };
}

export function DocumentPreviewA4({ config, values, docNumber, date, unit }: DocumentPreviewA4Props) {
  const color = BANNER_COLORS[config.accentVariant ?? 'default'];
  const fields = config.sections.flatMap((s) => s.fields);
  const resultField = fields.find((f) => f.previewKind === 'result');
  const resultRaw = resultField ? String(values[resultField.key] ?? '') : '';
  const resultLabel = resultField && resultRaw ? formatValue(resultField, resultRaw) : '';
  const isGood = resultField?.resultGoodValues?.includes(resultRaw);

  const issuerName = String(values.issuerName ?? '');
  const issuerPosition = String(values.issuerPosition ?? '');
  const issuerBadge = String(values.issuerBadge ?? '');
  const signatureMode = (values.signatureMode as 'auto' | 'manual') ?? 'auto';

  const sections = config.sections
    .map((section) => ({ section, ...visibleParts(section, values) }))
    .filter((s) => s.kvFields.length + s.paragraphFields.length + s.repeatFields.length > 0);

  return (
    <div className="a4-sheet px-12 py-10 mx-auto" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: GRAY[900] }}>
      {/* Letterhead */}
      <div className="flex items-start justify-between gap-6 pb-4" style={{ borderBottom: `4px double ${color}` }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 54, height: 54, border: `2px solid ${color}`, color }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m12 8 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: GRAY[500] }}>{INSTITUTION_STATE}</div>
            <div className="text-base font-bold uppercase tracking-wide" style={{ color }}>{INSTITUTION_NAME}</div>
            <div className="text-xs mt-0.5" style={{ color: GRAY[800] }}>{unit || 'Jednostka nie została podana'}</div>
          </div>
        </div>
        <div className="text-right text-xs shrink-0">
          <div style={{ color: GRAY[500] }}>{INSTITUTION_CITY}, dnia {date}</div>
          <div className="mt-1.5" style={{ color: GRAY[500] }}>Nr dokumentu</div>
          <div className="font-mono text-sm font-semibold">{docNumber}</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mt-8 mb-7">
        <div className="text-xl font-bold uppercase tracking-[0.12em]">{config.docTypeLabel}</div>
        {config.preamble && (
          <div className="text-sm italic mt-2" style={{ color: GRAY[800] }}>{config.preamble}</div>
        )}
        <div className="mx-auto mt-3" style={{ width: 80, borderTop: `2px solid ${color}` }} />
      </div>

      <div className="space-y-5 text-sm" style={{ color: GRAY[800] }}>
        {sections.map(({ section, kvFields, paragraphFields, repeatFields }, i) => (
          <div key={section.key}>
            <div
              className="text-xs font-bold uppercase tracking-wide mb-2 pb-1"
              style={{ color, borderBottom: `1px solid ${GRAY[200]}` }}
            >
              {ROMAN[i] ?? i + 1}. {section.title}
            </div>

            {kvFields.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-2">
                {kvFields.map((f) => (
                  <div key={f.key} className="flex justify-between gap-2">
                    <span style={{ color: GRAY[500] }}>{f.label}</span>
                    <span className="font-medium text-right">{formatValue(f, values[f.key])}</span>
                  </div>
                ))}
              </div>
            )}

            {paragraphFields.map((f) => (
              <div key={f.key} className="mb-2">
                <div className="text-xs mb-0.5" style={{ color: GRAY[500] }}>{f.label}</div>
                <div className="whitespace-pre-line leading-relaxed text-justify">{String(values[f.key])}</div>
              </div>
            ))}

            {repeatFields.map((f) => {
              const rows = values[f.key] as Array<Record<string, string>>;
              return (
                <table key={f.key} className="w-full text-xs border-collapse mt-2">
                  <thead>
                    <tr>
                      <th className="text-left pb-1 pr-2 font-medium w-6" style={{ borderBottom: `1px solid ${GRAY[300]}`, color: GRAY[500] }}>Lp.</th>
                      {f.subFields?.map((sf) => (
                        <th key={sf.key} className="text-left pb-1 pr-3 font-medium" style={{ borderBottom: `1px solid ${GRAY[300]}`, color: GRAY[500] }}>
                          {sf.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 pr-2 align-top" style={{ borderBottom: `1px solid ${GRAY[100]}` }}>{idx + 1}.</td>
                        {f.subFields?.map((sf) => (
                          <td key={sf.key} className="py-1.5 pr-3 align-top" style={{ borderBottom: `1px solid ${GRAY[100]}` }}>
                            {row[sf.key] ? formatValue(sf, row[sf.key]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}
          </div>
        ))}

        {resultField && resultLabel && (
          <div className="flex justify-center py-3">
            <div
              className="px-8 py-2.5 text-sm font-bold uppercase tracking-[0.15em]"
              style={{
                border: `2px solid ${isGood ? '#2F6B4F' : '#8E2C2C'}`,
                color: isGood ? '#2F6B4F' : '#8E2C2C',
              }}
            >
              {resultField.label}: {resultLabel}
            </div>
          </div>
        )}
      </div>

      <SignatureBlock
        name={issuerName || '—'}
        position={issuerPosition || '—'}
        badge={issuerBadge || '—'}
        unit={unit || '—'}
        mode={signatureMode}
        color={color}
      />

      <div className="mt-10 pt-4 text-[9px] text-center leading-relaxed" style={{ borderTop: `1px solid ${GRAY[200]}`, color: GRAY[400] }}>
        Dokument wygenerowany w PoliceOS
      </div>
    </div>
  );
}

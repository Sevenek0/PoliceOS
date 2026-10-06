import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormField, GeneratorConfig } from '../../types';
import { exportElementAsFile } from '../../utils/exportDocument';
import { Icon } from '../Icon';
import { DocumentPreviewA4 } from '../documents/DocumentPreviewA4';
import { useOfficerProfile } from '../../store/useOfficerProfile';
import { useActivityLog } from '../../store/useActivityLog';
import { useDocumentHistory } from '../../store/useDocumentHistory';
import { ConfirmModal } from '../ConfirmModal';

function randomDocNumber(prefix: string): string {
  const digits = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}-${digits}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function emptyRow(subFields: FormField[]): Record<string, string> {
  return Object.fromEntries(subFields.map((sf) => [sf.key, '']));
}

export function GeneratorFormLayout({ config }: { config: GeneratorConfig }) {
  const officer = useOfficerProfile();
  const record = useActivityLog((s) => s.record);
  const saveDocument = useDocumentHistory((s) => s.save);
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [docNumber] = useState(() => randomDocNumber(config.docPrefix));
  const [date] = useState(() => todayLabel());
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const allFields = useMemo(() => config.sections.flatMap((s) => s.fields), [config]);

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of allFields) {
      if (f.type === 'repeat') init[f.key] = [];
      else if (f.defaultValue !== undefined) init[f.key] = f.defaultValue;
      else if (f.type === 'checkbox') init[f.key] = false;
      else init[f.key] = '';
    }
    init.issuerName = officer.name;
    init.issuerPosition = officer.position;
    init.issuerBadge = officer.badge;

    init.unit = officer.unit;
    init.signatureMode = 'auto';
    return init;
  });

  useEffect(() => {
    record('doc', config.id, config.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  const requiredFields = allFields.filter((f) => f.required);
  const isValid = requiredFields.every((f) => {
    const v = values[f.key];
    if (f.type === 'repeat') return Array.isArray(v) && v.length > 0;
    if (f.type === 'checkbox') return v === true;
    return v !== undefined && v !== null && String(v).trim() !== '';
  });

  function setField(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function addRow(field: FormField) {
    setValues((v) => ({ ...v, [field.key]: [...(v[field.key] as Record<string, string>[]), emptyRow(field.subFields ?? [])] }));
  }

  function updateRow(field: FormField, index: number, subKey: string, val: string) {
    setValues((v) => {
      const rows = [...(v[field.key] as Record<string, string>[])];
      rows[index] = { ...rows[index], [subKey]: val };
      return { ...v, [field.key]: rows };
    });
  }

  function removeRow(field: FormField, index: number) {
    setValues((v) => {
      const rows = [...(v[field.key] as Record<string, string>[])];
      rows.splice(index, 1);
      return { ...v, [field.key]: rows };
    });
  }

  async function exportAs(kind: 'pdf' | 'png') {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      await exportElementAsFile(previewRef.current, kind, docNumber);
    } finally {
      setExporting(false);
    }
  }

  function handleSaveConfirmed() {
    saveDocument({
      generatorId: config.id,
      generatorTitle: config.title,
      generatorIcon: config.icon,
      docNumber,
      date,
      unit: String(values.unit ?? ''),
      values,
    });
    setShowSaveConfirm(false);
    setSavedJustNow(true);
    setTimeout(() => setSavedJustNow(false), 2500);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto p-6 flex flex-col xl:flex-row gap-6">
        <div className="xl:w-[480px] shrink-0 space-y-4">
          <div>
            <h1 className="font-display font-bold text-xl">{config.title}</h1>
            <p className="text-sm text-ink-muted mt-0.5">{config.description}</p>
          </div>

          {config.sections.map((section) => {
            const requiredInSection = section.fields.filter((f) => f.required);
            const filledCount = requiredInSection.filter((f) => {
              const v = values[f.key];
              if (f.type === 'repeat') return Array.isArray(v) && v.length > 0;
              if (f.type === 'checkbox') return v === true;
              return v !== undefined && v !== null && String(v).trim() !== '';
            }).length;
            return (
              <div key={section.key} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name={section.icon} size={15} className="text-accent-ink" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{section.title}</h2>
                  </div>
                  {requiredInSection.length > 0 && (
                    <span className={`text-[11px] font-medium ${filledCount === requiredInSection.length ? 'text-success' : 'text-ink-faint'}`}>
                      {filledCount}/{requiredInSection.length} uzupełnionych
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {section.fields.map((f) => (
                    <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)}
                      onAddRow={() => addRow(f)} onUpdateRow={(i, sk, v) => updateRow(f, i, sk, v)} onRemoveRow={(i) => removeRow(f, i)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="sticky top-0 pt-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Podgląd na żywo
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!isValid}
                  onClick={() => setShowSaveConfirm(true)}
                  className="flex items-center gap-1.5 bg-surface-2 border border-border text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-3 transition-colors"
                >
                  <Icon name={savedJustNow ? 'check' : 'save'} size={14} /> {savedJustNow ? 'Zapisano' : 'Zapisz'}
                </button>
                <button
                  type="button"
                  disabled={!isValid || exporting}
                  onClick={() => exportAs('pdf')}
                  className="flex items-center gap-1.5 bg-accent text-white text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <Icon name="file-down" size={14} /> PDF
                </button>
                <button
                  type="button"
                  disabled={!isValid || exporting}
                  onClick={() => exportAs('png')}
                  className="flex items-center gap-1.5 bg-surface-2 border border-border text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-3 transition-colors"
                >
                  <Icon name="image-down" size={14} /> PNG
                </button>
              </div>
            </div>
            {!isValid && <p className="text-xs text-ink-faint text-right mb-2">Uzupełnij wymagane pola (*), aby odblokować eksport.</p>}
            <div ref={previewRef} className="overflow-x-auto pb-2">
              <DocumentPreviewA4 config={config} values={values} docNumber={docNumber} date={date} unit={String(values.unit ?? '')} />
            </div>
          </div>

          {showSaveConfirm && (
            <ConfirmModal
              title="Zapisać ten dokument?"
              description={`Dokument ${docNumber} zostanie zapisany w „Moich dokumentach" i będzie można go później otworzyć lub ponownie wyeksportować.`}
              confirmLabel="Zapisz"
              icon="save"
              onConfirm={handleSaveConfirmed}
              onCancel={() => setShowSaveConfirm(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field, value, onChange, onAddRow, onUpdateRow, onRemoveRow,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  onAddRow: () => void;
  onUpdateRow: (index: number, subKey: string, v: string) => void;
  onRemoveRow: (index: number) => void;
}) {
  const labelEl = (
    <span className="text-xs text-ink-muted">
      {field.label}{field.required ? <span className="text-danger"> *</span> : null}{field.unit ? ` (${field.unit})` : ''}
    </span>
  );

  if (field.type === 'repeat') {
    const rows = (value as Record<string, string>[]) ?? [];
    return (
      <div className="flex flex-col gap-2">
        {labelEl}
        {rows.map((row, i) => (
          <div key={i} className="border border-border rounded-lg p-2.5 space-y-1.5 relative">
            <button type="button" onClick={() => onRemoveRow(i)} className="absolute top-1.5 right-1.5 text-ink-faint hover:text-danger">
              <Icon name="x" size={14} />
            </button>
            {field.subFields?.map((sf) => (
              <label key={sf.key} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-ink-faint">{sf.label}</span>
                {sf.type === 'select' ? (
                  <select
                    value={row[sf.key] ?? ''}
                    onChange={(e) => onUpdateRow(i, sf.key, e.target.value)}
                    className="bg-bg border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="">—</option>
                    {sf.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    value={row[sf.key] ?? ''}
                    onChange={(e) => onUpdateRow(i, sf.key, e.target.value)}
                    className="bg-bg border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-accent"
                  />
                )}
              </label>
            ))}
          </div>
        ))}
        <button type="button" onClick={onAddRow} className="flex items-center justify-center gap-1.5 text-xs text-accent-ink border border-dashed border-accent rounded-lg py-2 hover:bg-accent-soft transition-colors">
          <Icon name="plus" size={14} /> Dodaj pozycję
        </button>
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--accent)]" />
        {labelEl}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="flex flex-col gap-1">
        {labelEl}
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="" disabled>Wybierz...</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="flex flex-col gap-1">
        {labelEl}
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent resize-y"
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1">
      {labelEl}
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={String(value ?? '')}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

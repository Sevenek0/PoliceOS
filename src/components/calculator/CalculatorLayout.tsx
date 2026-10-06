import { useEffect, useMemo, useState } from 'react';
import type { CalculatorConfig } from '../../types';
import { Icon } from '../Icon';
import { useActivityLog } from '../../store/useActivityLog';
import { SentenceCalculator } from './SentenceCalculator';

const COLOR_CLASSES: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-ink',
};

const REF_COLOR_CLASSES: Record<string, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent-ink',
  muted: 'bg-surface-2 text-ink-muted',
};

export function CalculatorLayout({ config }: { config: CalculatorConfig }) {
  const record = useActivityLog((s) => s.record);
  const [values, setValues] = useState<Record<string, number | string>>(() => {
    const init: Record<string, number | string> = {};
    for (const f of config.fields) if (f.defaultValue !== undefined) init[f.key] = f.defaultValue;
    return init;
  });

  useEffect(() => {
    record('calc', config.id, config.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  const result = useMemo(() => config.compute(values), [config, values]);

  if (config.custom === 'sentence') return <SentenceCalculator />;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
          <Icon name={config.icon} size={22} />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl">{config.title}</h1>
          <p className="text-sm text-ink-muted">{config.subtitle}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-3">Parametry</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {config.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">{f.label}{f.unit ? ` (${f.unit})` : ''}</span>
              {f.type === 'select' ? (
                <select
                  value={String(values[f.key] ?? '')}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="" disabled>Wybierz...</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={values[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
                />
              )}
            </label>
          ))}
        </div>
      </div>

      {config.referenceTable && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-3">{config.referenceTable.title}</h2>
          <div className="flex flex-col gap-1.5">
            {config.referenceTable.rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${REF_COLOR_CLASSES[r.color] ?? REF_COLOR_CLASSES.muted}`}>
                  {r.label}
                </span>
                <span className="text-ink-muted text-right">{r.range}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        {result ? (
          <>
            <div className={`font-display font-bold text-4xl ${COLOR_CLASSES[result.color]}`}>{result.value}</div>
            <div className="text-sm text-ink-muted mt-1">{result.label}</div>
            <div className="text-sm mt-3 text-ink">{result.interpretation}</div>
          </>
        ) : (
          <div className="text-ink-faint text-sm py-4">Uzupełnij wszystkie parametry, aby zobaczyć wynik.</div>
        )}
      </div>
    </div>
  );
}

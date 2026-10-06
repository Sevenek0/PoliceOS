import { useMemo, useState } from 'react';
import { Icon } from '../Icon';
import { AGGRAVATING, MITIGATING, sentenceMultiplier } from '../../data/calculators';
import {
  CATEGORY_LABELS, CHAPTERS, MAX_FINE, MAX_SENTENCE_MONTHS, MINUTES_PER_MONTH, PENAL_CODE, formatMoney,
} from '../../data/penalCode';
import type { OffenseCategory, PenalArticle } from '../../types';

const CATEGORY_CLASSES: Record<OffenseCategory, string> = {
  wykroczenie: 'bg-success-soft text-success',
  przestepstwo: 'bg-warning-soft text-warning',
  zbrodnia: 'bg-danger-soft text-danger',
};

const ARTICLE_BY_ID = new Map(PENAL_CODE.map((a) => [a.id, a]));

export function SentenceCalculator() {
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState('all');
  /** article id → count */
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [circumstances, setCircumstances] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PENAL_CODE.filter((a) => {
      if (chapter !== 'all' && a.chapter !== chapter) return false;
      if (q && !`${a.article} ${a.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, chapter]);

  const selected: { art: PenalArticle; count: number }[] = Object.entries(picked)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ art: ARTICLE_BY_ID.get(id)!, count }));

  const baseMonths = selected.reduce((s, { art, count }) => s + art.months * count, 0);
  const baseFine = selected.reduce((s, { art, count }) => s + art.fine * count, 0);
  const multiplier = sentenceMultiplier(circumstances);
  const rawMonths = Math.round(baseMonths * multiplier);
  const rawFine = Math.round((baseFine * multiplier) / 50) * 50;
  const months = Math.min(rawMonths, MAX_SENTENCE_MONTHS);
  const fine = Math.min(rawFine, MAX_FINE);
  const noBail = selected.some(({ art }) => art.noBail);
  const hasCrime = selected.some(({ art }) => art.category === 'zbrodnia');

  function add(id: string) {
    setPicked((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  }
  function dec(id: string) {
    setPicked((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));
  }
  function toggle(key: string) {
    setCircumstances((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function reset() {
    setPicked({});
    setCircumstances(new Set());
  }

  async function copySummary() {
    const lines = [
      'ZARZUTY:',
      ...selected.map(({ art, count }) => `- ${art.article} ${art.title}${count > 1 ? ` (x${count})` : ''}`),
      `KARA: ${months} mies. (${months * MINUTES_PER_MONTH} min) | GRZYWNA: ${formatMoney(fine)}`,
      noBail ? 'KAUCJA: niedopuszczalna' : '',
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // brak dostępu do schowka — pomijamy
    }
  }

  const multiplierPct = Math.round((multiplier - 1) * 100);

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
          <Icon name="gavel" size={22} />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl">Kalkulator zatrzymania</h1>
          <p className="text-sm text-ink-muted">
            Wybierz artykuły z taryfikatora i okoliczności — limit kary łącznej: {MAX_SENTENCE_MONTHS} mies. i {formatMoney(MAX_FINE)}.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Article picker */}
        <div className="lg:w-[440px] shrink-0 bg-surface border border-border rounded-xl flex flex-col lg:max-h-[calc(100vh-190px)]">
          <div className="p-4 border-b border-border space-y-2.5">
            <div className="relative">
              <Icon name="search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj artykułu lub czynu..."
                className="w-full bg-bg border border-border rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-accent"
            >
              <option value="all">Wszystkie rozdziały</option>
              {CHAPTERS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2 min-h-[240px]">
            {list.map((art) => {
              const count = picked[art.id] ?? 0;
              return (
                <div
                  key={art.id}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 ${count > 0 ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
                >
                  <button type="button" onClick={() => add(art.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-ink-faint shrink-0">{art.article}</span>
                      <span className="text-sm font-medium truncate">{art.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-1.5 py-px rounded text-[10px] font-medium ${CATEGORY_CLASSES[art.category]}`}>{CATEGORY_LABELS[art.category]}</span>
                      <span className="text-[11px] text-ink-faint">{art.months} mies. · {formatMoney(art.fine)}</span>
                    </div>
                  </button>
                  {count > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => dec(art.id)} className="w-6 h-6 rounded-md bg-surface-3 flex items-center justify-center hover:text-danger" aria-label="Usuń">
                        <Icon name="minus" size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-accent-ink">{count}</span>
                      <button type="button" onClick={() => add(art.id)} className="w-6 h-6 rounded-md bg-surface-3 flex items-center justify-center hover:text-accent-ink" aria-label="Dodaj">
                        <Icon name="plus" size={13} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => add(art.id)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-ink-faint hover:text-accent-ink hover:border-accent shrink-0" aria-label="Dodaj">
                      <Icon name="plus" size={13} />
                    </button>
                  )}
                </div>
              );
            })}
            {list.length === 0 && <div className="text-center text-sm text-ink-faint py-10">Brak artykułów dla podanych filtrów.</div>}
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Wybrane zarzuty</h2>
              {selected.length > 0 && (
                <button type="button" onClick={reset} className="text-xs text-ink-faint hover:text-danger flex items-center gap-1">
                  <Icon name="rotate-ccw" size={12} /> Wyczyść
                </button>
              )}
            </div>
            {selected.length === 0 ? (
              <div className="text-sm text-ink-faint py-4 text-center">Kliknij artykuł na liście, aby dodać go do zatrzymania.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {selected.map(({ art, count }) => (
                  <div key={art.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-mono text-xs text-ink-faint">{art.article}</span> {art.title}
                      {count > 1 && <span className="text-accent-ink font-semibold"> ×{count}</span>}
                    </span>
                    <span className="text-xs text-ink-muted shrink-0">{art.months * count} mies. · {formatMoney(art.fine * count)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 text-sm border-t border-border pt-2 mt-1 font-medium">
                  <span>Suma bazowa</span>
                  <span>{baseMonths} mies. · {formatMoney(baseFine)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CircumstanceGroup title="Okoliczności łagodzące" items={MITIGATING} selected={circumstances} onToggle={toggle} tone="success" />
            <CircumstanceGroup title="Okoliczności obciążające" items={AGGRAVATING} selected={circumstances} onToggle={toggle} tone="danger" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            {selected.length === 0 ? (
              <div className="text-ink-faint text-sm py-4 text-center">Wybierz co najmniej jeden artykuł, aby zobaczyć wymiar kary.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-display font-bold text-4xl text-accent-ink">{months}</div>
                    <div className="text-sm text-ink-muted mt-1">mies. pozbawienia wolności</div>
                    <div className="text-xs text-ink-faint mt-0.5">= {months * MINUTES_PER_MONTH} min w grze</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-4xl text-accent-ink">{formatMoney(fine)}</div>
                    <div className="text-sm text-ink-muted mt-1">grzywny</div>
                  </div>
                  <div>
                    <div className={`font-display font-bold text-4xl ${multiplierPct > 0 ? 'text-danger' : multiplierPct < 0 ? 'text-success' : 'text-ink'}`}>
                      ×{multiplier.toFixed(2)}
                    </div>
                    <div className="text-sm text-ink-muted mt-1">mnożnik okoliczności</div>
                    <div className="text-xs text-ink-faint mt-0.5">zakres 0,50–2,00</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-5">
                  {rawMonths > MAX_SENTENCE_MONTHS && (
                    <Notice tone="warning" icon="triangle-alert">
                      Wyliczona kara ({rawMonths} mies.) przekracza limit — orzeka się maksymalnie {MAX_SENTENCE_MONTHS} mies.
                    </Notice>
                  )}
                  {rawFine > MAX_FINE && (
                    <Notice tone="warning" icon="triangle-alert">
                      Wyliczona grzywna ({formatMoney(rawFine)}) przekracza limit — orzeka się maksymalnie {formatMoney(MAX_FINE)}.
                    </Notice>
                  )}
                  {noBail ? (
                    <Notice tone="danger" icon="lock">Co najmniej jeden zarzut wyklucza zwolnienie za kaucją.</Notice>
                  ) : hasCrime ? (
                    <Notice tone="warning" icon="info">Zarzut zbrodni — kaucja możliwa, ale zalecana wysoka kwota lub areszt.</Notice>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={copySummary}
                  className="mt-5 w-full flex items-center justify-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'Skopiowano' : 'Kopiuj podsumowanie do protokołu'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CircumstanceGroup({
  title, items, selected, onToggle, tone,
}: {
  title: string;
  items: { key: string; label: string; percent: number }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  tone: 'success' | 'danger';
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-2.5">{title}</h2>
      <div className="flex flex-col gap-1.5">
        {items.map((m) => (
          <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={selected.has(m.key)} onChange={() => onToggle(m.key)} className="accent-[var(--accent)]" />
            <span className="flex-1">{m.label}</span>
            <span className={`text-xs font-mono ${tone === 'success' ? 'text-success' : 'text-danger'}`}>
              {m.percent > 0 ? '+' : ''}{m.percent}%
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Notice({ tone, icon, children }: { tone: 'warning' | 'danger'; icon: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-2 text-xs rounded-lg p-3 leading-relaxed ${tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'}`}>
      <Icon name={icon} size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

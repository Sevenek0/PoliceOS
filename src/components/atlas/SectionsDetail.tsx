import type { AtlasEntry } from '../../types';
import { Icon } from '../Icon';
import { CATEGORY_COLOR_CLASSES, colorForCategoryKey } from '../categoryColor';

const BADGE_CLASSES: Record<string, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  accent: 'bg-accent-soft text-accent-ink',
};

const SECTION_ICONS = ['circle-check', 'sparkles', 'list-ordered', 'zap', 'triangle-alert'];

function isNumberedList(content: string): string[] | null {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every((l) => /^\d+[.)]\s/.test(l))) return lines;
  return null;
}

export function SectionsDetail({ entry, icon }: { entry: AtlasEntry; icon: string }) {
  const color = colorForCategoryKey(entry.category);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_COLOR_CLASSES[color]}`}>
          <Icon name={icon} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {entry.subtitle && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${CATEGORY_COLOR_CLASSES[color]}`}>{entry.subtitle}</span>
            )}
            {entry.badgeLabel && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${BADGE_CLASSES[entry.badgeColor ?? 'accent']}`}>{entry.badgeLabel}</span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-2 text-ink-muted">{entry.categoryLabel}</span>
          </div>
          <h1 className="font-display font-bold text-2xl">{entry.name}</h1>
          {entry.synonyms && <div className="text-xs text-ink-faint mt-1">{entry.synonyms}</div>}
        </div>
      </div>

      {entry.stats && entry.stats.length > 0 && (
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${Math.min(entry.stats.length, 5)}, minmax(0, 1fr))` }}>
          {entry.stats.map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-ink-faint">{s.label}</div>
              <div className="text-sm font-semibold mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {entry.tabs.map((tab, i) => {
          const steps = isNumberedList(tab.content);
          return (
            <div key={tab.label} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Icon name={SECTION_ICONS[i % SECTION_ICONS.length]} size={14} className="text-accent-ink" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{tab.label}</h2>
              </div>
              {steps ? (
                <ol className="flex flex-col gap-2">
                  {steps.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <span className="w-5 h-5 rounded-md bg-accent-soft text-accent-ink text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{s.replace(/^\d+[.)]\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line">{tab.content}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

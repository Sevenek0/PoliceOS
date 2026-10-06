import { useMemo, useState, useEffect } from 'react';
import type { AtlasConfig, AtlasEntry } from '../../types';
import { Icon } from '../Icon';
import { useActivityLog } from '../../store/useActivityLog';
import { CATEGORY_COLOR_CLASSES, colorForCategoryKey } from '../categoryColor';
import { SectionsDetail } from './SectionsDetail';

function EntryIcon({ entry, icon, size = 'sm' }: { entry: AtlasEntry; icon: string; size?: 'sm' | 'lg' }) {
  const color = colorForCategoryKey(entry.category);
  const dim = size === 'lg' ? 'w-11 h-11' : 'w-8 h-8';
  return (
    <div className={`${dim} rounded-lg flex items-center justify-center shrink-0 ${CATEGORY_COLOR_CLASSES[color]}`}>
      <Icon name={icon} size={size === 'lg' ? 20 : 15} />
    </div>
  );
}

export function AtlasLayout({ config }: { config: AtlasConfig }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [domain, setDomain] = useState<string>(config.domains?.[0]?.key ?? 'all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const record = useActivityLog((s) => s.record);

  useEffect(() => {
    record('atlas', config.id, config.title);
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  const filteredEntries = useMemo(() => {
    return config.entries.filter((e) => {
      if (config.domains && domain !== 'all' && e.domain !== domain) return false;
      if (category !== 'all' && e.category !== category) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${e.name} ${e.subtitle ?? ''} ${e.synonyms ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [config, query, category, domain]);

  const visibleCategories = useMemo(() => {
    if (!config.domains || domain === 'all') return config.categories;
    return config.categories.filter((c) => !c.domain || c.domain === domain);
  }, [config, domain]);

  const selected: AtlasEntry | undefined = useMemo(
    () => filteredEntries.find((e) => e.id === selectedId),
    [filteredEntries, selectedId]
  );

  useEffect(() => {
    setActiveTab(0);
  }, [selected?.id]);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-[340px] shrink-0 border-r border-border flex flex-col h-full lg:max-h-full">
        <div className="p-4 border-b border-border space-y-3">
          <div>
            <h2 className="font-display font-semibold text-lg">{config.title}</h2>
            <p className="text-xs text-ink-muted mt-0.5">{config.description}</p>
          </div>
          <div className="relative">
            <Icon name="search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={config.searchPlaceholder}
              className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          {config.domains && (
            <div className="flex gap-1 flex-wrap">
              {config.domains.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => { setDomain(d.key); setCategory('all'); }}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    domain === d.key ? 'bg-accent-soft border-accent text-accent-ink' : 'border-border text-ink-muted hover:text-ink'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-accent"
          >
            <option value="all">Wszystkie kategorie</option>
            {visibleCategories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <div className="text-[11px] text-ink-faint">Wyników: {filteredEntries.length}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filteredEntries.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelectedId(e.id)}
              className={`w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg mb-0.5 transition-colors ${
                selected?.id === e.id ? 'bg-accent-soft text-accent-ink' : 'hover:bg-surface-2 text-ink'
              }`}
            >
              <EntryIcon entry={e} icon={config.icon} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{e.name}</div>
                {e.subtitle && <div className="text-xs text-ink-faint truncate mt-0.5">{e.subtitle}</div>}
              </div>
            </button>
          ))}
          {filteredEntries.length === 0 && (
            <div className="text-center text-sm text-ink-faint py-10">Brak wyników dla podanych filtrów.</div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center text-ink-faint mb-4">
              <Icon name={config.icon} size={26} />
            </div>
            <h3 className="font-display font-semibold text-lg">Wybierz pozycję z listy</h3>
            <p className="text-sm text-ink-faint mt-1">Kliknij pozycję, aby zobaczyć szczegółowe informacje</p>
            {filteredEntries.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-center mt-5 max-w-md">
                {filteredEntries.slice(0, 6).map((e) => {
                  const color = colorForCategoryKey(e.category);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-transform hover:scale-105 ${CATEGORY_COLOR_CLASSES[color]}`}
                    >
                      {e.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : config.detailKind === 'sections' ? (
          <SectionsDetail entry={selected} icon={config.icon} />
        ) : (
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-start gap-4 mb-4">
              <EntryIcon entry={selected} icon={config.icon} size="lg" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-accent-ink font-medium uppercase tracking-wide">{selected.categoryLabel}</span>
                  {selected.domainLabel && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-2 text-ink-muted">{selected.domainLabel}</span>
                  )}
                </div>
                <h1 className="font-display font-bold text-2xl mt-1">{selected.name}</h1>
                {selected.subtitle && <div className="text-sm text-ink-muted mt-0.5">{selected.subtitle}</div>}
              </div>
            </div>

            <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
              {selected.tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === i ? 'border-accent text-accent-ink font-medium' : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="prose-content whitespace-pre-line text-sm leading-relaxed text-ink">
              {selected.tabs[activeTab]?.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

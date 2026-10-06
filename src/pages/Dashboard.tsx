import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useOfficerProfile } from '../store/useOfficerProfile';
import { useActivityLog } from '../store/useActivityLog';
import { GENERATORS } from '../data/generators';
import { CALCULATORS } from '../data/calculators';
import { ATLASES } from '../data/atlases';

type SearchItem = { id: string; kind: 'doc' | 'calc' | 'atlas'; title: string; icon: string; path: string };

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Dashboard() {
  const navigate = useNavigate();
  const profile = useOfficerProfile();
  const { topN, recent, countByKind } = useActivityLog();
  const now = useClock();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<'doc' | 'calc' | 'atlas'>('doc');

  const allItems: SearchItem[] = useMemo(
    () => [
      ...ATLASES.map((a) => ({ id: a.id, kind: 'atlas' as const, title: a.title, icon: a.icon, path: `/panel/atlasy/${a.id}` })),
      ...GENERATORS.map((g) => ({ id: g.id, kind: 'doc' as const, title: g.title, icon: g.icon, path: `/panel/generatory/${g.id}` })),
      ...CALCULATORS.map((c) => ({ id: c.id, kind: 'calc' as const, title: c.title, icon: c.icon, path: `/panel/kalkulatory/${c.id}` })),
    ],
    []
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allItems.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 8);
  }, [query, allItems]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const priorityGenerators = GENERATORS.filter((g) => g.category === 'priority');
  const standardGenerators = GENERATORS.filter((g) => g.category === 'standard');
  const criticalCalculators = CALCULATORS.filter((c) => c.category === 'critical');
  const standardCalculators = CALCULATORS.filter((c) => c.category === 'standard');

  const recents = recent(6);
  const activityCounts = {
    doc: countByKind('doc'),
    calc: countByKind('calc'),
    atlas: countByKind('atlas'),
    total: countByKind('doc') + countByKind('calc') + countByKind('atlas'),
  };
  const topList = topN(7, activityTab);

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-8">
      {/* Welcome card */}
      <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ background: 'radial-gradient(circle at top right, var(--accent), transparent 60%)' }} />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
              {profile.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wide">Zalogowany jako</div>
              <div className="font-display font-bold text-lg">{profile.name}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent-ink text-[11px] font-medium">{profile.position}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-2 text-ink-muted text-[11px]">Leg. {profile.badge}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-2 text-ink-muted text-[11px]">{profile.unit}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-success text-xs justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
              </div>
              <div className="font-mono text-lg font-semibold mt-0.5">{now.toLocaleTimeString('pl-PL')}</div>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Szukaj atlasu, dokumentu lub kalkulatora..."
            className="w-full bg-bg border border-border rounded-xl pl-10 pr-16 py-2.5 text-sm outline-none focus:border-accent transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-faint border border-border rounded px-1.5 py-0.5 font-mono">Ctrl+K</span>

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  type="button"
                  onClick={() => { navigate(r.path); setSearchOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface-2 text-left"
                >
                  <Icon name={r.icon} size={15} className="text-accent-ink shrink-0" />
                  <span className="truncate">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {recents.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-xs text-ink-faint">Ostatnio:</span>
            {recents.map((r) => {
              const item = allItems.find((i) => i.kind === r.kind && i.id === r.id);
              if (!item) return null;
              return (
                <button
                  key={`${r.kind}-${r.id}`}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="px-2.5 py-1 rounded-full bg-surface-2 text-xs hover:bg-surface-3 transition-colors"
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sentence calculator banner */}
      <section>
        <button
          type="button"
          onClick={() => navigate('/panel/kalkulatory/taryfikator')}
          className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface border border-accent/40 rounded-2xl p-5 text-left hover:border-accent transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ background: 'radial-gradient(circle at top left, var(--accent), transparent 60%)' }} />
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white shrink-0 relative">
            <Icon name="siren" size={24} />
          </div>
          <div className="relative flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg">Kalkulator zatrzymania</h3>
              <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent-ink text-[10px] font-bold uppercase">Taryfikator</span>
            </div>
            <p className="text-sm text-ink-muted mt-0.5">
              Wybierz artykuły z kodeksu karnego, zaznacz okoliczności łagodzące i obciążające — kalkulator wyliczy łączny czas odsiadki i grzywnę do protokołu zatrzymania.
            </p>
          </div>
          <span className="relative flex items-center gap-1.5 text-sm font-medium text-accent-ink shrink-0">
            Otwórz <Icon name="arrow-right" size={15} />
          </span>
        </button>
      </section>

      {/* Activity */}
      <section>
        <h2 className="font-display font-semibold text-base mb-3">Twoja aktywność</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Łącznie akcji" value={activityCounts.total} icon="activity" />
          <StatCard label="Dokumenty" value={activityCounts.doc} icon="file-text" />
          <StatCard label="Kalkulatory" value={activityCounts.calc} icon="calculator" />
          <StatCard label="Atlasy" value={activityCounts.atlas} icon="book-open" />
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex gap-1 mb-3">
            {(['doc', 'calc', 'atlas'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActivityTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activityTab === t ? 'bg-accent-soft text-accent-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t === 'doc' ? 'Dokumenty' : t === 'calc' ? 'Kalkulatory' : 'Atlasy'}
              </button>
            ))}
          </div>
          {topList.length === 0 ? (
            <div className="text-sm text-ink-faint py-6 text-center">Brak aktywności — zacznij korzystać z narzędzi, aby zobaczyć ranking.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {topList.map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-2">
                  <span className="w-5 text-xs text-ink-faint font-mono">{i + 1}</span>
                  <span className="flex-1 text-sm truncate">{entry.label}</span>
                  <span className="text-xs text-ink-faint">{entry.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Priority documents */}
      <section>
        <h2 className="font-display font-semibold text-base mb-3">Najczęściej używane dokumenty</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {priorityGenerators.map((g) => (
            <BigCard key={g.id} title={g.title} description={g.description} icon={g.icon} onClick={() => navigate(`/panel/generatory/${g.id}`)} accent={g.accentVariant} />
          ))}
        </div>
      </section>

      {/* Standard documents */}
      <section>
        <h2 className="font-display font-semibold text-base mb-3">Pozostałe dokumenty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {standardGenerators.map((g) => (
            <Tile key={g.id} title={g.title} icon={g.icon} onClick={() => navigate(`/panel/generatory/${g.id}`)} />
          ))}
        </div>
      </section>

      {/* Critical calculators */}
      <section>
        <h2 className="font-display font-semibold text-base mb-3">Kalkulatory główne</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {criticalCalculators.map((c) => (
            <BigCard key={c.id} title={c.title} description={c.subtitle} icon={c.icon} onClick={() => navigate(`/panel/kalkulatory/${c.id}`)} />
          ))}
        </div>
      </section>

      {/* Standard calculators */}
      <section>
        <h2 className="font-display font-semibold text-base mb-3">Pozostałe kalkulatory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {standardCalculators.map((c) => (
            <Tile key={c.id} title={c.title} icon={c.icon} onClick={() => navigate(`/panel/kalkulatory/${c.id}`)} />
          ))}
        </div>
      </section>

      {/* Knowledge base */}
      <section>
        <h2 className="font-display font-semibold text-base mb-3">Baza wiedzy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ATLASES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/panel/atlasy/${a.id}`)}
              className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 text-left hover:border-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
                <Icon name={a.icon} size={19} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{a.title}</div>
                <div className="text-xs text-ink-faint truncate">{a.entries.length} pozycji</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
        <Icon name={icon} size={17} />
      </div>
      <div>
        <div className="font-display font-bold text-xl leading-none">{value}</div>
        <div className="text-xs text-ink-faint mt-1">{label}</div>
      </div>
    </div>
  );
}

function BigCard({ title, description, icon, onClick, accent }: { title: string; description: string; icon: string; onClick: () => void; accent?: string }) {
  const isDanger = accent === 'danger' || accent === 'warning';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 bg-surface border border-border rounded-xl p-4 text-left hover:border-accent transition-colors"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDanger ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-ink'}`}>
        <Icon name={icon} size={19} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        <div className="text-xs text-ink-faint mt-0.5 line-clamp-2">{description}</div>
      </div>
    </button>
  );
}

function Tile({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 bg-surface border border-border rounded-lg p-3 text-left hover:border-accent transition-colors"
    >
      <Icon name={icon} size={16} className="text-accent-ink" />
      <span className="text-xs font-medium leading-snug line-clamp-2">{title}</span>
    </button>
  );
}

import { NavLink } from 'react-router-dom';
import { Icon } from '../Icon';
import { LogoMark, Wordmark } from '../Logo';
import { ACCENTS } from '../accents';
import { ATLASES } from '../../data/atlases';
import { GENERATORS } from '../../data/generators';
import { CALCULATORS } from '../../data/calculators';
import { useOfficerProfile } from '../../store/useOfficerProfile';

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">{title}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function NavItem({ to, icon, label, end }: { to: string; icon: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive ? 'bg-accent-soft text-accent-ink font-medium' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
        }`
      }
    >
      <Icon name={icon} size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { name, position, accent, update } = useOfficerProfile();

  return (
    <aside className="w-[220px] shrink-0 h-full flex flex-col bg-bg-2 border-r border-border">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <LogoMark size={32} />
          <div className="min-w-0">
            <Wordmark size="sm" className="block truncate" />
            <div className="text-[10px] text-ink-faint tracking-wide uppercase truncate">Panel LSPD</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" onClick={onNavigate}>
        <NavItem to="/panel" icon="layout-dashboard" label="Pulpit" end />
        <NavItem to="/panel/kartoteka" icon="database" label="Kartoteka (MDT)" />
        <NavItem to="/panel/dokumenty" icon="folder-clock" label="Moje dokumenty" />

        <NavSection title="Baza wiedzy">
          {ATLASES.map((a) => (
            <NavItem key={a.id} to={`/panel/atlasy/${a.id}`} icon={a.icon} label={a.title} />
          ))}
        </NavSection>

        <NavSection title="Generatory">
          {GENERATORS.map((g) => (
            <NavItem key={g.id} to={`/panel/generatory/${g.id}`} icon={g.icon} label={g.title} />
          ))}
        </NavSection>

        <NavSection title="Kalkulatory">
          {CALCULATORS.map((c) => (
            <NavItem key={c.id} to={`/panel/kalkulatory/${c.id}`} icon={c.icon} label={c.title} />
          ))}
        </NavSection>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 mb-3">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => update({ accent: a.key })}
              aria-label={`Akcent: ${a.label}`}
              title={a.label}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                accent === a.key ? 'border-ink' : 'border-transparent'
              }`}
              style={{ background: a.hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{name}</div>
            <div className="text-[11px] text-ink-faint truncate">{position}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

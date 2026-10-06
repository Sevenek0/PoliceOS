import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const navigate = useNavigate();

  return (
    <header className="h-14 shrink-0 border-b border-border bg-bg-2/80 backdrop-blur flex items-center gap-3 px-4">
      <div className="h-5 w-1 rounded-full bg-accent shrink-0" />
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-lg hover:bg-surface-2 text-ink-muted"
        aria-label="Menu"
      >
        <Icon name="menu" size={18} />
      </button>
      <h1 className="font-display font-semibold text-sm truncate flex-1">{title}</h1>

      <div className="flex items-center gap-1.5 text-xs text-success">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        Online
      </div>
      <button
        type="button"
        onClick={() => navigate('/panel')}
        className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-muted hover:text-ink"
        aria-label="Pulpit"
      >
        <Icon name="house" size={17} />
      </button>
      <button
        type="button"
        onClick={() => navigate('/panel/ustawienia')}
        className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-muted hover:text-ink"
        aria-label="Ustawienia"
      >
        <Icon name="settings" size={17} />
      </button>
    </header>
  );
}

import { Icon } from '../Icon';

export const INPUT = 'bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent w-full';

export function Label({ text, required, className = '', children }: { text: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-ink-muted">{text}{required && <span className="text-danger"> *</span>}</span>
      {children}
    </label>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-danger-soft text-danger text-xs rounded-lg p-3 leading-relaxed mb-4">
      <Icon name="triangle-alert" size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export function Card({ title, icon, action, children }: { title: string; icon: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name={icon} size={15} className="text-ink-faint" />
        <h2 className="text-xs font-semibold tracking-wider uppercase text-ink-muted flex-1">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Flag({ label, tone = 'danger' }: { label: string; tone?: 'danger' | 'warning' }) {
  const cls = tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${cls}`}>{label}</span>;
}

import { Icon } from './Icon';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title, description, confirmLabel = 'Potwierdź', cancelLabel = 'Anuluj', icon = 'save', onConfirm, onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink mb-3">
          <Icon name={icon} size={19} />
        </div>
        <h3 className="font-display font-bold text-base">{title}</h3>
        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">{description}</p>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-sm font-medium rounded-lg py-2 border border-border text-ink-muted hover:bg-surface-2 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 text-sm font-medium rounded-lg py-2 bg-accent text-white hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Icon } from '../Icon';

/** Kod przekazania dokumentu do JusticeOS — do skopiowania i wklejenia w formularzu DOJ. */
export function TransferModal({ code, docNumber, onClose }: { code: string; docNumber: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // brak dostępu do schowka — kod można zaznaczyć ręcznie
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl p-5 w-full max-w-lg shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink mb-3">
          <Icon name="send" size={19} />
        </div>
        <h3 className="font-display font-bold text-base">Przekaż {docNumber} do JusticeOS</h3>
        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
          Skopiuj kod i przekaż go prokuratorowi. W JusticeOS otwiera on np. akt oskarżenia lub nakaz i klika
          „Importuj z PoliceOS” — dane osoby, zarzuty, opis zdarzenia i dowody wypełnią się same.
        </p>
        <textarea readOnly value={code} rows={4} onFocus={(e) => e.target.select()}
          className="w-full mt-3 bg-bg border border-border rounded-lg px-2.5 py-2 text-[11px] font-mono break-all resize-none outline-none" />
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose}
            className="flex-1 text-sm font-medium rounded-lg py-2 border border-border text-ink-muted hover:bg-surface-2 transition-colors">
            Zamknij
          </button>
          <button type="button" onClick={copy}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg py-2 bg-accent text-white hover:opacity-90 transition-opacity">
            <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'Skopiowano' : 'Kopiuj kod'}
          </button>
        </div>
      </div>
    </div>
  );
}

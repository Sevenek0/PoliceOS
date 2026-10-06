import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ConfirmModal } from '../components/ConfirmModal';
import { DocumentPreviewA4 } from '../components/documents/DocumentPreviewA4';
import { useDocumentHistory, useMyDocuments } from '../store/useDocumentHistory';
import { useDiscordAuth } from '../store/useDiscordAuth';
import { useOfficerProfile } from '../store/useOfficerProfile';
import { GENERATORS } from '../data/generators';
import { exportElementAsFile } from '../utils/exportDocument';
import type { SavedDocument } from '../types';

function formatSavedAt(ts: number): string {
  return new Date(ts).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SyncBanner() {
  const navigate = useNavigate();
  const status = useDocumentHistory((s) => s.syncStatus);
  const error = useDocumentHistory((s) => s.syncError);
  const needsLogin = useDocumentHistory((s) => s.syncNeedsLogin);
  const sync = useDocumentHistory((s) => s.sync);

  function relogin() {
    useDiscordAuth.getState().logout();
    useOfficerProfile.getState().update({ onboarded: false });
    navigate('/start', { replace: true });
  }

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-ink-faint mt-2">
        <Icon name="loader" size={13} className="animate-spin" /> Synchronizacja z serwerem…
      </div>
    );
  }
  if (status === 'synced') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success mt-2">
        <Icon name="cloud-check" size={13} /> Zapisane na serwerze
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="mt-2 text-xs bg-danger-soft text-danger rounded-lg px-2.5 py-2">
        <div className="flex items-start gap-1.5">
          <Icon name="cloud-off" size={13} className="shrink-0 mt-px" />
          <span>{error} Dokumenty są na razie tylko w tej przeglądarce.</span>
        </div>
        <button
          type="button"
          onClick={needsLogin ? relogin : () => void sync()}
          className="mt-1.5 font-semibold underline underline-offset-2"
        >
          {needsLogin ? 'Zaloguj ponownie' : 'Spróbuj ponownie'}
        </button>
      </div>
    );
  }
  return null;
}

export function DocumentHistoryPage() {
  const documents = useMyDocuments();
  const removeDocument = useDocumentHistory((s) => s.remove);
  const sync = useDocumentHistory((s) => s.sync);
  const syncStatus = useDocumentHistory((s) => s.syncStatus);
  const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id ?? null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void sync();
  }, [sync]);

  const selected: SavedDocument | undefined = documents.find((d) => d.id === selectedId) ?? documents[0];
  const generatorConfig = selected ? GENERATORS.find((g) => g.id === selected.generatorId) : undefined;

  async function handleExport(kind: 'pdf' | 'png') {
    if (!previewRef.current || !selected) return;
    setExporting(true);
    try {
      await exportElementAsFile(previewRef.current, kind, selected.docNumber);
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteConfirmed() {
    if (!pendingDeleteId) return;
    if (selectedId === pendingDeleteId) setSelectedId(null);
    removeDocument(pendingDeleteId);
    setPendingDeleteId(null);
  }

  if (documents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center text-ink-faint mb-4">
          <Icon name="folder-clock" size={26} />
        </div>
        <h3 className="font-display font-semibold text-lg">
          {syncStatus === 'syncing' ? 'Wczytywanie dokumentów…' : 'Brak zapisanych dokumentów'}
        </h3>
        <p className="text-sm text-ink-faint mt-1 max-w-sm">
          Podczas wypełniania dokumentu kliknij „Zapisz", aby zachować go tutaj do późniejszego podglądu lub ponownego eksportu.
        </p>
        <div className="max-w-sm">
          <SyncBanner />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-[340px] shrink-0 border-r border-border flex flex-col h-full lg:max-h-full">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">Moje dokumenty</h2>
          <p className="text-xs text-ink-muted mt-0.5">{documents.length} zapisanych dokumentów</p>
          <SyncBanner />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedId(doc.id)}
              className={`w-full flex items-center gap-2.5 text-left px-2.5 py-2.5 rounded-lg mb-0.5 transition-colors ${
                selected?.id === doc.id ? 'bg-accent-soft text-accent-ink' : 'hover:bg-surface-2 text-ink'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
                <Icon name={doc.generatorIcon} size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{doc.generatorTitle}</div>
                <div className="text-xs text-ink-faint truncate">{doc.docNumber} · {formatSavedAt(doc.savedAt)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected && generatorConfig ? (
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div>
                <div className="text-xs text-accent-ink font-medium uppercase tracking-wide">{generatorConfig.title}</div>
                <h1 className="font-display font-bold text-xl mt-0.5">{selected.docNumber}</h1>
                <div className="text-xs text-ink-faint mt-0.5">Zapisano {formatSavedAt(selected.savedAt)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(selected.id)}
                  className="flex items-center gap-1.5 border border-border text-xs font-medium rounded-lg px-3 py-1.5 text-danger hover:bg-danger-soft transition-colors"
                >
                  <Icon name="trash" size={14} /> Usuń
                </button>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-1.5 bg-accent text-white text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <Icon name="file-down" size={14} /> PDF
                </button>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => handleExport('png')}
                  className="flex items-center gap-1.5 bg-surface-2 border border-border text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-surface-3 transition-colors"
                >
                  <Icon name="image-down" size={14} /> PNG
                </button>
              </div>
            </div>

            <div ref={previewRef}>
              <DocumentPreviewA4
                config={generatorConfig}
                values={selected.values}
                docNumber={selected.docNumber}
                date={selected.date}
                unit={selected.unit}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">Wybierz dokument z listy.</div>
        )}
      </div>

      {pendingDeleteId && (
        <ConfirmModal
          title="Usunąć dokument?"
          description="Ta operacja jest nieodwracalna — dokument zostanie trwale usunięty z historii i z serwera."
          confirmLabel="Usuń"
          icon="trash"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}

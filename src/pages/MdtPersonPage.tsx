import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ConfirmModal } from '../components/ConfirmModal';
import { Card, ErrorBox, Flag, INPUT, Label } from '../components/mdt/ui';
import { OWNER_DISCORD_ID } from '../config';
import { formatMoney } from '../data/penalCode';
import {
  errorMessage, EMPTY_PERSON, EMPTY_RECORD, LICENSES, RECORD_KINDS,
  addRecord, deletePerson, deleteRecord, documentSubject, formatDbDate, getPerson, recordFromDocument, savePerson,
  type MdtPerson, type MdtRecord, type MdtVehicle, type PersonInput, type RecordInput, type RecordKind,
} from '../lib/mdtApi';
import { useDiscordAuth } from '../store/useDiscordAuth';
import { useMyDocuments } from '../store/useDocumentHistory';

function toInput(p: MdtPerson): PersonInput {
  const { createdAt: _c, updatedAt: _u, updatedBy: _b, ...rest } = p;
  return rest;
}

function LicensePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value.split(',').map((s) => s.trim()).filter(Boolean);
  const toggle = (l: string) => onChange((selected.includes(l) ? selected.filter((s) => s !== l) : [...selected, l]).join(', '));
  return (
    <div className="flex flex-wrap gap-1.5">
      {LICENSES.map((l) => (
        <button key={l} type="button" onClick={() => toggle(l)}
          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
            selected.includes(l) ? 'bg-accent text-white border-accent' : 'border-border text-ink-muted hover:text-ink'
          }`}>
          {l}
        </button>
      ))}
    </div>
  );
}

function RecordForm({ personName, onAdd }: { personName: string; onAdd: (r: RecordInput) => Promise<boolean> }) {
  const [draft, setDraft] = useState<RecordInput>(EMPTY_RECORD);
  const [busy, setBusy] = useState(false);
  const documents = useMyDocuments();
  // Dokumenty tej osoby na górze listy — reszta pod spodem.
  const sortedDocs = useMemo(() => {
    const name = personName.trim().toLowerCase();
    return [...documents].sort((a, b) => Number(documentSubject(b).toLowerCase() === name) - Number(documentSubject(a).toLowerCase() === name));
  }, [documents, personName]);
  const patch = (p: Partial<RecordInput>) => setDraft((d) => ({ ...d, ...p }));

  async function submit() {
    setBusy(true);
    if (await onAdd(draft)) setDraft(EMPTY_RECORD);
    setBusy(false);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-border rounded-xl p-3 mb-3">
      {sortedDocs.length > 0 && (
        <Label text="Wypełnij z zapisanego dokumentu" className="sm:col-span-2">
          <select value="" className={INPUT}
            onChange={(e) => {
              const doc = documents.find((d) => d.id === e.target.value);
              if (doc) setDraft(recordFromDocument(doc));
            }}>
            <option value="">Wybierz dokument…</option>
            {sortedDocs.slice(0, 50).map((d) => (
              <option key={d.id} value={d.id}>{d.docNumber} — {d.generatorTitle}{documentSubject(d) ? ` (${documentSubject(d)})` : ''}</option>
            ))}
          </select>
        </Label>
      )}
      <Label text="Rodzaj">
        <select value={draft.kind} onChange={(e) => patch({ kind: e.target.value as RecordKind })} className={INPUT}>
          {Object.entries(RECORD_KINDS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </Label>
      <Label text="Tytuł" required>
        <input value={draft.title} maxLength={200} onChange={(e) => patch({ title: e.target.value })} className={INPUT} />
      </Label>
      <Label text="Treść" className="sm:col-span-2">
        <textarea value={draft.content} rows={3} maxLength={4000} onChange={(e) => patch({ content: e.target.value })} className={`${INPUT} resize-y`} />
      </Label>
      <Label text="Grzywna ($)">
        <input type="number" min={0} value={draft.fine || ''} onChange={(e) => patch({ fine: Number(e.target.value) || 0 })} className={INPUT} />
      </Label>
      <Label text="Odsiadka (mies.)">
        <input type="number" min={0} value={draft.jailMonths || ''} onChange={(e) => patch({ jailMonths: Number(e.target.value) || 0 })} className={INPUT} />
      </Label>
      <Label text="Nr dokumentu">
        <input value={draft.docNumber} maxLength={100} onChange={(e) => patch({ docNumber: e.target.value })} className={INPUT} />
      </Label>
      <div className="flex items-end">
        <button type="button" disabled={busy || !draft.title.trim()} onClick={submit}
          className="w-full flex items-center justify-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg py-2 hover:opacity-90 disabled:opacity-40">
          <Icon name="plus" size={15} /> Dodaj wpis
        </button>
      </div>
    </div>
  );
}

function RecordItem({ r, canDelete, onDelete }: { r: MdtRecord; canDelete: boolean; onDelete: () => void }) {
  const meta = RECORD_KINDS[r.kind] ?? RECORD_KINDS.inne;
  return (
    <div className="flex gap-3 py-3 border-t border-border first:border-t-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.className}`}>
        <Icon name={meta.icon} size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{r.title}</span>
          <span className="text-[11px] text-ink-faint">{meta.label}{r.docNumber && ` · ${r.docNumber}`}</span>
        </div>
        {r.content && <p className="text-xs text-ink-muted whitespace-pre-line mt-1 leading-relaxed">{r.content}</p>}
        {(r.fine > 0 || r.jailMonths > 0) && (
          <div className="flex gap-3 mt-1 text-xs">
            {r.jailMonths > 0 && <span className="text-danger">{r.jailMonths} mies.</span>}
            {r.fine > 0 && <span className="text-warning">{formatMoney(r.fine)}</span>}
          </div>
        )}
        <div className="text-[11px] text-ink-faint mt-1">{formatDbDate(r.createdAt)} · {r.author}</div>
      </div>
      {canDelete && (
        <button type="button" onClick={onDelete} aria-label="Usuń wpis" className="text-ink-faint hover:text-danger self-start">
          <Icon name="trash" size={14} />
        </button>
      )}
    </div>
  );
}

export function MdtPersonPage() {
  const { id = '' } = useParams();
  const isNew = id === 'nowa';
  const navigate = useNavigate();
  const userId = useDiscordAuth((s) => s.user?.id);
  const [draft, setDraft] = useState<PersonInput>(EMPTY_PERSON);
  const [person, setPerson] = useState<MdtPerson | null>(null);
  const [records, setRecords] = useState<MdtRecord[]>([]);
  const [vehicles, setVehicles] = useState<MdtVehicle[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = useCallback(async () => {
    if (isNew) return;
    try {
      const data = await getPerson(id);
      setPerson(data.person);
      setDraft(toInput(data.person));
      setRecords(data.records);
      setVehicles(data.vehicles);
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, 'Nie udało się wczytać osoby.'));
    }
  }, [id, isNew]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patch = (p: Partial<PersonInput>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  async function save() {
    setError(null);
    try {
      const res = await savePerson(isNew ? draft : { ...draft, id });
      if (isNew) navigate(`/panel/kartoteka/osoba/${res.id}`, { replace: true });
      else { await refresh(); setSaved(true); }
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zapisać.'));
    }
  }

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setError(null);
    try {
      await action();
      await refresh();
      return true;
    } catch (err) {
      setError(errorMessage(err, 'Operacja nie powiodła się.'));
      return false;
    }
  }

  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm text-ink-muted">{loadError}</p>
        <button type="button" onClick={() => navigate('/panel/kartoteka')} className="mt-4 text-sm text-accent-ink hover:underline">Wróć do kartoteki</button>
      </div>
    );
  }
  if (!isNew && !person) return <div className="p-6 text-sm text-ink-faint">Ładowanie…</div>;

  const totalFines = records.reduce((s, r) => s + r.fine, 0);
  const totalJail = records.reduce((s, r) => s + r.jailMonths, 0);

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      <button type="button" onClick={() => navigate('/panel/kartoteka')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3">
        <Icon name="chevron-left" size={14} /> Kartoteka
      </button>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${draft.wanted ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-ink'}`}>
          <Icon name={draft.wanted ? 'siren' : 'user'} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl truncate">{isNew ? 'Nowa osoba' : person?.name}</h1>
            {person?.wanted && <Flag label="Poszukiwany" />}
          </div>
          {person && (
            <p className="text-sm text-ink-muted">
              {records.length} wpisów · łącznie {totalJail} mies. i {formatMoney(totalFines)}
              {person.updatedBy && ` · ostatnia zmiana: ${person.updatedBy}, ${formatDbDate(person.updatedAt ?? person.createdAt)}`}
            </p>
          )}
        </div>
      </div>

      <ErrorBox message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 items-start">
        <Card title="Dane osobowe" icon="id-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Label text="Imię i nazwisko" required className="sm:col-span-2">
              <input value={draft.name} maxLength={150} onChange={(e) => patch({ name: e.target.value })} className={INPUT} />
            </Label>
            <Label text="Data urodzenia">
              <input type="date" value={draft.dob} onChange={(e) => patch({ dob: e.target.value })} className={INPUT} />
            </Label>
            <Label text="SSN">
              <input value={draft.ssn} maxLength={50} onChange={(e) => patch({ ssn: e.target.value })} className={INPUT} />
            </Label>
            <Label text="Telefon">
              <input value={draft.phone} maxLength={50} onChange={(e) => patch({ phone: e.target.value })} className={INPUT} />
            </Label>
            <Label text="Adres">
              <input value={draft.address} maxLength={200} onChange={(e) => patch({ address: e.target.value })} className={INPUT} />
            </Label>
            <Label text="Rysopis / uwagi" className="sm:col-span-2">
              <textarea value={draft.description} rows={3} maxLength={2000} onChange={(e) => patch({ description: e.target.value })} className={`${INPUT} resize-y`} />
            </Label>
            <Label text="Licencje" className="sm:col-span-2">
              <LicensePicker value={draft.licenses} onChange={(licenses) => patch({ licenses })} />
            </Label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 mt-1">
              <input type="checkbox" checked={draft.wanted} onChange={(e) => patch({ wanted: e.target.checked })} className="accent-[var(--danger)]" />
              Osoba poszukiwana
            </label>
            {draft.wanted && (
              <Label text="Powód poszukiwania" className="sm:col-span-2">
                <input value={draft.wantedReason} maxLength={300} onChange={(e) => patch({ wantedReason: e.target.value })} className={INPUT} />
              </Label>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button type="button" onClick={save} disabled={draft.name.trim().length < 2}
              className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40">
              <Icon name="save" size={15} /> {isNew ? 'Dodaj do kartoteki' : 'Zapisz zmiany'}
            </button>
            {saved && <span className="text-xs text-success flex items-center gap-1"><Icon name="check" size={13} /> Zapisano</span>}
            {!isNew && (
              <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto text-xs text-ink-faint hover:text-danger flex items-center gap-1">
                <Icon name="trash" size={13} /> Usuń osobę
              </button>
            )}
          </div>
        </Card>

        {!isNew && person && (
          <div className="flex flex-col gap-4">
            <Card title={`Historia (${records.length})`} icon="list-clock">
              <RecordForm personName={person.name} onAdd={(r) => run(() => addRecord(id, r))} />
              {records.length === 0
                ? <div className="text-xs text-ink-faint py-2">Brak wpisów.</div>
                : records.map((r) => (
                  <RecordItem key={r.id} r={r} canDelete={r.authorId === userId || userId === OWNER_DISCORD_ID}
                    onDelete={() => void run(() => deleteRecord(r.id))} />
                ))}
            </Card>
            <Card title={`Pojazdy (${vehicles.length})`} icon="car"
              action={
                <button type="button" onClick={() => navigate(`/panel/kartoteka/pojazd/nowy?owner=${id}`)}
                  className="text-xs text-accent-ink hover:underline flex items-center gap-1">
                  <Icon name="plus" size={12} /> Dodaj
                </button>
              }>
              {vehicles.length === 0 ? <div className="text-xs text-ink-faint">Brak zarejestrowanych pojazdów.</div> : vehicles.map((v) => (
                <button key={v.id} type="button" onClick={() => navigate(`/panel/kartoteka/pojazd/${v.id}`)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-2 text-left">
                  <span className="font-mono text-xs font-semibold">{v.plate}</span>
                  <span className="text-xs text-ink-muted truncate flex-1">{[v.model, v.color].filter(Boolean).join(', ')}</span>
                  {v.stolen && <Flag label="Skradziony" tone="warning" />}
                </button>
              ))}
            </Card>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Usunąć osobę z kartoteki?"
          description="Zostaną usunięte także wszystkie jej wpisy. Pojazdy zostaną w kartotece bez właściciela."
          confirmLabel="Usuń" icon="trash"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setConfirmDelete(false);
            try {
              await deletePerson(id);
              navigate('/panel/kartoteka');
            } catch (err) {
              setError(errorMessage(err, 'Nie udało się usunąć osoby.'));
            }
          }}
        />
      )}
    </div>
  );
}

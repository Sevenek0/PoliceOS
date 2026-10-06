import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ConfirmModal } from '../components/ConfirmModal';
import { Card, ErrorBox, Flag, INPUT, Label } from '../components/mdt/ui';
import {
  errorMessage, EMPTY_VEHICLE, deleteVehicle, formatDbDate, getPerson, getVehicle, saveVehicle, searchMdt,
  type MdtPerson, type MdtVehicle, type VehicleInput,
} from '../lib/mdtApi';

/** Wybór właściciela spośród osób w kartotece. */
function OwnerPicker({ ownerName, onPick }: { ownerName: string; onPick: (p: MdtPerson | null) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MdtPerson[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchMdt(query).then((r) => { if (!cancelled) setResults(r.persons.slice(0, 8)); }).catch(() => {});
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  if (ownerName) {
    return (
      <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-2.5 py-2 text-sm">
        <Icon name="user" size={14} className="text-ink-faint" />
        <span className="flex-1 truncate">{ownerName}</span>
        <button type="button" onClick={() => onPick(null)} className="text-xs text-ink-faint hover:text-danger">Zmień</button>
      </div>
    );
  }
  return (
    <div className="relative">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj osoby w kartotece…" className={INPUT} />
      {query.trim().length >= 2 && results.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
          {results.map((p) => (
            <button key={p.id} type="button" onClick={() => { onPick(p); setQuery(''); setResults([]); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2">
              {p.name} <span className="text-xs text-ink-faint">{p.dob}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MdtVehiclePage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const isNew = id === 'nowy';
  const navigate = useNavigate();
  const [draft, setDraft] = useState<VehicleInput>(EMPTY_VEHICLE);
  const [ownerName, setOwnerName] = useState('');
  const [vehicle, setVehicle] = useState<MdtVehicle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isNew) {
      const owner = params.get('owner');
      if (owner) {
        getPerson(owner).then(({ person }) => {
          if (cancelled) return;
          setDraft((d) => ({ ...d, ownerId: person.id }));
          setOwnerName(person.name);
        }).catch(() => {});
      }
    } else {
      getVehicle(id).then(({ vehicle: v }) => {
        if (cancelled) return;
        setVehicle(v);
        setDraft({ id: v.id, plate: v.plate, model: v.model, color: v.color, ownerId: v.ownerId, stolen: v.stolen, notes: v.notes });
        setOwnerName(v.ownerName);
      }).catch((err) => { if (!cancelled) setLoadError(errorMessage(err, 'Nie udało się wczytać pojazdu.')); });
    }
    return () => { cancelled = true; };
  }, [id, isNew, params]);

  const patch = (p: Partial<VehicleInput>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  async function save() {
    setError(null);
    try {
      const res = await saveVehicle(draft);
      if (isNew) navigate(`/panel/kartoteka/pojazd/${res.id}`, { replace: true });
      else setSaved(true);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zapisać pojazdu.'));
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
  if (!isNew && !vehicle) return <div className="p-6 text-sm text-ink-faint">Ładowanie…</div>;

  return (
    <div className="max-w-[640px] mx-auto p-6">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3">
        <Icon name="chevron-left" size={14} /> Wstecz
      </button>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${draft.stolen ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent-ink'}`}>
          <Icon name="car" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl truncate">{isNew ? 'Nowy pojazd' : vehicle?.plate}</h1>
            {vehicle?.stolen && <Flag label="Skradziony" tone="warning" />}
          </div>
          {vehicle?.updatedBy && <p className="text-sm text-ink-muted">Ostatnia zmiana: {vehicle.updatedBy}, {formatDbDate(vehicle.updatedAt ?? vehicle.createdAt)}</p>}
        </div>
      </div>

      <ErrorBox message={error} />

      <Card title="Dane pojazdu" icon="car-front">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Label text="Nr rejestracyjny" required>
            <input value={draft.plate} maxLength={20} onChange={(e) => patch({ plate: e.target.value.toUpperCase() })} className={`${INPUT} font-mono`} />
          </Label>
          <Label text="Marka i model">
            <input value={draft.model} maxLength={100} onChange={(e) => patch({ model: e.target.value })} className={INPUT} />
          </Label>
          <Label text="Kolor">
            <input value={draft.color} maxLength={50} onChange={(e) => patch({ color: e.target.value })} className={INPUT} />
          </Label>
          <Label text="Właściciel">
            <OwnerPicker ownerName={ownerName} onPick={(p) => { patch({ ownerId: p?.id ?? null }); setOwnerName(p?.name ?? ''); }} />
          </Label>
          <Label text="Uwagi" className="sm:col-span-2">
            <textarea value={draft.notes} rows={3} maxLength={2000} onChange={(e) => patch({ notes: e.target.value })} className={`${INPUT} resize-y`} />
          </Label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={draft.stolen} onChange={(e) => patch({ stolen: e.target.checked })} />
            Pojazd zgłoszony jako skradziony
          </label>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button type="button" onClick={save} disabled={draft.plate.trim().length < 2}
            className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40">
            <Icon name="save" size={15} /> {isNew ? 'Dodaj pojazd' : 'Zapisz zmiany'}
          </button>
          {saved && <span className="text-xs text-success flex items-center gap-1"><Icon name="check" size={13} /> Zapisano</span>}
          {draft.ownerId && (
            <button type="button" onClick={() => navigate(`/panel/kartoteka/osoba/${draft.ownerId}`)} className="text-xs text-accent-ink hover:underline">
              Karta właściciela
            </button>
          )}
          {!isNew && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto text-xs text-ink-faint hover:text-danger flex items-center gap-1">
              <Icon name="trash" size={13} /> Usuń
            </button>
          )}
        </div>
      </Card>

      {confirmDelete && (
        <ConfirmModal
          title="Usunąć pojazd z kartoteki?" description="Tej operacji nie można cofnąć." confirmLabel="Usuń" icon="trash"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setConfirmDelete(false);
            try {
              await deleteVehicle(id);
              navigate('/panel/kartoteka');
            } catch (err) {
              setError(errorMessage(err, 'Nie udało się usunąć pojazdu.'));
            }
          }}
        />
      )}
    </div>
  );
}

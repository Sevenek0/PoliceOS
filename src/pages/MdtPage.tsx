import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Card, ErrorBox, Flag, INPUT } from '../components/mdt/ui';
import { errorMessage, searchMdt, type MdtPerson, type MdtVehicle, type SearchResult } from '../lib/mdtApi';

type Tab = 'osoby' | 'pojazdy';

function PersonRow({ p, onOpen }: { p: MdtPerson; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 text-left">
      <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center text-ink-muted shrink-0">
        <Icon name="user" size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{p.name}</div>
        <div className="text-xs text-ink-faint truncate">
          {[p.dob && `ur. ${p.dob}`, p.ssn && `SSN ${p.ssn}`, p.phone].filter(Boolean).join(' · ') || 'Brak danych dodatkowych'}
        </div>
      </div>
      {p.wanted && <Flag label="Poszukiwany" />}
    </button>
  );
}

function VehicleRow({ v, onOpen }: { v: MdtVehicle; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 text-left">
      <div className="px-2 py-1 rounded-md bg-surface-3 font-mono text-xs font-semibold shrink-0 min-w-[84px] text-center">{v.plate}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{[v.model, v.color].filter(Boolean).join(', ') || 'Pojazd'}</div>
        <div className="text-xs text-ink-faint truncate">{v.ownerName ? `Właściciel: ${v.ownerName}` : 'Właściciel nieznany'}</div>
      </div>
      {v.stolen && <Flag label="Skradziony" tone="warning" />}
    </button>
  );
}

export function MdtPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('osoby');
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      searchMdt(query)
        .then((res) => { if (!cancelled) { setData(res); setError(null); } })
        .catch((err) => { if (!cancelled) setError(errorMessage(err, 'Nie udało się przeszukać kartoteki.')); });
    }, query ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const openPerson = (id: string) => navigate(`/panel/kartoteka/osoba/${id}`);
  const openVehicle = (id: string) => navigate(`/panel/kartoteka/pojazd/${id}`);
  const list = tab === 'osoby' ? data?.persons ?? [] : data?.vehicles ?? [];

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
          <Icon name="database" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-xl">Kartoteka (MDT)</h1>
          <p className="text-sm text-ink-muted">Osoby, pojazdy i historia interwencji — wspólna dla całej jednostki.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/panel/kartoteka/osoba/nowa')}
            className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90">
            <Icon name="user-plus" size={15} /> Nowa osoba
          </button>
          <button type="button" onClick={() => navigate('/panel/kartoteka/pojazd/nowy')}
            className="flex items-center gap-1.5 border border-border text-sm font-medium rounded-lg px-3 py-2 hover:bg-surface-2">
            <Icon name="car" size={15} /> Nowy pojazd
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj: imię i nazwisko, SSN, telefon, tablica rejestracyjna, model…"
          className={`${INPUT} pl-9 py-2.5`}
          autoFocus
        />
      </div>

      <ErrorBox message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        <Card
          title={query ? 'Wyniki wyszukiwania' : 'Ostatnio zmieniane'}
          icon="list"
          action={
            <div className="flex gap-1">
              {(['osoby', 'pojazdy'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${tab === t ? 'bg-accent text-white' : 'bg-surface-2 text-ink-muted hover:text-ink'}`}>
                  {t === 'osoby' ? `Osoby (${data?.persons.length ?? 0})` : `Pojazdy (${data?.vehicles.length ?? 0})`}
                </button>
              ))}
            </div>
          }
        >
          {!data ? (
            <div className="text-sm text-ink-faint py-6 text-center">Ładowanie…</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-ink-faint py-6 text-center">{query ? 'Brak wyników.' : 'Kartoteka jest pusta — dodaj pierwszą osobę lub pojazd.'}</div>
          ) : tab === 'osoby' ? (
            data.persons.map((p) => <PersonRow key={p.id} p={p} onOpen={() => openPerson(p.id)} />)
          ) : (
            data.vehicles.map((v) => <VehicleRow key={v.id} v={v} onOpen={() => openVehicle(v.id)} />)
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title={`Poszukiwani (${data?.wanted.length ?? 0})`} icon="siren">
            {data?.wanted.length ? data.wanted.map((p) => (
              <button key={p.id} type="button" onClick={() => openPerson(p.id)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-surface-2">
                <div className="text-sm font-medium text-danger truncate">{p.name}</div>
                <div className="text-xs text-ink-faint truncate">{p.wantedReason || 'Bez podanego powodu'}</div>
              </button>
            )) : <div className="text-xs text-ink-faint">Nikt nie jest poszukiwany.</div>}
          </Card>
          <Card title={`Skradzione pojazdy (${data?.stolen.length ?? 0})`} icon="car-front">
            {data?.stolen.length ? data.stolen.map((v) => (
              <button key={v.id} type="button" onClick={() => openVehicle(v.id)} className="w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg hover:bg-surface-2">
                <span className="font-mono text-xs font-semibold text-warning">{v.plate}</span>
                <span className="text-xs text-ink-faint truncate">{v.model}</span>
              </button>
            )) : <div className="text-xs text-ink-faint">Brak zgłoszonych kradzieży.</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}

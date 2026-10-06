import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOfficerProfile } from '../store/useOfficerProfile';
import { useDiscordAuth } from '../store/useDiscordAuth';
import {
  MAX_INVITES,
  createInvite,
  listMyInvites,
  cancelInvite,
  adminOverview,
  adminGrantAccess,
  adminRevokeAccess,
  adminCancelInvite,
  type MyInvite,
  type AccessRow,
  type AdminInviteRow,
} from '../lib/accessGate';
import { Icon } from '../components/Icon';
import { ACCENTS, POSITIONS } from '../components/accents';
import { OWNER_DISCORD_ID } from '../config';

const CATEGORIES = [
  { key: 'profil', label: 'Profil', icon: 'user' },
  { key: 'wyglad', label: 'Wygląd', icon: 'palette' },
  { key: 'zaproszenia', label: 'Zaproszenia', icon: 'ticket' },
  { key: 'konto', label: 'Konto', icon: 'shield' },
  { key: 'owner', label: 'Owner', icon: 'crown' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

export function SettingsPage() {
  const [category, setCategory] = useState<CategoryKey>('profil');
  const discordUser = useDiscordAuth((s) => s.user);
  const isOwner = discordUser?.id === OWNER_DISCORD_ID;
  const categories = isOwner ? CATEGORIES : CATEGORIES.filter((c) => c.key !== 'owner');

  return (
    <div className={`mx-auto p-6 ${category === 'owner' ? 'max-w-3xl' : 'max-w-xl'}`}>
      <h1 className="font-display font-bold text-xl mb-1">Ustawienia</h1>
      <p className="text-sm text-ink-muted mb-5">Dane wykorzystywane do automatycznego wypełniania nagłówków i podpisów pism.</p>

      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              category === c.key ? 'bg-accent text-white' : 'bg-surface-2 text-ink-muted hover:text-ink'
            }`}
          >
            <Icon name={c.icon} size={13} /> {c.label}
          </button>
        ))}
      </div>

      {category === 'profil' && <ProfileSection />}
      {category === 'wyglad' && <AppearanceSection />}
      {category === 'zaproszenia' && <InvitesSection isOwner={isOwner} />}
      {category === 'konto' && <AccountSection />}
      {category === 'owner' && isOwner && <OwnerSection />}

      <p className="text-[11px] text-ink-faint mt-4 text-center leading-relaxed">
        PoliceOS — Panel Policji (LSPD) to narzędzie fabularne (RP) dla serwerów roleplay.
        Wszystkie dokumenty, przepisy i wyroki są fikcyjne i nie stanowią rzeczywistej dokumentacji prawnej.
      </p>
    </div>
  );
}

function ProfileSection() {
  const profile = useOfficerProfile();
  const positions = POSITIONS.includes(profile.position) ? POSITIONS : [profile.position, ...POSITIONS];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <Field label="Imię i nazwisko" value={profile.name} onChange={(v) => profile.update({ name: v })} />
      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-muted">Stanowisko</span>
        <select
          value={profile.position}
          onChange={(e) => profile.update({ position: e.target.value })}
          className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
        >
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <Field label="Nr odznaki / legitymacji" value={profile.badge} onChange={(v) => profile.update({ badge: v.slice(0, 20) })} />
      <Field label="Jednostka" value={profile.unit} onChange={(v) => profile.update({ unit: v })} />
    </div>
  );
}

function AppearanceSection() {
  const profile = useOfficerProfile();

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <div>
        <div className="text-xs text-ink-muted mb-2">Kolor akcentu</div>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => profile.update({ accent: a.key })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                profile.accent === a.key ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border text-ink-muted hover:text-ink'
              }`}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: a.hex }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-ink-muted mb-2">Motyw</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => profile.update({ theme: 'dark' })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              profile.theme === 'dark' ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border text-ink-muted hover:text-ink'
            }`}
          >
            <Icon name="moon" size={13} /> Ciemny
          </button>
          <button
            type="button"
            onClick={() => profile.update({ theme: 'light' })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              profile.theme === 'light' ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border text-ink-muted hover:text-ink'
            }`}
          >
            <Icon name="sun" size={13} /> Jasny
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-danger-soft text-danger text-xs rounded-lg p-3 leading-relaxed mb-3">
      <Icon name="triangle-alert" size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function InvitesSection({ isOwner }: { isOwner: boolean }) {
  const [invites, setInvites] = useState<MyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cancelingCode, setCancelingCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setInvites(await listMyInvites());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać zaproszeń.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const used = invites.length;
  const limitReached = !isOwner && used >= MAX_INVITES;

  async function handleGenerate() {
    setPending(true);
    setError(null);
    const result = await createInvite();
    setPending(false);
    if (result.code) void refresh();
    else setError(result.error ?? 'Nie udało się wygenerować kodu.');
  }

  async function handleCancel(code: string) {
    setCancelingCode(code);
    setError(null);
    const ok = await cancelInvite(code);
    setCancelingCode(null);
    if (ok) void refresh();
    else setError('Nie udało się anulować kodu — być może został już wykorzystany.');
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold flex items-center gap-1.5">
          <Icon name="ticket" size={15} className="text-accent-ink" /> Zaproszenia
        </div>
        <span className="text-xs text-ink-muted">{isOwner ? `${used} wygenerowanych (bez limitu)` : `${used}/${MAX_INVITES} wykorzystane`}</span>
      </div>
      <p className="text-xs text-ink-muted mb-3">Wygeneruj kod i przekaż go osobie, którą chcesz wpuścić do PoliceOS. Każdy kod działa jeden raz.</p>

      {error && <ErrorBox>{error}</ErrorBox>}

      <button
        type="button"
        disabled={pending || loading || limitReached}
        onClick={handleGenerate}
        className="flex items-center gap-1.5 bg-accent text-white text-xs font-medium rounded-lg px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        <Icon name="plus" size={13} /> {pending ? 'Generowanie…' : 'Wygeneruj kod'}
      </button>

      {loading ? (
        <div className="text-xs text-ink-faint mt-3">Ładowanie…</div>
      ) : invites.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {invites.map((inv) => (
            <div key={inv.code} className="bg-bg border border-border rounded-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm tracking-wider select-all">{inv.code}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge used={Boolean(inv.usedBy)} />
                  {!inv.usedBy && (
                    <button
                      type="button"
                      disabled={cancelingCode === inv.code}
                      onClick={() => handleCancel(inv.code)}
                      className="text-[11px] text-danger hover:underline disabled:opacity-40"
                    >
                      {cancelingCode === inv.code ? 'Anulowanie…' : 'Anuluj'}
                    </button>
                  )}
                </div>
              </div>
              {inv.usedBy && (
                <div className="text-[11px] text-ink-muted mt-1">
                  Dołączył: <span className="text-ink font-medium">{inv.usedByUsername ?? 'nieznany'}</span>
                  {' '}· ID: <span className="font-mono">{inv.usedBy}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountSection() {
  const navigate = useNavigate();
  const discordUser = useDiscordAuth((s) => s.user);

  function handleLogout() {
    useDiscordAuth.getState().logout();
    useOfficerProfile.getState().update({ onboarded: false });
    navigate('/start', { replace: true });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold flex items-center gap-1.5 mb-3">
        <Icon name="shield" size={15} className="text-accent-ink" /> Konto
      </div>

      {discordUser ? (
        <div className="flex items-center gap-3 bg-bg border border-border rounded-lg px-3 py-2.5">
          {discordUser.avatarUrl ? (
            <img src={discordUser.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {discordUser.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-faint">Zalogowano przez Discord</div>
            <div className="text-sm font-medium truncate">{discordUser.globalName ?? discordUser.username}</div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-muted mb-3">Nie jesteś zalogowany przez Discord.</p>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 flex items-center gap-1.5 bg-danger-soft text-danger text-xs font-medium rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
      >
        <Icon name="log-out" size={13} /> Wyloguj się
      </button>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  // MariaDB zwraca "YYYY-MM-DD HH:MM:SS" (czas serwera).
  const d = new Date(value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}

function OwnerSection() {
  const discordUser = useDiscordAuth((s) => s.user);
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [invites, setInvites] = useState<AdminInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantId, setGrantId] = useState('');
  const [grantName, setGrantName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminOverview();
      setRows(data.access);
      setInvites(data.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać danych.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nameById = new Map<string, string>();
  rows.forEach((r) => r.username && nameById.set(r.discordId, r.username));

  function displayInviter(id: string | null): string {
    if (!id) return '—';
    if (id === 'owner') return 'Ty (nadane ręcznie)';
    if (id === OWNER_DISCORD_ID) return 'Ty';
    return nameById.get(id) ?? id;
  }

  async function handleGrant() {
    if (!grantId.trim()) return;
    setBusyId('__grant__');
    setError(null);
    const ok = await adminGrantAccess(grantId.trim(), grantName.trim());
    setBusyId(null);
    if (ok) {
      setGrantId('');
      setGrantName('');
      void refresh();
    } else {
      setError('Nie udało się nadać dostępu — sprawdź ID Discorda.');
    }
  }

  async function handleRevoke(discordId: string) {
    setBusyId(discordId);
    setError(null);
    const ok = await adminRevokeAccess(discordId);
    setBusyId(null);
    if (ok) void refresh();
    else setError('Nie udało się usunąć dostępu.');
  }

  async function handleCancelAny(code: string) {
    setBusyId(code);
    setError(null);
    const ok = await adminCancelInvite(code);
    setBusyId(null);
    if (ok) void refresh();
    else setError('Nie udało się anulować kodu.');
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-sm font-semibold flex items-center gap-1.5 mb-3">
          <Icon name="crown" size={15} className="text-accent-ink" /> Nadaj dostęp ręcznie
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={grantId}
            onChange={(e) => setGrantId(e.target.value)}
            placeholder="ID Discorda"
            className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-2 text-sm font-mono outline-none focus:border-accent"
          />
          <input
            value={grantName}
            onChange={(e) => setGrantName(e.target.value)}
            placeholder="Nick (opcjonalnie)"
            className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={!grantId.trim() || busyId === '__grant__'}
            onClick={handleGrant}
            className="flex items-center justify-center gap-1.5 bg-accent text-white text-xs font-medium rounded-lg px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Icon name="user-plus" size={13} /> Nadaj
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <Icon name="users" size={15} className="text-accent-ink" /> Kto ma dostęp
          </div>
          <span className="text-xs text-ink-muted">{rows.length + 1} osób</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-faint text-left">
                <th className="font-medium pb-2 pr-3">Nick</th>
                <th className="font-medium pb-2 pr-3">ID Discorda</th>
                <th className="font-medium pb-2 pr-3">Zaprosił</th>
                <th className="font-medium pb-2 pr-3">Dołączył</th>
                <th className="font-medium pb-2" />
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="py-2 pr-3 font-medium">{discordUser?.globalName ?? discordUser?.username}</td>
                <td className="py-2 pr-3 font-mono">{OWNER_DISCORD_ID}</td>
                <td className="py-2 pr-3 text-ink-faint">—</td>
                <td className="py-2 pr-3 text-ink-faint">—</td>
                <td className="py-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-soft text-accent-ink uppercase">Właściciel</span>
                </td>
              </tr>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-ink-faint">Ładowanie…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-ink-faint">Nikt jeszcze nie dołączył.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.discordId} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium">{r.username ?? '—'}</td>
                    <td className="py-2 pr-3 font-mono">{r.discordId}</td>
                    <td className="py-2 pr-3 text-ink-muted">{displayInviter(r.invitedBy)}</td>
                    <td className="py-2 pr-3 text-ink-muted whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={busyId === r.discordId}
                        onClick={() => handleRevoke(r.discordId)}
                        className="text-danger hover:underline disabled:opacity-40 whitespace-nowrap"
                      >
                        {busyId === r.discordId ? 'Usuwanie…' : 'Usuń dostęp'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-sm font-semibold flex items-center gap-1.5 mb-3">
          <Icon name="ticket" size={15} className="text-accent-ink" /> Wszystkie kody zaproszeń
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-faint text-left">
                <th className="font-medium pb-2 pr-3">Kod</th>
                <th className="font-medium pb-2 pr-3">Utworzył</th>
                <th className="font-medium pb-2 pr-3">Status</th>
                <th className="font-medium pb-2 pr-3">Wykorzystał</th>
                <th className="font-medium pb-2" />
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-ink-faint">{loading ? 'Ładowanie…' : 'Brak kodów w systemie.'}</td>
                </tr>
              ) : (
                invites.map((inv) => (
                  <tr key={inv.code} className="border-t border-border">
                    <td className="py-2 pr-3 font-mono tracking-wider">{inv.code}</td>
                    <td className="py-2 pr-3 text-ink-muted">{displayInviter(inv.createdBy)}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge used={Boolean(inv.usedBy)} />
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">{inv.usedByUsername ?? '—'}</td>
                    <td className="py-2">
                      {!inv.usedBy && (
                        <button
                          type="button"
                          disabled={busyId === inv.code}
                          onClick={() => handleCancelAny(inv.code)}
                          className="text-danger hover:underline disabled:opacity-40 whitespace-nowrap"
                        >
                          {busyId === inv.code ? 'Anulowanie…' : 'Anuluj'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ used }: { used: boolean }) {
  if (used) {
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-3 text-ink-muted uppercase">Wykorzystany</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-soft text-success uppercase">Aktywny</span>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

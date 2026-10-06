import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { useOfficerProfile } from '../store/useOfficerProfile';
import { useDiscordAuth } from '../store/useDiscordAuth';
import { isDiscordConfigured, buildDiscordAuthUrl } from '../utils/discordAuth';
import { checkAccess, redeemInvite, type AccessStatus } from '../lib/accessGate';
import { POSITIONS } from '../components/accents';

function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-8 px-3 py-1.5 rounded-lg border border-border transition-colors"
      >
        <Icon name="chevron-left" size={14} /> Powrót do strony głównej
      </button>
      <LogoMark size={44} rounded="rounded-xl" />
      {children}
    </div>
  );
}

function LoginGate({ showSetupInfo, onLogin }: { showSetupInfo: boolean; onLogin: () => void }) {
  return (
    <Shell>
      <h1 className="font-display font-bold text-2xl mt-4">Witaj w PoliceOS</h1>
      <p className="text-sm text-ink-muted mt-1 mb-6 text-center max-w-sm">
        Dostęp do panelu wymaga zalogowania przez Discord — to jedyny sposób logowania.
      </p>
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="h-1 bg-accent" />
        <div className="p-6 space-y-4">
          <button
            type="button"
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#5865F2] text-white text-sm font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity"
          >
            <Icon name="message-square" size={16} /> Zaloguj przez Discord
          </button>
          {showSetupInfo && (
            <div className="flex items-start gap-2 bg-warning-soft text-warning text-xs rounded-lg p-3 leading-relaxed">
              <Icon name="info" size={14} className="shrink-0 mt-0.5" />
              <span>
                Logowanie przez Discord nie jest jeszcze skonfigurowane w tej instancji aplikacji — brakuje Client ID.
                Właściciel strony musi go dodać w pliku <code className="font-mono">src/config.ts</code>.
              </span>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function CheckingGate() {
  return (
    <Shell>
      <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink mt-4 animate-pulse">
        <Icon name="loader" size={18} />
      </div>
      <p className="text-sm text-ink-muted mt-3">Sprawdzanie dostępu…</p>
    </Shell>
  );
}

function InviteGate({ onSuccess }: { onSuccess: () => void }) {
  const discordUser = useDiscordAuth((s) => s.user);
  const logout = useDiscordAuth((s) => s.logout);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRedeem() {
    if (!discordUser || !code.trim()) return;
    setPending(true);
    setError(null);
    const result = await redeemInvite(code);
    setPending(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error ?? 'Nie udało się aktywować kodu.');
    }
  }

  return (
    <Shell>
      <h1 className="font-display font-bold text-2xl mt-4">Dostęp na zaproszenie</h1>
      <p className="text-sm text-ink-muted mt-1 mb-6 text-center max-w-sm">
        PoliceOS jest dostępny tylko dla zaproszonych osób. Wklej kod zaproszenia, który dostałeś od kogoś, kto już ma dostęp.
      </p>
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="h-1 bg-accent" />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-2.5">
            {discordUser?.avatarUrl ? (
              <img src={discordUser.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {discordUser?.username.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs text-ink-faint">Zalogowano przez Discord</div>
              <div className="text-sm font-medium truncate">{discordUser?.globalName ?? discordUser?.username}</div>
            </div>
            <button type="button" onClick={logout} className="text-xs text-ink-faint hover:text-danger px-2 py-1">
              Wyloguj
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-faint uppercase tracking-wide">Kod zaproszenia</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="np. A1B2C3D4"
              className="w-full bg-bg border border-border rounded-lg px-2.5 py-2 text-sm font-mono tracking-wider outline-none focus:border-accent"
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 bg-danger-soft text-danger text-xs rounded-lg p-3 leading-relaxed">
              <Icon name="triangle-alert" size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!code.trim() || pending}
            onClick={handleRedeem}
            className="w-full flex items-center justify-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {pending ? 'Sprawdzanie…' : 'Aktywuj kod'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function ProfileForm() {
  const navigate = useNavigate();
  const profile = useOfficerProfile();
  const discord = useDiscordAuth((s) => s.user);
  const logout = useDiscordAuth((s) => s.logout);
  const [name, setName] = useState(profile.name);
  const [position, setPosition] = useState(profile.position || POSITIONS[0]);
  const [badge, setBadge] = useState(profile.badge);
  const [unit, setUnit] = useState(profile.unit);

  const isValid = name.trim() !== '' && badge.trim() !== '' && unit.trim() !== '';

  function handleSubmit() {
    if (!isValid) return;
    profile.update({ name: name.trim(), position, badge: badge.trim(), unit: unit.trim(), onboarded: true });
    navigate('/panel');
  }

  return (
    <Shell>
      <h1 className="font-display font-bold text-2xl mt-4">Uzupełnij dane</h1>
      <p className="text-sm text-ink-muted mt-1 mb-6 text-center">Zajmie to 30 sekund — te dane trafiają do nagłówków i podpisów pism</p>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="h-1 bg-accent" />
        <div className="p-6 space-y-5">
          {discord && (
            <div className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-2.5">
              {discord.avatarUrl ? (
                <img src={discord.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {discord.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-ink-faint">Zalogowano przez Discord</div>
                <div className="text-sm font-medium truncate">{discord.globalName ?? discord.username}</div>
              </div>
              <button type="button" onClick={logout} className="text-xs text-ink-faint hover:text-danger px-2 py-1">
                Wyloguj
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="id-card" size={15} className="text-accent-ink" />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Dane służbowe</span>
            </div>
            <span className="text-[11px] text-danger">Wymagane</span>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-faint uppercase tracking-wide">Imię i nazwisko *</span>
            <div className="relative">
              <Icon name="user" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jan Kowalski"
                className="w-full bg-bg border border-border rounded-lg pl-8 pr-2.5 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-ink-faint uppercase tracking-wide">Stanowisko *</span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-accent"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-ink-faint uppercase tracking-wide">Nr odznaki / legitymacji *</span>
              <div className="relative">
                <Icon name="badge-check" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value.slice(0, 20))}
                  placeholder="LSPD-0042"
                  className="w-full bg-bg border border-border rounded-lg pl-8 pr-2.5 py-2 text-sm font-mono outline-none focus:border-accent"
                />
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-faint uppercase tracking-wide">Jednostka *</span>
            <div className="relative">
              <Icon name="landmark" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="np. Mission Row Station"
                className="w-full bg-bg border border-border rounded-lg pl-8 pr-2.5 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </label>

          <button
            type="button"
            disabled={!isValid}
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Przejdź do panelu <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-ink-faint mt-5">
        <Icon name="lock" size={12} /> Dane profilu zostają w tej przeglądarce — na serwer trafiają tylko zapisane dokumenty
      </div>
    </Shell>
  );
}

function AccessErrorGate({ onRetry }: { onRetry: () => void }) {
  const logout = useDiscordAuth((s) => s.logout);
  return (
    <Shell>
      <h1 className="font-display font-bold text-2xl mt-4">Nie udało się sprawdzić dostępu</h1>
      <p className="text-sm text-ink-muted mt-1 mb-6 max-w-sm text-center">
        Serwer PoliceOS nie odpowiada albo sesja Discord wygasła. Spróbuj ponownie lub zaloguj się jeszcze raz.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
        >
          <Icon name="refresh-cw" size={14} /> Spróbuj ponownie
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 border border-border text-sm font-medium rounded-lg px-4 py-2 hover:bg-surface-2 transition-colors"
        >
          Zaloguj ponownie
        </button>
      </div>
    </Shell>
  );
}

type GateState = 'checking' | AccessStatus;

export function Onboarding() {
  const discordUser = useDiscordAuth((s) => s.user);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  const [gate, setGate] = useState<GateState>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!discordUser) return;
    let cancelled = false;
    setGate('checking');
    checkAccess().then((status) => {
      if (!cancelled) setGate(status);
    });
    return () => {
      cancelled = true;
    };
  }, [discordUser, attempt]);

  function handleLogin() {
    if (!isDiscordConfigured()) {
      setShowSetupInfo(true);
      return;
    }
    window.location.href = buildDiscordAuthUrl();
  }

  if (!discordUser) {
    return <LoginGate showSetupInfo={showSetupInfo} onLogin={handleLogin} />;
  }
  if (gate === 'checking') {
    return <CheckingGate />;
  }
  if (gate === 'error') {
    return <AccessErrorGate onRetry={() => setAttempt((a) => a + 1)} />;
  }
  if (gate === 'denied') {
    return <InviteGate onSuccess={() => setGate('authorized')} />;
  }
  return <ProfileForm />;
}

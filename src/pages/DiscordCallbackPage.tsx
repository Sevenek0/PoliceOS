import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useDiscordAuth } from '../store/useDiscordAuth';
import { useOfficerProfile } from '../store/useOfficerProfile';
import { useDiscordProfiles } from '../store/useDiscordProfiles';
import { parseAccessTokenFromHash, fetchDiscordUser } from '../utils/discordAuth';
import { checkAccess } from '../lib/accessGate';

export function DiscordCallbackPage() {
  const navigate = useNavigate();
  const setUser = useDiscordAuth((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = parseAccessTokenFromHash(window.location.hash);
    if (!auth) {
      setError('Brak tokenu logowania w odpowiedzi Discorda. Spróbuj zalogować się ponownie.');
      return;
    }
    fetchDiscordUser(auth.token)
      .then(async (user) => {
        setUser(user, auth.token, auth.expiresIn);
        const saved = useDiscordProfiles.getState().get(user.id);
        if (saved) {
          // Returning Discord account — restore the profile saved on a previous login.
          useOfficerProfile.getState().update(saved);
        } else {
          // First login on this account — prefill the name, then start tracking it.
          if (!useOfficerProfile.getState().name.trim()) {
            useOfficerProfile.getState().update({ name: user.globalName ?? user.username });
          }
          const { update: _update, ...snapshot } = useOfficerProfile.getState();
          useDiscordProfiles.getState().save(user.id, snapshot);
        }
        const authorized = (await checkAccess()) === 'authorized';
        const goToPanel = authorized && useOfficerProfile.getState().onboarded;
        navigate(goToPanel ? '/panel' : '/start', { replace: true });
      })
      .catch(() => {
        setError('Nie udało się połączyć z Discordem. Spróbuj ponownie.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center px-4 text-center">
      {error ? (
        <>
          <div className="w-12 h-12 rounded-xl bg-danger-soft flex items-center justify-center text-danger mb-4">
            <Icon name="triangle-alert" size={22} />
          </div>
          <h1 className="font-display font-bold text-lg">Logowanie nie powiodło się</h1>
          <p className="text-sm text-ink-muted mt-1.5 max-w-sm">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/start')}
            className="mt-5 flex items-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Wróć
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink mb-4 animate-pulse">
            <Icon name="loader" size={22} />
          </div>
          <p className="text-sm text-ink-muted">Logowanie przez Discord…</p>
        </>
      )}
    </div>
  );
}

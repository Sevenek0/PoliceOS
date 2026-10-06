import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Icon } from '../components/Icon';
import { LogoMark, Wordmark } from '../components/Logo';
import { useOfficerProfile } from '../store/useOfficerProfile';
import { useDiscordAuth } from '../store/useDiscordAuth';
import { isDiscordConfigured, buildDiscordAuthUrl } from '../utils/discordAuth';
import { ATLASES } from '../data/atlases';
import { GENERATORS } from '../data/generators';
import { CALCULATORS } from '../data/calculators';
import { ACCENTS } from '../components/accents';

export function Landing() {
  const navigate = useNavigate();
  const { accent, onboarded, update } = useOfficerProfile();
  const discordUser = useDiscordAuth((s) => s.user);
  const [showDiscordSetupInfo, setShowDiscordSetupInfo] = useState(false);

  const totalEntries = ATLASES.reduce((sum, a) => sum + a.entries.length, 0);

  function enterPanel() {
    navigate(onboarded ? '/panel' : '/start');
  }

  function handleDiscordLogin() {
    if (!isDiscordConfigured()) {
      setShowDiscordSetupInfo(true);
      return;
    }
    window.location.href = buildDiscordAuthUrl();
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-2/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} />
            <div>
              <Wordmark size="sm" className="block" />
              <div className="text-[9px] text-ink-faint tracking-wider uppercase leading-tight">Panel Policji — LSPD</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-ink-muted">
            <a href="#generatory" className="hover:text-ink transition-colors">Generatory</a>
            <a href="#kalkulatory" className="hover:text-ink transition-colors">Kalkulatory</a>
            <a href="#atlasy" className="hover:text-ink transition-colors">Baza wiedzy</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => update({ accent: a.key })}
                  aria-label={`Akcent: ${a.label}`}
                  title={a.label}
                  className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${
                    accent === a.key ? 'border-ink' : 'border-transparent'
                  }`}
                  style={{ background: a.hex }}
                />
              ))}
            </div>
            {discordUser ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted pr-1">
                {discordUser.avatarUrl ? (
                  <img src={discordUser.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-semibold">
                    {discordUser.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {discordUser.globalName ?? discordUser.username}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDiscordLogin}
                className="hidden sm:flex items-center gap-1.5 bg-[#5865F2] text-white text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
              >
                <Icon name="message-square" size={14} /> Discord
              </button>
            )}
            <button
              type="button"
              onClick={enterPanel}
              className="flex items-center gap-1.5 bg-accent text-white text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <Icon name="zap" size={14} /> Otwórz Panel
            </button>
          </div>
        </div>

        {showDiscordSetupInfo && (
          <div className="max-w-6xl mx-auto px-6 pb-3 -mt-1">
            <div className="flex items-start gap-2 bg-warning-soft text-warning text-xs rounded-lg p-3 leading-relaxed">
              <Icon name="info" size={14} className="shrink-0 mt-0.5" />
              <span>
                Logowanie przez Discord nie jest jeszcze skonfigurowane w tej instancji — brakuje Client ID.
                Właściciel strony musi go dodać w pliku <code className="font-mono">src/config.ts</code>.
              </span>
              <button type="button" onClick={() => setShowDiscordSetupInfo(false)} className="ml-auto shrink-0">
                <Icon name="x" size={14} />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="flex flex-col items-center text-center pt-20 pb-16">
          <span className="px-3 py-1 rounded-full text-xs bg-surface-2 text-ink-muted border border-border mb-6 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Narzędzie fabularne dla frakcji LSPD
          </span>

          <h1 className="leading-tight max-w-3xl">
            <Wordmark size="lg" className="text-ink" />
          </h1>
          <p className="font-display font-bold text-2xl sm:text-3xl mt-2 text-ink">Panel policyjny</p>
          <p className="text-lg text-ink-muted mt-1">dla funkcjonariuszy, detektywów i dowódców</p>

          <p className="text-sm text-ink-muted max-w-xl mt-6 leading-relaxed">
            Raporty, protokoły, mandaty i taryfikator kodeksu karnego do odgrywania ról w policji.
            Wystawiaj notatki z interwencji, protokoły zatrzymania i mandaty w kilkadziesiąt sekund.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={enterPanel}
              className="flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-xl px-6 py-3 hover:opacity-90 transition-opacity"
            >
              <Icon name="zap" size={16} /> Uruchom Panel
              
            </button>
            <a
              href="#atlasy"
              className="flex items-center gap-2 border border-border text-sm font-medium rounded-xl px-6 py-3 hover:bg-surface-2 transition-colors"
            >
              <Icon name="compass" size={16} /> Zobacz narzędzia
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-14 w-full max-w-3xl">
            <StatCard value={`${GENERATORS.length}`} label="Typów dokumentów" hint="od mandatu po raport" />
            <StatCard value={`${CALCULATORS.length}`} label="Kalkulatory" hint="taryfikator, prędkość, odsiadka" />
            <StatCard value={`${ATLASES.length}`} label="Działy wiedzy" hint="kodeks, procedury, kody radiowe" />
            <StatCard value={`${totalEntries}+`} label="Haseł w bazie" hint="artykuły, procedury, kody" />
          </div>
        </section>

        <section id="generatory" className="py-14 border-t border-border scroll-mt-20">
          <SectionHeader icon="file-text" title="Generatory dokumentów" description="Wypełnij formularz, obejrzyj gotowe pismo na żywo i eksportuj do PDF/PNG." />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mt-6">
            {GENERATORS.slice(0, 8).map((g) => (
              <FeatureTile key={g.id} icon={g.icon} title={g.title} onClick={enterPanel} />
            ))}
          </div>
        </section>

        <section id="kalkulatory" className="py-14 border-t border-border scroll-mt-20">
          <SectionHeader icon="calculator" title="Kalkulatory" description="Kara łączna z taryfikatora, mandat za prędkość i przelicznik czasu odsiadki." />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mt-6">
            {CALCULATORS.slice(0, 8).map((c) => (
              <FeatureTile key={c.id} icon={c.icon} title={c.title} onClick={enterPanel} />
            ))}
          </div>
        </section>

        <section id="atlasy" className="py-14 border-t border-border scroll-mt-20">
          <SectionHeader icon="book-open" title="Baza wiedzy" description="Kodeks karny z taryfikatorem, procedury policyjne i kody radiowe — z wyszukiwarką i filtrami." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {ATLASES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={enterPanel}
                className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 text-left hover:border-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
                  <Icon name={a.icon} size={19} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-ink-faint truncate">{a.entries.length} pozycji</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-border text-center">
          <h2 className="font-display font-bold text-2xl">Zacznij w mniej niż minutę</h2>
          <p className="text-sm text-ink-muted mt-2">Logowanie przez Discord, dostęp na zaproszenie — zapisane dokumenty trzymamy na serwerze.</p>
          <button
            type="button"
            onClick={enterPanel}
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-xl px-6 py-3 mt-6 hover:opacity-90 transition-opacity"
          >
            <Icon name="zap" size={16} /> Uruchom Panel
          </button>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-[11px] text-ink-faint leading-relaxed px-6">
        PoliceOS — Panel Policji (LSPD) to narzędzie fabularne (RP) dla serwerów roleplay.
        Wszystkie dokumenty, przepisy i wyroki są fikcyjne i nie stanowią rzeczywistej dokumentacji prawnej.
      </footer>
    </div>
  );
}

function StatCard({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="font-display font-bold text-2xl text-accent-ink">{value}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
      <div className="text-[10px] text-ink-faint mt-0.5">{hint}</div>
    </div>
  );
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
        <Icon name={icon} size={19} />
      </div>
      <div>
        <h2 className="font-display font-bold text-xl">{title}</h2>
        <p className="text-sm text-ink-muted mt-0.5 max-w-xl">{description}</p>
      </div>
    </div>
  );
}

function FeatureTile({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 bg-surface border border-border rounded-lg p-3 text-left hover:border-accent transition-colors"
    >
      <Icon name={icon} size={16} className="text-accent-ink" />
      <span className="text-xs font-medium leading-snug line-clamp-2">{title}</span>
    </button>
  );
}

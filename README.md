# PoliceOS — Panel Policji (LSPD)

Panel narzędziowy dla frakcji policyjnej na serwerze roleplay (FiveM): generatory raportów i protokołów
(interwencja, zatrzymanie, mandat, przeszukanie, pościg, kolizja, użycie siły…), kodeks karny z taryfikatorem,
procedury policyjne, kody radiowe oraz kalkulatory (zatrzymanie z taryfikatora, mandat za prędkość, czas odsiadki).

> **Uwaga:** to narzędzie fabularne (RP). Wszystkie dokumenty, przepisy i procedury są fikcyjne i **nie stanowią
> rzeczywistej dokumentacji**.

Szkielet powstał z JusticeOS (ten sam stos, logowanie i API) — bez serwerów i rejestru firm.
Taryfikator (`src/data/penalCode.ts`) jest kopią z JusticeOS — zmieniając przepisy, aktualizuj oba projekty.

## Stos

- React 19 + TypeScript + Vite, Tailwind CSS v4, react-router-dom, Zustand (persist)
- html2canvas + jsPDF (eksport PDF/PNG), lucide-react (ikony)
- API: Node (`server/index.js`) + MariaDB — dokumenty użytkowników i system zaproszeń

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

W trybie deweloperskim `/api` jest przekierowane na serwer produkcyjny (`vite.config.ts`, port 8082).
Logowanie Discord wymaga dodania `http://localhost:5173/auth/discord/callback` oraz
`http://<IP>:8082/auth/discord/callback` jako Redirect URL w aplikacji Discord (`src/config.ts`).

## Konfiguracja

- `src/config.ts` — Client ID aplikacji Discord, ID właściciela, nazwa instytucji w nagłówkach pism.
- `src/data/generators.ts` — formularze dokumentów.
- `src/data/procedures.ts`, `src/data/radioCodes.ts` — baza wiedzy (dopasuj kody do regulaminu frakcji).
- `src/data/calculators.ts` — kalkulatory (progi mandatu za prędkość).

## Serwer

- Strona: nginx na porcie 8082 (`deploy/nginx-policeos.conf`), pliki w `/var/www/policeos`.
- API: usługa systemd `policeos-api` (`deploy/policeos-api.service`) na `127.0.0.1:3003`, konfiguracja w `/etc/policeos-api.env`
  (`DB_USER`, `DB_PASSWORD`, `DB_NAME=policeos`, `PORT=3003`, `OWNER_DISCORD_ID`).
- Baza: MariaDB `policeos` (`server/schema.sql`) — tabele `documents`, `access`, `invites`; użytkownik API ma tylko SELECT/INSERT/DELETE.
- Aktualizacja: `~/deploy-policeos.sh` (kopia w `deploy/`).

## Do zrobienia

- Kartoteka osób i pojazdów (MDT) — wyszukiwanie, notatki, poszukiwania.
- Przekazywanie protokołów do JusticeOS (np. zatrzymanie → akt oskarżenia).

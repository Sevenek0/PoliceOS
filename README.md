# PoliceOS — Panel Policji (LSPD)

Panel narzędziowy dla frakcji policyjnej na serwerze roleplay (FiveM): generatory raportów i protokołów
(interwencja, zatrzymanie, mandat, przeszukanie, pościg, kolizja, użycie siły…), kodeks karny z taryfikatorem,
procedury policyjne, kody radiowe, kartotekę MDT (osoby, pojazdy, historia) oraz kalkulatory (zatrzymanie z taryfikatora, mandat za prędkość, czas odsiadki).

> **Uwaga:** to narzędzie fabularne (RP). Wszystkie dokumenty, przepisy i procedury są fikcyjne i **nie stanowią
> rzeczywistej dokumentacji**.

Szkielet powstał z JusticeOS (ten sam stos, logowanie i API) — bez serwerów i rejestru firm.
Taryfikator (`src/data/penalCode.ts`) jest kopią z JusticeOS — zmieniając przepisy, aktualizuj oba projekty.

## Stos

- React 19 + TypeScript + Vite, Tailwind CSS v4, react-router-dom, Zustand (persist)
- html2canvas + jsPDF (eksport PDF/PNG), lucide-react (ikony)
- API: Node (`server/index.js`, `server/mdt.js`) + MariaDB — dokumenty, zaproszenia i kartoteka MDT

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
- Baza: MariaDB `policeos` (`server/schema.sql`) — tabele `documents`, `access`, `invites` oraz `mdt_persons`, `mdt_vehicles`, `mdt_records`.
  Użytkownik API ma SELECT/INSERT/DELETE na całej bazie i dodatkowo UPDATE na kartotece (nadaj raz, po pierwszym `schema.sql`):

  ```sql
  GRANT UPDATE ON policeos.mdt_persons TO '<user>'@'localhost';
  GRANT UPDATE ON policeos.mdt_vehicles TO '<user>'@'localhost';
  ```
- Aktualizacja: `~/deploy-policeos.sh` (kopia w `deploy/`).

## Kartoteka (MDT)

- `/panel/kartoteka` — wyszukiwarka osób (imię, SSN, telefon) i pojazdów (tablica, model, właściciel), lista poszukiwanych i skradzionych pojazdów.
- Karta osoby: dane, licencje, status „poszukiwany”, pojazdy i historia wpisów (notatka, mandat, zatrzymanie, poszukiwanie).
- Wpis można wypełnić z zapisanego dokumentu — protokół zatrzymania przenosi zarzuty, odsiadkę, grzywnę i numer dokumentu.
- Kartoteka jest wspólna dla wszystkich z dostępem; wpis usuwa tylko autor albo właściciel panelu.

## Przekazanie do JusticeOS

W „Moich dokumentach” przy protokołach, raportach i wniosku o nakaz jest przycisk **Do JusticeOS** — generuje kod `POS1.…`.
Prokurator wkleja go w JusticeOS przyciskiem **Importuj z PoliceOS** (akt oskarżenia, nakaz, wyrok, list gończy…):
wypełniają się dane osoby, zarzuty, data i miejsce czynu, opis zdarzenia, dowody i odnośnik do dokumentu LSPD.
Format kodu: `src/lib/justiceTransfer.ts` (PoliceOS) ↔ `src/lib/policeImport.ts` (JusticeOS) — zmieniaj oba naraz.

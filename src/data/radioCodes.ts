// Kody radiowe (10-codes) i statusy jednostek — wersja uproszczona do celów fabularnych (RP).
// Każdy serwer używa nieco innej listy — dopasuj do regulaminu swojej frakcji.
import type { AtlasEntry, AtlasCategoryMeta } from '../types';

export const RADIO_CATEGORIES: AtlasCategoryMeta[] = [
  { key: 'status', label: 'Status jednostki', color: 'success' },
  { key: 'zdarzenia', label: 'Zdarzenia', color: 'warning' },
  { key: 'alarm', label: 'Alarmowe', color: 'danger' },
  { key: 'kody', label: 'Kody odpowiedzi', color: 'accent' },
];

const LABELS: Record<string, string> = Object.fromEntries(RADIO_CATEGORIES.map((c) => [c.key, c.label]));

function code(id: string, name: string, meaning: string, category: string, example: string): AtlasEntry {
  return {
    id, name, subtitle: meaning, category, categoryLabel: LABELS[category],
    ...(category === 'alarm' ? { badgeLabel: 'Priorytet', badgeColor: 'danger' as const } : {}),
    tabs: [
      { label: 'Znaczenie', content: meaning },
      { label: 'Przykład na radiu', content: example },
    ],
  };
}

export const RADIO_ENTRIES: AtlasEntry[] = [
  // Status jednostki
  code('10-4', '10-4', 'Przyjąłem, zrozumiałem', 'status', '„Dispatch, 1-ADAM-12, 10-4.”'),
  code('10-8', '10-8', 'Jednostka dostępna, w służbie', 'status', '„1-ADAM-12, 10-8, patrol Vinewood.”'),
  code('10-7', '10-7', 'Koniec służby / niedostępny', 'status', '„1-ADAM-12, 10-7 na dziś.”'),
  code('10-6', '10-6', 'Zajęty — wykonuję czynności', 'status', '„1-ADAM-12, 10-6, raport na komisariacie.”'),
  code('10-20', '10-20', 'Lokalizacja', 'status', '„Jaki twój 10-20?” — „Legion Square.”'),
  code('10-23', '10-23', 'Na miejscu zdarzenia', 'status', '„1-ADAM-12, 10-23 przy sklepie na Grove.”'),
  code('10-76', '10-76', 'W drodze na miejsce', 'status', '„1-ADAM-12, 10-76 do zgłoszenia.”'),
  code('10-9', '10-9', 'Powtórz, nie zrozumiałem', 'status', '„Dispatch, 10-9 ostatnią wiadomość.”'),

  // Zdarzenia
  code('10-38', '10-38', 'Kontrola drogowa', 'zdarzenia', '„1-ADAM-12, 10-38, czarny Sultan, tablice 12ABC345, Strawberry Ave.”'),
  code('10-11', '10-11', 'Kontrola pieszego', 'zdarzenia', '„1-ADAM-12, 10-11 przy molo, jedna osoba.”'),
  code('10-15', '10-15', 'Zatrzymany w radiowozie, transport', 'zdarzenia', '„1-ADAM-12, 10-15, jadę na Mission Row.”'),
  code('10-28', '10-28', 'Sprawdzenie rejestracji pojazdu', 'zdarzenia', '„Dispatch, 10-28 dla 12ABC345.”'),
  code('10-29', '10-29', 'Sprawdzenie osoby w bazie (poszukiwania)', 'zdarzenia', '„Dispatch, 10-29 dla John Doe, ur. 01.01.1990.”'),
  code('10-50', '10-50', 'Wypadek drogowy', 'zdarzenia', '„10-50 na autostradzie, potrzebny EMS.”'),
  code('10-80', '10-80', 'Pościg', 'zdarzenia', '„10-80! Biały Buffalo, na północ Del Perro Fwy, 110 mph.”'),
  code('10-90', '10-90', 'Napad / alarm w obiekcie', 'zdarzenia', '„10-90 w banku Fleeca na Legion Square.”'),

  // Alarmowe
  code('10-99', '10-99', 'Funkcjonariusz w niebezpieczeństwie — wszystkie jednostki', 'alarm', '„10-99! 1-ADAM-12, pod ostrzałem, Grove Street!”'),
  code('10-13', '10-13', 'Strzały oddane / strzelanina', 'alarm', '„10-13, strzały przy Davis, jedna osoba ranna.”'),
  code('10-78', '10-78', 'Potrzebne wsparcie', 'alarm', '„1-ADAM-12, 10-78, dwie dodatkowe jednostki.”'),
  code('10-52', '10-52', 'Potrzebny EMS', 'alarm', '„10-52 na mój 10-20, rana postrzałowa.”'),

  // Kody odpowiedzi
  code('code-1', 'Code 1', 'Bez sygnałów, normalna jazda', 'kody', '„Jedź Code 1, zgłoszenie bez priorytetu.”'),
  code('code-2', 'Code 2', 'Pilne — tylko światła', 'kody', '„Code 2 do kolizji na Vespucci.”'),
  code('code-3', 'Code 3', 'Alarmowo — światła i syrena', 'kody', '„Wszystkie jednostki Code 3 do 10-90.”'),
  code('code-4', 'Code 4', 'Sytuacja opanowana, wsparcie zbędne', 'kody', '„Code 4, podejrzany zatrzymany.”'),
  code('code-6', 'Code 6', 'Wysiadam z pojazdu do czynności', 'kody', '„1-ADAM-12, Code 6 przy podejrzanym pojeździe.”'),
];

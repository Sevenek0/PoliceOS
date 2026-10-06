// Procedury policyjne — treści własnej redakcji, do celów fabularnych (RP).
import type { AtlasEntry, AtlasCategoryMeta } from '../types';

function entry(
  id: string, name: string, subtitle: string, category: string, categoryLabel: string,
  kiedy: string, przebieg: string, uwagi: string, badge?: Pick<AtlasEntry, 'badgeLabel' | 'badgeColor'>
): AtlasEntry {
  return {
    id, name, subtitle, category, categoryLabel, ...badge,
    tabs: [
      { label: 'Kiedy stosować', content: kiedy },
      { label: 'Przebieg', content: przebieg },
      { label: 'Uwagi i błędy', content: uwagi },
    ],
  };
}

export const PROCEDURE_CATEGORIES: AtlasCategoryMeta[] = [
  { key: 'zatrzymanie', label: 'Zatrzymanie i prawa' },
  { key: 'drogowe', label: 'Ruch drogowy' },
  { key: 'taktyka', label: 'Taktyka i użycie siły' },
  { key: 'dokumentacja', label: 'Dokumentacja i DOJ' },
];

const Z = ['zatrzymanie', 'Zatrzymanie i prawa'] as const;
const D = ['drogowe', 'Ruch drogowy'] as const;
const T = ['taktyka', 'Taktyka i użycie siły'] as const;
const K = ['dokumentacja', 'Dokumentacja i DOJ'] as const;

export const PROCEDURE_ENTRIES: AtlasEntry[] = [
  entry('miranda', 'Pouczenie o prawach (formułka Mirandy)', 'Miranda warning', ...Z,
    'Przy każdym zatrzymaniu, przed pierwszym przesłuchaniem osoby zatrzymanej. Bez pouczenia wyjaśnienia zatrzymanego nie mogą być dowodem przeciwko niemu.',
    '1. „Masz prawo zachować milczenie.”\n2. „Wszystko, co powiesz, może zostać i zostanie użyte przeciwko tobie w sądzie.”\n3. „Masz prawo do adwokata i do jego obecności podczas przesłuchania.”\n4. „Jeśli nie stać cię na adwokata, zostanie ci on przydzielony z urzędu.”\n5. „Czy rozumiesz przysługujące ci prawa?” — odnotuj odpowiedź zatrzymanego.',
    'Pouczenie musi być wyraźne i zrozumiałe. Najczęstszy błąd: przesłuchanie „przy okazji” w radiowozie przed pouczeniem — takie wyjaśnienia obrona skutecznie podważa.',
    { badgeLabel: 'Obowiązkowe', badgeColor: 'danger' }),

  entry('zatrzymanie', 'Zatrzymanie osoby', 'Arrest', ...Z,
    'Przy ujęciu na gorącym uczynku, uzasadnionym podejrzeniu przestępstwa albo na podstawie nakazu lub listu gończego.',
    '1. Poinformuj osobę o zatrzymaniu i jego przyczynie.\n2. Zakuj w kajdanki i przeszukaj pod kątem broni.\n3. Pouczenie o prawach (Miranda).\n4. Zapewnij pomoc EMS, jeśli osoba jest ranna.\n5. Przewieź na komisariat, zdeponuj przedmioty.\n6. Wylicz karę z taryfikatora i sporządź protokół zatrzymania.',
    'Zatrzymany ma prawo do adwokata — jeśli go zażąda, wstrzymaj przesłuchanie do jego przybycia.',
    { badgeLabel: 'Kluczowe', badgeColor: 'accent' }),

  entry('legitymowanie', 'Legitymowanie', 'ID check', ...Z,
    'Gdy istnieje uzasadnione podejrzenie wykroczenia lub przestępstwa albo osoba jest uczestnikiem zdarzenia.',
    '1. Przedstaw się (stopień, nazwisko, jednostka).\n2. Podaj podstawę legitymowania.\n3. Poproś o dokument tożsamości.\n4. Sprawdź osobę w bazie (poszukiwania, nakazy).\n5. Oddaj dokument i poinformuj o dalszych czynnościach.',
    'Odmowa okazania dokumentu to wykroczenie — w razie wątpliwości co do tożsamości możesz zatrzymać osobę do jej ustalenia.'),

  entry('przeszukanie', 'Przeszukanie osoby, pojazdu, lokalu', 'Search', ...Z,
    'Za zgodą osoby, przy zatrzymaniu, przy uzasadnionym podejrzeniu (pojazd) albo na podstawie nakazu (lokal).',
    '1. Ustal podstawę przeszukania.\n2. Przy lokalu — okaż nakaz przeszukania.\n3. Przeszukuj w obecności drugiego funkcjonariusza lub świadka.\n4. Ujawnione przedmioty opisz i zabezpiecz.\n5. Sporządź protokół przeszukania.',
    'Dowody z przeszukania lokalu bez nakazu i bez zgody obrona łatwo podważy w sądzie.'),

  entry('kontrola-drogowa', 'Kontrola drogowa', 'Traffic stop', ...D,
    'Po ujawnieniu wykroczenia drogowego albo przy podejrzeniu, że pojazd lub kierowca jest poszukiwany.',
    '1. Zgłoś kontrolę na radiu (10-38, lokalizacja, tablice).\n2. Zatrzymaj pojazd w bezpiecznym miejscu.\n3. Podejdź od strony kierowcy, obserwuj wnętrze.\n4. Przedstaw się i podaj przyczynę kontroli.\n5. Sprawdź prawo jazdy, rejestrację i ubezpieczenie.\n6. Pouczenie, mandat lub dalsze czynności.',
    'Przy kontroli wysokiego ryzyka (felony stop) nie podchodź do pojazdu — wywołuj osoby komendami głosowymi.'),

  entry('felony-stop', 'Kontrola wysokiego ryzyka', 'Felony stop', ...D,
    'Pojazd skradziony, osoba poszukiwana, informacja o broni w pojeździe.',
    '1. Zgłoś na radiu i poczekaj na wsparcie.\n2. Ustaw radiowozy w klin, zajmij osłonę za drzwiami.\n3. Komendy: silnik off, kluczyki za okno, ręce na zewnątrz.\n4. Wywołuj osoby pojedynczo tyłem do jednostki.\n5. Kajdanki, przeszukanie, sprawdzenie pojazdu.',
    'Jeden funkcjonariusz wydaje komendy — pozostali osłaniają.',
    { badgeLabel: 'Wysokie ryzyko', badgeColor: 'danger' }),

  entry('poscig', 'Pościg', 'Pursuit', ...T,
    'Gdy kierowca nie zatrzymuje się do kontroli i ucieka.',
    '1. Zgłoś pościg (10-80): kierunek, pojazd, prędkość.\n2. Maks. 3 radiowozy w pościgu, reszta blokuje.\n3. Taktyki (PIT, kolczatka) tylko za zgodą dowódcy.\n4. Przerwij pościg, jeśli zagraża osobom postronnym.\n5. Po zakończeniu — raport z pościgu.',
    'PIT powyżej ok. 60 mph tylko przy zagrożeniu życia.'),

  entry('uzycie-sily', 'Kontinuum użycia siły', 'Use of force', ...T,
    'Przy oporze osoby zatrzymywanej lub zagrożeniu dla funkcjonariusza albo osób trzecich.',
    '1. Obecność i polecenia słowne.\n2. Siła fizyczna i chwyty obezwładniające.\n3. Środki pośrednie: pałka, gaz, taser.\n4. Broń palna — wyłącznie przy bezpośrednim zagrożeniu życia.\nPo każdym użyciu siły: pomoc medyczna i raport użycia siły.',
    'Środek ma być adekwatny do oporu — przeskoczenie poziomów wymaga uzasadnienia w raporcie.',
    { badgeLabel: 'Obowiązkowe', badgeColor: 'danger' }),

  entry('panic', 'Przycisk alarmowy (10-99)', 'Officer down', ...T,
    'Funkcjonariusz w bezpośrednim zagrożeniu, ranny lub pod ostrzałem.',
    '1. Nadaj 10-99 z lokalizacją.\n2. Wszystkie wolne jednostki jadą z sygnałami.\n3. Dyspozytor wzywa EMS do strefy (staging).\n4. Pierwsza jednostka ocenia sytuację i przejmuje dowodzenie.',
    'Kanał radiowy zostaje zwolniony tylko dla zdarzenia 10-99.'),

  entry('przekazanie-doj', 'Przekazanie sprawy do DOJ', 'Case referral', ...K,
    'Przy zbrodniach, sprawach bez zgody na mandat oraz gdy potrzebny jest nakaz.',
    '1. Zbierz raporty, protokoły i dowody.\n2. Sporządź wniosek o nakaz albo przekaż akta prokuratorowi.\n3. Zapisz numery dokumentów w raporcie.\n4. Bądź gotów zeznawać jako świadek na rozprawie.',
    'Dokumenty z PoliceOS można dołączać do aktów oskarżenia w JusticeOS.'),

  entry('zabezpieczenie-dowodow', 'Zabezpieczenie dowodów', 'Chain of custody', ...K,
    'Przy każdym ujawnieniu przedmiotu, który może być dowodem.',
    '1. Sfotografuj przedmiot na miejscu.\n2. Nadaj numer dowodu.\n3. Zapakuj i opisz (kto, gdzie, kiedy).\n4. Przekaż do magazynu dowodów i odnotuj w protokole.',
    'Każde przekazanie dowodu musi być odnotowane — przerwany łańcuch dowodowy podważa dowód.'),
];

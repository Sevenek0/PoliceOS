// Generatory dokumentów LSPD — wzory fikcyjne, wyłącznie do celów fabularnych (RP).
import type { GeneratorConfig, FormField, FormSection, SelectOption } from '../types';

const signatureField: FormField = {
  key: 'signatureMode', label: 'Podpis', type: 'select', required: true, previewKind: 'hidden',
  options: [{ label: 'Automatyczny (na podstawie profilu)', value: 'auto' }, { label: 'Ręczny opis', value: 'manual' }],
};

const OFFENSE_CATEGORIES: SelectOption[] = [
  { label: 'Wykroczenie', value: 'Wykroczenie' },
  { label: 'Przestępstwo', value: 'Przestępstwo' },
  { label: 'Zbrodnia', value: 'Zbrodnia' },
];

const ENFORCING_UNITS: SelectOption[] = [
  { label: 'LSPD — Los Santos Police Department', value: 'LSPD' },
  { label: "BCSO — Blaine County Sheriff's Office", value: 'BCSO' },
  { label: 'SAHP — San Andreas Highway Patrol', value: 'SAHP' },
  { label: 'US Marshals', value: 'US Marshals' },
  { label: 'FIB', value: 'FIB' },
];

/** Wystawca — imię, stanowisko, legitymacja i jednostka trafiają do bloku podpisu. */
function issuerSection(title = 'Wystawca'): FormSection {
  return {
    key: 'issuer', title, icon: 'user-round',
    fields: [
      { key: 'issuerName', label: 'Imię i nazwisko', type: 'text', required: true },
      { key: 'issuerPosition', label: 'Stopień', type: 'text', required: true },
      { key: 'issuerBadge', label: 'Nr odznaki', type: 'text', required: true },
      { key: 'unit', label: 'Jednostka', type: 'text', required: true },
      signatureField,
    ],
  };
}

/** Dane osoby — prefiks klucza pozwala mieć kilka osób w jednym dokumencie. */
function personSection(prefix: string, title: string, icon = 'user', extra: FormField[] = [], required = true): FormSection {
  return {
    key: prefix, title, icon,
    fields: [
      { key: `${prefix}Name`, label: 'Imię i nazwisko', type: 'text', required, previewKind: 'kv' },
      { key: `${prefix}Dob`, label: 'Data urodzenia', type: 'date', required, previewKind: 'kv' },
      { key: `${prefix}Id`, label: 'Nr identyfikacyjny (SSN)', type: 'text', previewKind: 'kv' },
      { key: `${prefix}Address`, label: 'Adres zamieszkania', type: 'text', previewKind: 'kv' },
      ...extra,
    ],
  };
}

const chargesField: FormField = {
  key: 'charges', label: 'Zarzuty', type: 'repeat', required: true, previewKind: 'repeat', subFields: [
    { key: 'article', label: 'Artykuł', type: 'text', required: true },
    { key: 'description', label: 'Opis czynu', type: 'text', required: true },
    { key: 'category', label: 'Kwalifikacja', type: 'select', options: OFFENSE_CATEGORIES },
  ],
};

const vehicleFields = (prefix: string): FormField[] => [
  { key: `${prefix}Model`, label: 'Marka i model', type: 'text', previewKind: 'kv' },
  { key: `${prefix}Plate`, label: 'Nr rejestracyjny', type: 'text', previewKind: 'kv' },
  { key: `${prefix}Color`, label: 'Kolor', type: 'text', previewKind: 'kv' },
];

const evidenceField: FormField = {
  key: 'evidenceItems', label: 'Zabezpieczone przedmioty', type: 'repeat', previewKind: 'repeat', subFields: [
    { key: 'item', label: 'Przedmiot', type: 'text', required: true },
    { key: 'quantity', label: 'Ilość', type: 'text' },
    { key: 'location', label: 'Miejsce ujawnienia', type: 'text' },
    { key: 'evidenceNo', label: 'Nr dowodu', type: 'text' },
  ],
};

export const GENERATORS: GeneratorConfig[] = [
  // ---------- Priorytetowe ----------
  {
    id: 'raport-interwencji', title: 'Raport z interwencji', description: 'Opis zdarzenia, podjętych czynności i ich wyniku', icon: 'clipboard-pen',
    docPrefix: 'RI', docTypeLabel: 'Raport z interwencji', category: 'priority',
    sections: [
      issuerSection('Funkcjonariusz sporządzający'),
      {
        key: 'incident', title: 'Zdarzenie', icon: 'map-pin', fields: [
          { key: 'incidentDate', label: 'Data i godzina', type: 'text', required: true, previewKind: 'kv', placeholder: 'np. 12.10.2026, 21:40' },
          { key: 'incidentPlace', label: 'Miejsce', type: 'text', required: true, previewKind: 'kv' },
          { key: 'incidentType', label: 'Rodzaj zgłoszenia', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Zgłoszenie 911', value: 'Zgłoszenie 911' }, { label: 'Kontrola drogowa', value: 'Kontrola drogowa' },
            { label: 'Patrol — ujawnienie własne', value: 'Patrol — ujawnienie własne' }, { label: 'Strzelanina', value: 'Strzelanina' },
            { label: 'Napad', value: 'Napad' }, { label: 'Zakłócanie porządku', value: 'Zakłócanie porządku' }, { label: 'Inne', value: 'Inne' },
          ] },
          { key: 'units', label: 'Jednostki na miejscu', type: 'text', previewKind: 'kv', placeholder: 'np. 1-ADAM-12, 2-LINCOLN-4, EMS' },
          { key: 'agency', label: 'Prowadząca agencja', type: 'select', previewKind: 'kv', options: ENFORCING_UNITS },
        ],
      },
      {
        key: 'persons', title: 'Uczestnicy', icon: 'users', fields: [
          { key: 'involved', label: 'Osoby uczestniczące', type: 'repeat', previewKind: 'repeat', subFields: [
            { key: 'name', label: 'Imię i nazwisko', type: 'text', required: true },
            { key: 'role', label: 'Rola', type: 'select', options: [
              { label: 'Podejrzany', value: 'Podejrzany' }, { label: 'Pokrzywdzony', value: 'Pokrzywdzony' },
              { label: 'Świadek', value: 'Świadek' }, { label: 'Zgłaszający', value: 'Zgłaszający' },
            ] },
            { key: 'notes', label: 'Uwagi', type: 'text' },
          ] },
        ],
      },
      {
        key: 'course', title: 'Przebieg', icon: 'file-text', fields: [
          { key: 'narrative', label: 'Przebieg interwencji', type: 'textarea', required: true, previewKind: 'paragraph' },
          { key: 'actions', label: 'Podjęte czynności', type: 'textarea', previewKind: 'paragraph', placeholder: 'Legitymowanie, przeszukanie, zatrzymanie, wezwanie EMS…' },
          { key: 'outcome', label: 'Wynik', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Pouczenie', value: 'Pouczenie' }, { label: 'Mandat', value: 'Mandat' },
            { label: 'Zatrzymanie', value: 'Zatrzymanie' }, { label: 'Przekazanie sprawy do DOJ', value: 'Przekazanie sprawy do DOJ' },
            { label: 'Brak podstaw do działań', value: 'Brak podstaw do działań' },
          ] },
        ],
      },
    ],
  },

  {
    id: 'protokol-zatrzymania', title: 'Protokół zatrzymania', description: 'Zatrzymanie osoby — podstawa, zarzuty i pouczenie', icon: 'link-2',
    docPrefix: 'PZ', docTypeLabel: 'Protokół zatrzymania osoby', accentVariant: 'danger', category: 'priority',
    sections: [
      issuerSection('Funkcjonariusz zatrzymujący'),
      personSection('detainee', 'Osoba zatrzymana', 'user', [
        { key: 'detaineeDescription', label: 'Rysopis / znaki szczególne', type: 'textarea', previewKind: 'paragraph' },
      ]),
      {
        key: 'arrest', title: 'Zatrzymanie', icon: 'siren', fields: [
          { key: 'arrestDate', label: 'Data i godzina zatrzymania', type: 'text', required: true, previewKind: 'kv' },
          { key: 'arrestPlace', label: 'Miejsce zatrzymania', type: 'text', required: true, previewKind: 'kv' },
          { key: 'reason', label: 'Podstawa zatrzymania', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Ujęcie na gorącym uczynku', value: 'Ujęcie na gorącym uczynku' },
            { label: 'Uzasadnione podejrzenie popełnienia przestępstwa', value: 'Uzasadnione podejrzenie popełnienia przestępstwa' },
            { label: 'Nakaz aresztowania', value: 'Nakaz aresztowania' },
            { label: 'List gończy', value: 'List gończy' },
          ] },
          { key: 'mirandaGiven', label: 'Pouczono o prawach (Miranda)', type: 'checkbox', previewKind: 'kv', defaultValue: true },
          { key: 'lawyerRequested', label: 'Zażądano adwokata', type: 'checkbox', previewKind: 'kv' },
          { key: 'medical', label: 'Udzielono pomocy medycznej / EMS', type: 'checkbox', previewKind: 'kv' },
        ],
      },
      { key: 'charges', title: 'Zarzuty', icon: 'list-ordered', fields: [chargesField] },
      {
        key: 'penalty', title: 'Kara z taryfikatora', icon: 'gavel', fields: [
          { key: 'jailMonths', label: 'Odsiadka', type: 'number', unit: 'mies.', previewKind: 'kv' },
          { key: 'fine', label: 'Grzywna', type: 'number', unit: '$', previewKind: 'kv' },
          { key: 'confiscated', label: 'Przedmioty zatrzymane do depozytu', type: 'textarea', previewKind: 'paragraph' },
          { key: 'notes', label: 'Uwagi', type: 'textarea', previewKind: 'paragraph' },
        ],
      },
    ],
  },

  {
    id: 'mandat-karny', title: 'Mandat karny', description: 'Grzywna nałożona w postępowaniu mandatowym', icon: 'receipt',
    docPrefix: 'MK', docTypeLabel: 'Mandat karny', accentVariant: 'warning', category: 'priority',
    sections: [
      issuerSection('Funkcjonariusz nakładający'),
      personSection('offender', 'Ukarany'),
      {
        key: 'offenses', title: 'Wykroczenia', icon: 'list-ordered', fields: [
          { key: 'offenseDate', label: 'Data wykroczenia', type: 'date', required: true, previewKind: 'kv' },
          { key: 'offensePlace', label: 'Miejsce', type: 'text', required: true, previewKind: 'kv' },
          { key: 'vehicle', label: 'Pojazd (jeśli dotyczy)', type: 'text', previewKind: 'kv' },
          { key: 'offensesList', label: 'Wykroczenia', type: 'repeat', required: true, previewKind: 'repeat', subFields: [
            { key: 'article', label: 'Artykuł', type: 'text', required: true },
            { key: 'description', label: 'Opis', type: 'text', required: true },
            { key: 'amount', label: 'Kwota ($)', type: 'text', required: true },
          ] },
          { key: 'total', label: 'Łączna kwota grzywny', type: 'number', unit: '$', required: true, previewKind: 'kv' },
          { key: 'paymentDays', label: 'Termin zapłaty', type: 'number', unit: 'dni', previewKind: 'kv', defaultValue: 7 },
          { key: 'accepted', label: 'Stanowisko ukaranego', type: 'select', required: true, previewKind: 'result',
            resultGoodValues: ['przyjety'], options: [
              { label: 'Mandat przyjęty', value: 'przyjety' },
              { label: 'Odmowa przyjęcia — sprawa skierowana do sądu', value: 'odmowa' },
            ] },
        ],
      },
    ],
  },

  {
    id: 'protokol-przeszukania', title: 'Protokół przeszukania', description: 'Przeszukanie osoby, pojazdu lub lokalu i zabezpieczone przedmioty', icon: 'search',
    docPrefix: 'PP', docTypeLabel: 'Protokół przeszukania', category: 'priority',
    sections: [
      issuerSection('Funkcjonariusz przeszukujący'),
      personSection('searched', 'Osoba przeszukiwana / właściciel', 'user'),
      {
        key: 'search', title: 'Przeszukanie', icon: 'scan-search', fields: [
          { key: 'searchDate', label: 'Data i godzina', type: 'text', required: true, previewKind: 'kv' },
          { key: 'searchObject', label: 'Przedmiot przeszukania', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Osoba', value: 'Osoba' }, { label: 'Pojazd', value: 'Pojazd' },
            { label: 'Lokal / nieruchomość', value: 'Lokal / nieruchomość' },
          ] },
          { key: 'searchPlace', label: 'Adres / pojazd', type: 'text', required: true, previewKind: 'kv' },
          { key: 'legalBasis', label: 'Podstawa', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Nakaz przeszukania', value: 'Nakaz przeszukania' },
            { label: 'Zgoda osoby', value: 'Zgoda osoby' },
            { label: 'Przeszukanie przy zatrzymaniu', value: 'Przeszukanie przy zatrzymaniu' },
            { label: 'Uzasadnione podejrzenie (probable cause)', value: 'Uzasadnione podejrzenie (probable cause)' },
          ] },
          { key: 'warrantRef', label: 'Sygnatura nakazu', type: 'text', previewKind: 'kv' },
          { key: 'witnesses', label: 'Obecni przy przeszukaniu', type: 'text', previewKind: 'kv' },
        ],
      },
      { key: 'evidence', title: 'Zabezpieczone przedmioty', icon: 'package', fields: [
        evidenceField,
        { key: 'searchNotes', label: 'Przebieg i uwagi', type: 'textarea', previewKind: 'paragraph' },
      ] },
    ],
  },

  // ---------- Pozostałe ----------
  {
    id: 'notatka-sluzbowa', title: 'Notatka służbowa', description: 'Krótki zapis czynności lub ustaleń funkcjonariusza', icon: 'sticky-note',
    docPrefix: 'NS', docTypeLabel: 'Notatka służbowa', category: 'standard',
    sections: [
      issuerSection('Sporządzający'),
      {
        key: 'note', title: 'Treść notatki', icon: 'file-text', fields: [
          { key: 'subject', label: 'Dotyczy', type: 'text', required: true, previewKind: 'kv' },
          { key: 'caseRef', label: 'Nr sprawy', type: 'text', previewKind: 'kv' },
          { key: 'eventDate', label: 'Data czynności', type: 'date', previewKind: 'kv' },
          { key: 'content', label: 'Treść', type: 'textarea', required: true, previewKind: 'paragraph' },
          { key: 'nextSteps', label: 'Wnioski / dalsze czynności', type: 'textarea', previewKind: 'paragraph' },
        ],
      },
    ],
  },

  {
    id: 'protokol-dowodow', title: 'Protokół zabezpieczenia dowodów', description: 'Łańcuch dowodowy — co, gdzie i kto zabezpieczył', icon: 'package-search',
    docPrefix: 'ZD', docTypeLabel: 'Protokół zabezpieczenia dowodów', category: 'standard',
    sections: [
      issuerSection('Funkcjonariusz zabezpieczający'),
      {
        key: 'case', title: 'Sprawa', icon: 'folder', fields: [
          { key: 'caseRef', label: 'Nr sprawy', type: 'text', required: true, previewKind: 'kv' },
          { key: 'scene', label: 'Miejsce zdarzenia', type: 'text', required: true, previewKind: 'kv' },
          { key: 'securedAt', label: 'Data i godzina zabezpieczenia', type: 'text', required: true, previewKind: 'kv' },
        ],
      },
      { key: 'evidence', title: 'Dowody', icon: 'package', fields: [
        { ...evidenceField, required: true },
        { key: 'storage', label: 'Miejsce przechowywania', type: 'text', previewKind: 'kv', defaultValue: 'Magazyn dowodów — Mission Row' },
        { key: 'handedTo', label: 'Przekazano (imię, stopień)', type: 'text', previewKind: 'kv' },
      ] },
    ],
  },

  {
    id: 'raport-poscigu', title: 'Raport z pościgu', description: 'Przebieg pościgu pojazdu lub pieszego i jego zakończenie', icon: 'car-front',
    docPrefix: 'RP', docTypeLabel: 'Raport z pościgu', accentVariant: 'warning', category: 'standard',
    sections: [
      issuerSection('Jednostka prowadząca'),
      {
        key: 'pursuit', title: 'Pościg', icon: 'route', fields: [
          { key: 'startTime', label: 'Rozpoczęcie (data, godzina)', type: 'text', required: true, previewKind: 'kv' },
          { key: 'startPlace', label: 'Miejsce rozpoczęcia', type: 'text', required: true, previewKind: 'kv' },
          { key: 'endPlace', label: 'Miejsce zakończenia', type: 'text', previewKind: 'kv' },
          { key: 'pursuitReason', label: 'Powód', type: 'text', required: true, previewKind: 'kv' },
          ...vehicleFields('suspectVehicle'),
          { key: 'maxSpeed', label: 'Maksymalna prędkość', type: 'number', unit: 'mph', previewKind: 'kv' },
          { key: 'tactics', label: 'Użyte taktyki', type: 'text', previewKind: 'kv', placeholder: 'PIT, kolczatka, blokada, Air-1…' },
          { key: 'units', label: 'Jednostki biorące udział', type: 'text', previewKind: 'kv' },
        ],
      },
      {
        key: 'end', title: 'Zakończenie', icon: 'flag', fields: [
          { key: 'endResult', label: 'Wynik', type: 'select', required: true, previewKind: 'result', resultGoodValues: ['zatrzymany'], options: [
            { label: 'Podejrzany zatrzymany', value: 'zatrzymany' },
            { label: 'Podejrzany zbiegł', value: 'zbiegl' },
            { label: 'Pościg przerwany (bezpieczeństwo)', value: 'przerwany' },
          ] },
          { key: 'damage', label: 'Szkody i ranni', type: 'textarea', previewKind: 'paragraph' },
          { key: 'narrative', label: 'Opis przebiegu', type: 'textarea', required: true, previewKind: 'paragraph' },
        ],
      },
    ],
  },

  {
    id: 'protokol-kolizji', title: 'Protokół kolizji drogowej', description: 'Zdarzenie drogowe — uczestnicy, pojazdy i sprawca', icon: 'car',
    docPrefix: 'KD', docTypeLabel: 'Protokół zdarzenia drogowego', category: 'standard',
    sections: [
      issuerSection('Funkcjonariusz'),
      {
        key: 'event', title: 'Zdarzenie', icon: 'map-pin', fields: [
          { key: 'eventDate', label: 'Data i godzina', type: 'text', required: true, previewKind: 'kv' },
          { key: 'eventPlace', label: 'Miejsce', type: 'text', required: true, previewKind: 'kv' },
          { key: 'eventType', label: 'Rodzaj', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Kolizja (tylko szkody)', value: 'Kolizja' }, { label: 'Wypadek (ranni)', value: 'Wypadek' },
            { label: 'Wypadek śmiertelny', value: 'Wypadek śmiertelny' },
          ] },
          { key: 'conditions', label: 'Warunki drogowe', type: 'text', previewKind: 'kv', placeholder: 'np. noc, deszcz, mokra nawierzchnia' },
        ],
      },
      personSection('driverA', 'Kierujący A', 'user', vehicleFields('vehicleA')),
      personSection('driverB', 'Kierujący B', 'user', vehicleFields('vehicleB'), false),
      {
        key: 'findings', title: 'Ustalenia', icon: 'scale', fields: [
          { key: 'culprit', label: 'Sprawca', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Kierujący A', value: 'Kierujący A' }, { label: 'Kierujący B', value: 'Kierujący B' },
            { label: 'Obaj kierujący', value: 'Obaj kierujący' }, { label: 'Nie ustalono', value: 'Nie ustalono' },
          ] },
          { key: 'injuries', label: 'Ranni / EMS', type: 'textarea', previewKind: 'paragraph' },
          { key: 'description', label: 'Opis zdarzenia', type: 'textarea', required: true, previewKind: 'paragraph' },
          { key: 'sanction', label: 'Zastosowane środki', type: 'text', previewKind: 'kv', placeholder: 'np. mandat 1500 $, zatrzymanie prawa jazdy' },
        ],
      },
    ],
  },

  {
    id: 'raport-uzycia-sily', title: 'Raport użycia siły', description: 'Użycie środków przymusu lub broni — uzasadnienie i skutki', icon: 'shield-alert',
    docPrefix: 'US', docTypeLabel: 'Raport użycia środków przymusu', accentVariant: 'danger', category: 'standard',
    sections: [
      issuerSection('Funkcjonariusz'),
      personSection('subject', 'Osoba, wobec której użyto siły', 'user', [], false),
      {
        key: 'force', title: 'Użycie siły', icon: 'shield-alert', fields: [
          { key: 'forceDate', label: 'Data i godzina', type: 'text', required: true, previewKind: 'kv' },
          { key: 'forcePlace', label: 'Miejsce', type: 'text', required: true, previewKind: 'kv' },
          { key: 'forceLevel', label: 'Najwyższy użyty środek', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Siła fizyczna', value: 'Siła fizyczna' }, { label: 'Kajdanki', value: 'Kajdanki' },
            { label: 'Pałka', value: 'Pałka' }, { label: 'Paralizator (taser)', value: 'Paralizator (taser)' },
            { label: 'Gaz pieprzowy', value: 'Gaz pieprzowy' }, { label: 'Broń palna', value: 'Broń palna' },
          ] },
          { key: 'shotsFired', label: 'Liczba oddanych strzałów', type: 'number', previewKind: 'kv' },
          { key: 'justification', label: 'Uzasadnienie', type: 'textarea', required: true, previewKind: 'paragraph' },
          { key: 'injuries', label: 'Obrażenia i pomoc medyczna', type: 'textarea', previewKind: 'paragraph' },
          { key: 'bodycam', label: 'Nagranie z kamery nasobnej', type: 'checkbox', previewKind: 'kv' },
        ],
      },
    ],
  },

  {
    id: 'wniosek-o-nakaz', title: 'Wniosek o nakaz do DOJ', description: 'Wniosek o nakaz przeszukania lub aresztowania kierowany do sądu', icon: 'send',
    docPrefix: 'WN', docTypeLabel: 'Wniosek o wydanie nakazu', category: 'standard',
    sections: [
      issuerSection('Wnioskujący'),
      personSection('target', 'Osoba, której dotyczy wniosek', 'user'),
      {
        key: 'request', title: 'Wniosek', icon: 'file-text', fields: [
          { key: 'warrantType', label: 'Rodzaj nakazu', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Nakaz przeszukania', value: 'Nakaz przeszukania' }, { label: 'Nakaz aresztowania', value: 'Nakaz aresztowania' },
            { label: 'List gończy', value: 'List gończy' },
          ] },
          { key: 'addressee', label: 'Adresat', type: 'text', previewKind: 'kv', defaultValue: 'Sąd Okręgowy w Los Santos' },
          { key: 'searchScope', label: 'Zakres (adres, pojazd)', type: 'text', previewKind: 'kv' },
          { key: 'probableCause', label: 'Uzasadnienie (probable cause)', type: 'textarea', required: true, previewKind: 'paragraph' },
          { key: 'evidenceSummary', label: 'Posiadane dowody', type: 'textarea', previewKind: 'paragraph' },
        ],
      },
    ],
  },

  {
    id: 'list-gonczy', title: 'List gończy', description: 'Publiczne poszukiwanie osoby ukrywającej się', icon: 'siren',
    docPrefix: 'LG', docTypeLabel: 'List gończy', accentVariant: 'danger', category: 'priority',
    sections: [
      issuerSection('Organ wydający'),
      personSection('wanted', 'Osoba poszukiwana', 'user', [
        { key: 'wantedAlias', label: 'Pseudonim / ksywa', type: 'text', previewKind: 'kv' },
        { key: 'wantedDescription', label: 'Rysopis i znaki szczególne', type: 'textarea', required: true, previewKind: 'paragraph' },
      ]),
      {
        key: 'details', title: 'Szczegóły poszukiwania', icon: 'crosshair', fields: [
          { key: 'armed', label: 'Stopień zagrożenia', type: 'select', required: true, previewKind: 'kv', options: [
            { label: 'Niski', value: 'Niski' }, { label: 'Średni', value: 'Średni' },
            { label: 'Wysoki — może być uzbrojony', value: 'Wysoki — może być uzbrojony' },
            { label: 'Bardzo wysoki — uzbrojony i niebezpieczny', value: 'Bardzo wysoki — uzbrojony i niebezpieczny' },
          ] },
          { key: 'lastSeen', label: 'Ostatnio widziany', type: 'text', previewKind: 'kv' },
          { key: 'reward', label: 'Nagroda', type: 'number', unit: '$', previewKind: 'kv' },
          { key: 'contact', label: 'Kontakt', type: 'text', previewKind: 'kv', defaultValue: 'Najbliższa jednostka policji lub numer alarmowy 911' },
          { key: 'chargesText', label: 'Zarzucane czyny', type: 'textarea', required: true, previewKind: 'paragraph' },
          { key: 'warning', label: 'Ostrzeżenie dla obywateli', type: 'textarea', previewKind: 'paragraph',
            defaultValue: 'Nie podejmuj samodzielnych prób zatrzymania. Każdego, kto zna miejsce pobytu poszukiwanego, prosimy o niezwłoczny kontakt z organami ścigania.' },
        ],
      },
    ],
  },
];

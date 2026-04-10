// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Einkaufsgruppe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gruppenname?: string;
    beschreibung?: string;
    einkaufsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    treffpunkt?: string;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    stadt?: string;
    max_teilnehmer?: number;
    oeffentlich?: boolean;
  };
}

export interface Teilnehmer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    gruppe?: string; // applookup -> URL zu 'Einkaufsgruppe' Record
    bemerkung?: string;
  };
}

export interface Einkaufsliste {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    liste_gruppe?: string; // applookup -> URL zu 'Einkaufsgruppe' Record
    liste_teilnehmer?: string; // applookup -> URL zu 'Teilnehmer' Record
    liste_artikel?: string; // applookup -> URL zu 'Artikel' Record
    menge?: number;
    einheit_freitext?: string;
    prioritaet?: LookupValue;
    status?: LookupValue;
    hinweis?: string;
  };
}

export interface Artikel {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikelname?: string;
    kategorie?: LookupValue;
    einheit?: LookupValue;
    artikelbeschreibung?: string;
    artikelbild?: string;
  };
}

export const APP_IDS = {
  EINKAUFSGRUPPE: '69bd201272c1eb2d5e90e025',
  TEILNEHMER: '69bd201635dec1f676ca482e',
  EINKAUFSLISTE: '69bd20171f363e8e32d0e8af',
  ARTIKEL: '69bd2017bdc3f95e8029956d',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'einkaufsliste': {
    prioritaet: [{ key: "niedrig", label: "Niedrig" }, { key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }],
    status: [{ key: "offen", label: "Offen" }, { key: "erledigt", label: "Erledigt" }],
  },
  'artikel': {
    kategorie: [{ key: "obst_gemuese", label: "Obst & Gemüse" }, { key: "milchprodukte", label: "Milchprodukte" }, { key: "fleisch_fisch", label: "Fleisch & Fisch" }, { key: "backwaren", label: "Backwaren" }, { key: "getraenke", label: "Getränke" }, { key: "tiefkuehl", label: "Tiefkühlprodukte" }, { key: "konserven", label: "Konserven & Trockenware" }, { key: "hygiene", label: "Hygiene & Haushalt" }, { key: "sonstiges", label: "Sonstiges" }],
    einheit: [{ key: "stueck", label: "Stück" }, { key: "kg", label: "Kilogramm (kg)" }, { key: "gramm", label: "Gramm (g)" }, { key: "liter", label: "Liter (l)" }, { key: "milliliter", label: "Milliliter (ml)" }, { key: "packung", label: "Packung" }, { key: "flasche", label: "Flasche" }, { key: "dose", label: "Dose" }, { key: "beutel", label: "Beutel" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'einkaufsgruppe': {
    'gruppenname': 'string/text',
    'beschreibung': 'string/textarea',
    'einkaufsdatum': 'date/datetimeminute',
    'treffpunkt': 'string/text',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'stadt': 'string/text',
    'max_teilnehmer': 'number',
    'oeffentlich': 'bool',
  },
  'teilnehmer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'gruppe': 'applookup/select',
    'bemerkung': 'string/textarea',
  },
  'einkaufsliste': {
    'liste_gruppe': 'applookup/select',
    'liste_teilnehmer': 'applookup/select',
    'liste_artikel': 'applookup/select',
    'menge': 'number',
    'einheit_freitext': 'string/text',
    'prioritaet': 'lookup/radio',
    'status': 'lookup/radio',
    'hinweis': 'string/textarea',
  },
  'artikel': {
    'artikelname': 'string/text',
    'kategorie': 'lookup/select',
    'einheit': 'lookup/select',
    'artikelbeschreibung': 'string/textarea',
    'artikelbild': 'file',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateEinkaufsgruppe = StripLookup<Einkaufsgruppe['fields']>;
export type CreateTeilnehmer = StripLookup<Teilnehmer['fields']>;
export type CreateEinkaufsliste = StripLookup<Einkaufsliste['fields']>;
export type CreateArtikel = StripLookup<Artikel['fields']>;
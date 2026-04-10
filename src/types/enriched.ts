import type { Einkaufsliste, Teilnehmer } from './app';

export type EnrichedTeilnehmer = Teilnehmer & {
  gruppeName: string;
};

export type EnrichedEinkaufsliste = Einkaufsliste & {
  liste_gruppeName: string;
  liste_teilnehmerName: string;
  liste_artikelName: string;
};

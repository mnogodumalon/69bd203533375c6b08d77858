import type { EnrichedEinkaufsliste, EnrichedTeilnehmer } from '@/types/enriched';
import type { Artikel, Einkaufsgruppe, Einkaufsliste, Teilnehmer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface TeilnehmerMaps {
  einkaufsgruppeMap: Map<string, Einkaufsgruppe>;
}

export function enrichTeilnehmer(
  teilnehmer: Teilnehmer[],
  maps: TeilnehmerMaps
): EnrichedTeilnehmer[] {
  return teilnehmer.map(r => ({
    ...r,
    gruppeName: resolveDisplay(r.fields.gruppe, maps.einkaufsgruppeMap, 'gruppenname'),
  }));
}

interface EinkaufslisteMaps {
  einkaufsgruppeMap: Map<string, Einkaufsgruppe>;
  teilnehmerMap: Map<string, Teilnehmer>;
  artikelMap: Map<string, Artikel>;
}

export function enrichEinkaufsliste(
  einkaufsliste: Einkaufsliste[],
  maps: EinkaufslisteMaps
): EnrichedEinkaufsliste[] {
  return einkaufsliste.map(r => ({
    ...r,
    liste_gruppeName: resolveDisplay(r.fields.liste_gruppe, maps.einkaufsgruppeMap, 'gruppenname'),
    liste_teilnehmerName: resolveDisplay(r.fields.liste_teilnehmer, maps.teilnehmerMap, 'vorname', 'nachname'),
    liste_artikelName: resolveDisplay(r.fields.liste_artikel, maps.artikelMap, 'artikelname'),
  }));
}

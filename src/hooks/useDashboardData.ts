import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Einkaufsgruppe, Teilnehmer, Einkaufsliste, Artikel } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [einkaufsgruppe, setEinkaufsgruppe] = useState<Einkaufsgruppe[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [einkaufsliste, setEinkaufsliste] = useState<Einkaufsliste[]>([]);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [einkaufsgruppeData, teilnehmerData, einkaufslisteData, artikelData] = await Promise.all([
        LivingAppsService.getEinkaufsgruppe(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getEinkaufsliste(),
        LivingAppsService.getArtikel(),
      ]);
      setEinkaufsgruppe(einkaufsgruppeData);
      setTeilnehmer(teilnehmerData);
      setEinkaufsliste(einkaufslisteData);
      setArtikel(artikelData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [einkaufsgruppeData, teilnehmerData, einkaufslisteData, artikelData] = await Promise.all([
          LivingAppsService.getEinkaufsgruppe(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getEinkaufsliste(),
          LivingAppsService.getArtikel(),
        ]);
        setEinkaufsgruppe(einkaufsgruppeData);
        setTeilnehmer(teilnehmerData);
        setEinkaufsliste(einkaufslisteData);
        setArtikel(artikelData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const einkaufsgruppeMap = useMemo(() => {
    const m = new Map<string, Einkaufsgruppe>();
    einkaufsgruppe.forEach(r => m.set(r.record_id, r));
    return m;
  }, [einkaufsgruppe]);

  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [teilnehmer]);

  const artikelMap = useMemo(() => {
    const m = new Map<string, Artikel>();
    artikel.forEach(r => m.set(r.record_id, r));
    return m;
  }, [artikel]);

  return { einkaufsgruppe, setEinkaufsgruppe, teilnehmer, setTeilnehmer, einkaufsliste, setEinkaufsliste, artikel, setArtikel, loading, error, fetchAll, einkaufsgruppeMap, teilnehmerMap, artikelMap };
}
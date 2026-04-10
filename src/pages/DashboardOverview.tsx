import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichTeilnehmer, enrichEinkaufsliste } from '@/lib/enrich';
import type { EnrichedEinkaufsliste } from '@/types/enriched';
import type { Einkaufsgruppe, Einkaufsliste, Artikel } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ShareFormLink } from '@/components/ShareFormLink';
import { EinkaufsgruppeDialog } from '@/components/dialogs/EinkaufsgruppeDialog';
import { EinkaufslisteDialog } from '@/components/dialogs/EinkaufslisteDialog';
import { TeilnehmerDialog } from '@/components/dialogs/TeilnehmerDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash,
  IconUsers, IconShoppingCart, IconPackage, IconList, IconMapPin, IconCalendar,
  IconChevronRight, IconX, IconUserPlus, IconShoppingBag,
} from '@tabler/icons-react';

const APPGROUP_ID = '69bd203533375c6b08d77858';
const REPAIR_ENDPOINT = '/claude/build/repair';

type DialogMode =
  | { type: 'create-gruppe' }
  | { type: 'edit-gruppe'; gruppe: Einkaufsgruppe }
  | { type: 'create-item'; gruppe: Einkaufsgruppe }
  | { type: 'edit-item'; item: EnrichedEinkaufsliste; gruppe: Einkaufsgruppe }
  | { type: 'create-teilnehmer'; gruppe: Einkaufsgruppe }
  | null;

export default function DashboardOverview() {
  const {
    einkaufsgruppe, teilnehmer, einkaufsliste, artikel,
    einkaufsgruppeMap, teilnehmerMap, artikelMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedTeilnehmer = enrichTeilnehmer(teilnehmer, { einkaufsgruppeMap });
  const enrichedEinkaufsliste = enrichEinkaufsliste(einkaufsliste, { einkaufsgruppeMap, teilnehmerMap, artikelMap });

  const [selectedGruppeId, setSelectedGruppeId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'gruppe' | 'item'; id: string } | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'liste' | 'teilnehmer'>('liste');

  const selectedGruppe = useMemo(
    () => einkaufsgruppe.find(g => g.record_id === selectedGruppeId) ?? null,
    [einkaufsgruppe, selectedGruppeId]
  );

  const gruppeItems = useMemo(
    () => enrichedEinkaufsliste.filter(item => {
      const id = extractRecordId(item.fields.liste_gruppe);
      return id === selectedGruppeId;
    }),
    [enrichedEinkaufsliste, selectedGruppeId]
  );

  const gruppeTeilnehmer = useMemo(
    () => enrichedTeilnehmer.filter(t => {
      const id = extractRecordId(t.fields.gruppe);
      return id === selectedGruppeId;
    }),
    [enrichedTeilnehmer, selectedGruppeId]
  );

  const totalOpen = enrichedEinkaufsliste.filter(i => i.fields.status?.key !== 'erledigt').length;
  const totalDone = enrichedEinkaufsliste.filter(i => i.fields.status?.key === 'erledigt').length;

  const handleToggleStatus = async (item: EnrichedEinkaufsliste) => {
    const newStatus = item.fields.status?.key === 'erledigt' ? 'offen' : 'erledigt';
    setToggling(prev => new Set(prev).add(item.record_id));
    try {
      await LivingAppsService.updateEinkaufslisteEntry(item.record_id, { status: newStatus as any });
      fetchAll();
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(item.record_id); return s; });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'gruppe') {
      await LivingAppsService.deleteEinkaufsgruppeEntry(deleteTarget.id);
      if (selectedGruppeId === deleteTarget.id) setSelectedGruppeId(null);
    } else {
      await LivingAppsService.deleteEinkaufslisteEntry(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gruppen"
          value={String(einkaufsgruppe.length)}
          description="Einkaufsgruppen"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen"
          value={String(totalOpen)}
          description="Artikel noch zu kaufen"
          icon={<IconShoppingCart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Erledigt"
          value={String(totalDone)}
          description="Artikel eingekauft"
          icon={<IconCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Artikel"
          value={String(artikel.length)}
          description="Im Katalog"
          icon={<IconPackage size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main workspace: groups + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[520px]">
        {/* Left: Group list */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Meine Gruppen</span>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setDialog({ type: 'create-gruppe' })}>
              <IconPlus size={13} className="shrink-0" />
              Neue Gruppe
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {einkaufsgruppe.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                <IconUsers size={36} className="text-muted-foreground" stroke={1.5} />
                <p className="text-sm text-muted-foreground">Noch keine Gruppen vorhanden.</p>
                <Button size="sm" className="mt-1" onClick={() => setDialog({ type: 'create-gruppe' })}>
                  <IconPlus size={14} className="mr-1" />Gruppe erstellen
                </Button>
              </div>
            ) : (
              einkaufsgruppe.map(gruppe => {
                const itemCount = enrichedEinkaufsliste.filter(i => extractRecordId(i.fields.liste_gruppe) === gruppe.record_id).length;
                const doneCount = enrichedEinkaufsliste.filter(i => extractRecordId(i.fields.liste_gruppe) === gruppe.record_id && i.fields.status?.key === 'erledigt').length;
                const memberCount = enrichedTeilnehmer.filter(t => extractRecordId(t.fields.gruppe) === gruppe.record_id).length;
                const isSelected = selectedGruppeId === gruppe.record_id;

                return (
                  <div
                    key={gruppe.record_id}
                    onClick={() => { setSelectedGruppeId(gruppe.record_id); setActiveTab('liste'); }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/8' : 'hover:bg-accent/40'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <IconShoppingBag size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{gruppe.fields.gruppenname ?? 'Unbenannte Gruppe'}</p>
                      <p className="text-xs text-muted-foreground">
                        {memberCount} Mitglied{memberCount !== 1 ? 'er' : ''} · {itemCount > 0 ? `${doneCount}/${itemCount} erledigt` : 'Keine Artikel'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setDialog({ type: 'edit-gruppe', gruppe }); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Bearbeiten"
                      >
                        <IconPencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'gruppe', id: gruppe.record_id }); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Löschen"
                      >
                        <IconTrash size={14} />
                      </button>
                      <IconChevronRight size={14} className={`text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        {!selectedGruppe ? (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
            <IconList size={48} className="text-muted-foreground mb-3" stroke={1.5} />
            <h3 className="font-semibold text-lg mb-1">Gruppe auswählen</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Wähle links eine Einkaufsgruppe aus, um die Einkaufsliste zu sehen und zu bearbeiten.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            {/* Group header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-base truncate">{selectedGruppe.fields.gruppenname ?? 'Gruppe'}</h2>
                    {selectedGruppe.fields.oeffentlich && (
                      <Badge variant="secondary" className="text-xs shrink-0">Öffentlich</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {selectedGruppe.fields.einkaufsdatum && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconCalendar size={12} className="shrink-0" />
                        {formatDate(selectedGruppe.fields.einkaufsdatum)}
                      </span>
                    )}
                    {selectedGruppe.fields.treffpunkt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconMapPin size={12} className="shrink-0" />
                        <span className="truncate max-w-[160px]">{selectedGruppe.fields.treffpunkt}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ShareFormLink appId={APP_IDS.EINKAUFSLISTE} label="Liste teilen" variant="inline" />
                  <button
                    onClick={() => setSelectedGruppeId(null)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                    title="Schließen"
                  >
                    <IconX size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-4">
              <button
                onClick={() => setActiveTab('liste')}
                className={`py-2 px-1 mr-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'liste' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Einkaufsliste ({gruppeItems.length})
              </button>
              <button
                onClick={() => setActiveTab('teilnehmer')}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'teilnehmer' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Mitglieder ({gruppeTeilnehmer.length})
              </button>
            </div>

            {activeTab === 'liste' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Progress bar */}
                {gruppeItems.length > 0 && (
                  <div className="px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.round((gruppeItems.filter(i => i.fields.status?.key === 'erledigt').length / gruppeItems.length) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {gruppeItems.filter(i => i.fields.status?.key === 'erledigt').length}/{gruppeItems.length}
                      </span>
                    </div>
                  </div>
                )}

                {/* List items */}
                <div className="flex-1 overflow-y-auto">
                  {gruppeItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <IconShoppingCart size={40} className="text-muted-foreground" stroke={1.5} />
                      <p className="text-sm text-muted-foreground">Noch keine Artikel auf der Liste.</p>
                      <Button size="sm" className="mt-1" onClick={() => setDialog({ type: 'create-item', gruppe: selectedGruppe })}>
                        <IconPlus size={14} className="mr-1" />Artikel hinzufügen
                      </Button>
                    </div>
                  ) : (
                    <GroupedItemList
                      items={gruppeItems}
                      artikel={artikel}
                      toggling={toggling}
                      onToggle={handleToggleStatus}
                      onEdit={(item) => setDialog({ type: 'edit-item', item, gruppe: selectedGruppe })}
                      onDelete={(id) => setDeleteTarget({ type: 'item', id })}
                    />
                  )}
                </div>

                {/* Action bar */}
                <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={() => setDialog({ type: 'create-item', gruppe: selectedGruppe })}>
                    <IconPlus size={14} className="mr-1" />Artikel hinzufügen
                  </Button>
                  {gruppeItems.some(i => i.fields.status?.key === 'erledigt') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const done = gruppeItems.filter(i => i.fields.status?.key === 'erledigt');
                        await Promise.all(done.map(i => LivingAppsService.updateEinkaufslisteEntry(i.record_id, { status: 'offen' as any })));
                        fetchAll();
                      }}
                    >
                      <IconRefresh size={14} className="mr-1" />Liste zurücksetzen
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'teilnehmer' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {gruppeTeilnehmer.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <IconUsers size={40} className="text-muted-foreground" stroke={1.5} />
                      <p className="text-sm text-muted-foreground">Noch keine Mitglieder eingetragen.</p>
                      <Button size="sm" className="mt-1" onClick={() => setDialog({ type: 'create-teilnehmer', gruppe: selectedGruppe })}>
                        <IconUserPlus size={14} className="mr-1" />Mitglied hinzufügen
                      </Button>
                    </div>
                  ) : (
                    gruppeTeilnehmer.map(t => (
                      <div key={t.record_id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {(t.fields.vorname?.[0] ?? '') + (t.fields.nachname?.[0] ?? '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{[t.fields.vorname, t.fields.nachname].filter(Boolean).join(' ')}</p>
                          {t.fields.email && <p className="text-xs text-muted-foreground truncate">{t.fields.email}</p>}
                        </div>
                        {t.fields.telefon && (
                          <a href={`tel:${t.fields.telefon}`} className="text-xs text-muted-foreground hover:text-primary shrink-0 truncate max-w-[100px]">
                            {t.fields.telefon}
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <Button size="sm" onClick={() => setDialog({ type: 'create-teilnehmer', gruppe: selectedGruppe })}>
                    <IconUserPlus size={14} className="mr-1" />Mitglied hinzufügen
                  </Button>
                  <span className="ml-2">
                    <ShareFormLink appId={APP_IDS.TEILNEHMER} label="Einladelink" variant="inline" />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {dialog?.type === 'create-gruppe' && (
        <EinkaufsgruppeDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createEinkaufsgruppeEntry(fields); fetchAll(); }}
          enablePhotoScan={AI_PHOTO_SCAN['Einkaufsgruppe']}
        />
      )}
      {dialog?.type === 'edit-gruppe' && (
        <EinkaufsgruppeDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.updateEinkaufsgruppeEntry(dialog.gruppe.record_id, fields); fetchAll(); }}
          defaultValues={dialog.gruppe.fields}
          enablePhotoScan={AI_PHOTO_SCAN['Einkaufsgruppe']}
        />
      )}
      {dialog?.type === 'create-item' && (
        <EinkaufslisteDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createEinkaufslisteEntry(fields); fetchAll(); }}
          defaultValues={{ liste_gruppe: createRecordUrl(APP_IDS.EINKAUFSGRUPPE, dialog.gruppe.record_id) }}
          einkaufsgruppeList={einkaufsgruppe}
          teilnehmerList={teilnehmer}
          artikelList={artikel}
          enablePhotoScan={AI_PHOTO_SCAN['Einkaufsliste']}
        />
      )}
      {dialog?.type === 'edit-item' && (
        <EinkaufslisteDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.updateEinkaufslisteEntry(dialog.item.record_id, fields); fetchAll(); }}
          defaultValues={dialog.item.fields}
          einkaufsgruppeList={einkaufsgruppe}
          teilnehmerList={teilnehmer}
          artikelList={artikel}
          enablePhotoScan={AI_PHOTO_SCAN['Einkaufsliste']}
        />
      )}
      {dialog?.type === 'create-teilnehmer' && (
        <TeilnehmerDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createTeilnehmerEntry(fields); fetchAll(); }}
          defaultValues={{ gruppe: createRecordUrl(APP_IDS.EINKAUFSGRUPPE, dialog.gruppe.record_id) }}
          einkaufsgruppeList={einkaufsgruppe}
          enablePhotoScan={AI_PHOTO_SCAN['Teilnehmer']}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'gruppe' ? 'Gruppe löschen' : 'Artikel entfernen'}
        description={deleteTarget?.type === 'gruppe' ? 'Diese Gruppe und alle zugehörigen Daten werden gelöscht.' : 'Diesen Artikel von der Einkaufsliste entfernen?'}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// --- Grouped item list by category ---
function GroupedItemList({
  items, artikel, toggling, onToggle, onEdit, onDelete,
}: {
  items: EnrichedEinkaufsliste[];
  artikel: Artikel[];
  toggling: Set<string>;
  onToggle: (item: EnrichedEinkaufsliste) => void;
  onEdit: (item: EnrichedEinkaufsliste) => void;
  onDelete: (id: string) => void;
}) {
  // Group by artikel category
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: EnrichedEinkaufsliste[] }>();
    items.forEach(item => {
      const artikelId = extractRecordId(item.fields.liste_artikel);
      const art = artikelId ? artikel.find(a => a.record_id === artikelId) : undefined;
      const catKey = art?.fields.kategorie?.key ?? 'sonstiges';
      const catLabel = art?.fields.kategorie?.label ?? 'Sonstiges';
      if (!map.has(catKey)) map.set(catKey, { label: catLabel, items: [] });
      map.get(catKey)!.items.push(item);
    });
    // Sort: open first within each group, done at bottom
    map.forEach(group => {
      group.items.sort((a, b) => {
        const aD = a.fields.status?.key === 'erledigt' ? 1 : 0;
        const bD = b.fields.status?.key === 'erledigt' ? 1 : 0;
        if (aD !== bD) return aD - bD;
        const aPri = a.fields.prioritaet?.key === 'hoch' ? 0 : a.fields.prioritaet?.key === 'normal' ? 1 : 2;
        const bPri = b.fields.prioritaet?.key === 'hoch' ? 0 : b.fields.prioritaet?.key === 'normal' ? 1 : 2;
        return aPri - bPri;
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, artikel]);

  return (
    <div>
      {grouped.map(([catKey, group]) => (
        <div key={catKey}>
          <div className="px-4 py-1.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {group.label}
          </div>
          {group.items.map(item => {
            const isDone = item.fields.status?.key === 'erledigt';
            const isToggling = toggling.has(item.record_id);
            const priorityColor = item.fields.prioritaet?.key === 'hoch'
              ? 'bg-red-500'
              : item.fields.prioritaet?.key === 'normal'
              ? 'bg-yellow-400'
              : 'bg-muted-foreground/30';

            return (
              <div
                key={item.record_id}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 transition-colors ${isDone ? 'bg-muted/20' : 'hover:bg-accent/20'}`}
              >
                {/* Toggle checkbox */}
                <button
                  onClick={() => onToggle(item)}
                  disabled={isToggling}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary'
                  } ${isToggling ? 'opacity-50' : ''}`}
                  title={isDone ? 'Als offen markieren' : 'Als erledigt markieren'}
                >
                  {isDone && <IconCheck size={11} />}
                </button>

                {/* Priority dot */}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColor}`} title={item.fields.prioritaet?.label ?? ''} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                    {item.liste_artikelName || 'Unbekannter Artikel'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.fields.menge != null
                      ? `${item.fields.menge}${item.fields.einheit_freitext ? ' ' + item.fields.einheit_freitext : ''}`
                      : '—'}
                    {item.liste_teilnehmerName ? ` · ${item.liste_teilnehmerName}` : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Bearbeiten"
                  >
                    <IconPencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(item.record_id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Löschen"
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Skeleton ---
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

// --- Error ---
function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);
    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });
    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });
      if (!resp.ok || !resp.body) { setRepairing(false); setRepairFailed(true); return; }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch { setRepairing(false); setRepairFailed(true); }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{repairing ? repairStatus : error.message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}

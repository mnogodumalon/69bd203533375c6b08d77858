import type { Einkaufsliste, Einkaufsgruppe, Teilnehmer, Artikel } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface EinkaufslisteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Einkaufsliste | null;
  onEdit: (record: Einkaufsliste) => void;
  einkaufsgruppeList: Einkaufsgruppe[];
  teilnehmerList: Teilnehmer[];
  artikelList: Artikel[];
}

export function EinkaufslisteViewDialog({ open, onClose, record, onEdit, einkaufsgruppeList, teilnehmerList, artikelList }: EinkaufslisteViewDialogProps) {
  function getEinkaufsgruppeDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return einkaufsgruppeList.find(r => r.record_id === id)?.fields.gruppenname ?? '—';
  }

  function getTeilnehmerDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return teilnehmerList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getArtikelDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return artikelList.find(r => r.record_id === id)?.fields.artikelname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Einkaufsliste anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einkaufsgruppe</Label>
            <p className="text-sm">{getEinkaufsgruppeDisplayName(record.fields.liste_gruppe)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eingetragen von (Teilnehmer)</Label>
            <p className="text-sm">{getTeilnehmerDisplayName(record.fields.liste_teilnehmer)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Artikel</Label>
            <p className="text-sm">{getArtikelDisplayName(record.fields.liste_artikel)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Menge</Label>
            <p className="text-sm">{record.fields.menge ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einheit (optional)</Label>
            <p className="text-sm">{record.fields.einheit_freitext ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Priorität</Label>
            <Badge variant="secondary">{record.fields.prioritaet?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hinweis</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.hinweis ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
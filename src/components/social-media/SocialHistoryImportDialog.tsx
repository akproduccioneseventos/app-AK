'use client';

import { useMemo, useState } from 'react';
import { ArchiveRestore, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { SocialPlatform } from '@/types/social-media';
import { importSocialHistory } from '@/app/actions/social-history';

const HISTORY_PLATFORMS: SocialPlatform[] = [
  'Facebook',
  'Instagram',
  'Threads',
  'TikTok',
  'YouTube',
  'X',
];

interface SocialHistoryImportDialogProps {
  onImported?: () => void;
}

export function SocialHistoryImportDialog({ onImported }: SocialHistoryImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>('Instagram');
  const [archive, setArchive] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const archiveLabel = useMemo(() => {
    if (!archive) return 'Elegir archivo ZIP, JSON o JS';
    const mb = archive.size / 1024 / 1024;
    return `${archive.name} · ${mb < 1 ? '<1' : mb.toFixed(1)} MB`;
  }, [archive]);

  const handleImport = async () => {
    if (!archive) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.set('platform', platform);
      formData.set('archive', archive);
      const result = await importSocialHistory(formData);

      if (!result.success) {
        throw new Error(result.error || 'No se pudo importar el historial.');
      }

      const range = result.oldestDate && result.newestDate
        ? ` Desde ${new Date(result.oldestDate).toLocaleDateString('es-UY')} hasta ${new Date(result.newestDate).toLocaleDateString('es-UY')}.`
        : '';

      toast({
        title: `${result.imported} publicaciones importadas`,
        description: `${result.skipped} duplicadas se ignoraron.${range}`,
      });
      setArchive(null);
      setOpen(false);
      onImported?.();
    } catch (error) {
      toast({
        title: 'No se pudo importar',
        description: error instanceof Error ? error.message : 'Revisá el archivo y probá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-sky-200 bg-sky-50/60 text-sky-900 hover:bg-sky-100">
          <ArchiveRestore className="mr-2 h-4 w-4 text-sky-700" />
          Importar historial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Traer publicaciones históricas</DialogTitle>
          <DialogDescription>
            Cargá el archivo oficial exportado de la red. La app conserva fechas, textos, enlaces y métricas disponibles, evitando duplicados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Red social</label>
            <Select value={platform} onValueChange={(value) => { setPlatform(value as SocialPlatform); setArchive(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HISTORY_PLATFORMS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Archivo oficial de exportación</label>
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center hover:bg-slate-100">
              <Upload className="mb-2 h-6 w-6 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">{archiveLabel}</span>
              <span className="mt-1 text-xs text-slate-500">Acepta archivos .zip, .json o .js (máx 100 MB).</span>
              <input
                type="file"
                accept=".zip,.json,.js,application/zip,application/json,text/javascript"
                className="sr-only"
                onChange={(event) => setArchive(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Esto no publica nada ni modifica tus redes. Solo guarda el historial dentro de AK Producciones para memoria y estadísticas.
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isImporting}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!archive || isImporting}>
            {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</> : 'Importar archivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

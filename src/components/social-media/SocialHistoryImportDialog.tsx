'use client';

import { useMemo, useState } from 'react';
import { ArchiveRestore, Loader2, Upload, Youtube } from 'lucide-react';
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
import { importSocialHistory, syncYouTubeHistory } from '@/app/actions/social-history';

const HISTORY_PLATFORMS: SocialPlatform[] = [
  'Facebook',
  'Instagram',
  'Threads',
  'TikTok',
  'YouTube',
  'X',
];

interface SocialHistoryImportDialogProps {
  onImported: () => void;
}

export function SocialHistoryImportDialog({ onImported }: SocialHistoryImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>('Facebook');
  const [archive, setArchive] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const archiveLabel = useMemo(() => {
    if (!archive) return 'Elegir ZIP, JSON o JS';
    const mb = archive.size / 1024 / 1024;
    return `${archive.name} · ${mb < 1 ? '<1' : mb.toFixed(1)} MB`;
  }, [archive]);

  const finishResult = (result: Awaited<ReturnType<typeof importSocialHistory>>) => {
    if (!result.success) throw new Error(result.error || 'No se pudo importar el historial.');
    const range = result.oldestDate && result.newestDate
      ? ` Desde ${new Date(result.oldestDate).toLocaleDateString('es-UY')} hasta ${new Date(result.newestDate).toLocaleDateString('es-UY')}.`
      : '';
    toast({
      title: `${result.imported} publicaciones agregadas`,
      description: `${result.skipped} duplicadas se dejaron afuera.${range}`,
    });
    setArchive(null);
    setOpen(false);
    onImported();
  };

  const handleImport = async () => {
    if (!archive) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.set('platform', platform);
      formData.set('archive', archive);
      finishResult(await importSocialHistory(formData));
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

  const handleYouTubeSync = async () => {
    setIsImporting(true);
    try {
      finishResult(await syncYouTubeHistory());
    } catch (error) {
      toast({
        title: 'No se pudo sincronizar YouTube',
        description: error instanceof Error ? error.message : 'Revisá la configuración del canal.',
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
          <DialogTitle>Traer publicaciones viejas</DialogTitle>
          <DialogDescription>
            Cargá la exportación oficial de la red. La app conserva fechas, textos, enlaces y métricas disponibles, y evita volver a guardar publicaciones que ya existen.
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

          {platform === 'YouTube' && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <Youtube className="mt-0.5 h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">YouTube se puede traer automáticamente</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Si el canal ya está configurado en el servidor, este botón recorre todos los videos y conserva fecha, título, descripción y métricas disponibles.</p>
                  <Button className="mt-3 bg-red-600 hover:bg-red-700" onClick={handleYouTubeSync} disabled={isImporting}>
                    {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sincronizando...</> : 'Traer todo YouTube'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Archivo oficial {platform === 'YouTube' ? '(alternativa)' : ''}</label>
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center hover:bg-slate-100">
              <Upload className="mb-2 h-6 w-6 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">{archiveLabel}</span>
              <span className="mt-1 text-xs text-slate-500">Máximo 100 MB por archivo. Si pesa más, cargalo por partes.</span>
              <input
                type="file"
                accept=".zip,.json,.js,application/zip,application/json,text/javascript"
                className="sr-only"
                onChange={(event) => setArchive(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Esto no publica nada ni modifica tus redes. Solo reconstruye la memoria histórica dentro de AK Producciones.
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

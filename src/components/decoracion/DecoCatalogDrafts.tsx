'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, RefreshCw, RotateCcw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDecorationDrafts, processNextDecorationDraft, approveDecorationDraft, dismissDecorationDraft, retryDecorationDraft } from '@/app/actions/decoracion-catalogo';
import type { DraftList, DecorationDraft } from '@/lib/decoracion/catalog-types';
import type { ElementoDecorativo } from '@/types/fiesta';
import DecoCanvas from './DecoCanvas';
import DecoElementLibrary, { type LibraryElement } from './DecoElementLibrary';

interface Props { fiestaId?: string; onChanged?: () => void | Promise<void> }

const statusLabel: Record<DecorationDraft['status'], string> = {
  queued: 'En cola', analyzing: 'Analizando', review: 'Revisión', approved: 'Aprobado', dismissed: 'Descartado', error: 'Error',
};

export default function DecoCatalogDrafts({ fiestaId = 'catalogo-decoracion', onChanged }: Props) {
  const [list, setList] = useState<DraftList | null>(null);
  const [selected, setSelected] = useState<DecorationDraft | null>(null);
  const [elements, setElements] = useState<ElementoDecorativo[]>([]);
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [retryPending, setRetryPending] = useState(false);
  const runRef = useRef(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const result = await getDecorationDrafts();
      if (mountedRef.current) setList(result);
      return result;
    } catch (cause) {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los borradores.');
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  const processQueue = useCallback(async (automatic: boolean) => {
    if (runRef.current) return;
    runRef.current = true;
    setProcessing(true);
    setError('');
    try {
      const limit = automatic ? 3 : 1;
      for (let i = 0; i < limit && mountedRef.current; i += 1) {
        const result = await processNextDecorationDraft();
        if (!mountedRef.current) break;
        const updated = await refresh();
        if (result.error) { setError(result.error); break; }
        if (!result.processed || !automatic || !updated?.automatic) break;
      }
    } catch (cause) {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : 'No se pudo procesar el siguiente borrador.');
    } finally {
      runRef.current = false;
      if (mountedRef.current) setProcessing(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (loading || !list?.automatic || list.pending <= 0 || runRef.current) return;
    void processQueue(true);
  }, [loading, list?.automatic, processQueue]);

  const openDraft = (draft: DecorationDraft) => {
    if (draft.status !== 'review' && draft.status !== 'error') return;
    setSelected(draft);
    setElements(draft.elementos.map(element => ({ ...element, colores: [...element.colores] })));
    setName(draft.source.title?.trim() || '');
    setSelectedId(null);
  };

  const updateDrafts = (id: string) => setList(current => current ? {
    ...current,
    drafts: current.drafts.filter(draft => draft.id !== id),
    pending: Math.max(0, current.pending - 1),
  } : current);

  const approve = async () => {
    if (!selected || selected.status !== 'review' || !name.trim() || elements.length === 0) return;
    setBusy(true); setError('');
    try {
      const result = await approveDecorationDraft(selected.id, selected.revision, name.trim(), elements);
      if (!result.success) { setError(result.error || 'No se pudo aprobar el borrador.'); return; }
      updateDrafts(selected.id); setSelected(null); await onChanged?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo aprobar el borrador.'); }
    finally { setBusy(false); }
  };

  const dismiss = async (draft: DecorationDraft) => {
    setBusy(true); setError('');
    try { await dismissDecorationDraft(draft.id); updateDrafts(draft.id); if (selected?.id === draft.id) setSelected(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo descartar el borrador.'); }
    finally { setBusy(false); }
  };

  const retry = async (draft: DecorationDraft) => {
    setBusy(true); setError('');
    try {
      await retryDecorationDraft(draft.id);
      if (selected?.id === draft.id) setSelected(null);
      setRetryPending(true);
      await refresh();
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo reintentar el borrador.'); }
    finally { setBusy(false); }
  };

  const addElement = (item: LibraryElement) => {
    const element: ElementoDecorativo = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo: item.tipo, x: 350 + (elements.length % 4) * 25, y: 220 + (elements.length % 4) * 20,
      escala: 1, colores: ['#D4AF37'], etiqueta: item.label,
      ...(item.width ? { width: item.width } : {}), ...(item.height ? { height: item.height } : {}),
      ...(item.imageDataUri ? { imageDataUri: item.imageDataUri, isCustom: true } : {}),
    };
    setElements(current => [...current, element]); setSelectedId(element.id);
  };

  const activeElement = elements.find(element => element.id === selectedId);
  const mutateSelected = (patch: Partial<ElementoDecorativo>) => setElements(current => current.map(element => element.id === selectedId ? { ...element, ...patch } : element));
  const visibleDrafts = list?.drafts.slice(0, visibleCount) ?? [];

  return (
    <section className="space-y-4 border-b pb-5" aria-labelledby="deco-drafts-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="deco-drafts-title" className="text-base font-semibold">Borradores del catálogo</h2>
          <p className="text-sm text-muted-foreground">{list ? `${list.pending} pendientes` : 'Cargando estado...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" title="Actualizar borradores" aria-label="Actualizar borradores" onClick={() => void refresh()} disabled={loading || processing}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {!!list?.pending && <Button type="button" variant="outline" onClick={() => void processQueue(false)} disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Procesar siguiente
          </Button>}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? <p role="status" className="text-sm text-muted-foreground">Cargando borradores...</p> : !visibleDrafts.length ? (
        <p className="text-sm text-muted-foreground">No hay borradores pendientes.</p>
      ) : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDrafts.map(draft => <article key={draft.id} className="min-w-0 border p-2">
          <button type="button" className="block w-full text-left" onClick={() => openDraft(draft)} aria-label={`Revisar ${draft.source.title || 'borrador'}`}>
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img src={draft.source.url} alt={draft.source.title || 'Foto de referencia'} className="h-full w-full object-contain" />
            </div>
            <span className="mt-1 block text-xs text-muted-foreground">Borrador 2D para revisar · Referencia, no stock ni medidas</span>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{draft.source.title || 'Sin título'}</span>
              <span className={`shrink-0 text-xs ${draft.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>{statusLabel[draft.status]}</span>
            </div>
          </button>
          {draft.error && <p className="mt-1 text-xs text-destructive">{draft.error}</p>}
          <div className="mt-2 flex gap-2">
            {draft.status === 'error' && <Button type="button" size="sm" variant="outline" onClick={() => { openDraft(draft); }} disabled={busy}>Revisar error</Button>}
            {draft.status === 'error' && <Button type="button" size="sm" variant="outline" onClick={() => void retry(draft)} disabled={busy}><RotateCcw className="mr-1 h-4 w-4" />Reintentar análisis</Button>}
            <Button type="button" size="sm" variant="ghost" onClick={() => void dismiss(draft)} disabled={busy}><Trash2 className="mr-1 h-4 w-4" />Descartar</Button>
          </div>
        </article>)}
      </div>}
      {retryPending && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-amber-500 pl-3 text-sm">
        <span>El análisis puede consumir otra IA; si el resultado anterior no se confirmó, podría repetirse.</span>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => { setRetryPending(false); void processQueue(false); }}>Reintentar análisis</Button>
          <Button type="button" size="icon" variant="ghost" title="Cerrar aviso" aria-label="Cerrar aviso de reintento" onClick={() => setRetryPending(false)}><X className="h-4 w-4" /></Button>
        </div>
      </div>}
      {!!list && list.drafts.length > visibleCount && <Button type="button" variant="ghost" onClick={() => setVisibleCount(count => count + 12)}>Mostrar más <ChevronDown className="ml-1 h-4 w-4" /></Button>}
      {visibleCount > 12 && !!list && <Button type="button" variant="ghost" onClick={() => setVisibleCount(count => Math.max(12, count - 12))}><ChevronUp className="mr-1 h-4 w-4" />Mostrar menos</Button>}

      {selected && <div className="space-y-4 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Revisar: {selected.source.title || 'borrador'}</h3>
          <Button type="button" size="icon" variant="ghost" title="Cerrar revisión" aria-label="Cerrar revisión" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <figure className="min-w-0">
            <figcaption className="mb-2 text-sm font-medium">Referencia, no stock ni medidas</figcaption>
            <div className="flex min-h-52 items-center justify-center bg-muted p-2"><img src={selected.source.url} alt={selected.source.title || 'Foto original de referencia'} className="max-h-[420px] max-w-full object-contain" /></div>
          </figure>
          <div className="min-w-0 space-y-3">
            <label className="block text-sm font-medium" htmlFor="draft-template-name">Nombre</label>
            <Input id="draft-template-name" value={name} onChange={event => setName(event.target.value)} maxLength={100} />
            <DecoCanvas elementos={elements} onChange={setElements} selectedId={selectedId} onSelectId={setSelectedId} fondoColor="#F1F3F4" autoFit />
            {activeElement && <div className="flex flex-wrap items-center gap-3 border p-2">
              <label className="flex items-center gap-2 text-sm">Escala
                <input aria-label="Escala del elemento seleccionado" type="range" min="0.3" max="3" step="0.1" value={activeElement.escala} onChange={event => mutateSelected({ escala: Number(event.target.value) })} />
              </label>
              <label className="flex items-center gap-2 text-sm">Color
                <input aria-label="Color del elemento seleccionado" type="color" value={activeElement.tintColor || activeElement.colores[0] || '#D4AF37'} onChange={event => mutateSelected(activeElement.imageDataUri ? { tintColor: event.target.value, tintOpacity: Math.max(activeElement.tintOpacity ?? 0, 0.45) } : { colores: [event.target.value, ...activeElement.colores.slice(1)] })} />
              </label>
              <Button type="button" size="icon" variant="ghost" title="Eliminar elemento" aria-label="Eliminar elemento seleccionado" onClick={() => { setElements(current => current.filter(element => element.id !== selectedId)); setSelectedId(null); }}><Trash2 className="h-4 w-4" /></Button>
            </div>}
            <div className="h-72 min-h-0 border p-2"><DecoElementLibrary fiestaId={fiestaId} onAddElement={addElement} akOnly={true} /></div>
          </div>
        </div>
        {!!selected.unknowns.length && <div className="border-l-2 border-amber-500 pl-3">
          <h4 className="text-sm font-medium">Elementos por revisar</h4>
          <ul className="list-inside list-disc text-sm text-muted-foreground">{selected.unknowns.map((unknown, index) => <li key={`${index}-${unknown}`}>{unknown}</li>)}</ul>
        </div>}
        <div className="flex flex-wrap gap-2">
          {selected.status === 'review' && <Button type="button" onClick={() => void approve()} disabled={busy || !name.trim() || elements.length === 0}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Aprobar plantilla</Button>}
          <Button type="button" variant="outline" onClick={() => void dismiss(selected)} disabled={busy}>Descartar</Button>
          {selected.status === 'error' && <Button type="button" variant="outline" onClick={() => void retry(selected)} disabled={busy}><RotateCcw className="mr-2 h-4 w-4" />Reintentar análisis</Button>}
        </div>
      </div>}
    </section>
  );
}

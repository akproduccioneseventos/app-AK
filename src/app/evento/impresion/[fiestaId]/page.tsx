'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { soloAprobados, esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, RefreshCw, Loader2, ToggleLeft, ToggleRight, CheckCircle, Check, Slash, AlertCircle } from 'lucide-react';
import { getSocialPosts } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { SocialGalleryPost } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ReconnectingIndicator } from '@/components/entretenimiento/ReconnectingIndicator';
import NextImage from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const REFRESH_INTERVAL_MS = 3000;

function isVideoPost(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

export default function PrintStationPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [disconnectedSince, setDisconnectedSince] = useState<Date | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [printedIds, setPrintedIds] = useState<Set<string>>(new Set());
  const [printPost, setPrintPost] = useState<SocialGalleryPost | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pendingPrintConfirmation, setPendingPrintConfirmation] = useState<SocialGalleryPost | null>(null);

  // Load printed IDs from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(`printed_${fiestaId}`);
    if (stored) {
      try {
        setPrintedIds(new Set(JSON.parse(stored)));
      } catch (_) {}
    }
  }, [fiestaId]);

  const loadData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const [fiestaData, socialPosts] = await Promise.all([
        getFiestaById(fiestaId),
        getSocialPosts(fiestaId),
      ]);
      setFiesta(fiestaData);
      
      // Keep only approved image posts (we cannot print videos directly)
      const approvedImages = socialPosts.filter(
        p => esAprobadoParaMostrar(p) && !isVideoPost(p)
      );
      setPosts(approvedImages);
      setHasError(false);
      setDisconnectedSince(null);
    } catch {
      setHasError(true);
      setDisconnectedSince(prev => prev || new Date());
    } finally {
      if (showIndicator) setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle printing trigger
  const handlePrint = useCallback((post: SocialGalleryPost, retry = false) => {
    if (isPrinting || (pendingPrintConfirmation && !retry)) return;
    setIsPrinting(true);
    setPrintPost(post);

    // Give browser time to render print template before executing window.print()
    setTimeout(() => {
      window.print();

      setIsPrinting(false);
      setPrintPost(null);
      setPendingPrintConfirmation(post);

      toast({
        title: 'Verifica la copia impresa',
        description: 'La foto seguira en la cola hasta que confirmes que salio correctamente.',
        duration: 2000,
      });
    }, 600);
  }, [isPrinting, pendingPrintConfirmation, toast]);

  const confirmPrinted = () => {
    if (!pendingPrintConfirmation) return;
    const post = pendingPrintConfirmation;
    setPrintedIds(prev => {
      const next = new Set(prev);
      next.add(post.id);
      localStorage.setItem(`printed_${fiestaId}`, JSON.stringify(Array.from(next)));
      return next;
    });
    setPendingPrintConfirmation(null);
    toast({ title: 'Impresion confirmada', description: `Foto de ${post.authorName} completada.` });
  };

  const retryPrint = () => {
    const post = pendingPrintConfirmation;
    setPendingPrintConfirmation(null);
    if (post) {
      handlePrint(post, true);
    }
  };

  const skipPrint = (postId: string) => {
    setPrintedIds(prev => {
      const next = new Set(prev);
      next.add(postId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`printed_${fiestaId}`, JSON.stringify(Array.from(next)));
      }
      return next;
    });
    toast({ title: 'Foto omitida de la cola' });
  };

  const resetQueue = () => {
    setPrintedIds(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`printed_${fiestaId}`);
    }
    toast({ title: 'Cola de impresión reiniciada' });
  };

  // Auto-Print Trigger effect
  useEffect(() => {
    if (!autoPrint || posts.length === 0 || isPrinting || pendingPrintConfirmation) return;
    
    // Find first unprinted post (newest approved first)
    const nextToPrint = [...posts]
      .reverse() // check oldest approved first so we print in order of upload
      .find(p => !printedIds.has(p.id));

    if (nextToPrint) {
      handlePrint(nextToPrint);
    }
  }, [posts, autoPrint, printedIds, isPrinting, pendingPrintConfirmation, handlePrint]);

  // Compute pending queues count
  const pendingCount = useMemo(() => {
    return posts.filter(p => !printedIds.has(p.id)).length;
  }, [posts, printedIds]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        <p className="text-sm tracking-widest uppercase text-zinc-400">Iniciando Estación de Impresión...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none print:bg-white print:text-black">
      
      {/* 🖨️ PRINT TEMPLATE (Hidden from screen, visible only on @media print) */}
      <div id="print-area" className="hidden print:block print:absolute print:inset-0">
        {printPost && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white relative">
            <div className="relative w-full h-[85%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={printPost.imageUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center font-bold tracking-widest uppercase mt-4 text-slate-800 text-sm">
              {fiesta?.configuracion?.nombreEvento || 'Fiesta AK'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Foto por {printPost.authorName} · Muro Social AK
            </div>
          </div>
        )}
      </div>

      {/* SCREEN UI */}
      <div className="flex-1 flex flex-col overflow-hidden print:hidden">
        
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 backdrop-blur-md shrink-0 pt-safe">
          <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 justify-center">
              <Printer className="w-4 h-4 animate-pulse" /> Estación de Impresión
            </h1>
            {fiesta && <p className="text-xs text-zinc-400 truncate max-w-[180px]">{fiesta.configuracion?.nombreEvento}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => loadData(true)} className="h-10 w-10 bg-white/5 rounded-full">
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </Button>
        </header>

        {/* PERMANENT OFFLINE / RECONNECTING WARNING BANNER */}
        {hasError && (
          <div className="bg-rose-500/20 border-b border-rose-500/40 text-rose-200 px-6 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Sin conexión a internet · No se están recibiendo fotos nuevas
                {disconnectedSince ? ` (desde las ${disconnectedSince.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})` : ''}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadData(true)}
              className="h-7 text-xs bg-rose-500/30 hover:bg-rose-500/40 text-white rounded-lg gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Reintentar ahora
            </Button>
          </div>
        )}

        {/* STATUS & CONTROLS DASHBOARD */}
        <div className="p-6 bg-zinc-900/30 border-b border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 items-center">
          
          {/* Status Counter */}
          <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-3xl">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner
              ${pendingCount > 0 ? 'bg-amber-400/20 text-amber-400 animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
              {pendingCount}
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pendientes de Impresión</p>
              <p className="text-lg font-black">{posts.length} fotos aprobadas en total</p>
            </div>
          </div>

          {/* Auto-Print Toggle */}
          <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 p-4 rounded-3xl">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold flex items-center gap-1.5">
                Impresión Automática (Auto-Print)
              </Label>
              <p className="text-[11px] text-zinc-400 leading-tight">Imprime fotos apenas son aprobadas.</p>
            </div>
            <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>

          {/* Reset Queue */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="border border-zinc-800 bg-transparent text-zinc-400 hover:text-white rounded-2xl" onClick={resetQueue}>
              Reiniciar Cola
            </Button>
            <Button
              className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-2xl gap-2 shadow-lg shadow-amber-950/20"
              onClick={() => {
                const next = posts.find(p => !printedIds.has(p.id));
                if (next) handlePrint(next);
                else toast({ title: 'No hay fotos pendientes en la cola.' });
              }}
              disabled={isPrinting || pendingCount === 0}
            >
              {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Imprimir Siguiente
            </Button>
          </div>
        </div>

        {/* PRINT QUEUE LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-2">Historial de Fotos y Cola</h2>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map(post => {
                const isPrinted = printedIds.has(post.id);
                return (
                  <div
                    key={post.id}
                    className={`border rounded-3xl p-4 bg-zinc-900/20 flex flex-col justify-between gap-4 transition-all relative overflow-hidden
                      ${isPrinted ? 'border-zinc-900/80 opacity-60' : 'border-zinc-800 shadow-md shadow-black/30'}`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6 z-10">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md
                        ${isPrinted ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50' : 'bg-amber-400 text-zinc-950'}`}>
                        {isPrinted ? 'Impresa' : 'En Cola'}
                      </span>
                    </div>

                    {/* Image Preview */}
                    <div className="relative w-full aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/50">
                      <NextImage src={post.imageUrl} alt="" fill className="object-contain" unoptimized />
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">Autor</p>
                      <p className="text-sm font-bold text-white truncate">{post.authorName}</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {!isPrinted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-zinc-400 hover:text-rose-400 text-xs"
                          onClick={() => skipPrint(post.id)}
                        >
                          Omitir
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className={`rounded-xl text-xs font-bold gap-1.5 flex-1 col-span-${isPrinted ? 2 : 1}
                          ${isPrinted ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-amber-400 hover:bg-amber-300 text-zinc-950'}`}
                        onClick={() => handlePrint(post)}
                        disabled={isPrinting}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {isPrinted ? 'Reimprimir' : 'Imprimir'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-500 border border-dashed border-zinc-800 rounded-[2rem]">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-medium">Aún no hay fotos aprobadas en este evento.</p>
            </div>
          )}
        </div>

      </div>

      <AlertDialog open={pendingPrintConfirmation !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿La foto salio impresa correctamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmala solamente cuando tengas la copia fisica. Si cancelaste o hubo un error, reintenta sin quitarla de la cola.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={retryPrint}>Reintentar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPrinted}>Confirmar impresa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          #print-area {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999999 !important;
          }
          /* Hide all screen interface elements */
          body > *:not(#print-area) {
            display: none !important;
          }
          @page {
            size: 4in 6in; /* Standard photobooth size */
            margin: 0;
          }
        }
      `}</style>
      <ReconnectingIndicator isReconnecting={hasError} />
    </div>
  );
}

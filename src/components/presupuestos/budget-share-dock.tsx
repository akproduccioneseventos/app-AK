'use client';

import { Suspense, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCopy, Download, Edit3, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { enlacePublicoDelPresupuesto } from '@/lib/presupuestos/enlace-publico';

function isBudgetViewRoute(pathname: string | null) {
  return Boolean(pathname && /^\/presupuestos\/[^/]+\/ver$/.test(pathname));
}

function budgetIdFromPath(pathname: string | null): string | null {
  const m = pathname?.match(/^\/presupuestos\/([^/]+)\/ver$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * El enlace que se comparte es SIEMPRE el público con token (el mismo que arma el botón de la
 * pantalla). Antes se copiaba la dirección interna y el cliente caía en el ingreso (SHARE80).
 */
async function getClientBudgetUrl(pathname: string | null): Promise<string> {
  const id = budgetIdFromPath(pathname);
  if (!id) throw new Error('No se encontró el presupuesto.');
  return enlacePublicoDelPresupuesto(id, window.location.origin);
}

function buildBudgetShareText(url: string) {
  return `Te comparto el presupuesto formal de AK Producciones.\nPodés abrirlo desde el enlace y descargarlo como PDF. La reserva y las firmas se confirman con el contrato correspondiente.\n${url}`;
}

export function BudgetShareDock() {
  return (
    <Suspense fallback={null}>
      <BudgetShareDockInner />
    </Suspense>
  );
}

function BudgetShareDockInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const accessMode = (searchParams.get('mode') || searchParams.get('modo') || '').toLowerCase();
  const isPublicOrGuestView =
    searchParams.has('token') ||
    searchParams.get('public') === '1' ||
    searchParams.get('cliente') === '1' ||
    searchParams.get('client') === '1' ||
    searchParams.get('guest') === '1' ||
    searchParams.get('direct') === '1' ||
    searchParams.get('imprimir') === '1' ||
    ['cliente', 'client', 'publico', 'public', 'invitado', 'guest'].includes(accessMode);

  const shouldRender = useMemo(() => isBudgetViewRoute(pathname) && !isPublicOrGuestView, [isPublicOrGuestView, pathname]);
  if (!shouldRender) return null;

  const editHref = pathname?.replace(/\/ver$/, '/edit') || '/presupuestos/nuevo';

  const avisarQueFallo = (error: unknown) => {
    toast({
      title: 'No se pudo armar el enlace del cliente',
      description: error instanceof Error ? error.message : 'Probá de nuevo en un momento.',
      variant: 'destructive',
    });
  };

  const handleWhatsApp = async () => {
    // La ventana se abre en el toque (si no, el navegador la bloquea) y se completa al tener el enlace.
    const ventana = window.open('', '_blank');
    try {
      const url = await getClientBudgetUrl(pathname);
      const destino = `https://wa.me/?text=${encodeURIComponent(buildBudgetShareText(url))}`;
      if (ventana) {
        ventana.opener = null;
        ventana.location.href = destino;
      } else {
        window.open(destino, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      ventana?.close();
      avisarQueFallo(error);
    }
  };

  const handlePdf = () => {
    toast({ title: 'Preparando PDF', description: 'Elegí Guardar como PDF en el diálogo de impresión.' });
    window.setTimeout(() => window.print(), 150);
  };

  const handleCopy = async () => {
    let url: string;
    try {
      url = await getClientBudgetUrl(pathname);
    } catch (error) {
      avisarQueFallo(error);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: 'Es el enlace del cliente: lo abre sin cuenta.' });
    } catch {
      // La barra del navegador tiene la dirección INTERNA: no se manda a copiarla de ahí.
      toast({ title: 'No se pudo copiar', description: `Copiá este enlace a mano: ${url}`, variant: 'destructive' });
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    setIsSharing(true);
    try {
      let url: string;
      try {
        url = await getClientBudgetUrl(pathname);
      } catch (error) {
        avisarQueFallo(error);
        return;
      }
      const text = buildBudgetShareText(url);
      await navigator.share({
        title: 'Presupuesto AK Producciones',
        text,
        url,
      });
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast({ title: 'No se pudo compartir', description: 'Probá con WhatsApp o copiando el enlace.', variant: 'destructive' });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 px-3 print:hidden pointer-events-none sm:bottom-5">
      <div className="pointer-events-auto mx-auto grid w-full max-w-3xl grid-cols-2 items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur sm:flex">
        <Button onClick={handleWhatsApp} className="h-11 rounded-xl bg-[#25D366] text-[11px] font-black uppercase tracking-wider text-white hover:bg-[#1fb85a] sm:flex-1">
          <MessageSquare className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
        <Button onClick={handlePdf} variant="secondary" className="h-11 rounded-xl text-[11px] font-black uppercase tracking-wider sm:flex-1">
          <Download className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Button onClick={handleNativeShare} variant="outline" className="h-11 rounded-xl text-[11px] font-black uppercase tracking-wider sm:flex-1" disabled={isSharing}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartir
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-xl text-[11px] font-black uppercase tracking-wider sm:flex-1">
          <Link href={editHref}>
            <Edit3 className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button onClick={handleCopy} variant="outline" size="icon" className="hidden h-11 w-11 shrink-0 rounded-xl sm:inline-flex" aria-label="Copiar enlace del presupuesto">
          <ClipboardCopy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

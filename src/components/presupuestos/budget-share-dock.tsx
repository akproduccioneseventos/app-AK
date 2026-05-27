'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCopy, Download, Edit3, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function isBudgetViewRoute(pathname: string | null) {
  return Boolean(pathname && /^\/presupuestos\/[^/]+\/ver$/.test(pathname));
}

function getCurrentBudgetUrl() {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('imprimir');
  return url.toString();
}

function buildBudgetShareText(url: string) {
  return `Te comparto el presupuesto formal de AK Producciones.\nPodés abrirlo desde el enlace y descargarlo como PDF. La reserva y las firmas se confirman con el contrato correspondiente.\n${url}`;
}

export function BudgetShareDock() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const shouldRender = useMemo(() => isBudgetViewRoute(pathname), [pathname]);
  if (!shouldRender) return null;

  const editHref = pathname?.replace(/\/ver$/, '/edit') || '/presupuestos/nuevo';

  const handleWhatsApp = () => {
    const url = getCurrentBudgetUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(buildBudgetShareText(url))}`, '_blank', 'noopener,noreferrer');
  };

  const handlePdf = () => {
    toast({ title: 'Preparando PDF', description: 'Elegí Guardar como PDF en el diálogo de impresión.' });
    window.setTimeout(() => window.print(), 150);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentBudgetUrl());
      toast({ title: 'Enlace copiado', description: 'Listo para pegar en WhatsApp o enviar al cliente.' });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Copiá el enlace desde la barra del navegador.', variant: 'destructive' });
    }
  };

  const handleNativeShare = async () => {
    const url = getCurrentBudgetUrl();
    const text = buildBudgetShareText(url);
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    setIsSharing(true);
    try {
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

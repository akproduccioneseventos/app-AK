'use client';

import { useCallback, useEffect, useState } from 'react';
import NextImage from 'next/image';
import {
  BellRing,
  Camera,
  CheckCircle2,
  Loader2,
  Martini,
  Shuffle,
  Wine,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  cancelBarDrinkOrder,
  changeBarDrinkOrder,
  createBarDrinkOrder,
  getGuestBarOrders,
  getPublicBarraTecnologicaDashboard,
  uploadBarMagicPhoto,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import type { BarDrinkOrder, PublicBarTechnologyDashboard } from '@/types/barra-tecnologica';
import type { Invitado, Trago } from '@/types/fiesta';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MiniQuioscoProps {
  fiestaId: string;
  guest: Pick<Invitado, 'id' | 'nombre' | 'tableNumber'>;
  guestAccessToken: string;
  canShareToSocial: boolean;
  onClose: () => void;
}

const ORDER_STATUS: Record<string, string> = {
  nuevo: 'Pedido recibido',
  preparando: 'En preparacion',
  listo: 'Listo para retirar',
};

export function MiniQuiosco({ fiestaId, guest, guestAccessToken, canShareToSocial, onClose }: MiniQuioscoProps) {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<PublicBarTechnologyDashboard | null>(null);
  const [myOrders, setMyOrders] = useState<BarDrinkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<Trago | null>(null);
  const [drinkToChange, setDrinkToChange] = useState<BarDrinkOrder | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isCanceling, setIsCanceling] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoadError(false);
    try {
      const [dashboardResult, ordersResult] = await Promise.all([
        getPublicBarraTecnologicaDashboard(fiestaId),
        getGuestBarOrders(fiestaId, guest.id, guestAccessToken),
      ]);
      if (!dashboardResult.success || !dashboardResult.data || !ordersResult.success) throw new Error('No se pudo cargar el quiosco.');
      setDashboard(dashboardResult.data);
      setMyOrders(ordersResult.orders || []);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, guest.id, guestAccessToken]);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 5_000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const submitOrder = async (drinkId: string) => {
    setIsOrdering(true);
    const result = drinkToChange
      ? await changeBarDrinkOrder(fiestaId, drinkToChange.id, drinkId, guest.id, guestAccessToken)
      : await createBarDrinkOrder({
        fiestaId,
        drinkId,
        guestName: guest.nombre,
        guestId: guest.id,
        tableNumber: guest.tableNumber,
      });
    if (result.success) {
      toast({ title: 'Pedido registrado', description: 'Te avisaremos cuando este listo.' });
      setSelectedDrink(null);
      setDrinkToChange(null);
      await loadData();
    } else {
      toast({ title: 'No se pudo registrar', description: 'Intentá nuevamente. Si el problema continúa, avisá al equipo de la barra.', variant: 'destructive' });
    }
    setIsOrdering(false);
  };

  const handleCancel = async (orderId: string) => {
    setIsCanceling(orderId);
    const result = await cancelBarDrinkOrder(fiestaId, orderId, guest.id, guestAccessToken);
    if (result.success) {
      toast({ title: 'Pedido cancelado', description: 'Tu pedido fue cancelado.' });
      await loadData();
    } else {
      toast({ title: 'No se pudo cancelar', description: 'Intentá nuevamente. Si el problema continúa, avisá al equipo de la barra.', variant: 'destructive' });
    }
    setIsCanceling(null);
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('authorName', guest.nombre);
      formData.append('caption', 'Brindis desde la barra');
      formData.append('followConfirmed', 'true');
      formData.append('file', file);
      formData.append('source', 'kiosco');
      const result = await uploadBarMagicPhoto(formData);
      toast(result.success
        ? { title: 'Recuerdo enviado', description: 'Tu foto aparecera en el muro social.' }
        : { title: 'No se pudo subir', description: 'Intentá nuevamente. Si el problema continúa, avisá al equipo de la barra.', variant: 'destructive' });
    } catch {
      toast({ title: 'No se pudo subir', description: 'Intenta nuevamente.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const activeOrder = myOrders.find((order) => ['nuevo', 'preparando', 'listo'].includes(order.status));
  const accentColor = dashboard?.settings?.accentColor || '#b91c1c';
  const drinks = dashboard?.drinks || [];
  const chooseRandomDrink = () => {
    if (drinks.length) setSelectedDrink(drinks[Math.floor(Math.random() * drinks.length)]);
  };

  if (isLoading) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950 p-6 text-center text-white" role="status" aria-live="polite"><div><Loader2 className="mx-auto h-10 w-10 animate-spin" /><p className="mt-4 text-sm font-medium text-slate-200">Estamos preparando el quiosco de tragos.</p></div></div>;
  }

  if (loadError) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950 p-6 text-center text-white"><div className="max-w-sm"><h2 className="text-xl font-black">No pudimos abrir el quiosco</h2><p className="mt-3 text-sm text-slate-300">Intentá nuevamente. Si el problema continúa, avisá al equipo de la barra.</p><div className="mt-5 flex justify-center gap-3"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button onClick={() => { setIsLoading(true); loadData(); }} className="bg-white text-slate-950 hover:bg-slate-200">Reintentar</Button></div></div></div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-950">
      <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Barra tecnologica</p><h2 className="mt-1 text-lg font-black">Quiosco de tragos</h2></div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar quiosco" className="rounded-lg"><X className="h-5 w-5" /></Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-5 p-4 sm:p-6">
          {activeOrder && <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-slate-100" style={{ color: accentColor }}>{activeOrder.status === 'nuevo' && <BellRing className="h-5 w-5" />}{activeOrder.status === 'preparando' && <Loader2 className="h-5 w-5 animate-spin" />}{activeOrder.status === 'listo' && <CheckCircle2 className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Mi pedido actual</p><p className="mt-1 text-lg font-black">{activeOrder.drinkName}</p><p className="mt-1 text-sm font-bold" style={{ color: accentColor }}>{ORDER_STATUS[activeOrder.status] || activeOrder.status}</p></div></div>{(activeOrder.status === 'nuevo' || activeOrder.status === 'preparando') && <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => handleCancel(activeOrder.id)} disabled={isCanceling === activeOrder.id} className="min-h-11 rounded-lg border-red-200 text-red-700 hover:bg-red-50">{isCanceling === activeOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar'}</Button><Button variant="outline" onClick={() => setDrinkToChange(activeOrder)} className="min-h-11 rounded-lg">Cambiar trago</Button></div>}</section>}

          {canShareToSocial && <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Muro social</p><p className="mt-1 text-sm text-slate-600">Compartí una foto o video de tu brindis.</p></div><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50"><Camera className="h-4 w-4" />{isUploading ? 'Subiendo...' : 'Subir recuerdo'}<input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={isUploading} className="sr-only" /></label></div></section>}

          <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-slate-500">Carta</p><h3 className="mt-1 text-2xl font-black">Elegí tu trago</h3></div>{!activeOrder && drinks.length > 1 && <Button variant="outline" onClick={chooseRandomDrink} className="min-h-10 rounded-lg"><Shuffle className="mr-2 h-4 w-4" />Sugerirme uno</Button>}</div>{/* Carrusel de tragos. Antes era una grilla quieta de dos columnas con la foto
            del tamano de una estampilla: el trago no se veia, se leia. Ahora las
            tarjetas se pasan de costado con el dedo y se acomodan solas al soltar,
            igual que en la pantalla grande del salon.

            Las tarjetas miden 78% del ancho a proposito, para que asome la
            siguiente: si ocupan todo, el invitado cree que hay un solo trago. */}
          <div
            className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Carta de tragos"
          >
            {drinks.map((drink) => (
              <article
                key={drink.id}
                className="flex w-[78%] max-w-xs flex-none snap-center flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:w-64"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  {drink.imageUrl ? (
                    <NextImage src={drink.imageUrl} alt={drink.nombre} fill className="object-cover" unoptimized />
                  ) : (
                    /* Sin foto cargada no se deja un hueco gris: se arma una tarjeta
                       con el color de la fiesta y el trago bien grande. */
                    <div
                      className="grid h-full place-items-center"
                      style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}55)` }}
                    >
                      <Wine className="h-16 w-16" style={{ color: accentColor }} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-lg font-black leading-tight text-slate-900">{drink.nombre}</p>
                  {drink.ingredientes?.length ? (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate-500">
                      {drink.ingredientes.join(', ')}
                    </p>
                  ) : null}
                  {/* El boton va abajo de todo y ocupa el ancho: se alcanza con el
                      pulgar y se toca sin apuntar, que es como se usa en una fiesta. */}
                  <Button
                    onClick={() => setSelectedDrink(drink)}
                    disabled={Boolean(activeOrder)}
                    className="mt-4 min-h-12 w-full rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Pedir
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {drinks.length === 0 && <p className="mt-4 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">La carta todavia no esta disponible.</p>}</section>
        </div>
      </div>

      <Dialog open={Boolean(selectedDrink || drinkToChange)} onOpenChange={(open) => { if (!open) { setSelectedDrink(null); setDrinkToChange(null); } }}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-lg border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-black">{drinkToChange ? 'Cambiar trago' : 'Confirmar pedido'}</DialogTitle></DialogHeader>
          {selectedDrink ? <div className="py-3"><div className="grid h-14 w-14 place-items-center rounded-lg bg-slate-100" style={{ color: accentColor }}><Martini className="h-7 w-7" /></div><p className="mt-4 text-lg font-black">{selectedDrink.nombre}</p><p className="mt-1 text-sm text-slate-500">Se preparara a nombre de {guest.nombre}.</p></div> : <p className="py-3 text-sm leading-relaxed text-slate-600">Elegí el nuevo trago de la carta para cambiar tu pedido actual.</p>}
          <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => { setSelectedDrink(null); setDrinkToChange(null); }} className="min-h-11 rounded-lg">Cancelar</Button><Button onClick={() => selectedDrink && submitOrder(selectedDrink.id)} disabled={!selectedDrink || isOrdering} className="min-h-11 rounded-lg text-white" style={{ backgroundColor: accentColor }}>{isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

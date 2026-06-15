'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Martini, Wine, X, Clock, CheckCircle2, ChevronRight, Loader2, Camera, Shuffle, BellRing 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  getBarraTecnologicaDashboard, 
  createBarDrinkOrder, 
  cancelBarDrinkOrder, 
  changeBarDrinkOrder,
  uploadBarMagicPhoto
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import type { BarDrinkOrder, BarTechnologyDashboard } from '@/types/barra-tecnologica';
import type { Invitado, Trago } from '@/types/fiesta';
import NextImage from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MiniQuiosco({ fiestaId, guest, onClose }: { fiestaId: string, guest: Invitado, onClose: () => void }) {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // States
  const [selectedDrink, setSelectedDrink] = useState<Trago | null>(null);
  const [myOrders, setMyOrders] = useState<BarDrinkOrder[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isCanceling, setIsCanceling] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState<string | null>(null);
  const [drinkToChange, setDrinkToChange] = useState<BarDrinkOrder | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = useCallback(async () => {
    const dashResult = await getBarraTecnologicaDashboard(fiestaId);
    if (dashResult.success && dashResult.data) {
      setDashboard(dashResult.data);
      const orders = dashResult.data.orders.filter(o => o.guestName === guest.nombre);
      setMyOrders(orders);
    }
    setIsLoading(false);
  }, [fiestaId, guest.nombre]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const submitOrder = async (drinkId: string, isChangeOrderId?: string) => {
    setIsOrdering(true);
    let result;
    if (isChangeOrderId) {
      result = await changeBarDrinkOrder(fiestaId, isChangeOrderId, drinkId);
    } else {
      result = await createBarDrinkOrder({
        fiestaId,
        drinkId,
        guestName: guest.nombre,
        tableNumber: guest.tableNumber,
      });
    }

    if (result.success) {
      toast({ title: '¡Éxito!', description: 'Pedido registrado.' });
      setSelectedDrink(null);
      setDrinkToChange(null);
      await loadData();
    } else {
      toast({ title: 'Atención', description: result.error, variant: 'destructive' });
    }
    setIsOrdering(false);
  };

  const handleCancel = async (orderId: string) => {
    setIsCanceling(orderId);
    const result = await cancelBarDrinkOrder(fiestaId, orderId);
    if (result.success) {
      toast({ title: 'Pedido cancelado', description: 'Has cancelado el pedido correctamente.' });
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo cancelar', variant: 'destructive' });
    }
    setIsCanceling(null);
  };

  const openRandomDrink = () => {
    const drinks = dashboard?.drinks || [];
    if (!drinks.length) return;
    const randomIndex = Math.floor(Math.random() * drinks.length);
    setSelectedDrink(drinks[randomIndex]);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('authorName', guest.nombre);
      formData.append('caption', 'Brindando desde la Barra VIP 🍸');
      formData.append('followConfirmed', 'true');
      formData.append('file', file);
      formData.append('source', 'kiosco');

      const result = await uploadBarMagicPhoto(formData);
      if (result.success) {
        toast({ title: '¡Salud! 🥂', description: 'Tu recuerdo ya está en el Muro Social.' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo subir tu recuerdo.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
      </div>
    );
  }

  const activeOrder = myOrders.find(o => ['nuevo', 'preparando', 'listo'].includes(o.status));
  const settings = dashboard?.settings;
  const accentColor = settings?.accentColor || '#f43f5e';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
        <h2 className="text-xl font-black text-white drop-shadow-md">🍸 Quiosco Virtual</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 pt-20 px-4">
        {/* Mis Pedidos Activos */}
        {activeOrder && (
          <div className="mb-6 p-4 rounded-3xl bg-white/10 border border-white/20 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-3">Mi Pedido Actual</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                {activeOrder.status === 'nuevo' && <BellRing className="w-6 h-6 text-amber-500 animate-pulse" />}
                {activeOrder.status === 'preparando' && <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />}
                {activeOrder.status === 'listo' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
              </div>
              <div className="flex-1">
                <p className="text-xl font-black text-white">{activeOrder.drinkName}</p>
                <p className="text-sm font-bold capitalize text-amber-400">
                  {activeOrder.status === 'listo' ? '¡LISTO PARA RETIRAR!' : `Estado: ${activeOrder.status}`}
                </p>
              </div>
            </div>

            {(activeOrder.status === 'nuevo' || activeOrder.status === 'preparando') && (
              <div className="mt-4 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 rounded-xl bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  onClick={() => handleCancel(activeOrder.id)}
                  disabled={isCanceling === activeOrder.id}
                >
                  {isCanceling === activeOrder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancelar'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 rounded-xl bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  onClick={() => setDrinkToChange(activeOrder)}
                >
                  Cambiar trago
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Carga Multimedia */}
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-white/10 shadow-lg text-center backdrop-blur-md">
          <h3 className="text-lg font-black text-white mb-2">¡Sube tu brindis! 📸</h3>
          <p className="text-xs text-white/60 mb-4">Comparte una foto o video de tu trago y aparecerá en la pantalla gigante.</p>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*,video/*" 
              capture="environment"
              onChange={handleMediaUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <Button className="w-full h-12 rounded-2xl bg-white text-black font-bold pointer-events-none">
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Camera className="w-5 h-5 mr-2" />}
              {isUploading ? 'Subiendo...' : 'Tomar Foto / Video'}
            </Button>
          </div>
        </div>

        {/* Header Menú */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-black">La Carta</h3>
          {!activeOrder && (
            <Button size="sm" onClick={openRandomDrink} className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg text-xs font-bold h-8 border-0">
              <Shuffle className="w-3 h-3 mr-1" /> Sorpréndeme
            </Button>
          )}
        </div>

        {/* Lista de tragos */}
        <div className="grid grid-cols-1 gap-3">
          {dashboard?.drinks.map(drink => (
            <div 
              key={drink.id} 
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative">
                {drink.imageUrl ? (
                  <NextImage src={drink.imageUrl} alt={drink.nombre} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-rose-500/50"><Wine className="w-8 h-8" /></div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-base leading-tight mb-0.5">{drink.nombre}</p>
                <p className="text-xs text-white/50 line-clamp-1">{drink.ingredientes?.join(', ')}</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setSelectedDrink(drink)}
                disabled={!!activeOrder}
                className="rounded-full bg-white text-black font-bold h-9 w-9 p-0 shrink-0 shadow-md hover:bg-slate-200"
              >
                +
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedDrink || !!drinkToChange} onOpenChange={(o) => { if (!o) { setSelectedDrink(null); setDrinkToChange(null); } }}>
        <DialogContent className="sm:max-w-md bg-slate-900 text-white border-white/10 rounded-3xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {drinkToChange ? 'Cambiar Trago' : 'Confirmar Pedido'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="w-24 h-24 rounded-full bg-rose-500/20 mx-auto flex items-center justify-center mb-4">
              <Martini className="w-12 h-12 text-rose-500" />
            </div>
            {drinkToChange && !selectedDrink ? (
              <p className="text-slate-300">Selecciona el nuevo trago de la lista para cambiar tu pedido actual de <strong>{drinkToChange.drinkName}</strong>.</p>
            ) : (
              <>
                <p className="text-xl font-bold mb-2">{selectedDrink?.nombre}</p>
                <p className="text-sm text-slate-400">Se preparará a nombre de {guest.nombre}.</p>
              </>
            )}
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Button variant="outline" onClick={() => { setSelectedDrink(null); setDrinkToChange(null); }} className="flex-1 rounded-xl border-white/20 bg-transparent hover:bg-white/10 text-white">Cancelar</Button>
            {(selectedDrink || drinkToChange) && (
              <Button 
                onClick={() => {
                  if (drinkToChange && !selectedDrink) {
                    setSelectedDrink(null);
                  } else if (selectedDrink) {
                    submitOrder(selectedDrink.id, drinkToChange?.id);
                  }
                }} 
                disabled={isOrdering} 
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
              >
                {isOrdering ? <Loader2 className="w-5 h-5 animate-spin" /> : (drinkToChange && !selectedDrink ? 'Elegir nuevo trago' : 'Confirmar')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

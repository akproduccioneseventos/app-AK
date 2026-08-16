'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Invitado } from '@/types/invitado';
import { checkInGuest } from '@/app/actions/fiesta/invitados.actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle2, UserPlus, AlertCircle, XCircle, Moon, Sun, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { enqueueOfflineAction, flushOfflineQueue } from '@/lib/offline/offline-action-queue';

export default function RecepcionClient({ 
  fiestaId, 
  initialInvitados, 
  fiestaName 
}: { 
  fiestaId: string; 
  initialInvitados: Invitado[];
  fiestaName: string;
}) {
  const [invitados, setInvitados] = useState<Invitado[]>(initialInvitados);
  const [search, setSearch] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void flushOfflineQueue(async (action) => {
        if (action.type === 'recepcion_checkin') {
          const res = await checkInGuest(action.fiestaId, action.payload.guestId);
          return { success: res.success, error: res.error };
        }
        return { success: true };
      }, { fiestaId });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fiestaId]);

  const filteredInvitados = useMemo(() => {
    if (!search.trim()) return invitados;
    const lower = search.toLowerCase();
    return invitados.filter(i => 
      i.nombre.toLowerCase().includes(lower) || 
      (i.tableNumber && i.tableNumber.toLowerCase().includes(lower))
    );
  }, [invitados, search]);

  const handleCheckIn = async (guestId: string) => {
    setIsCheckingIn(guestId);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          id: `checkin_${fiestaId}_${guestId}`,
          type: 'recepcion_checkin',
          fiestaId,
          payload: { guestId },
        });
        setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, checkedIn: true } : inv));
        toast({ title: 'Guardado sin conexión 📶', description: 'Se sincronizará automáticamente al volver internet.' });
        return;
      }

      const res = await checkInGuest(fiestaId, guestId);
      if (res.success && res.invitado) {
        const checkInInvitado = res.invitado;
        setInvitados(prev => prev.map(inv => inv.id === guestId ? checkInInvitado : inv));
        toast({ title: '¡Listo!', description: 'Invitado marcado como presente.' });
      } else {
        enqueueOfflineAction({
          id: `checkin_${fiestaId}_${guestId}`,
          type: 'recepcion_checkin',
          fiestaId,
          payload: { guestId },
        });
        setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, checkedIn: true } : inv));
        toast({ title: 'Guardado sin conexión 📶', description: 'Se sincronizará automáticamente al volver internet.' });
      }
    } catch (e) {
      enqueueOfflineAction({
        id: `checkin_${fiestaId}_${guestId}`,
        type: 'recepcion_checkin',
        fiestaId,
        payload: { guestId },
      });
      setInvitados(prev => prev.map(inv => inv.id === guestId ? { ...inv, checkedIn: true } : inv));
      toast({ title: 'Guardado sin conexión 📶', description: 'Se sincronizará automáticamente al volver internet.' });
    } finally {
      setIsCheckingIn(null);
    }
  };

  const getRsvpBadge = (status: string) => {
    switch(status) {
      case 'Confirmado': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Confirma</span>;
      case 'Rechazado': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">No va</span>;
      default: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">Duda</span>;
    }
  };

  const presentes = invitados.filter(i => i.checkedIn).length;
  const totales = invitados.filter(i => i.rsvp === 'Confirmado').length;

  return (
    <div className={`flex flex-col h-full min-h-screen pb-24 transition-colors ${nightMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header Sticky */}
      <div className={`sticky top-0 p-4 shadow-md z-10 flex flex-col gap-2 ${nightMode ? 'bg-black border-b border-zinc-800' : 'bg-black text-white'}`}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black truncate pr-2 text-white">Recepción: {fiestaName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNightMode(!nightMode)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition"
              title={nightMode ? 'Modo claro' : 'Modo noche'}
            >
              {nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="bg-amber-400 text-zinc-950 px-3 py-1 rounded-full font-black text-sm whitespace-nowrap">
              {presentes} / {totales}
            </div>
          </div>
        </div>

        {isOffline && (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Sin conexión: las llegadas se guardan en el celular y se enviarán solas.</span>
          </div>
        )}

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <Input 
            type="text" 
            placeholder="Buscar por nombre o mesa..." 
            className={`pl-12 py-6 text-lg rounded-xl font-bold ${nightMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white text-black'}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="p-4 flex-1">
        {filteredInvitados.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-bold">No se encontraron invitados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredInvitados.map(inv => (
              <div 
                key={inv.id} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  inv.checkedIn 
                    ? (nightMode ? 'bg-emerald-950/40 border-emerald-500/60' : 'bg-green-50 border-green-200')
                    : (nightMode ? 'bg-zinc-900 border-zinc-800 shadow-sm' : 'bg-white border-gray-100 shadow-sm')
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-xl font-black truncate ${inv.checkedIn ? (nightMode ? 'text-emerald-300' : 'text-green-900') : (nightMode ? 'text-white' : 'text-gray-900')}`}>
                      {inv.nombre}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getRsvpBadge(inv.rsvp)}
                      {inv.tableNumber && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${nightMode ? 'bg-blue-950/60 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-800'}`}>
                          Mesa {inv.tableNumber}
                        </span>
                      )}
                      {inv.partySize && inv.partySize > 1 && (
                        <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${nightMode ? 'bg-purple-950/60 text-purple-300 border border-purple-800' : 'bg-purple-100 text-purple-800'}`}>
                          <UserPlus className="w-3 h-3" /> {inv.partySize}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {inv.checkedIn ? (
                      <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${nightMode ? 'text-emerald-400 bg-emerald-900/30' : 'text-green-600 bg-green-100'}`}>
                        <CheckCircle2 className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase mt-1">Presente</span>
                      </div>
                    ) : (
                      <Button 
                        size="lg"
                        className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl h-14 px-6 shadow-md"
                        disabled={isCheckingIn === inv.id}
                        onClick={() => handleCheckIn(inv.id)}
                      >
                        {isCheckingIn === inv.id ? '...' : 'Ingresar'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


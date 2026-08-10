'use client';

import React, { useState, useMemo } from 'react';
import { Invitado } from '@/types/invitado';
import { checkInGuest } from '@/app/actions/fiesta/invitados.actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle2, UserPlus, AlertCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
      const res = await checkInGuest(fiestaId, guestId);
      if (res.success && res.invitado) {
        const checkInInvitado = res.invitado;
        setInvitados(prev => prev.map(inv => inv.id === guestId ? checkInInvitado : inv));
        toast({ title: '¡Listo!', description: 'Invitado marcado como presente.' });
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo marcar asistencia.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Error de conexión.', variant: 'destructive' });
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
    <div className="flex flex-col h-full min-h-screen pb-24">
      {/* Header Sticky */}
      <div className="sticky top-0 bg-black text-white p-4 shadow-md z-10 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold truncate pr-2">Recepción: {fiestaName}</h1>
          <div className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm whitespace-nowrap">
            {presentes} / {totales}
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <Input 
            type="text" 
            placeholder="Buscar por nombre o mesa..." 
            className="pl-12 py-6 text-lg text-black rounded-xl"
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
            <p className="text-lg">No se encontraron invitados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredInvitados.map(inv => (
              <div 
                key={inv.id} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  inv.checkedIn 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-xl font-bold truncate ${inv.checkedIn ? 'text-green-900' : 'text-gray-900'}`}>
                      {inv.nombre}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getRsvpBadge(inv.rsvp)}
                      {inv.tableNumber && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                          Mesa {inv.tableNumber}
                        </span>
                      )}
                      {inv.partySize && inv.partySize > 1 && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">
                          <UserPlus className="w-3 h-3" /> {inv.partySize}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {inv.checkedIn ? (
                      <div className="flex flex-col items-center justify-center text-green-600 bg-green-100 p-2 rounded-lg">
                        <CheckCircle2 className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase mt-1">Listo</span>
                      </div>
                    ) : (
                      <Button 
                        size="lg"
                        className="bg-black hover:bg-gray-800 text-white rounded-xl h-14 px-6 shadow-md"
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

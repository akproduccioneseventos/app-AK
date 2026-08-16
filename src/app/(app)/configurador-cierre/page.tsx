'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { calculateSimulatorPricing, type SimulatorPriceStats } from '@/lib/simulator/pricing';
import type { ServicioEmpresa } from '@/types/empresa';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, ArrowRight, Loader2, Users, Calendar, LayoutGrid, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPresupuesto } from '@/app/actions/presupuestos';

export default function ConfiguradorCierrePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [invitados, setInvitados] = useState<number>(100);
  const [tipoEvento, setTipoEvento] = useState<string>('15_anos');
  const [fechaEvento, setFechaEvento] = useState<string>(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [isLoadingServicios, setIsLoadingServicios] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getServiciosEmpresa();
        setServicios(data.filter((s) => s.activo !== false));
        // Default popular services
        const initialSelected = data
          .filter((s) => s.esRecomendado || s.categoria === 'Pista y Luces' || s.categoria === 'Audiovisual')
          .slice(0, 3)
          .map((s) => s.id);
        setSelectedIds(initialSelected);
      } catch (err) {
        console.error('Error cargando servicios:', err);
      } finally {
        setIsLoadingServicios(false);
      }
    }
    void load();
  }, []);

  const pricing: SimulatorPriceStats = useMemo(() => {
    return calculateSimulatorPricing({
      selectedServiceIds: selectedIds,
      servicios,
      invitados,
      fechaEvento,
      esClubUruguay: false,
    });
  }, [selectedIds, servicios, invitados, fechaEvento]);

  const toggleServicio = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCrearPresupuesto = async () => {
    setIsCreatingBudget(true);
    try {
      const itemsPresupuestados = pricing.detallados.map((item) => ({
        id: item.id,
        servicioId: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        precioUnitario: item.precioUnitario,
        cantidad: item.cantidad,
        costoTotal: item.costoTotal,
      }));

      const res = await createPresupuesto({
        clienteNombre: 'Reunión de Cierre (Tablet)',
        clienteEmail: '',
        clienteTelefono: '',
        tipoEvento,
        fechaEvento,
        invitados,
        total: pricing.totalFinal,
        items: itemsPresupuestados,
        origen: 'manual',
        descuento: pricing.descPromo,
      });

      if (res && res.id) {
        toast({ title: '¡Presupuesto creado con éxito!' });
        router.push(`/presupuestos/${res.id}/ver`);
      } else {
        toast({ title: 'Presupuesto guardado', description: 'Redirigiendo a presupuestos...' });
        router.push('/presupuestos');
      }
    } catch (error: any) {
      toast({ title: 'Error al generar presupuesto', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingBudget(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white select-none">
      {/* Header Tablet */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-400 p-2 text-zinc-950 font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Configurador de Evento</h1>
            <p className="text-xs font-semibold text-zinc-400">Reunión de Cierre en Oficina</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/40 px-4 py-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-400">Invitados:</span>
            <div className="flex items-center gap-2">
              {[80, 100, 150, 200].map((num) => (
                <button
                  key={num}
                  onClick={() => setInvitados(num)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                    invitados === num ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left 2 Cols: Interactive Visual Service Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-amber-400" />
              Elegí los servicios para el salón
            </h2>
            <p className="text-sm text-zinc-400 mb-4">Tocá cada tarjeta para sumarla o quitarla de la propuesta.</p>

            {isLoadingServicios ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {servicios.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServicio(s.id)}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10'
                          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
                          {s.categoria}
                        </span>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                            isSelected ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-zinc-700 bg-zinc-800 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>

                      <h3 className="text-base font-black text-white leading-snug mb-2">{s.nombre}</h3>
                      {s.descripcion && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{s.descripcion}</p>
                      )}

                      <div className="mt-auto flex items-baseline justify-between border-t border-zinc-800/80 pt-3">
                        <span className="text-xs text-zinc-500 font-bold">Valor</span>
                        <span className="text-sm font-black text-amber-300">
                          ${s.precioBase ? s.precioBase.toLocaleString('es-UY') : s.precioPorPersona ? `${s.precioPorPersona}/pers.` : 'Consultar'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Summary & Action Box */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-black text-white">Resumen del Evento</h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Tarifa Oficial AK
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Servicios elegidos:</span>
                <span className="font-bold text-white">{pricing.detallados.length}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Total sin ajuste:</span>
                <span className="font-bold text-white">${pricing.totalSinAjuste.toLocaleString('es-UY')}</span>
              </div>
              {pricing.ajusteAnual > 0 && (
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Ajuste anual ({pricing.annualProjection.yearsDifference} año):</span>
                  <span className="font-bold text-white">+${pricing.ajusteAnual.toLocaleString('es-UY')}</span>
                </div>
              )}
            </div>

            {/* Big price display for parents */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Proyectado</p>
              <div className="text-4xl font-black text-amber-400">
                ${pricing.totalFinal.toLocaleString('es-UY')}
              </div>
              <p className="text-xs font-bold text-zinc-400 pt-1">
                ${pricing.precioPorPersona.toLocaleString('es-UY')} por persona ({invitados} invitados)
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleCrearPresupuesto}
              disabled={isCreatingBudget || pricing.detallados.length === 0}
              className="w-full h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-400/10 disabled:opacity-50"
            >
              {isCreatingBudget ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Guardar Presupuesto</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

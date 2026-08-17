'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { calculateSimulatorPricing, type SimulatorPriceStats } from '@/lib/simulator/pricing';
import type { ServicioEmpresa } from '@/types/empresa';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { DecoracionData, LayoutElement } from '@/types/fiesta';
import {
  Sparkles,
  Users,
  Check,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  Flame,
  Volume2,
  Tv,
  Camera,
  GlassWater,
  PartyPopper,
} from 'lucide-react';

// Dynamic import for 3D canvas to avoid SSR errors
const SalonScene = dynamic(
  () => import('@/components/salon-3d/SalonScene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-bold">Cargando salón interactivo 3D...</p>
      </div>
    ),
  }
);

const BASE_SALON_ELEMENTS: LayoutElement[] = [
  { id: 'escenario_1', name: 'Escenario Principal', type: 'area', category: 'Escenario', x: 200, y: 40, width: 240, height: 100, rotation: 0 },
  { id: 'mesa_1', name: 'Mesa 1', type: 'element', category: 'Mesas', x: 80, y: 180, width: 80, height: 80, rotation: 0, seats: 10 },
  { id: 'mesa_2', name: 'Mesa 2', type: 'element', category: 'Mesas', x: 480, y: 180, width: 80, height: 80, rotation: 0, seats: 10 },
  { id: 'mesa_3', name: 'Mesa 3', type: 'element', category: 'Mesas', x: 80, y: 320, width: 80, height: 80, rotation: 0, seats: 10 },
  { id: 'mesa_4', name: 'Mesa 4', type: 'element', category: 'Mesas', x: 480, y: 320, width: 80, height: 80, rotation: 0, seats: 10 },
];

export default function ConfiguradorVisualPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);

  // Configurador state
  const [adultos, setAdultos] = useState<number>(100);
  const [ninosYAdolescentes, setNinosYAdolescentes] = useState<number>(30);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [primaryColor, setPrimaryColor] = useState<string>('#e11d48');

  // Load initial catalog and settings
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [servs, cfg] = await Promise.all([getServiciosEmpresa(), getArmadoRapidoConfig()]);
        setServicios(servs);
        setConfig(cfg);

        // Preselect popular or essential items
        const initialSelected = new Set<string>();
        servs.forEach((s) => {
          const lower = s.nombre.toLowerCase();
          if (lower.includes('dj') || lower.includes('sonido') || lower.includes('iluminac')) {
            initialSelected.add(s.id);
          }
        });
        setSelectedServiceIds(initialSelected);
      } catch (err: any) {
        toast({
          title: 'Error al cargar catálogo',
          description: err?.message || 'No se pudo cargar los servicios de la empresa.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    void loadCatalog();
  }, [toast]);

  // Toggle service selection
  const toggleService = useCallback((id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Compute pricing strictly using calculateSimulatorPricing
  const pricingStats: SimulatorPriceStats | null = useMemo(() => {
    if (!config || !servicios.length) return null;

    const selectedServicesArray = Array.from(selectedServiceIds).map((id) => ({
      id,
      esRegalo: false,
    }));

    return calculateSimulatorPricing({
      config,
      services: servicios,
      adultos,
      ninosYAdolescentes,
      selectedServices: selectedServicesArray,
      annualAdjustmentPercentage: 15,
    });
  }, [config, servicios, selectedServiceIds, adultos, ninosYAdolescentes]);

  // Generate 3D room elements dynamically based on selected services
  const decoracion3D: DecoracionData = useMemo(() => {
    const elements: LayoutElement[] = [...BASE_SALON_ELEMENTS];

    const hasPistaLed = servicios.some(
      (s) => selectedServiceIds.has(s.id) && s.nombre.toLowerCase().includes('pista')
    );
    const hasPantalla = servicios.some(
      (s) =>
        selectedServiceIds.has(s.id) &&
        (s.nombre.toLowerCase().includes('pantalla') || s.nombre.toLowerCase().includes('led'))
    );
    const hasBarra = servicios.some(
      (s) => selectedServiceIds.has(s.id) && s.nombre.toLowerCase().includes('barra')
    );
    const hasFotocabina = servicios.some(
      (s) =>
        selectedServiceIds.has(s.id) &&
        (s.nombre.toLowerCase().includes('fotocabina') || s.nombre.toLowerCase().includes('360'))
    );

    if (hasPistaLed) {
      elements.push({
        id: 'pista_led_center',
        name: 'Pista LED Interactiva',
        type: 'area',
        category: 'Pista de Baile',
        x: 240,
        y: 220,
        width: 160,
        height: 160,
        rotation: 0,
      });
    }

    if (hasPantalla) {
      elements.push({
        id: 'pantalla_gigante',
        name: 'Pantalla LED Gigante',
        type: 'element',
        category: 'Escenario',
        x: 200,
        y: 20,
        width: 240,
        height: 20,
        rotation: 0,
      });
    }

    if (hasBarra) {
      elements.push({
        id: 'barra_tragos',
        name: 'Barra de Tragos VIP',
        type: 'element',
        category: 'Barra',
        x: 40,
        y: 40,
        width: 120,
        height: 60,
        rotation: 0,
      });
    }

    if (hasFotocabina) {
      elements.push({
        id: 'cabina_fotos',
        name: 'Plataforma 360 / Fotocabina',
        type: 'element',
        category: 'Living',
        x: 500,
        y: 40,
        width: 100,
        height: 80,
        rotation: 0,
      });
    }

    return {
      salonWidth: 16,
      salonHeight: 16,
      pixelsPerMeter: 40,
      salonElements: elements,
      paletaColores: {
        primary: primaryColor,
        secondary: '#1e293b',
        accent: '#fbbf24',
      },
    };
  }, [selectedServiceIds, servicios, primaryColor]);

  const formatMoney = (val?: number) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(val);
  };

  const handleCrearPresupuesto = () => {
    // Navigate to budget builder with selected IDs pre-configured
    const ids = Array.from(selectedServiceIds).join(',');
    router.push(`/presupuestos/nuevo?servicios=${encodeURIComponent(ids)}&adultos=${adultos}&menores=${ninosYAdolescentes}`);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-lg font-bold text-slate-700">Preparando el Configurador 3D...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white select-none">
      {/* Header táctil sin jerga */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Experiencia y Diseño de Fiesta</h1>
            <p className="text-xs text-slate-400">Tocá los elementos para diseñar el salón y ver la cotización al instante</p>
          </div>
        </div>

        {/* Selector de invitados rápido táctil */}
        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300">Invitados:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdultos((prev) => Math.max(20, prev - 10))}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold flex items-center justify-center text-lg active:scale-95 transition-transform"
            >
              -
            </button>
            <span className="text-sm font-black w-14 text-center">{adultos + ninosYAdolescentes}</span>
            <button
              type="button"
              onClick={() => setAdultos((prev) => prev + 10)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold flex items-center justify-center text-lg active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace: 3D Scene + Touch Service Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Visualizador 3D (Mayor parte de la pantalla) */}
        <div className="lg:col-span-8 relative min-h-[420px] lg:min-h-full bg-slate-950 flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Badge variant="outline" className="bg-slate-900/80 border-slate-700 text-slate-300 text-xs px-3 py-1 font-bold backdrop-blur-md">
              Vista 3D Interactiva (Girá y hacé zoom con los dedos)
            </Badge>
          </div>

          <div className="flex-1 w-full h-full min-h-[420px]">
            <SalonScene decoracion={decoracion3D} />
          </div>

          {/* Barra de colores de iluminación interactiva */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-2 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 pl-2">Ambiente:</span>
            {['#e11d48', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ffffff'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setPrimaryColor(color)}
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-xl transition-all ${
                  primaryColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Panel de módulos y adicionales táctiles (Lado derecho) */}
        <div className="lg:col-span-4 bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between max-h-[85vh] lg:max-h-[calc(100vh-80px)] overflow-hidden">
          <div className="p-4 border-b border-slate-800/80">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Módulos y Efectos Visuales
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Tocá para encender o apagar en el salón</p>
          </div>

          {/* Lista de servicios scrolleable táctil */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {servicios.map((srv) => {
              const isSelected = selectedServiceIds.has(srv.id);
              const price = srv.precioVenta || srv.precioBase || srv.valorUnitarioEstimado || 0;

              return (
                <Card
                  key={srv.id}
                  onClick={() => toggleService(srv.id)}
                  className={`cursor-pointer transition-all duration-200 border rounded-2xl active:scale-[0.98] ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isSelected ? <Check className="w-5 h-5 stroke-[3]" /> : <Plus className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{srv.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{srv.categoria || 'Servicio Integral'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-300">
                        {price > 0 ? formatMoney(price) : 'Incluido'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer de precio grande en vivo y botón de confirmación */}
          <div className="p-5 bg-slate-950 border-t border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inversión Fiesta</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5">
                  {formatMoney(pricingStats?.totalFinal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Por Persona</p>
                <p className="text-lg font-black text-amber-400">
                  {formatMoney(pricingStats?.precioPorPersona)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCrearPresupuesto}
              size="lg"
              className="w-full h-14 text-base font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:opacity-95 shadow-xl shadow-amber-500/20 rounded-2xl active:scale-95 transition-all"
            >
              Continuar a Presupuesto Formal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

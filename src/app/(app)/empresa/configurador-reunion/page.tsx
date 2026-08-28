'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  Calendar,
  Layers,
  Save,
  CheckCircle2,
  DollarSign,
  Plus,
  Minus,
  PartyPopper,
  Palette,
  Eye,
  Share2,
  Phone,
  FileText,
  Loader2,
  ChevronRight,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { calculateSimulatorPricing, type SimulatorPriceStats } from '@/lib/simulator/pricing';
import type { ServicioEmpresa } from '@/types/empresa';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { DecoracionData, LayoutElement } from '@/types/fiesta';

// Carga diferida del componente Three.js 3D para evitar errores de renderizado en el servidor
const SalonScene = dynamic(
  () => import('@/components/salon-3d/SalonScene'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-xs font-semibold">Cargando salón interactivo 3D...</p>
        </div>
      </div>
    ),
  }
);

export default function ConfiguradorReunionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServicioEmpresa[]>([]);
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  /**
   * Si el catalogo no carga, hay que DECIRLO.
   *
   * Antes el error se anotaba en el registro del servidor y la pantalla se
   * dibujaba igual, vacia y sin explicacion: el que la abria veia un
   * configurador sin un solo servicio y no tenia forma de saber por que. Y es la
   * pantalla que se usa **delante del cliente**, en la reunion de cierre.
   */
  const [noCargo, setNoCargo] = useState(false);

  // Form State
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoEvento, setTipoEvento] = useState('15 Años');
  const [fechaEvento, setFechaEvento] = useState('');
  const [adultos, setAdultos] = useState<number>(100);
  const [menores, setMenores] = useState<number>(20);

  // 3D Visual Customization
  const [salonColor, setSalonColor] = useState('#d97706'); // Color de luces LED
  const [tableCount, setTableCount] = useState(10);

  // Selected Services
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [savingBudget, setSavingBudget] = useState(false);
  const [savedResult, setSavedResult] = useState<{ id: string; numero?: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [servs, conf] = await Promise.all([
          getServiciosEmpresa(),
          getArmadoRapidoConfig(),
        ]);
        setServices(servs);
        setConfig(conf);

        // Preseleccionar servicios base recomendados
        const initialSelected = new Set<string>();
        servs.forEach((s) => {
          const lower = s.nombre.toLowerCase();
          if (
            lower.includes('dj') ||
            lower.includes('discoteca') ||
            lower.includes('iluminación') ||
            lower.includes('sonido') ||
            lower.includes('salón')
          ) {
            initialSelected.add(s.id);
          }
        });
        setSelectedServiceIds(initialSelected);
      } catch (err) {
        console.error('Error cargando catálogo:', err);
        setNoCargo(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update table count automatically based on guest count (10 guests per table)
  useEffect(() => {
    const total = (Number(adultos) || 0) + (Number(menores) || 0);
    const tables = Math.max(4, Math.ceil(total / 10));
    setTableCount(tables);
  }, [adultos, menores]);

  // Generar layout 3D reactivo
  const decoracion3D: DecoracionData = useMemo(() => {
    const elements: LayoutElement[] = [
      // Pista de baile central
      {
        id: 'pista-central',
        name: 'Pista LED Central',
        category: 'pista',
        x: 300,
        y: 250,
        width: 160,
        height: 160,
        rotation: 0,
        type: 'element',
      },
      // Escenario & DJ
      {
        id: 'escenario-dj',
        name: 'Cabina DJ & Escenario',
        category: 'escenario',
        x: 300,
        y: 50,
        width: 220,
        height: 80,
        rotation: 0,
        type: 'element',
      },
      // Barra de tragos
      {
        id: 'barra-tragos',
        name: 'Barra de Tragos',
        category: 'decoracion',
        x: 60,
        y: 250,
        width: 80,
        height: 140,
        rotation: 0,
        type: 'element',
        backgroundColor: '#1e293b',
      },
    ];

    // Distribuir mesas alrededor de la pista
    const radius = 220;
    const centerX = 300;
    const centerY = 270;
    for (let i = 0; i < tableCount; i++) {
      const angle = (i / tableCount) * 2 * Math.PI;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle) * 0.85);
      elements.push({
        id: `mesa-${i + 1}`,
        name: `Mesa ${i + 1}`,
        category: 'mesa',
        x: Math.max(40, Math.min(560, x)),
        y: Math.max(90, Math.min(520, y)),
        width: 50,
        height: 50,
        rotation: 0,
        type: 'element',
        seats: 10,
      });
    }

    return {
      elements,
      primaryColor: salonColor,
      secondaryColor: '#ffffff',
      ambience: 'glam',
      pixelsPerMeter: 40,
      salonWidth: 16,
      salonHeight: 14,
    };
  }, [salonColor, tableCount]);

  // Cálculo de Precios Unificado con calculateSimulatorPricing
  const pricingStats: SimulatorPriceStats | null = useMemo(() => {
    if (!config || services.length === 0) return null;

    const selectedList = Array.from(selectedServiceIds).map((id) => ({ id }));
    return calculateSimulatorPricing({
      config,
      services,
      adultos: Number(adultos) || 0,
      ninosYAdolescentes: Number(menores) || 0,
      selectedServices: selectedList,
      eventoFecha: fechaEvento || null,
      annualAdjustmentPercentage: (config as any).annualAdjustmentPercentage || 8,
    });
  }, [config, services, selectedServiceIds, adultos, menores, fechaEvento]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveBudget = async () => {
    if (!clienteNombre.trim()) {
      toast({
        title: 'Falta el nombre del cliente',
        description: 'Por favor ingresá el nombre de la familia o cumpleañero/a.',
        variant: 'destructive',
      });
      return;
    }
    if (!pricingStats) return;

    setSavingBudget(true);
    try {
      const itemsPresupuestados = pricingStats.detallados.map((item) => ({
        idServicioCatalogo: item.id,
        nombreServicio: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        precioUnitarioPresupuesto: item.precioUnitario,
        costoTotalItem: item.costoTotal,
        categoriaServicio: item.categoria,
        subcategoria: item.subcategoria || '',
        calculationMethod: item.calculationMethod || 'fijo',
        precioBase: item.precioBase,
        precioPorPersona: item.precioPorPersona,
        invitadosPorUnidad: item.invitadosPorUnidad,
        tramosDePrecio: item.tramosDePrecio,
      }));

      const totalGuests = (Number(adultos) || 0) + (Number(menores) || 0);
      const res = await savePresupuesto({
        clienteNombre: clienteNombre.trim(),
        clienteContacto: clienteTelefono.trim(),
        eventoTipo: tipoEvento,
        eventoFecha: fechaEvento || '',
        invitadosCantidad: totalGuests,
        invitadosAdultos: Number(adultos) || 0,
        invitadosAdolescentes: Number(menores) || 0,
        invitadosNinos: 0,
        salonFiestas: 'Salón Club Uruguay / Propio',
        itemsPresupuestados,
        costoTotalEstimado: pricingStats.subtotalBruto,
        totalConDescuento: pricingStats.totalFinal,
        descuentoValor: pricingStats.descPromo,
        descuentoTipo: 'fijo',
        estado: 'Borrador',
        timestamp: new Date().toISOString(),
      });

      if (res.success && res.id) {
        setSavedResult({ id: res.id, numero: res.presupuesto?.numero });
        toast({
          title: '¡Presupuesto Formal Creado!',
          description: `Guardado como Presupuesto #${res.presupuesto?.numero || res.id}.`,
        });
      } else {
        toast({
          title: 'Error al guardar',
          description: res.error || 'No se pudo guardar el presupuesto.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error inesperado',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingBudget(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-8 space-y-4 max-w-md mx-auto">
        <div className="rounded-full bg-red-100 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Configurador Visual 3D & Reunión de Cierre</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cargando el salón interactivo tridimensional, catálogo de servicios de sonido e iluminación, y motor de cálculo de presupuestos en tiempo real para la presentación con el cliente.
        </p>
      </div>
    );
  }

  if (noCargo || services.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-8 space-y-4 max-w-md mx-auto">
        <div className="rounded-full bg-amber-100 p-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">No se pudo cargar el catálogo de servicios</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Sin el catálogo no se puede armar el presupuesto en la reunión, porque los precios
          salen de ahí y no se inventan. Probá recargar la pantalla; si sigue igual, avisale al
          equipo de AK antes de sentarte con el cliente.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Volver a intentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black uppercase text-red-700">
              Reunión de Cierre
            </span>
            <span className="text-xs text-slate-500">· Modo Presentación en Vivo</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Configurador Visual 3D & Cierre
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Diseñá el salón y ajustá los servicios en vivo junto a los padres o clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedResult ? (
            <Button
              onClick={() => router.push(`/presupuestos/${savedResult.id}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl shadow-md"
            >
              <FileText className="h-4 w-4" /> Ver Presupuesto #{savedResult.numero || ''}
            </Button>
          ) : (
            <Button
              onClick={handleSaveBudget}
              disabled={savingBudget || !pricingStats}
              className="bg-red-700 hover:bg-red-800 text-white font-black gap-2 rounded-xl shadow-md"
            >
              {savingBudget ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Generar Presupuesto Formal</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid Principal: Izquierda 3D/Visual | Derecha Controles y Precios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Vista 3D del Salón */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-950 text-white p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Salón Interactivo 3D
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  {tableCount} Mesas distribuidas · {Number(adultos) + Number(menores)} Invitados
                </CardDescription>
              </div>

              {/* Selector de color LED */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">Luces LED:</span>
                {[
                  { name: 'Dorado', hex: '#d97706' },
                  { name: 'Fucsia', hex: '#db2777' },
                  { name: 'Azul', hex: '#2563eb' },
                  { name: 'Violeta', hex: '#7c3aed' },
                  { name: 'Esmeralda', hex: '#059669' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSalonColor(col.hex)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${
                      salonColor === col.hex ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-70'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                    aria-label={`Color ${col.name}`}
                  />
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0 h-[380px] sm:h-[480px] bg-slate-950 relative">
              <SalonScene decoracion={decoracion3D} />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                💡 Arrastrá para rotar la cámara 3D · Rueda para zoom
              </div>
            </CardContent>
          </Card>

          {/* Selector de Extras / Servicios en Tarjetas Grandes */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-black text-slate-900 flex items-center justify-between">
                <span>Catálogo de Servicios AK ({selectedServiceIds.size} seleccionados)</span>
                <span className="text-xs text-slate-500 font-normal">Tocá para agregar o quitar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {services.map((serv) => {
                  const isSelected = selectedServiceIds.has(serv.id);
                  const price = serv.precioVenta || serv.precioPorPersona || serv.precioBase || 0;
                  return (
                    <button
                      key={serv.id}
                      type="button"
                      onClick={() => toggleService(serv.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-red-600 bg-red-50/70 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isSelected ? 'bg-red-700 text-white' : 'border border-slate-300 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                          <p className="font-black text-xs truncate">{serv.nombre}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{serv.categoria}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-900">
                          ${price.toLocaleString('es-UY')}
                        </p>
                        <span className="text-[9px] uppercase font-bold text-slate-400">
                          {serv.calculationMethod === 'porPersona' ? '/ pers.' : 'fijo'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Datos del Evento, Cotizador en Vivo y Cierre */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tarjeta de Datos Rápidos del Cliente */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-black text-slate-900">1. Datos de la Fiesta</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Cliente / Familia</Label>
                  <Input
                    type="text"
                    placeholder="Ej. Familia Rodríguez"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">WhatsApp</Label>
                  <Input
                    type="tel"
                    placeholder="Ej. 099 123 456"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Tipo de Evento</Label>
                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 Años">15 Años</SelectItem>
                      <SelectItem value="Boda">Boda</SelectItem>
                      <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                      <SelectItem value="Empresarial">Empresarial</SelectItem>
                      <SelectItem value="Infantil">Infantil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Fecha Prevista</Label>
                  <Input
                    type="date"
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Adultos
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={() => setAdultos((v) => Math.max(0, v - 5))}
                    >
                      -
                    </Button>
                    <span className="flex-1 text-center font-black text-sm text-slate-900">{adultos}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={() => setAdultos((v) => v + 5)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Menores
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={() => setMenores((v) => Math.max(0, v - 5))}
                    >
                      -
                    </Button>
                    <span className="flex-1 text-center font-black text-sm text-slate-900">{menores}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={() => setMenores((v) => v + 5)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Resumen Financiero en Vivo (100% Exacto) */}
          <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-50/40 via-white to-amber-50/30 shadow-lg overflow-hidden">
            <CardHeader className="p-4 border-b border-red-100 bg-white/70">
              <CardTitle className="text-sm font-black text-slate-900 flex items-center justify-between">
                <span>2. Resumen Financiero en Vivo</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  Motor Oficial AK
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {pricingStats ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Servicios ({pricingStats.detallados.length}):</span>
                    <span className="font-bold text-slate-900">
                      ${pricingStats.subtotalBruto.toLocaleString('es-UY')}
                    </span>
                  </div>

                  {pricingStats.descPromo > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Bonificación / Descuento:</span>
                      <span>-${pricingStats.descPromo.toLocaleString('es-UY')}</span>
                    </div>
                  )}

                  {pricingStats.ajusteAnual > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Proyección Ajuste Anual ({pricingStats.annualProjection.eventYear - pricingStats.annualProjection.currentYear} años):</span>
                      <span className="font-bold">+${pricingStats.ajusteAnual.toLocaleString('es-UY')}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-500">Inversión Total</p>
                      <p className="text-2xl font-black text-red-700">
                        ${pricingStats.totalFinal.toLocaleString('es-UY')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Por Invitado</p>
                      <p className="text-base font-black text-slate-900">
                        ${pricingStats.precioPorPersona.toLocaleString('es-UY')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Calculando cotización...</p>
              )}

              {/* Botón de Cierre */}
              <div className="pt-2">
                <Button
                  onClick={handleSaveBudget}
                  disabled={savingBudget || !pricingStats}
                  className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-sm shadow-md gap-2 transition"
                >
                  {savingBudget ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando Presupuesto...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Guardar como Presupuesto Formal</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

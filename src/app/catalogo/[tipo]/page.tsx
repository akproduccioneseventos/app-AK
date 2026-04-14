'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_TYPES, SERVICES } from '@/data/presentacion';
import { getContenidoPorTipo } from '@/app/presentacion-led/lib/contenido-por-tipo';
import {
  sharedServices,
  sharedWhyUs,
  sharedProcess,
  sharedPromotion,
  sharedPaymentMethods,
  sharedFAQs,
} from '@/data/event-catalogs/shared';

const TOTAL_STEPS = 9; // pasos 0-8

export default function CatalogoPorTipoPage() {
  const params = useParams();
  const router = useRouter();
  const tipoId = typeof params?.tipo === 'string' ? params.tipo : '';

  const eventoType = EVENT_TYPES.find((e) => e.id === tipoId);
  const contenido = getContenidoPorTipo(eventoType?.budgetTipo ?? tipoId);

  const [paso, setPaso] = useState(0);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Set<string>>(new Set());
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Ordenar servicios: primero los de categoriasDestacadas, luego el resto
  const serviciosOrdenados = useMemo(() => {
    const destacadas = contenido.categoriasDestacadas.map((c) => c.toLowerCase());
    const highlighted: typeof SERVICES = [];
    const rest: typeof SERVICES = [];
    SERVICES.forEach((s) => {
      const isHighlighted = destacadas.some(
        (d) => s.label.toLowerCase().includes(d) || d.includes(s.label.toLowerCase())
      );
      if (isHighlighted) highlighted.push(s);
      else rest.push(s);
    });
    return [...highlighted, ...rest];
  }, [contenido.categoriasDestacadas]);

  const toggleServicio = (id: string) => {
    setServiciosSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSiguiente = () => {
    if (paso < TOTAL_STEPS - 1) setPaso((p) => p + 1);
  };
  const handleAnterior = () => {
    if (paso > 0) setPaso((p) => p - 1);
  };

  const handleCrearPresupuesto = () => {
    const tipo = eventoType?.budgetTipo ?? tipoId;
    const serviciosIds = Array.from(serviciosSeleccionados).join(',');
    const url = `/presupuestos/nuevo/crear?tipo=${encodeURIComponent(tipo)}${serviciosIds ? `&servicios=${encodeURIComponent(serviciosIds)}` : ''}`;
    router.push(url);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola! Me interesa organizar ${eventoType?.label ?? 'un evento'} con AK Producciones. ¿Podemos hablar?`
    );
    window.open(`https://wa.me/59898355530?text=${msg}`, '_blank');
  };

  if (!eventoType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-600 font-semibold">Tipo de fiesta no encontrado.</p>
        <Link href="/catalogo">
          <Button variant="outline">← Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  const progressPercent = Math.round((paso / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/catalogo" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Catálogos
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">
          {eventoType.emoji} {eventoType.label}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>
            Paso {paso + 1} de {TOTAL_STEPS}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500 bg-gradient-to-r', contenido.colorAcento)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="min-h-[400px]">
        {paso === 0 && (
          <PasoPortada
            eventoType={eventoType}
            contenido={contenido}
            onNext={handleSiguiente}
          />
        )}
        {paso === 1 && <PasoWhyUs />}
        {paso === 2 && <PasoProceso />}
        {paso === 3 && (
          <PasoServicios
            servicios={serviciosOrdenados}
            seleccionados={serviciosSeleccionados}
            onToggle={toggleServicio}
            colorAcento={contenido.colorAcento}
            destacadas={contenido.categoriasDestacadas}
          />
        )}
        {paso === 4 && <PasoPaquetes />}
        {paso === 5 && <PasoRegalos mensajeRegalos={contenido.mensajeRegalos} />}
        {paso === 6 && <PasoPagos />}
        {paso === 7 && <PasoFAQs openFaq={openFaq} onToggleFaq={setOpenFaq} />}
        {paso === 8 && (
          <PasoResumen
            eventoType={eventoType}
            contenido={contenido}
            serviciosSeleccionados={serviciosSeleccionados}
            servicios={SERVICES}
            onCrearPresupuesto={handleCrearPresupuesto}
            onWhatsApp={handleWhatsApp}
          />
        )}
      </div>

      {/* Navegación */}
      <Separator />
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handleAnterior}
          disabled={paso === 0}
          className="flex items-center gap-2 rounded-xl font-bold"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>
        {paso < TOTAL_STEPS - 1 ? (
          <Button
            onClick={handleSiguiente}
            className={cn(
              'flex items-center gap-2 rounded-xl font-bold bg-gradient-to-r text-white',
              contenido.colorAcento
            )}
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCrearPresupuesto}
            className="flex items-center gap-2 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
          >
            Crear presupuesto <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Paso 0: Portada / Hero ──────────────────────────────────────────────────

function PasoPortada({
  eventoType,
  contenido,
  onNext,
}: {
  eventoType: (typeof EVENT_TYPES)[number];
  contenido: ReturnType<typeof getContenidoPorTipo>;
  onNext: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl p-8 flex flex-col items-center text-center gap-6 bg-gradient-to-br text-white',
        contenido.colorAcento
      )}
    >
      <span className="text-7xl">{eventoType.emoji}</span>
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{eventoType.label}</h1>
        <p className="text-lg font-bold opacity-90">{contenido.tagline}</p>
        <p className="text-sm opacity-80 font-medium">{contenido.subtitulo}</p>
      </div>
      <Button
        onClick={onNext}
        className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-bold px-8 py-3 backdrop-blur-sm transition-all"
      >
        Ver catálogo completo →
      </Button>
    </div>
  );
}

// ─── Paso 1: Por qué elegirnos ───────────────────────────────────────────────

function PasoWhyUs() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900">¿Por qué elegir AK Producciones?</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sharedWhyUs.map((item) => (
          <Card key={item.id} className="border border-slate-100 shadow-sm rounded-xl">
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 2: Nuestro proceso ─────────────────────────────────────────────────

function PasoProceso() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Cómo trabajamos</h2>
      <div className="space-y-3">
        {sharedProcess.map((step) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm">
              {step.step}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{step.icon}</span>
                <p className="font-bold text-slate-900 text-sm">{step.title}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 3: Servicios disponibles ───────────────────────────────────────────

function PasoServicios({
  servicios,
  seleccionados,
  onToggle,
  colorAcento,
  destacadas,
}: {
  servicios: typeof SERVICES;
  seleccionados: Set<string>;
  onToggle: (id: string) => void;
  colorAcento: string;
  destacadas: string[];
}) {
  const destacadasLower = destacadas.map((d) => d.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900">¿Qué servicios necesitás?</h2>
        <p className="text-xs text-slate-500 font-medium">
          Seleccioná los servicios que querés incluir. Al final podés convertirlos en un presupuesto.
        </p>
      </div>
      {seleccionados.size > 0 && (
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700 font-bold border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {servicios.map((servicio) => {
          const isSelected = seleccionados.has(servicio.id);
          const isDestacado = destacadasLower.some(
            (d) =>
              servicio.label.toLowerCase().includes(d) ||
              d.includes(servicio.label.toLowerCase())
          );
          return (
            <button
              key={servicio.id}
              type="button"
              onClick={() => onToggle(servicio.id)}
              className={cn(
                'text-left rounded-xl border-2 p-4 transition-all duration-200 w-full',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{servicio.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 text-sm">{servicio.label}</p>
                    {isDestacado && !isSelected && (
                      <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 font-bold px-1.5 py-0">
                        Destacado
                      </Badge>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {servicio.description}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {servicio.specs.slice(0, 3).map((spec) => (
                      <li key={spec} className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                        {spec}
                      </li>
                    ))}
                    {servicio.specs.length > 3 && (
                      <li className="text-[10px] text-indigo-400 font-medium">
                        +{servicio.specs.length - 3} más…
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Paso 4: Paquetes ────────────────────────────────────────────────────────

function PasoPaquetes() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Nuestros paquetes</h2>
      <div className="grid grid-cols-1 gap-4">
        {sharedServices.map((paquete) => (
          <Card
            key={paquete.id}
            className={cn(
              'border rounded-xl overflow-hidden',
              paquete.highlighted
                ? 'border-indigo-400 shadow-lg shadow-indigo-100'
                : 'border-slate-100 shadow-sm'
            )}
          >
            <CardHeader className={cn('pb-3', paquete.highlighted ? 'bg-indigo-50' : 'bg-slate-50')}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black text-slate-900">{paquete.title}</CardTitle>
                {paquete.highlighted && (
                  <Badge className="bg-indigo-600 text-white border-0 text-[10px] font-black uppercase tracking-wider">
                    Más elegido
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{paquete.description}</p>
            </CardHeader>
            <CardContent className="pt-3 pb-4">
              <ul className="space-y-1.5">
                {paquete.included.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-bold text-indigo-600">{paquete.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 5: Regalos incluidos ───────────────────────────────────────────────

function PasoRegalos({ mensajeRegalos }: { mensajeRegalos: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900">{sharedPromotion.sectionTitle}</h2>
        <p className="text-sm text-slate-600 font-medium">{mensajeRegalos}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sharedPromotion.gifts.map((gift) => (
          <Card key={gift.id} className="border border-amber-100 shadow-sm rounded-xl bg-amber-50/40">
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{gift.icon}</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">{gift.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{gift.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 6: Formas de pago ──────────────────────────────────────────────────

function PasoPagos() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Formas de pago</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sharedPaymentMethods.map((method) => (
          <Card key={method.id} className="border border-slate-100 shadow-sm rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl shrink-0">{method.icon}</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">{method.name}</p>
                <p className="text-xs text-slate-500">{method.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 7: Preguntas frecuentes ────────────────────────────────────────────

function PasoFAQs({
  openFaq,
  onToggleFaq,
}: {
  openFaq: string | null;
  onToggleFaq: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Preguntas frecuentes</h2>
      <div className="space-y-2">
        {sharedFAQs.map((faq) => {
          const isOpen = openFaq === faq.id;
          return (
            <div key={faq.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                onClick={() => onToggleFaq(isOpen ? null : faq.id)}
              >
                <p className="font-bold text-slate-900 text-sm">{faq.question}</p>
                <span className="text-slate-400 shrink-0 text-lg leading-none">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Paso 8: Resumen y cierre ─────────────────────────────────────────────────

function PasoResumen({
  eventoType,
  contenido,
  serviciosSeleccionados,
  servicios,
  onCrearPresupuesto,
  onWhatsApp,
}: {
  eventoType: (typeof EVENT_TYPES)[number];
  contenido: ReturnType<typeof getContenidoPorTipo>;
  serviciosSeleccionados: Set<string>;
  servicios: typeof SERVICES;
  onCrearPresupuesto: () => void;
  onWhatsApp: () => void;
}) {
  const seleccionadosList = servicios.filter((s) => serviciosSeleccionados.has(s.id));

  return (
    <div className="space-y-6">
      {/* Mensaje de cierre */}
      <div
        className={cn(
          'rounded-2xl p-6 text-center bg-gradient-to-br text-white space-y-2',
          contenido.colorAcento
        )}
      >
        <span className="text-4xl">{eventoType.emoji}</span>
        <p className="text-lg font-black leading-snug">{contenido.mensajeCierre}</p>
      </div>

      {/* Resumen de servicios seleccionados */}
      <div className="space-y-3">
        <h3 className="font-black text-slate-900 text-base">
          {seleccionadosList.length > 0
            ? `Servicios seleccionados (${seleccionadosList.length})`
            : 'No seleccionaste servicios aún'}
        </h3>
        {seleccionadosList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {seleccionadosList.map((s) => (
              <Badge
                key={s.id}
                className="bg-indigo-100 text-indigo-800 border-0 font-bold text-xs px-3 py-1.5 rounded-lg"
              >
                {s.emoji} {s.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Podés volver al paso de servicios para elegir o continuar igual para armar el presupuesto desde cero.
          </p>
        )}
      </div>

      <Separator />

      {/* CTAs */}
      <div className="space-y-3">
        <Button
          onClick={onCrearPresupuesto}
          className="w-full rounded-xl font-black text-sm h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
        >
          Crear presupuesto manual →
        </Button>
        <Button
          variant="outline"
          onClick={onWhatsApp}
          className="w-full rounded-xl font-bold text-sm h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 justify-center"
        >
          <MessageCircle className="w-4 h-4" />
          Contactar por WhatsApp
        </Button>
      </div>
    </div>
  );
}

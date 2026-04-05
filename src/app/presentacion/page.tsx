'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Wand2, X, ChevronRight } from 'lucide-react';
import { EVENT_TYPES, SERVICES, type EventType, type Service } from '@/data/presentacion';
import { CompanyLogo } from '@/components/company-logo';

// ── Constants ─────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = '59898355530';
const WHATSAPP_MESSAGE =
  '👋 Hola AK Producciones! Me interesa conocer sus servicios para organizar un evento.';
const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

type Screen = 'event-types' | 'services' | 'service-detail';

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PresentacionPage() {
  const [screen, setScreen] = useState<Screen>('event-types');
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleEventTypeSelect = useCallback((et: EventType) => {
    setSelectedEventType(et);
    setScreen('services');
  }, []);

  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedService(service);
    setScreen('service-detail');
  }, []);

  const handleBackToEventTypes = useCallback(() => {
    setSelectedEventType(null);
    setSelectedService(null);
    setScreen('event-types');
  }, []);

  const handleBackToServices = useCallback(() => {
    setSelectedService(null);
    setScreen('services');
  }, []);

  const budgetHref = selectedEventType
    ? `/presupuestos/nuevo/crear?tipo=${encodeURIComponent(selectedEventType.budgetTipo)}`
    : '/presupuestos/nuevo/crear';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-4">
          {screen !== 'event-types' && (
            <button
              onClick={screen === 'service-detail' ? handleBackToServices : handleBackToEventTypes}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all duration-200"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <CompanyLogo size="sm" />
            <div className="hidden sm:block">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white leading-none">
                AK Producciones
              </p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                Salto · Uruguay
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
          <button onClick={handleBackToEventTypes} className="hover:text-white transition-colors">
            Tipos
          </button>
          {selectedEventType && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button onClick={handleBackToServices} className="hover:text-white transition-colors">
                {selectedEventType.label}
              </button>
            </>
          )}
          {selectedService && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">{selectedService.label}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/simulador-de-presupuesto" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-violet-700 hover:bg-violet-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-200 shadow-lg">
              <Wand2 className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Simulador</span>
            </button>
          </Link>
          <Link href={budgetHref}>
            <button className="flex items-center gap-2 px-3 sm:px-5 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-200 shadow-lg">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Presupuesto</span>
            </button>
          </Link>
        </div>
      </header>

      {/* ── Screens ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        {screen === 'event-types' && (
          <EventTypesScreen onSelect={handleEventTypeSelect} />
        )}
        {screen === 'services' && selectedEventType && (
          <ServicesScreen
            eventType={selectedEventType}
            onSelect={handleServiceSelect}
            budgetHref={budgetHref}
          />
        )}
        {screen === 'service-detail' && selectedService && selectedEventType && (
          <ServiceDetailScreen
            service={selectedService}
            eventType={selectedEventType}
            budgetHref={budgetHref}
            onClose={handleBackToServices}
          />
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-4 px-6 border-t border-slate-800 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          © {new Date().getFullYear()} AK Producciones · Salto, Uruguay
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-green-400 transition-colors"
        >
          📲 098 355 530
        </a>
      </footer>
    </div>
  );
}

// ── Screen 1: Event Types ──────────────────────────────────────────────────────
function EventTypesScreen({ onSelect }: { onSelect: (et: EventType) => void }) {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:py-16">
      <div className="w-full max-w-5xl space-y-10">
        <div className="text-center space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">
            Modo Presentación
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none">
            ¿Qué tipo de evento{' '}
            <span className="text-primary italic">organizamos?</span>
          </h1>
          <p className="text-slate-400 font-semibold text-base sm:text-lg">
            Seleccioná el tipo de fiesta para ver los servicios disponibles.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {EVENT_TYPES.map((et) => (
            <button
              key={et.id}
              onClick={() => onSelect(et)}
              className={`group relative flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-[2rem] ${et.color} hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-black/40 cursor-pointer min-h-[160px] sm:min-h-[200px]`}
            >
              <span
                className="text-5xl sm:text-7xl drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
                role="img"
                aria-label={et.label}
              >
                {et.emoji}
              </span>
              <span className={`text-lg sm:text-2xl font-black uppercase tracking-wide ${et.textColor}`}>
                {et.label}
              </span>
              <div className="absolute inset-0 rounded-[2rem] border-2 border-white/10 group-hover:border-white/30 transition-colors duration-300 pointer-events-none" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Screen 2: Services ─────────────────────────────────────────────────────────
function ServicesScreen({
  eventType,
  onSelect,
  budgetHref,
}: {
  eventType: EventType;
  onSelect: (s: Service) => void;
  budgetHref: string;
}) {
  return (
    <section className="flex-1 flex flex-col items-center px-6 py-10 sm:py-14">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl">{eventType.emoji}</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                  Nuestros Servicios
                </p>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-white">
                  {eventType.label}
                </h2>
              </div>
            </div>
          </div>
          <Link href={budgetHref}>
            <button className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-xl">
              <FileText className="w-5 h-5 shrink-0" />
              Abrir Presupuesto
            </button>
          </Link>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="group flex flex-col items-center gap-4 p-6 sm:p-8 rounded-[1.75rem] bg-slate-900 border border-slate-800 hover:border-primary/50 hover:bg-slate-800 active:scale-95 transition-all duration-300 shadow-xl cursor-pointer text-center min-h-[150px] sm:min-h-[180px]"
            >
              <span
                className="text-4xl sm:text-5xl drop-shadow group-hover:scale-110 transition-transform duration-300"
                role="img"
                aria-label={service.label}
              >
                {service.emoji}
              </span>
              <span className="text-base sm:text-xl font-black text-white uppercase tracking-wide leading-tight">
                {service.label}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Ver detalles →
              </span>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href={budgetHref}>
            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-2xl">
              <FileText className="w-5 h-5 shrink-0" />
              Armar Presupuesto Ahora
            </button>
          </Link>
          <Link href="/simulador-de-presupuesto" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-violet-700 hover:bg-violet-600 text-white font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-xl">
              <Wand2 className="w-5 h-5 shrink-0" />
              Simulador de Presupuesto
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Screen 3: Service Detail ───────────────────────────────────────────────────
function ServiceDetailScreen({
  service,
  eventType,
  budgetHref,
  onClose,
}: {
  service: Service;
  eventType: EventType;
  budgetHref: string;
  onClose: () => void;
}) {
  return (
    <section className="flex-1 flex flex-col items-center px-6 py-10 sm:py-14">
      <div className="w-full max-w-5xl space-y-8">
        {/* Service Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <span
              className="text-6xl sm:text-8xl drop-shadow-2xl shrink-0"
              role="img"
              aria-label={service.label}
            >
              {service.emoji}
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                {eventType.emoji} {eventType.label} · Servicio
              </p>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-white leading-none">
                {service.label}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-lg sm:text-2xl text-slate-300 font-medium leading-relaxed max-w-3xl">
          {service.description}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Specs */}
          <div className="bg-slate-900 border border-slate-800 rounded-[1.75rem] p-7 sm:p-10 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">
              ✅ Qué incluye
            </h3>
            <ul className="space-y-4">
              {service.specs.map((spec, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="text-base sm:text-lg text-slate-200 font-semibold leading-snug">
                    {spec}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Links & CTAs */}
          <div className="flex flex-col gap-5">
            {/* Canva Portfolio */}
            {service.canvaLink && !service.canvaLink.includes('CANVA_PLACEHOLDER') && (
              <a
                href={service.canvaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-5 p-6 sm:p-8 rounded-[1.75rem] bg-gradient-to-br from-violet-700 to-purple-900 border border-violet-600/40 hover:border-violet-400/60 transition-all duration-300 shadow-xl"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">
                    Portafolio
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-white">Ver en Canva</p>
                  <p className="text-sm text-violet-200/70 font-medium mt-1">
                    Galería de trabajos realizados
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-violet-300 shrink-0" />
              </a>
            )}

            {/* Drive Backup */}
            {service.driveLink && !service.driveLink.includes('DRIVE_PLACEHOLDER') && (
              <a
                href={service.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-5 p-6 sm:p-8 rounded-[1.75rem] bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-600/40 hover:border-blue-400/60 transition-all duration-300 shadow-xl"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">📁</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                    Galería
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-white">Ver en Drive</p>
                  <p className="text-sm text-blue-200/70 font-medium mt-1">
                    Fotos de eventos anteriores
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-blue-300 shrink-0" />
              </a>
            )}

            {/* Budget CTA */}
            <Link href={budgetHref} className="block">
              <div className="group flex items-center gap-5 p-6 sm:p-8 rounded-[1.75rem] bg-primary hover:bg-primary/90 transition-all duration-300 shadow-2xl cursor-pointer">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">
                    Cotizar ahora
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-white">Abrir Presupuesto</p>
                  <p className="text-sm text-white/70 font-medium mt-1">
                    {eventType.label} seleccionado automáticamente
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/60 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </Link>

            {/* Simulator CTA */}
            <Link href="/simulador-de-presupuesto" target="_blank" rel="noopener noreferrer" className="block">
              <div className="group flex items-center gap-5 p-5 sm:p-6 rounded-[1.75rem] bg-slate-900 border border-slate-700 hover:border-violet-500/50 hover:bg-slate-800 transition-all duration-300 shadow-xl cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-violet-700/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Wand2 className="w-6 h-6 sm:w-7 sm:h-7 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-400">
                    Estimación rápida
                  </p>
                  <p className="text-lg sm:text-xl font-black text-white">Simulador de Presupuesto</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

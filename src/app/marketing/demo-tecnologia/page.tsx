"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Globe2,
  MonitorPlay,
  QrCode,
  RotateCcw,
  Smartphone,
  Users,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createDemoFiesta } from '@/app/actions/fiesta-actual';

const salesScript = [
  'Primero mostramos que AK organiza la fiesta completa: salon, servicios, equipo y control.',
  'Despues mostramos la tecnologia como tranquilidad: todo esta conectado y visible.',
  'Luego abrimos la demo LED o el portal para que la familia lo vea como experiencia real.',
  'Cerramos con simulador o WhatsApp, sin crear una fiesta falsa en planificacion.',
];

const proofCards = [
  { label: 'Antes', copy: 'La familia entiende paquetes, presupuesto, servicios y pasos sin perderse.' },
  { label: 'Durante', copy: 'Los invitados participan con QR, fotos, muro, pantalla y entretenimiento.' },
  { label: 'Despues', copy: 'AK entrega recuerdos, galeria, contenido para redes y una experiencia memorable.' },
];

export default function MarketingDemoTecnologiaPage() {
  const [demoFiestaId, setDemoFiestaId] = useState<string | null>(null);
  const [loadingKind, setLoadingKind] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ak_demo_fiesta_id');
    if (stored) {
      setDemoFiestaId(stored);
    }
  }, []);

  const handleCreateDemo = async (kind: 'xv' | 'boda' | 'tecnologia-total') => {
    setLoadingKind(kind);
    try {
      const res = await createDemoFiesta(kind);
      if (res.success && res.newFiestaId) {
        setDemoFiestaId(res.newFiestaId);
        localStorage.setItem('ak_demo_fiesta_id', res.newFiestaId);
      } else {
        alert('Error al crear la demo: ' + res.error);
      }
    } catch (e: any) {
      alert('Error de red/servidor: ' + e.message);
    } finally {
      setLoadingKind(null);
    }
  };

  const handleClearDemo = () => {
    setDemoFiestaId(null);
    localStorage.removeItem('ak_demo_fiesta_id');
  };

  const demoLayers = [
    {
      title: 'Portal del cliente',
      detail: 'Presupuesto, pagos, servicios, reuniones y avances en una vista clara para la familia.',
      icon: Users,
      href: demoFiestaId ? `/portal-cliente/${demoFiestaId}` : '/fiestas/nueva/portal-cliente',
      tone: 'text-blue-400 bg-blue-400/10 group-hover:bg-blue-400/20 group-hover:text-blue-300',
    },
    {
      title: 'Invitados y QR',
      detail: 'Invitación web, RSVP, mesa, check-in y acceso móvil para participar sin papeles.',
      icon: QrCode,
      href: demoFiestaId ? `/invitacion/${demoFiestaId}` : '/fiestas/nueva/modulo-invitado',
      tone: 'text-emerald-400 bg-emerald-400/10 group-hover:bg-emerald-400/20 group-hover:text-emerald-300',
    },
    {
      title: 'Pantalla LED',
      detail: 'Muro social, mensajes, fotos, música y momentos de fiesta listos para mostrar en vivo.',
      icon: MonitorPlay,
      href: demoFiestaId ? `/evento/muro-en-vivo/${demoFiestaId}` : '/presentacion-led/portafolio',
      tone: 'text-indigo-400 bg-indigo-400/10 group-hover:bg-indigo-400/20 group-hover:text-indigo-300',
    },
    {
      title: 'Entretenimiento',
      detail: 'Fotocabina, plataforma 360, tótems, espejo y futuras experiencias AK conectadas a galería.',
      icon: Camera,
      href: demoFiestaId ? `/evento/plataforma-360/${demoFiestaId}` : '/fiestas/nueva/entretenimiento',
      tone: 'text-pink-400 bg-pink-400/10 group-hover:bg-pink-400/20 group-hover:text-pink-300',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-20 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <Link href="/marketing" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver a Marketing
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            Demo Interactiva
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl text-white mb-6">
            Demostración de Tecnología AK
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Presenta la tecnología de AK como una experiencia completa. Selecciona un escenario para generar datos en tiempo real y mostrar a los clientes cómo funciona el ecosistema.
          </p>
        </div>

        {/* Control Panel */}
        <div className="rounded-[2rem] bg-slate-900 border border-slate-800 p-6 sm:p-10 mb-14 shadow-2xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Escenario de Prueba
              </h2>
              <p className="text-sm text-slate-400">Selecciona el tipo de evento a simular.</p>
            </div>
            {demoFiestaId && (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado
                  </span>
                  <span className="text-white font-mono text-xs opacity-70 mt-1">{demoFiestaId}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <button
                  onClick={handleClearDemo}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                  title="Desconectar demo"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {!demoFiestaId ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => handleCreateDemo('xv')}
                disabled={loadingKind !== null}
                className="flex items-center justify-center py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white font-bold transition disabled:opacity-50"
              >
                {loadingKind === 'xv' ? 'Creando...' : 'XV Años'}
              </button>
              <button
                onClick={() => handleCreateDemo('boda')}
                disabled={loadingKind !== null}
                className="flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition disabled:opacity-50"
              >
                {loadingKind === 'boda' ? 'Creando...' : 'Boda'}
              </button>
              <button
                onClick={() => handleCreateDemo('tecnologia-total')}
                disabled={loadingKind !== null}
                className="flex items-center justify-center py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white font-bold transition disabled:opacity-50"
              >
                {loadingKind === 'tecnologia-total' ? 'Creando...' : 'Tecnología Total'}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href={`/evento/muro-en-vivo/${demoFiestaId}`}
                className="flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition"
              >
                <MonitorPlay className="h-5 w-5" />
                Ver Pantalla LED
              </Link>
              <Link
                href="/landing"
                className="flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white font-bold transition"
              >
                <Globe2 className="h-5 w-5" />
                Ver Web Pública
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-xl font-bold text-white mb-6">Módulos de la Experiencia</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {demoLayers.map(layer => {
              const Icon = layer.icon;
              return (
                <Link key={layer.title} href={layer.href} className="group block bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:bg-slate-800 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-2xl transition-colors', layer.tone)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1.5">{layer.title}</h4>
                      <p className="text-slate-400 leading-relaxed text-sm">{layer.detail}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Guion y Argumentos */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Guion */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Guion Comercial
            </h3>
            <ul className="space-y-6">
              {salesScript.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300 mt-0.5">{i + 1}</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Propuesta */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
            <h3 className="text-lg font-bold text-white mb-6">La Percepción del Cliente</h3>
            <div className="space-y-6">
              {proofCards.map((card) => (
                <div key={card.label} className="border-l-2 border-indigo-500/50 pl-5 py-1">
                  <h4 className="text-white font-bold mb-1.5 text-sm uppercase tracking-wider">{card.label}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

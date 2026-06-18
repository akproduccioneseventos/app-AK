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
      tone: 'border-blue-100 bg-blue-50 text-blue-700',
    },
    {
      title: 'Invitados y QR',
      detail: 'Invitacion web, RSVP, mesa, check-in y acceso movil para participar sin papeles.',
      icon: QrCode,
      href: demoFiestaId ? `/invitacion/${demoFiestaId}` : '/fiestas/nueva/modulo-invitado',
      tone: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Pantalla LED',
      detail: 'Muro social, mensajes, fotos, musica y momentos de fiesta listos para mostrar en vivo.',
      icon: MonitorPlay,
      href: demoFiestaId ? `/evento/muro-en-vivo/${demoFiestaId}` : '/presentacion-led/portafolio',
      tone: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    },
    {
      title: 'Entretenimiento',
      detail: 'Fotocabina, plataforma 360, totems, espejo y futuras experiencias AK conectadas a galeria.',
      icon: Camera,
      href: demoFiestaId ? `/evento/plataforma-360/${demoFiestaId}` : '/fiestas/nueva/entretenimiento',
      tone: 'border-pink-100 bg-pink-50 text-pink-700',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: "url('/media/catalogo-servicios/salon-discoteca-ak-01.jpeg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.84)_55%,rgba(15,23,42,0.62)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-20">
          <div className="space-y-7">
            <Link href="/marketing" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/80 hover:bg-white/15">
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              Marketing
            </Link>
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-blue-200">Demo interactiva en tiempo real</p>
              <h1 className="max-w-4xl text-4xl font-black leading-none sm:text-6xl lg:text-7xl">
                La tecnologia AK se vende como una experiencia completa
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-white/70">
                Esta pantalla sirve para mostrarle a una familia como se veria el portal, la pantalla LED,
                los QR, el muro social y los entretenimientos con un solo clic y de forma interactiva.
              </p>
            </div>

            {/* Panel de Control de Demo (Glassmorphism) */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    Panel de Control de Demo
                  </h3>
                  <p className="text-xs text-white/50">Crea un evento demo en Firestore para activar todos los enlaces interactivos</p>
                </div>
                {demoFiestaId && (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Demo Conectada
                  </span>
                )}
              </div>

              {demoFiestaId ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Demo Activa</p>
                        <p className="text-base font-black text-blue-300 mt-0.5">
                          {demoFiestaId.includes('xv') ? 'XV Años Martina' : demoFiestaId.includes('boda') ? 'Boda Sofía y Mateo' : 'Tecnología Total'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">ID de Evento</p>
                        <p className="text-xs font-mono text-white/60 mt-1 break-all">{demoFiestaId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleClearDemo()}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-red-400 transition-all hover:scale-[1.02]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Desconectar Demo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-white/70">Selecciona una fiesta demo para generar datos reales en vivo:</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      onClick={() => handleCreateDemo('xv')}
                      disabled={loadingKind !== null}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 font-black uppercase tracking-widest text-slate-950 text-xs shadow-2xl transition hover:-translate-y-0.5 disabled:opacity-50",
                        loadingKind === 'xv' && "animate-pulse"
                      )}
                    >
                      {loadingKind === 'xv' ? 'Creando XV...' : 'Generar XV Martina'}
                    </button>
                    <button
                      onClick={() => handleCreateDemo('boda')}
                      disabled={loadingKind !== null}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 px-4 font-black uppercase tracking-widest text-white text-xs shadow-2xl transition hover:-translate-y-0.5 disabled:opacity-50",
                        loadingKind === 'boda' && "animate-pulse"
                      )}
                    >
                      {loadingKind === 'boda' ? 'Creando Boda...' : 'Generar Boda Sofía'}
                    </button>
                    <button
                      onClick={() => handleCreateDemo('tecnologia-total')}
                      disabled={loadingKind !== null}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 px-4 font-black uppercase tracking-widest text-white text-xs backdrop-blur transition hover:-translate-y-0.5 disabled:opacity-50",
                        loadingKind === 'tecnologia-total' && "animate-pulse"
                      )}
                    >
                      {loadingKind === 'tecnologia-total' ? 'Creando Tecno...' : 'Generar Tecno Total'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={demoFiestaId ? `/evento/muro-en-vivo/${demoFiestaId}` : '/presentacion-led/portafolio'}
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-white px-6 font-black uppercase tracking-widest text-slate-950 shadow-2xl transition hover:-translate-y-0.5"
              >
                <MonitorPlay className="h-5 w-5" />
                {demoFiestaId ? 'Abrir Muro en Vivo' : 'Abrir demo LED'}
              </Link>
              <Link href="/landing" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 font-black uppercase tracking-widest text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                <Globe2 className="h-5 w-5" />
                Ver web publica
              </Link>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-[.72fr_1fr]">
              <div className="rounded-[1.75rem] bg-slate-950/75 p-4">
                <div className="mx-auto max-w-[220px] rounded-[2rem] border border-white/15 bg-slate-900 p-3">
                  <div className="aspect-[9/16] rounded-[1.5rem] bg-gradient-to-b from-slate-800 via-indigo-950 to-slate-950 p-4">
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                        <span>Portal AK</span>
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-white p-3 text-slate-950">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fiesta conectada</p>
                          <p className="mt-1 text-2xl font-black">Todo en un link</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['RSVP', 'Pagos', 'Fotos', 'QR'].map((item) => (
                            <div key={item} className="rounded-xl bg-white/10 p-2 text-center text-[10px] font-black uppercase tracking-widest text-white/70">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {demoLayers.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <Link key={layer.title} href={layer.href} className="group block rounded-2xl bg-white p-4 text-slate-950 transition hover:-translate-y-0.5">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-xl border p-3', layer.tone)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-black">{layer.title}</h2>
                          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{layer.detail}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-800" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Guion comercial</p>
          <div className="mt-5 space-y-3">
            {salesScript.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-slate-950">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">{index + 1}</span>
                <p className="text-sm font-bold leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {proofCards.map((card) => (
            <div key={card.label} className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950">
              <CheckCircle2 className="mb-4 h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-black">{card.label}</h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">{card.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-2xl lg:grid-cols-[.8fr_1.2fr]">
          <div
            className="min-h-[280px] bg-cover bg-center"
            style={{ backgroundImage: "url('/media/catalogo-servicios/photobooth-vogue-01.jpeg')" }}
          />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Entretenimiento ampliado</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">La demo tambien muestra lo que AK puede inventar y ampliar</h2>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500">
              Totems, plataforma 360, fotocabina, Bogue, espejo magico y nuevas experiencias pueden presentarse
              como productos de tecnologia AK conectados al portal, a la pantalla y al contenido post-fiesta.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Totems', 'Fotocabina', '360', 'Bogue', 'Espejo', 'Invento AK'].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600">
                  {item}
                </span>
              ))}
            </div>
            <Link
              href={demoFiestaId ? `/evento/plataforma-360/${demoFiestaId}` : '/fiestas/nueva/entretenimiento'}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
            >
              Ver modulo de entretenimiento
              <RotateCcw className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

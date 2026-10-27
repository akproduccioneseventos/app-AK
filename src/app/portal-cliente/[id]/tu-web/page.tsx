'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Check, Loader2, Palette, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getFiestaForPortalSession,
  initializePortalSession,
} from '@/app/actions/fiesta/portal.actions';
import { elegirPropuestaDeWeb } from '@/app/actions/fiesta/armar-web-con-ia.actions';
import type { FiestaEnPlanificacion, PropuestaDeWeb } from '@/types/fiesta';

const SESSION_KEY_PREFIX = 'portal_auth_';

export default function TuWebPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [propuestas, setPropuestas] = useState<PropuestaDeWeb[]>([]);
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      let data = await getFiestaForPortalSession(fiestaId);
      if (!data) {
        const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId) : null;
        if (savedKey) {
          const initRes = await initializePortalSession(fiestaId, savedKey);
          if (initRes.success) {
            data = await getFiestaForPortalSession(fiestaId);
          }
        }
      }

      if (!data) {
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }

      setFiesta(data);
      setPropuestas(data.propuestasDeWeb || []);
      setElegidaId(data.propuestaDeWebElegida || null);
      setUnauthorized(false);
    } catch (err) {
      console.error('Error al cargar datos de la web en el portal:', err);
      setUnauthorized(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleElegir = async (propuestaId: string) => {
    if (!fiestaId || submittingId) return;
    setSubmittingId(propuestaId);

    try {
      const res = await elegirPropuestaDeWeb(fiestaId, propuestaId);
      if (res && res.success) {
        setElegidaId(propuestaId);
        toast({
          title: '¡Diseño elegido!',
          description: '¡Hermosa elección! Tu web ya quedó configurada y le avisamos al equipo.',
        });
      } else {
        toast({
          title: 'Error al elegir la propuesta',
          description: res?.error || 'No pudimos guardar tu elección. Reintentá en unos instantes.',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar tu elección.';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Smartphone className="w-12 h-12 text-rose-400" />
        <h1 className="text-xl font-bold">Sesión no disponible</h1>
        <p className="text-sm text-slate-400 max-w-sm">
          No pudimos verificar tu sesión en el portal. Por favor ingresá nuevamente desde el enlace principal.
        </p>
        <Button asChild variant="outline" className="text-slate-900 border-slate-700 bg-white hover:bg-slate-100">
          <Link href={`/portal-cliente/${fiestaId}`}>Volver al Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/portal-cliente/${fiestaId}`}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Volver al portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Tu web
              </h1>
              <p className="text-xs text-slate-400">Elegí la versión que más te guste para tu fiesta</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2 pt-2">
          <p className="text-xs uppercase tracking-widest font-black text-pink-400">Diseños Exclusivos</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tres versiones para tu gran noche
          </h2>
          <p className="text-sm text-slate-400">
            Deslizá para ver las 3 propuestas con distintas plantillas, combinaciones de colores y tonos. Tocá el botón de la que más te identifique.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
            <p className="text-sm text-slate-400">Cargando propuestas de diseño...</p>
          </div>
        ) : propuestas.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <Sparkles className="w-10 h-10 text-pink-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Propuestas en preparación</h3>
            <p className="text-sm text-slate-400">
              Todavía no se generaron las 3 propuestas para tu fiesta. ¡Muy pronto las vas a poder ver y elegir desde acá!
            </p>
            <Button asChild variant="outline" className="rounded-xl border-slate-700 text-slate-900 bg-white hover:bg-slate-100">
              <Link href={`/portal-cliente/${fiestaId}`}>Volver al menú principal</Link>
            </Button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory justify-start md:justify-center items-start custom-scrollbar">
            {propuestas.map((propuesta, idx) => {
              const data = propuesta.invitacionDigital;
              const paleta = data.cabecera?.paletaColores || { primary: '#ec4899', secondary: '#2d3748', accent: '#f7fafc' };
              const esElegida = elegidaId === propuesta.id;
              const isSubmittingThis = submittingId === propuesta.id;

              const tonoLabel =
                propuesta.tono === 'clasico' ? 'Tono Clásico' :
                propuesta.tono === 'moderno' ? 'Tono Moderno' :
                propuesta.tono === 'divertido' ? 'Tono Divertido' :
                `Opción ${idx + 1}`;

              const paletaLabel =
                propuesta.paletaTipo === 'analoga' ? 'Armonía Análoga' :
                propuesta.paletaTipo === 'contraste' ? 'Alto Contraste' :
                propuesta.paletaTipo === 'suave' ? 'Tonos Suaves' :
                'Paleta Personalizada';

              return (
                <div
                  key={propuesta.id}
                  className={`w-[300px] sm:w-[330px] flex-shrink-0 snap-center rounded-[2.5rem] border-[6px] ${
                    esElegida
                      ? 'border-pink-500 shadow-2xl shadow-pink-500/20 ring-4 ring-pink-500/30'
                      : 'border-slate-800 shadow-xl'
                  } bg-slate-900 overflow-hidden flex flex-col transition-all duration-300`}
                >
                  {/* Notch superior simulando celular */}
                  <div className="pt-2 pb-1 bg-slate-950 flex justify-center">
                    <div className="w-24 h-4 bg-slate-800 rounded-full" />
                  </div>

                  {/* Badges de estilo */}
                  <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-pink-300 border-pink-500/40 bg-pink-500/10">
                      {tonoLabel}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-300 border-slate-700 bg-slate-800/50">
                      {data.plantilla}
                    </Badge>
                  </div>

                  {/* Vista previa interna simulada del teléfono */}
                  <div
                    className="p-5 flex-1 flex flex-col justify-between space-y-4 min-h-[360px] text-center"
                    style={{
                      background: `linear-gradient(180deg, ${paleta.secondary} 0%, #0f172a 100%)`,
                    }}
                  >
                    {/* Indicador de paleta */}
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border border-white/30 shadow-sm"
                        style={{ backgroundColor: paleta.primary }}
                        title="Color Primario"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-white/30 shadow-sm"
                        style={{ backgroundColor: paleta.secondary }}
                        title="Color Secundario"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-white/30 shadow-sm"
                        style={{ backgroundColor: paleta.accent }}
                        title="Color de Acento"
                      />
                      <span className="text-[10px] text-slate-300 font-medium ml-1.5">{paletaLabel}</span>
                    </div>

                    {/* Cabecera / Protagonista */}
                    <div className="space-y-1.5 py-4">
                      <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: paleta.primary }}>
                        {data.cabecera?.subtitulo?.text || 'Mis 15 Años'}
                      </p>
                      <h3
                        className="text-3xl font-black tracking-tight drop-shadow-md"
                        style={{ color: '#ffffff' }}
                      >
                        {data.cabecera?.protagonista1 || 'Sofía'}
                      </h3>
                      {data.cabecera?.protagonista2 && (
                        <p className="text-sm text-slate-300">& {data.cabecera.protagonista2}</p>
                      )}
                    </div>

                    {/* Mensaje de bienvenida según tono */}
                    <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-left space-y-2">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: paleta.primary }} />
                        {data.bienvenida?.titulo?.text || '¡Te espero!'}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {data.bienvenida?.texto?.text || 'Una noche pensada para compartir momentos inolvidables juntos.'}
                      </p>
                    </div>

                    {/* Despedida */}
                    <div className="text-center pt-2">
                      <p
                        className="text-lg font-bold italic"
                        style={{ color: paleta.primary }}
                      >
                        {data.despedida?.texto?.text || '¡Te esperamos!'}
                      </p>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800">
                    {esElegida ? (
                      <Button
                        disabled
                        className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-bold gap-2 opacity-100 cursor-default shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        ¡Elegida!
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleElegir(propuesta.id)}
                        disabled={submittingId !== null}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black uppercase text-xs tracking-wider gap-2 shadow-lg transition-transform active:scale-95"
                      >
                        {isSubmittingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>¡Quiero esta!</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

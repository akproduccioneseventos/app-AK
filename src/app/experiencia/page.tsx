'use client';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Camera,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Calculator,
  ShieldCheck,
  Smartphone,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicFooter } from '@/components/public-footer';

const WHATSAPP_URL = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=Hola%20AK%2C%20estuve%20viendo%20la%20experiencia%20interactiva%20y%20quiero%20hacerles%20una%20consulta`;

interface PasoInfo {
  numero: number;
  titulo: string;
  subtitulo: string;
  icono: React.ElementType;
}

const PASOS: PasoInfo[] = [
  {
    numero: 1,
    titulo: 'La invitación digital',
    subtitulo: 'Tus invitados reciben una tarjeta interactiva en su celular con cuenta regresiva, mapa y detalles.',
    icono: Mail,
  },
  {
    numero: 2,
    titulo: 'Confirmación de asistencia',
    subtitulo: 'Cada invitado confirma con un toque si asiste, cuántos van y si necesitan menú especial celíaco o vegetariano.',
    icono: CheckCircle2,
  },
  {
    numero: 3,
    titulo: 'Portal del invitado',
    subtitulo: 'Saben exactamente qué mesa les toca, cómo llegar y qué platos van a degustar.',
    icono: Users,
  },
  {
    numero: 4,
    titulo: 'Portal del cliente',
    subtitulo: 'Tu centro de control para coordinar cuotas con fechas claras, proveedores y armado de salón.',
    icono: LayoutDashboard,
  },
  {
    numero: 5,
    titulo: 'Entretenimiento interactivo',
    subtitulo: 'Fotocabina digital, mensajes en vivo y dinámicas divertidas durante la fiesta.',
    icono: Camera,
  },
  {
    numero: 6,
    titulo: 'El álbum terminado',
    subtitulo: 'Al finalizar la noche, fotos organizadas en alta calidad para descargar y revivir cada momento.',
    icono: ImageIcon,
  },
];

function ExperienciaContent() {
  const searchParams = useSearchParams();
  const pasoParam = searchParams.get('paso');
  const [pasoActual, setPasoActual] = useState<number>(1);

  useEffect(() => {
    if (pasoParam) {
      const p = parseInt(pasoParam, 10);
      if (p >= 1 && p <= 6) {
        setPasoActual(p);
      }
    }
  }, [pasoParam]);

  // Estados de simulación paso 2
  const [rsvpConfirmado, setRsvpConfirmado] = useState(false);
  const [menuElegido, setMenuElegido] = useState('Clásico');

  // Estados de simulación paso 5
  const [fotoTomada, setFotoTomada] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Barra superior institucional */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-wider text-amber-400">AK</span>
            <span className="text-xs uppercase tracking-widest text-slate-400">Eventos</span>
          </Link>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs hidden sm:inline-flex">
              Demostración de muestra
            </Badge>
            <Button size="sm" asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs">
              <Link href="/simulador-ak">
                <Calculator className="w-3.5 h-3.5 mr-1" />
                Armar presupuesto
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Cabecera principal */}
      <section className="py-10 px-4 max-w-4xl mx-auto text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 px-3 py-1">
          +7 años de experiencia · +200 eventos realizados
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Viví la experiencia <span className="text-amber-400">AK Producciones</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          Recorré en 6 pasos interactivos cómo disfrutan tus invitados y cómo coordinás tu fiesta desde el primer día.
          Es una demostración interactiva con datos simulados de ejemplo.
        </p>
      </section>

      {/* Navegador de pasos */}
      <div className="max-w-5xl mx-auto px-4 w-full mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PASOS.map((paso) => {
            const Icono = paso.icono;
            const esActivo = paso.numero === pasoActual;
            const esPasado = paso.numero < pasoActual;
            return (
              <button
                key={paso.numero}
                onClick={() => setPasoActual(paso.numero)}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  esActivo
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/5'
                    : esPasado
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold">Paso {paso.numero}</span>
                  {esPasado ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icono className={`w-3.5 h-3.5 ${esActivo ? 'text-amber-400' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className="text-[11px] font-medium truncate">{paso.titulo}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área interactiva del paso */}
      <main className="max-w-4xl mx-auto px-4 w-full flex-1 mb-16">
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-black font-bold text-sm">
                  {pasoActual}
                </span>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-white">
                    {PASOS[pasoActual - 1].titulo}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    {PASOS[pasoActual - 1].subtitulo}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                Ejemplo demostrativo
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Paso 1: Invitación Digital */}
            {pasoActual === 1 && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 max-w-md mx-auto text-center space-y-4">
                  <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                    15 Años de Morena
                  </div>
                  <div className="text-2xl font-serif font-bold text-white">
                    ¡Te espero para festejar!
                  </div>
                  <p className="text-xs text-slate-400">
                    Sábado 20 de Noviembre · Salón Club Uruguay · 21:00 hs
                  </p>
                  <div className="grid grid-cols-4 gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                    <div>
                      <div className="text-lg font-bold text-amber-400">45</div>
                      <div className="text-[10px] text-slate-400">DÍAS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-400">14</div>
                      <div className="text-[10px] text-slate-400">HORAS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-400">30</div>
                      <div className="text-[10px] text-slate-400">MIN</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-400">12</div>
                      <div className="text-[10px] text-slate-400">SEG</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg text-xs text-slate-300 text-left border border-slate-800/80 space-y-1">
                    <div>👗 <strong>Vestimenta:</strong> Elegante sport</div>
                    <div>🎵 <strong>Música favorita:</strong> Podés sugerir tu tema</div>
                    <div>📍 <strong>Ubicación GPS:</strong> Salto, Uruguay</div>
                  </div>
                  <Button
                    onClick={() => setPasoActual(2)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm"
                  >
                    Confirmar asistencia en el paso siguiente
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 2: Confirmación de Asistencia */}
            {pasoActual === 2 && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">Confirmá tu presencia</h3>
                    <p className="text-xs text-slate-400">Respuesta rápida y directa para la organización</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-slate-300 font-medium">¿Venís a la fiesta?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={rsvpConfirmado ? 'default' : 'outline'}
                        onClick={() => setRsvpConfirmado(true)}
                        className={rsvpConfirmado ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-700'}
                      >
                        ¡Sí, voy con alegría!
                      </Button>
                      <Button
                        type="button"
                        variant={!rsvpConfirmado ? 'default' : 'outline'}
                        onClick={() => setRsvpConfirmado(false)}
                        className={!rsvpConfirmado ? 'bg-slate-800 text-slate-300' : 'border-slate-700'}
                      >
                        No podré asistir
                      </Button>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs text-slate-300 font-medium">Tipo de menú para tu plato:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Clásico', 'Celíaco', 'Vegetariano'].map((m) => (
                          <Button
                            key={m}
                            type="button"
                            size="sm"
                            variant={menuElegido === m ? 'default' : 'outline'}
                            onClick={() => setMenuElegido(m)}
                            className={menuElegido === m ? 'bg-amber-500 text-black font-semibold' : 'border-slate-700 text-xs'}
                          >
                            {m}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => setPasoActual(3)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm"
                    >
                      Ver mi portal de invitado
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Portal del Invitado */}
            {pasoActual === 3 && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-slate-400">Hola, Invitado de Muestra</div>
                      <div className="text-base font-bold text-white">Mesa Asignada: #04 (Jóvenes)</div>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Confirmado</Badge>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-2 border border-slate-800">
                    <div className="font-semibold text-slate-200">Detalles de tu noche:</div>
                    <div className="text-slate-400">• Tu plato registrado: <span className="text-amber-400">{menuElegido}</span></div>
                    <div className="text-slate-400">• Barra de tragos con carta interactiva</div>
                    <div className="text-slate-400">• Fotocabina disponible durante la velada</div>
                  </div>

                  <Button
                    onClick={() => setPasoActual(4)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm"
                  >
                    Pasar al Portal del Cliente
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 4: Portal del Cliente */}
            {pasoActual === 4 && (
              <div className="space-y-6 max-w-lg mx-auto">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="text-xs text-amber-400 font-semibold uppercase">Panel de Control del Cliente</div>
                    <div className="text-lg font-bold text-white">Coordinación de los 15 de Morena</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Invitados Confirmados</div>
                      <div className="text-xl font-bold text-white mt-1">98 / 120</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Plan de Cuotas</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">Al día</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-200">Próximos pasos de organización:</div>
                    <div className="text-slate-400">✓ Menú de degustación aprobado</div>
                    <div className="text-slate-400">✓ Armado del salón en 3D configurado</div>
                    <div className="text-slate-400">✓ Lista de temas sugeridos por invitados</div>
                  </div>

                  <Button
                    onClick={() => setPasoActual(5)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm"
                  >
                    Probar el entretenimiento
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 5: Entretenimiento */}
            {pasoActual === 5 && (
              <div className="space-y-6 max-w-md mx-auto text-center">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-white">Simulador de Fotocabina</h3>
                  <p className="text-xs text-slate-400">
                    Los invitados se toman fotos instantáneas con marcos temáticos desde su celular o tótem.
                  </p>

                  <div className="aspect-[4/3] bg-slate-900 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {fotoTomada ? (
                      <div className="space-y-2 text-center animate-in fade-in">
                        <div className="text-3xl">🎉 📸</div>
                        <div className="text-sm font-bold text-amber-400">¡Foto de muestra capturada!</div>
                        <div className="text-xs text-slate-400">Marco oficial de AK Producciones aplicado</div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-xs text-slate-400">Vista previa de la cámara de muestra</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFotoTomada(!fotoTomada)}
                      className="flex-1 border-slate-700 text-xs"
                    >
                      {fotoTomada ? 'Tomar otra' : 'Simular foto'}
                    </Button>
                    <Button
                      onClick={() => setPasoActual(6)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                    >
                      Ver el álbum final
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 6: Álbum Terminado */}
            {pasoActual === 6 && (
              <div className="space-y-6 max-w-lg mx-auto">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">El recuerdo de tu noche</h3>
                    <p className="text-xs text-slate-400">
                      Galería digital organizada con fotos de alta resolución listas para descargar.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-square bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600 text-xs"
                      >
                        Foto #{i}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                    Al terminar la fiesta, cada familia puede buscar sus recuerdos con un clic.
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm">
                      <Link href="/simulador-ak">
                        <Calculator className="w-4 h-4 mr-2" />
                        Armar presupuesto para mi fiesta
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-slate-700 text-slate-300 text-sm">
                      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                        Escribinos por WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Navegación inferior */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPasoActual(Math.max(1, pasoActual - 1))}
                disabled={pasoActual === 1}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Paso anterior
              </Button>

              <span className="text-xs text-slate-500">
                Paso {pasoActual} de {PASOS.length}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPasoActual(Math.min(6, pasoActual + 1))}
                disabled={pasoActual === 6}
                className="text-slate-400 hover:text-white"
              >
                Siguiente paso
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function ExperienciaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Cargando demostración...</div>}>
      <ExperienciaContent />
    </Suspense>
  );
}

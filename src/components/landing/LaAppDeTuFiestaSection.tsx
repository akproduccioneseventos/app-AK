"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  Send,
  Sparkles,
  GlassWater,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  QrCode,
  Music,
  MapPin,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Wine,
  Heart,
  ChevronRight,
  Tv,
} from "lucide-react";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";
import { cn } from "@/lib/utils";

interface LaAppDeTuFiestaSectionProps {
  whatsappNumber?: string;
}

type MomentoId = "antes" | "invitacion" | "durante" | "barra" | "despues";

interface MomentoConfig {
  id: MomentoId;
  etapa: string;
  badge: string;
  titulo: string;
  subtitulo: string;
  loQueEntiende: string;
  icon: React.ElementType;
}

export type { MomentoId, MomentoConfig };

export const MOMENTOS_APP_FIESTA: MomentoConfig[] = [
  {
    id: "antes",
    etapa: "1. Antes",
    badge: "Planificación sin fricción",
    titulo: "Portal del cliente: decisiones y acuerdos en orden",
    subtitulo: "Menú, selección musical, decoración y tareas organizadas sin perderte en chats.",
    loQueEntiende: "Organizás tu fiesta sin perder conversaciones en chats ni papeles sueltos.",
    icon: CalendarCheck,
  },
  {
    id: "invitacion",
    etapa: "2. Invitación",
    badge: "Acceso digital al instante",
    titulo: "Invitación digital interactiva y confirmación ágil",
    subtitulo: "Mapa, recomendaciones, dress code y confirmación de asistencia con QR.",
    loQueEntiende: "Tus invitados encuentran todo desde su enlace y confirman en un toque.",
    icon: Send,
  },
  {
    id: "durante",
    etapa: "3. Durante",
    badge: "Mural y DJ en vivo",
    titulo: "Participación en tiempo real en la pantalla gigante",
    subtitulo: "Dedicatorias, fotos de los invitados y pedidos musicales con moderación previa.",
    loQueEntiende: "Tus invitados participan activamente de la fiesta, no solo miran.",
    icon: MessageSquare,
  },
  {
    id: "barra",
    etapa: "4. Barra y Tótem",
    badge: "Carta digital y pedidos",
    titulo: "Carta de tragos digital con seguimiento de turno",
    subtitulo: "Los invitados exploran la coctelería y piden sin amontonarse frente a la barra.",
    loQueEntiende: "El pedido llega directo a quien lo prepara, con cola separada del DJ.",
    icon: GlassWater,
  },
  {
    id: "despues",
    etapa: "5. Después",
    badge: "Recuerdos intactos",
    titulo: "Álbum digital completo disponible al día siguiente",
    subtitulo: "Fotos de fotocabina, videos 360 y mensajes de los invitados para revivir la noche.",
    loQueEntiende: "Te quedan los recuerdos de tu fiesta organizados y listos para compartir.",
    icon: ImageIcon,
  },
];

const MOMENTOS = MOMENTOS_APP_FIESTA;

export function LaAppDeTuFiestaSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
}: LaAppDeTuFiestaSectionProps) {
  const reduceMotion = useReducedMotion();
  const [momentoActivo, setMomentoActivo] = useState<MomentoId>("antes");

  // Estados interactivos simulados para la demo aislada (sin tocar datos reales)
  const [demoMenuTab, setDemoMenuTab] = useState<"menu" | "musica" | "deco">("menu");
  const [rsvpState, setRsvpState] = useState<"pendiente" | "confirmado" | "celiaco">("pendiente");
  const [demoMensaje, setDemoMensaje] = useState("");
  const [demoMensajesEnviados, setDemoMensajesEnviados] = useState<Array<{ id: string; texto: string; autor: string; estado: "moderando" | "aprobado" }>>([
    { id: "msg-1", texto: "¡Qué fiestón! Te queremos mucho Cami 🎉", autor: "Santi y Martina", estado: "aprobado" },
  ]);
  const [pedidoTragoEstado, setPedidoTragoEstado] = useState<"ninguno" | "en_cola" | "listo">("ninguno");

  const configActual = MOMENTOS.find((m) => m.id === momentoActivo) || MOMENTOS[0];

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, estuve viendo "La app de tu fiesta" (${configActual.titulo}) en el sitio web de AK y me interesa saber más para mi evento.`
  )}`;

  const handleEnviarMensajeDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoMensaje.trim()) return;
    const nuevo = {
      id: `demo-msg-${Date.now()}`,
      texto: demoMensaje.trim(),
      autor: "Vos (Invitado Demo)",
      estado: "moderando" as const,
    };
    setDemoMensajesEnviados((prev) => [nuevo, ...prev]);
    setDemoMensaje("");

    // Simulación pedagógica de moderación
    setTimeout(() => {
      setDemoMensajesEnviados((prev) =>
        prev.map((m) => (m.id === nuevo.id ? { ...m, estado: "aprobado" } : m))
      );
    }, 1800);
  };

  const handleSimularPedidoTrago = () => {
    setPedidoTragoEstado("en_cola");
    setTimeout(() => {
      setPedidoTragoEstado("listo");
    }, 2000);
  };

  return (
    <section
      id="tecnologia"
      className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-20 text-slate-950 sm:py-28"
    >
      {/* Halo de luz sutil en fondo sin orbes invasivos */}
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-red-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-slate-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera Comercial */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold tracking-wider text-red-700 uppercase">
            <Sparkles className="h-3.5 w-3.5 text-red-600" />
            Tecnología AK para Eventos
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            La app de tu fiesta
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Organizá los detalles, invitá a los tuyos y compartí los recuerdos desde un mismo lugar.
            Diseñada para que la fiesta se disfrute en la pista y en cada celular.
          </p>
        </div>

        {/* Selector de los 5 Momentos (Tabs progresivos) */}
        <div className="mt-12">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 sm:gap-3">
            {MOMENTOS.map((m) => {
              const Icon = m.icon;
              const activo = m.id === momentoActivo;
              return (
                <button
                  key={m.id}
                  type="button"
                  // Marca el boton de cada momento. La prueba de la orden 50 cuenta
                  // estos y no "todos los botones de la seccion": adentro hay
                  // tambien los de la demo, y contarlos todos la volvia fragil.
                  data-testid="momento-de-la-app"
                  onClick={() => setMomentoActivo(m.id)}
                  className={cn(
                    "flex flex-shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 sm:flex-col sm:items-start sm:gap-2 sm:p-4",
                    activo
                      ? "border-red-600 bg-white shadow-lg shadow-red-500/10 ring-2 ring-red-600/20"
                      : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-colors",
                        activo ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {m.etapa}
                    </span>
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", activo ? "text-slate-900" : "text-slate-700")}>
                      {m.id === "antes" && "Portal Cliente"}
                      {m.id === "invitacion" && "Invitación"}
                      {m.id === "durante" && "Mural en Vivo"}
                      {m.id === "barra" && "Barra & Cócteles"}
                      {m.id === "despues" && "Recuerdos"}
                    </p>
                    <p className="hidden text-xs text-slate-500 sm:block sm:line-clamp-1">
                      {m.badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Interactivo: Recorrido y Demostración Aislada */}
        <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/50 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Columna Izquierda: Explicación de Valor Comercial */}
            <div className="space-y-6 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1 text-xs font-bold tracking-wide text-red-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {configActual.badge}
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {configActual.titulo}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {configActual.subtitulo}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      Lo que sentís como cliente
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-emerald-900">
                      &ldquo;{configActual.loQueEntiende}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción directa */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 transition-transform duration-150 hover:bg-red-700 active:scale-95"
                >
                  Consultar para mi fiesta
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/simulador-de-presupuesto"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Simular presupuesto
                </Link>
              </div>

              <p className="text-xs text-slate-400">
                * Muestra interactiva pedagógica con datos de prueba. No publica ni emite mensajes reales.
              </p>
            </div>

            {/* Columna Derecha: Pantalla Interactiva Real Simulada */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl sm:p-6">
                {/* Barra superior de dispositivo demo */}
                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-300">DEMO EN VIVO</span>
                    <span className="text-slate-500">• 15 de Camila (Muestra)</span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    Modo seguro
                  </span>
                </div>

                {/* Contenido interactivo dinámico según el momento seleccionado */}
                <AnimatePresence mode="wait">
                  {momentoActivo === "antes" && (
                    <motion.div
                      key="demo-antes"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex gap-2 border-b border-slate-800 pb-2">
                        <button
                          type="button"
                          onClick={() => setDemoMenuTab("menu")}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-semibold transition",
                            demoMenuTab === "menu" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Menú & Platos
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoMenuTab("musica")}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-semibold transition",
                            demoMenuTab === "musica" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Música elegida
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoMenuTab("deco")}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-semibold transition",
                            demoMenuTab === "deco" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Mural de Deco
                        </button>
                      </div>

                      {demoMenuTab === "menu" && (
                        <div className="space-y-2 rounded-xl bg-slate-900/80 p-4 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-200">
                            <span>Propuesta Gastronómica Aprobada</span>
                            <span className="text-emerald-400">Confirmado</span>
                          </div>
                          <p className="text-slate-400">
                            Recepción de bocados calientes + Asado Criollo Premium.
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                            <div className="rounded bg-slate-800 p-2">
                              🍽️ <strong>Celíacos:</strong> 3 menúes adaptados
                            </div>
                            <div className="rounded bg-slate-800 p-2">
                              🥗 <strong>Vegetarianos:</strong> 4 opciones gourmet
                            </div>
                          </div>
                        </div>
                      )}

                      {demoMenuTab === "musica" && (
                        <div className="space-y-2 rounded-xl bg-slate-900/80 p-4 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-200">
                            <span>Lista para el DJ</span>
                            <span className="text-red-400">Sincronizado</span>
                          </div>
                          <div className="space-y-1.5 text-slate-300">
                            <div className="flex items-center justify-between rounded bg-slate-800/80 px-2.5 py-1.5">
                              <span>🎵 Vals / Entrada: &ldquo;A Thousand Years&rdquo;</span>
                              <span className="text-[10px] text-slate-400">Momento Clave</span>
                            </div>
                            <div className="flex items-center justify-between rounded bg-slate-800/80 px-2.5 py-1.5">
                              <span>🔥 Cachengue & Fiesta: Hits 2026 seleccionados</span>
                              <span className="text-[10px] text-slate-400">Tanda Central</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {demoMenuTab === "deco" && (
                        <div className="space-y-2 rounded-xl bg-slate-900/80 p-4 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-200">
                            <span>Estilo & Iluminación</span>
                            <span className="text-purple-400">Paleta Oro & Lila</span>
                          </div>
                          <p className="text-slate-400">
                            Centros de mesa con flores de estación, iluminación perimetral en tonos cálidos.
                          </p>
                          <div className="rounded bg-slate-800/80 p-2 text-slate-300">
                            ✨ 8 fotos de referencia aprobadas con tu organizador.
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-400">
                        <span>💬 Conversación centralizada con tu productor asignado</span>
                        <span className="text-emerald-400 font-semibold">Al día</span>
                      </div>
                    </motion.div>
                  )}

                  {momentoActivo === "invitacion" && (
                    <motion.div
                      key="demo-invitacion"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">
                              Invitación Digital
                            </span>
                            <h4 className="text-sm font-bold text-white">¡Mis 15 - Camila!</h4>
                          </div>
                          <QrCode className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="mt-2 text-xs text-slate-300">
                          Sábado 18 de Octubre • 21:00 hs • Salón Los Robles
                        </p>

                        <div className="mt-4 rounded-lg bg-slate-950 p-3">
                          <p className="text-xs font-semibold text-slate-200">
                            ¿Venís a festejar conmigo?
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setRsvpState("confirmado")}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                rsvpState === "confirmado"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              )}
                            >
                              ✓ Sí, confirmo
                            </button>
                            <button
                              type="button"
                              onClick={() => setRsvpState("celiaco")}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                rsvpState === "celiaco"
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              )}
                            >
                              🌾 Menú sin TACC
                            </button>
                          </div>

                          {rsvpState !== "pendiente" && (
                            <p className="mt-2 text-[11px] text-emerald-400 animate-fadeIn">
                              🎉 ¡Asistencia registrada! Tu lugar en la Mesa 4 ya está guardado.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {momentoActivo === "durante" && (
                    <motion.div
                      key="demo-durante"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Simulación de Pantalla Gigante */}
                      <div className="rounded-xl border border-red-900/40 bg-slate-900 p-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-red-400">
                            <Tv className="h-3.5 w-3.5" /> Pantalla del Salón
                          </span>
                          <span className="text-[10px] text-emerald-400">● Conectada al muro</span>
                        </div>

                        <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                          {demoMensajesEnviados.map((m) => (
                            <div
                              key={m.id}
                              className={cn(
                                "rounded-lg p-2.5 text-xs transition-all",
                                m.estado === "aprobado"
                                  ? "border border-red-500/30 bg-gradient-to-r from-red-950/40 to-slate-900 text-white"
                                  : "border border-amber-500/30 bg-amber-950/20 text-amber-200"
                              )}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold">{m.autor}</span>
                                <span className={m.estado === "aprobado" ? "text-emerald-400" : "text-amber-400"}>
                                  {m.estado === "aprobado" ? "En pantalla grande" : "En revisión de operador..."}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-200">{m.texto}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Celular del invitado escribiendo dedicatoria */}
                      <form onSubmit={handleEnviarMensajeDemo} className="flex gap-2">
                        <input
                          type="text"
                          value={demoMensaje}
                          onChange={(e) => setDemoMensaje(e.target.value)}
                          placeholder="Escribí una dedicatoria de prueba..."
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enviar
                        </button>
                      </form>
                      <p className="text-[10px] text-slate-500">
                        * Moderación activa: el operador autoriza cada foto y dedicatoria antes de salir en la pantalla principal.
                      </p>
                    </motion.div>
                  )}

                  {momentoActivo === "barra" && (
                    <motion.div
                      key="demo-barra"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Wine className="h-4 w-4 text-amber-400" /> Carta Digital de Tragos
                          </span>
                          <span className="text-[10px] text-slate-500">Cola independiente del DJ</span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                            <p className="font-bold text-white">Mojito de Maracuyá</p>
                            <p className="text-[11px] text-slate-400">Ron blanco, maracuyá natural, menta fresca y lima.</p>
                            <button
                              type="button"
                              onClick={handleSimularPedidoTrago}
                              className="mt-2 w-full rounded bg-amber-600/30 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-600/50"
                            >
                              Pedir en barra
                            </button>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                            <p className="font-bold text-white">Citrus Mocktail (Sin Alcohol)</p>
                            <p className="text-[11px] text-slate-400">Pomelo rosado, tónica, romero fresco y almíbar de frutos.</p>
                            <button
                              type="button"
                              onClick={handleSimularPedidoTrago}
                              className="mt-2 w-full rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
                            >
                              Pedir en barra
                            </button>
                          </div>
                        </div>

                        {pedidoTragoEstado !== "ninguno" && (
                          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs">
                            <div className="flex items-center justify-between font-semibold text-emerald-300">
                              <span>Pedido #42: Mojito</span>
                              <span>{pedidoTragoEstado === "en_cola" ? "⏳ En preparación" : "✅ Listo para retirar"}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-emerald-400">
                              {pedidoTragoEstado === "en_cola"
                                ? "El barman ya recibió tu comanda en la tablet de barra."
                                : "Tu trago está listo. Acercate a la barra a buscarlo."}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {momentoActivo === "despues" && (
                    <motion.div
                      key="demo-despues"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-semibold">Álbum de Recuerdos de la Fiesta</span>
                        <span className="text-[10px] text-slate-500">Al día siguiente</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-center">
                          <p className="text-base font-extrabold text-red-400">184</p>
                          <p className="text-[10px] text-slate-400">Fotos de Cabina</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-center">
                          <p className="text-base font-extrabold text-purple-400">46</p>
                          <p className="text-[10px] text-slate-400">Videos 360°</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-center">
                          <p className="text-base font-extrabold text-emerald-400">92</p>
                          <p className="text-[10px] text-slate-400">Dedicatorias</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <p className="font-semibold text-slate-200">Acceso seguro para vos y tus invitados</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Cada invitado puede volver a entrar a su enlace para descargar sus tiras de recuerdo, ver los momentos en alta resolución y revivir los mejores momentos sin contraseñas difíciles.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Cierre y Transparencia */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 sm:p-8">
          <p className="font-medium text-slate-800">
            ¿Querés ver cómo se adapta la app a tu tipo de fiesta?
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Los módulos contratados se integran a tu presupuesto personalizado (cumpleaños de 15, bodas, empresariales o infantiles).
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-red-600 hover:text-red-700"
            >
              Hablar con un asesor por WhatsApp
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LaAppDeTuFiestaSection;

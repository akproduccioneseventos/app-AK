'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  DollarSign,
  HeartHandshake,
  PartyPopper,
  ShieldCheck,
  ArrowRight,
  Calculator,
  MessageSquare,
  Users,
  Music,
  Wine,
  Film,
  Camera,
  QrCode,
  UtensilsCrossed,
  Radio,
  Clock,
  Compass,
  CheckCircle2,
  ExternalLink,
  Phone,
  LayoutGrid,
} from 'lucide-react';
import { AudioGuestbookModal } from '@/components/evento/AudioGuestbookModal';
import { BrindisCruzadoModal } from '@/components/evento/BrindisCruzadoModal';
import { CamaraDescartableModal } from '@/components/evento/CamaraDescartableModal';
import { CrowdSyncShow } from '@/components/evento/CrowdSyncShow';

export function CuatroPuertasHub() {
  const [demoAudioOpen, setDemoAudioOpen] = useState(false);
  const [demoBrindisOpen, setDemoBrindisOpen] = useState(false);
  const [demoCamaraOpen, setDemoCamaraOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      {/* Encabezado Principal */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Ecosistema AK Producciones • Nivel Mundial 2026
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          El Centro de Control en 4 Puertas
        </h1>
        <p className="text-sm md:text-base text-slate-400">
          Todo el poder de AK Producciones organizado con elegancia: desde la captación en redes hasta la pista de baile sincronizada en vivo.
        </p>
      </div>

      {/* Grid de las 4 Puertas Maestras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* PUERTA 1: VIDRIERA & VENTAS AUTOMÁTICAS */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl space-y-5 hover:border-amber-400/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30">
                <DollarSign className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Puerta 1 • Ventas 24/7
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Vidriera & Ventas Automáticas</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Para el cliente que aún no contrató. Cotiza solo en segundos, consulta por redes, recibe respuesta inteligente 24/7 y se agenda directo en tu WhatsApp.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/simulador-ak"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      Simulador de Presupuestos Inteligente
                    </div>
                    <div className="text-[10px] text-slate-500">Calcula invitados y servicios en 1 min</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-amber-300 transition" />
              </Link>

              <Link
                href="/empresa/presencia-digital?tab=comentarios"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-300">
                      Centro de Redes, Auto-Respuestas & WhatsApp
                    </div>
                    <div className="text-[10px] text-slate-500">Tabla unificada en tiempo real + CRM</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-rose-300 transition" />
              </Link>

              <Link
                href="/contabilidad/crm/agenda"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Agenda de Reuniones con Prospectos
                    </div>
                    <div className="text-[10px] text-slate-500">Recordatorios de cita con modismo uruguayo</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-300 transition" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Conversión con neuroventas sin fricción</span>
            <span className="text-amber-400 font-bold">100% Automático</span>
          </div>
        </div>

        {/* PUERTA 2: EL ESTUDIO DE LA FAMILIA (PORTAL CLIENTE) */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/30 rounded-3xl space-y-5 hover:border-sky-400/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-sky-500/15 text-sky-400 rounded-2xl border border-sky-500/30">
                <HeartHandshake className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Puerta 2 • Estudio de la Familia
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">El Portal Privado de la Familia</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Para el cliente que ya contrató. Cero estrés: solo 4 tarjetas gigantes para organizar invitados, mesas inteligentes, música infaltable y estado de pagos.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/portal"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300">
                      Invitados, Alergias y Mesas Anti-Estrés
                    </div>
                    <div className="text-[10px] text-slate-500">Reparto de mesas en 1 clic + menú especial</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-sky-300 transition" />
              </Link>

              <Link
                href="/portal"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <Music className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300">
                      Guion de la Noche & Canciones Infaltables
                    </div>
                    <div className="text-[10px] text-slate-500">Cronograma minuto a minuto coordinado</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-purple-300 transition" />
              </Link>

              <Link
                href="/portal"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Invitación Digital de Lujo para WhatsApp
                    </div>
                    <div className="text-[10px] text-slate-500">RSVP, GPS, código de vestimenta y regalos</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-300 transition" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Experiencia de alta gama sin abrumar</span>
            <span className="text-sky-400 font-bold">4 Pasos Claros</span>
          </div>
        </div>

        {/* PUERTA 3: LA NOCHE EN VIVO (APP DEL INVITADO PWA / PLAY STORE) */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/30 rounded-3xl space-y-5 hover:border-purple-400/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-purple-500/15 text-purple-400 rounded-2xl border border-purple-500/30">
                <PartyPopper className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Puerta 3 • La Noche en Vivo
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">App del Invitado (Tendencias 2026)</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Lo que los invitados usan desde el teléfono en la fiesta. Instalable con un toque en Android/PC (PWA / Play Store) con entretenimientos que no existen en ningún otro salón.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDemoAudioOpen(true)}
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition space-y-1"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <div className="text-xs font-bold text-white">El Teléfono Rojo</div>
                <div className="text-[10px] text-slate-500">Cápsula de voz retro al vinilo</div>
              </button>

              <button
                onClick={() => setDemoBrindisOpen(true)}
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition space-y-1"
              >
                <Wine className="w-4 h-4 text-pink-400" />
                <div className="text-xs font-bold text-white">Brindis Cruzado</div>
                <div className="text-[10px] text-slate-500">Entre mesas a pantalla LED</div>
              </button>

              <button
                onClick={() => setDemoCamaraOpen(true)}
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition space-y-1"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <div className="text-xs font-bold text-white">Cámara Retro</div>
                <div className="text-[10px] text-slate-500">Revelado al mediodía domingo</div>
              </button>

              <Link
                href="/evento/muro-en-vivo"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-left transition space-y-1 block"
              >
                <Radio className="w-4 h-4 text-sky-400" />
                <div className="text-xs font-bold text-white">Muro Social LED</div>
                <div className="text-[10px] text-slate-500">Fotos proyectadas en vivo</div>
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Efecto Coldplay + Votación de DJ</span>
            <span className="text-purple-400 font-bold">5 Botones VIP</span>
          </div>
        </div>

        {/* PUERTA 4: CABINA DE MANDO AK (DUEÑO & STAFF) */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl space-y-5 hover:border-emerald-400/50 transition-all shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Puerta 4 • Cabina de Mando AK
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Cabina de Mando & Operación</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Para vos y tu equipo. La vista del dueño te muestra solo las 4 cosas del día, y los tableros de fiesta mantienen a Cocina, DJ, Puerta y Coordinador sincronizados al segundo.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/mi-dia"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      Vista Dueño ("Mi Día")
                    </div>
                    <div className="text-[10px] text-slate-500">Caja, cierres pendientes y alertas de fiesta</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-amber-300 transition" />
              </Link>

              <Link
                href="/fiestas/nueva/catering/hoja-de-cocina"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Hoja de Cocina Automatizada
                    </div>
                    <div className="text-[10px] text-slate-500">Porciones, menú celíacos y tiempos de salida</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-300 transition" />
              </Link>

              <Link
                href="/evento/accesos"
                className="p-3 bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <QrCode className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300">
                      Control de Acceso con QR en Puerta
                    </div>
                    <div className="text-[10px] text-slate-500">Check-in de invitados en 2 segundos</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-sky-300 transition" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Cero fallas operativas la noche de fiesta</span>
            <span className="text-emerald-400 font-bold">Roles Separados</span>
          </div>
        </div>
      </div>

      {/* Modales Interactivos de Prueba */}
      <AudioGuestbookModal
        fiestaId="demo_ak"
        isOpen={demoAudioOpen}
        onClose={() => setDemoAudioOpen(false)}
      />
      <BrindisCruzadoModal
        fiestaId="demo_ak"
        isOpen={demoBrindisOpen}
        onClose={() => setDemoBrindisOpen(false)}
      />
      <CamaraDescartableModal
        fiestaId="demo_ak"
        isOpen={demoCamaraOpen}
        onClose={() => setDemoCamaraOpen(false)}
      />
    </div>
  );
}

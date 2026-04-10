'use client';

import { motion } from 'framer-motion';
import { Check, Shield, Clock, Headphones, Star, Zap, Heart } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';

const BENEFICIOS = [
  {
    icon: Shield,
    titulo: 'Un solo proveedor',
    descripcion: 'Todo coordinado por nosotros. Sin intermediarios ni sorpresas de último momento.',
    color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
    iconColor: 'text-indigo-300',
  },
  {
    icon: Clock,
    titulo: 'Puntualidad garantizada',
    descripcion: 'Cada servicio en tiempo y forma. Nos encargamos del cronograma completo del evento.',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    iconColor: 'text-emerald-300',
  },
  {
    icon: Headphones,
    titulo: 'Atención personalizada',
    descripcion: 'Coordinador dedicado a tu evento. Siempre disponible antes, durante y después.',
    color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30',
    iconColor: 'text-violet-300',
  },
  {
    icon: Star,
    titulo: 'Calidad premium',
    descripcion: 'Materiales y equipos de primer nivel. El mismo estándar en cada evento que organizamos.',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    iconColor: 'text-amber-300',
  },
  {
    icon: Zap,
    titulo: 'Resolución inmediata',
    descripcion: 'Si algo sale diferente a lo planeado, lo resolvemos al instante. Vos solo disfrutás.',
    color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
    iconColor: 'text-rose-300',
  },
  {
    icon: Heart,
    titulo: 'Experiencia que emociona',
    descripcion: 'Más de 500 eventos realizados. Sabemos cómo crear momentos que se recuerdan para siempre.',
    color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
    iconColor: 'text-pink-300',
  },
];

export function BeneficiosSlide() {
  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">La diferencia AK</p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            ¿Por qué elegirnos?
          </h1>
          <p className="text-white/60 text-lg mt-2 max-w-2xl mx-auto">
            Somos tu solución integral. Un solo equipo se encarga de todo para que vos solo tengas que disfrutar.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFICIOS.map((b, i) => (
            <motion.div
              key={b.titulo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`bg-gradient-to-br ${b.color} border rounded-2xl p-5`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <b.icon className={`h-5 w-5 ${b.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{b.titulo}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{b.descripcion}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-white/10">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-white/80 font-semibold">Servicio integral · Sin estrés · Resultado garantizado</span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

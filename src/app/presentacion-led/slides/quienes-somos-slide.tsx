'use client';

import { motion } from 'framer-motion';
import { Award, Heart, Users } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import type { CompanyInfo } from '@/types/settings';

interface QuienesSomosSlideProps {
  companyInfo: CompanyInfo;
}

const STATS = [
  { icon: Award, label: 'Años de experiencia', value: '+10' },
  { icon: Heart, label: 'Eventos realizados', value: '+500' },
  { icon: Users, label: 'Familias felices', value: '+500' },
];

export function QuienesSomosSlide({ companyInfo }: QuienesSomosSlideProps) {
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
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-2">Quiénes somos</p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            {companyInfo.companyName || 'AK Producciones'}
          </h1>
          <p className="text-white/60 text-lg mt-2">
            {companyInfo.companyAddress || 'Salto, Uruguay'} · Producción integral de eventos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Story + Stats */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-bold text-white mb-3">Nuestra historia</h2>
              <p className="text-white/70 leading-relaxed text-base">
                En AK Producciones somos especialistas en transformar momentos especiales en recuerdos eternos. 
                Nacimos con la pasión de organizar eventos únicos, y hoy somos el equipo de confianza de cientos 
                de familias en Salto y la región.
              </p>
              <p className="text-white/70 leading-relaxed text-base mt-3">
                Nos encargamos de <span className="text-white font-semibold">todo</span>: desde la decoración hasta 
                el catering, el sonido, la fotografía y la coordinación general. Un solo equipo, una sola propuesta, 
                cero preocupaciones para vos.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-3"
            >
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-white/10 rounded-2xl p-4 text-center"
                >
                  <stat.icon className="h-6 w-6 text-indigo-300 mx-auto mb-2" />
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-white/50 text-xs leading-tight mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Photo placeholders */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <ImagePlaceholder
                id="empresa-foto-1"
                label="Foto del equipo AK Producciones"
                aspectRatio="16/9"
              />
            </motion.div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <ImagePlaceholder
                  id="empresa-foto-2"
                  label="Foto de un evento realizado"
                  aspectRatio="4/3"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <ImagePlaceholder
                  id="empresa-foto-3"
                  label="Foto del local / oficina"
                  aspectRatio="4/3"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';

const BENEFICIOS = [
  { emoji: '🛡️', texto: 'Un solo proveedor para coordinar todo el evento.' },
  { emoji: '⏱️', texto: 'Cada etapa coordinada.' },
  { emoji: '🎧', texto: 'Atención personalizada antes, durante y después.' },
  { emoji: '⭐', texto: 'Servicios propios, con equipo propio.' },
  { emoji: '⚡', texto: 'Un equipo atento a cada imprevisto.' },
  { emoji: '❤️', texto: 'Experiencia que emociona y se recuerda.' },
];

const FOTO_BENEFICIOS_DEFAULT = '/media/catalogo-servicios/familia_feliz_evento.png';
const FOTO_BENEFICIOS_FALLBACK = '/media/catalogo-servicios/boda_persuasiva.png';

function normalizarTextoBeneficio(texto: string): string {
  const lower = texto.toLowerCase();
  if (lower.includes('imprevisto')) return 'Un equipo atento a cada imprevisto.';
  if (lower.includes('puntualidad en cada etapa')) return 'Cada etapa coordinada.';
  if (lower.includes('calidad premium')) return 'Servicios propios, con equipo propio.';
  return texto;
}

function isSafeImagePath(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

export function BeneficiosSlide({
  beneficios = BENEFICIOS,
  imagenLateralUrl,
}: {
  beneficios?: { emoji: string; texto: string }[];
  imagenLateralUrl?: string;
}) {
  const [imgSrc, setImgSrc] = useState<string>(
    isSafeImagePath(imagenLateralUrl) ? imagenLateralUrl : FOTO_BENEFICIOS_DEFAULT,
  );
  const beneficiosNormalizados = beneficios.map((b) => ({
    ...b,
    texto: normalizarTextoBeneficio(b.texto),
  }));

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">La diferencia AK</p>
          <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">
            ¿Por qué elegirnos?
          </h1>
          <p className="text-white/60 text-base md:text-lg mt-2 max-w-2xl mx-auto">
            Somos tu solución integral. Un solo equipo se encarga de todo para que vos solo tengas que disfrutar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {beneficiosNormalizados.map((b, i) => (
            <motion.div
              key={`${b.texto}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                  {b.emoji || '✨'}
                </div>
                <div>
                  <p className="text-white/85 text-sm leading-relaxed">{b.texto}</p>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
          <div>
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-slate-900">
              <Image
                src={imgSrc}
                alt="Equipo y familia disfrutando el evento con AK Producciones"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
                className="object-cover"
                onError={() => {
                  if (imgSrc !== FOTO_BENEFICIOS_FALLBACK) {
                    setImgSrc(FOTO_BENEFICIOS_FALLBACK);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-5 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-white/10">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-white/80 font-semibold">Servicio integral · Sin estrés</span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

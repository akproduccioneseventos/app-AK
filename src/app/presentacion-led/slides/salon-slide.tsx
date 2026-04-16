'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, MapPin, Users } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { cn } from '@/lib/utils';
import type { CatalogoFoto } from '@/types/catalogo';
import type { CompanyInfo } from '@/types/settings';

interface SalonSlideProps {
  catalogoFotos: CatalogoFoto[];
  companyInfo: CompanyInfo;
  tipoFiesta: string;
}

function toSafeImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (/[<>"'`]/.test(url)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function SalonSlide({ catalogoFotos, companyInfo, tipoFiesta }: SalonSlideProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const fotosSalon = useMemo(
    () => catalogoFotos.map((foto) => {
      const safeUrl = toSafeImageUrl(foto.url);
      const categoria = normalizeText(foto.categoriaServicio || '');
      return safeUrl && categoria.includes('salon') ? { ...foto, safeUrl } : null;
    }).filter((foto): foto is CatalogoFoto & { safeUrl: string } => !!foto).slice(0, 4),
    [catalogoFotos],
  );

  const visibleFotos = useMemo(
    () => fotosSalon.filter(foto => !failedIds.has(foto.id)),
    [fotosSalon, failedIds],
  );

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-emerald-500/30 border border-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-indigo-200" />
            </div>
            <p className="text-white/60 font-semibold uppercase tracking-widest text-xs">Propuesta AK</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Nuestro Salón</h1>
          <p className="text-white/60 text-base">
            Un espacio pensado para celebrar {tipoFiesta || 'tu evento'} con comodidad, estilo y soporte integral.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            {visibleFotos.length > 0 ? (
              <div className={cn(
                'grid gap-2 rounded-2xl overflow-hidden',
                visibleFotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}>
                {visibleFotos.map((foto) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={foto.id}
                    src={foto.safeUrl}
                    alt={foto.titulo ?? 'Salón AK'}
                    className={cn(
                      'w-full object-cover rounded-xl',
                      visibleFotos.length === 1 ? 'aspect-[4/3]' : 'aspect-square',
                    )}
                    onError={() => setFailedIds(prev => new Set(prev).add(foto.id))}
                  />
                ))}
              </div>
            ) : (
              <ImagePlaceholder
                id="salon-general"
                label="Foto del salón"
                aspectRatio="4/3"
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">Descripción</p>
              <p className="text-white/80 leading-relaxed text-sm">
                {companyInfo.companyName || 'AK Producciones'} te ofrece una solución integral para centralizar salón,
                logística y servicios en un mismo flujo comercial, antes de definir los detalles por tipo de fiesta.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Características</p>
              <ul className="space-y-2.5">
                <li className="text-white/75 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-300" />
                  Capacidad adaptable según cantidad de invitados
                </li>
                <li className="text-white/75 text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-300" />
                  Ubicación y accesos coordinables según evento
                </li>
                <li className="text-white/75 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Espacio preparado para integrar catering, ambientación y técnica
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

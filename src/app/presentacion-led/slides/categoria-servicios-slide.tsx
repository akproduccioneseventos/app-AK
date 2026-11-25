'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, ChevronDown, ChevronUp, ListChecks, Music, Camera, Utensils, Palette, Users, Zap, Package, Gift, Sparkles, Info, Images } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SlideLayout } from '../components/slide-layout';
import { cn } from '@/lib/utils';
import type { ServicioEmpresa } from '@/types/empresa';
import { GLITTER_BAR_FOTO_DE_EJEMPLO } from '@/lib/catering/menu-images';
import type { CatalogoFoto } from '@/types/catalogo';
import { SERVICES } from '@/data/presentacion';

function isSafeHttpsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const POOL_DISCOTECA = [
  '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
  '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
  '/media/catalogo-servicios/discoteca-iluminacion-bolas-01.jpeg',
  '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
  '/media/catalogo-servicios/discoteca_img_223_p22_x1619.jpeg',
  '/media/catalogo-servicios/discoteca_img_224_p22_x1620.jpeg',
  '/media/catalogo-servicios/discoteca_img_225_p22_x1621.jpeg',
  '/media/catalogo-servicios/discoteca_img_226_p22_x1622.jpeg',
  '/media/catalogo-servicios/discoteca_img_227_p22_x1623.jpeg',
  '/media/catalogo-servicios/discoteca_img_228_p22_x1624.jpeg',
  '/media/catalogo-servicios/blog_iluminacion.png',
];

const POOL_FOTOGRAFIA = [
  '/media/catalogo-servicios/fotografia_cabina_img_255_p27_x1695.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_256_p27_x3827.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_257_p28_x3839.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_258_p28_x3848.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_259_p28_x3852.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_260_p28_x3855.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_261_p28_x3858.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_262_p28_x3861.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_238_p25_x1660.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_239_p25_x1661.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_240_p25_x1662.jpeg',
];

const POOL_FILMACION = [
  '/media/catalogo-servicios/fotografia_cabina_img_266_p29_x1725.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_267_p29_x1726.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_268_p29_x1727.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_269_p29_x1729.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_241_p25_x1663.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_242_p25_x3787.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_245_p26_x1678.jpeg',
  '/media/catalogo-servicios/glitter_bar_img_246_p26_x1679.jpeg',
];

const POOL_ENTRETENIMIENTO = [
  '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_252_p27_x1692.jpeg',
  '/media/catalogo-servicios/tecnologia_fiesta.png',
  '/media/catalogo-servicios/fotografia_cabina_img_220_p21_x1612.jpeg',
  '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
  GLITTER_BAR_FOTO_DE_EJEMPLO,
  '/media/catalogo-servicios/fotografia_cabina_img_263_p29_x1722.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_253_p27_x1693.jpeg',
  '/media/catalogo-servicios/fotografia_cabina_img_254_p27_x1694.jpeg',
  '/media/catalogo-servicios/discoteca_img_235_p23_x3749.jpeg',
];

const POOL_DECORACION = [
  '/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg',
  '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
  '/media/catalogo-servicios/decoracion-centro-mesa-01.jpeg',
  '/media/catalogo-servicios/decoracion-xv-lila-01.jpeg',
  '/media/catalogo-servicios/decoracion-xv-luces-01.jpeg',
  '/media/catalogo-servicios/xv-decoracion-rosa-01.jpeg',
  '/media/catalogo-servicios/xv-mesa-principal-ak-02.jpeg',
  '/media/catalogo-servicios/decoracion_img_035_p04_x1123.jpeg',
  '/media/catalogo-servicios/decoracion_img_037_p04_x2758.jpeg',
  '/media/catalogo-servicios/decoracion_img_038_p04_x2765.jpeg',
  '/media/catalogo-servicios/decoracion_img_040_p05_x1140.jpeg',
  '/media/catalogo-servicios/decoracion_img_054_p07_x1180.jpeg',
];

const POOL_REPOSTERIA = [
  '/media/catalogo-servicios/candy-bar-xv-01.jpeg',
  '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg',
  '/media/catalogo-servicios/candy-bar-xv-detalle-03.jpeg',
  '/media/catalogo-servicios/candy-bar-xv-luces-04.jpeg',
  '/media/catalogo-servicios/reposteria-torta-xv-01.jpeg',
  '/media/catalogo-servicios/reposteria-torta-servicio-02.jpeg',
  '/media/catalogo-servicios/reposteria-tortas-ak-03.jpeg',
  '/media/catalogo-servicios/postres-mesa-ak-01.jpeg',
  '/media/catalogo-servicios/reposteria_img_044_p06_x1148.jpeg',
  '/media/catalogo-servicios/reposteria_img_329_p39_x1914.jpeg',
  '/media/catalogo-servicios/reposteria_img_330_p39_x1915.jpeg',
  '/media/catalogo-servicios/reposteria_img_343_p42_x4303.jpeg',
  '/media/catalogo-servicios/reposteria_img_346_p42_x4322.jpeg',
  '/media/catalogo-servicios/catering_img_074_p09_x1198.jpeg',
  '/media/catalogo-servicios/catering_img_075_p09_x1199.jpeg',
  '/media/catalogo-servicios/catering_img_076_p09_x1200.jpeg',
  '/media/catalogo-servicios/catering_img_077_p09_x1201.jpeg',
  '/media/catalogo-servicios/catering_img_078_p09_x1202.jpeg',
  '/media/catalogo-servicios/catering_img_079_p09_x1203.jpeg',
  '/media/catalogo-servicios/catering_img_080_p09_x1204.jpeg',
];

const POOL_OTROS = [
  '/media/catalogo-servicios/blog_salon.png',
  '/media/catalogo-servicios/quinceanera_persuasiva.png',
  '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
  '/media/catalogo-servicios/organizador_equipo.png',
  '/media/catalogo-servicios/montaje_equipo.png',
  '/media/catalogo-servicios/familia_feliz_evento.png',
  '/media/catalogo-servicios/boda_persuasiva.png',
];

const POOL_GLOBAL_FALLBACK = [
  '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
  '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
  '/media/catalogo-servicios/catering_img_202_p19_x1580.jpeg',
  '/media/catalogo-servicios/catering_img_203_p19_x1581.jpeg',
  '/media/catalogo-servicios/catering_img_204_p19_x1582.jpeg',
  '/media/catalogo-servicios/catering_img_206_p19_x1584.jpeg',
  '/media/catalogo-servicios/catering_img_207_p20_x1592.jpeg',
  ...POOL_OTROS,
  ...POOL_DISCOTECA,
  ...POOL_DECORACION,
  ...POOL_FOTOGRAFIA,
  ...POOL_REPOSTERIA,
];

function getServiceThemePool(servicio: { id?: string; nombre?: string | null; categoria?: string | null }): string[] {
  const nombre = normalizeText(servicio.nombre);
  const categoria = normalizeText(servicio.categoria);
  const fullText = `${nombre} ${categoria}`;

  // Se pregunta por "glitter" ANTES que por "bar": si no, le toca la foto de los tragos.
  if (fullText.includes('glitter') || fullText.includes('maquillaje') || fullText.includes('make up') || fullText.includes('makeup') || fullText.includes('peluqueria')) {
    if (fullText.includes('glitter')) {
      return [GLITTER_BAR_FOTO_DE_EJEMPLO, '/media/catalogo-servicios/quinceanera_persuasiva.png', ...POOL_ENTRETENIMIENTO];
    }
    return ['/media/catalogo-servicios/quinceanera_persuasiva.png', ...POOL_OTROS];
  }
  if (fullText.includes('hielo')) {
    return ['/media/catalogo-servicios/barra_tragos_img_340_p41_x4284.jpeg', '/media/catalogo-servicios/barra_tragos_img_341_p41_x4287.jpeg', ...POOL_OTROS];
  }
  if (fullText.includes('club uruguay') || fullText.includes('salon')) {
    return ['/media/catalogo-servicios/blog_salon.png', '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg', ...POOL_OTROS];
  }
  if (fullText.includes('barra') || fullText.includes('trago') || fullText.includes('bebida') || fullText.includes('coctel') || fullText.includes('barman') || fullText.includes('cerveza') || fullText.includes('refresco')) {
    return [...POOL_BEBIDAS, ...POOL_GLOBAL_FALLBACK];
  }
  if (fullText.includes('vogue')) {
    return ['/media/catalogo-servicios/photobooth-vogue-01.jpeg', ...POOL_ENTRETENIMIENTO];
  }
  if (fullText.includes('espejo')) {
    return ['/media/catalogo-servicios/fotografia_cabina_img_252_p27_x1692.jpeg', ...POOL_ENTRETENIMIENTO];
  }
  if (fullText.includes('totem') || fullText.includes('ia')) {
    return ['/media/catalogo-servicios/tecnologia_fiesta.png', ...POOL_ENTRETENIMIENTO];
  }
  if (fullText.includes('fotocabina') || fullText.includes('cabina')) {
    return ['/media/catalogo-servicios/fotografia_cabina_img_220_p21_x1612.jpeg', '/media/catalogo-servicios/fotografia_cabina_img_221_p21_x1613.jpeg', ...POOL_ENTRETENIMIENTO];
  }
  if (fullText.includes('360') || fullText.includes('plataforma')) {
    return ['/media/catalogo-servicios/fotografia_cabina_img_263_p29_x1722.jpeg', '/media/catalogo-servicios/fotografia_cabina_img_264_p29_x1723.jpeg', ...POOL_ENTRETENIMIENTO];
  }
  if (fullText.includes('fuego')) {
    return ['/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', '/media/catalogo-servicios/discoteca_img_235_p23_x3749.jpeg', ...POOL_ENTRETENIMIENTO];
  }
  if (fullText.includes('candy') || fullText.includes('mesa dulce') || fullText.includes('golosina') || fullText.includes('torta') || fullText.includes('pastel') || fullText.includes('reposteria') || fullText.includes('postre')) {
    return [...POOL_REPOSTERIA, ...POOL_GLOBAL_FALLBACK];
  }
  if (fullText.includes('pista') && fullText.includes('grande')) {
    return ['/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', ...POOL_DISCOTECA];
  }
  if (fullText.includes('pista')) {
    return ['/media/catalogo-servicios/discoteca-iluminacion-bolas-01.jpeg', ...POOL_DISCOTECA];
  }
  if (fullText.includes('discoteca') || fullText.includes('dj') || fullText.includes('audio') || fullText.includes('sonido') || fullText.includes('iluminacion') || fullText.includes('luces')) {
    return [...POOL_DISCOTECA, ...POOL_GLOBAL_FALLBACK];
  }
  if (fullText.includes('filmac') || fullText.includes('video')) {
    return [...POOL_FILMACION, ...POOL_FOTOGRAFIA, ...POOL_GLOBAL_FALLBACK];
  }
  if (fullText.includes('foto') || fullText.includes('album')) {
    return [...POOL_FOTOGRAFIA, ...POOL_FILMACION, ...POOL_GLOBAL_FALLBACK];
  }
  if (fullText.includes('decoracion') || fullText.includes('deco') || fullText.includes('ambientacion') || fullText.includes('centro') || fullText.includes('banner') || fullText.includes('cuadro') || fullText.includes('divan')) {
    return [...POOL_DECORACION, ...POOL_GLOBAL_FALLBACK];
  }
  if (categoria.includes('entreten')) {
    return [...POOL_ENTRETENIMIENTO, ...POOL_GLOBAL_FALLBACK];
  }
  if (categoria.includes('otros')) {
    return [...POOL_OTROS, ...POOL_GLOBAL_FALLBACK];
  }
  return POOL_GLOBAL_FALLBACK;
}

const POOL_BEBIDAS = [
  '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_289_p34_x1805.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_290_p34_x1806.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_292_p34_x1808.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_293_p34_x1809.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_339_p41_x4281.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_340_p41_x4284.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_341_p41_x4287.jpeg',
  '/media/catalogo-servicios/barra_tragos_img_342_p41_x4290.jpeg',
  '/media/catalogo-servicios/blog_bebidas.png',
];

function getCategoryHeroFallback(categoria: string): string {
  const c = normalizeText(categoria);
  if (c.includes('entreten')) return '/media/catalogo-servicios/tecnologia_fiesta.png';
  if (c.includes('otros')) return '/media/catalogo-servicios/blog_salon.png';
  if (c.includes('discoteca') || c.includes('dj') || c.includes('sonido') || c.includes('iluminac')) {
    return '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg';
  }
  if (c.includes('filmac') || c.includes('video')) return '/media/catalogo-servicios/fotografia_cabina_img_266_p29_x1725.jpeg';
  if (c.includes('foto')) return '/media/catalogo-servicios/fotografia_cabina_img_255_p27_x1695.jpeg';
  if (c.includes('decorac') || c.includes('ambientac')) return '/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg';
  if (c.includes('reposter') || c.includes('torta') || c.includes('candy')) return '/media/catalogo-servicios/reposteria-torta-xv-01.jpeg';
  if (c.includes('barra') || c.includes('bebida')) return '/media/catalogo-servicios/barra-tragos-ak-01.jpeg';
  return '/media/catalogo-servicios/recepcion-display-evento-01.jpeg';
}

function categoryMatchesCatalog(catalogoCat: string, slideCat: string): boolean {
  const cat = normalizeText(catalogoCat);
  const slide = normalizeText(slideCat);
  if (cat === slide) return true;
  if ((slide.includes('discoteca') || slide.includes('dj') || slide.includes('sonido')) && cat.includes('discoteca')) return true;
  if (slide.includes('fotograf') && (cat.includes('fotograf') || cat.includes('cabina'))) return true;
  if (slide.includes('decorac') && cat.includes('decorac')) return true;
  if ((slide.includes('reposter') || slide.includes('candy')) && (cat.includes('reposter') || cat.includes('candy'))) return true;
  if ((slide.includes('bebida') || slide.includes('barra')) && (cat.includes('barra') || cat.includes('bebida'))) return true;
  return false;
}

interface CategoriaServiciosSlideProps {
  categoria: string;
  servicios: ServicioEmpresa[];
  selectedServices: string[];
  onToggleSelect: (id: string) => void;
  mostrarPrecios: boolean;
  categoriaIndex: number;
  totalCategorias: number;
  catalogoFotos?: CatalogoFoto[];
  tipoFiesta?: string;
  /** Map of service ID -> uploaded LED photo URL */
  ledFotoMap?: Record<string, string>;
  /** Called when user clicks 'Ver experiencia visual' to open inline gallery */
  onOpenGallery?: (categoria: string, subcategoria?: string) => void;
}

function getServiceIcon(categoria?: string) {
  if (!categoria) return <Package className="h-8 w-8" />;
  const c = categoria.toLowerCase();
  if (c.includes('musica') || c.includes('música') || c.includes('discoteca') || c.includes('dj') || c.includes('sonido')) return <Music className="h-8 w-8" />;
  if (c.includes('fotografia') || c.includes('fotografía') || c.includes('filmacion') || c.includes('filmación') || c.includes('video') || c.includes('foto')) return <Camera className="h-8 w-8" />;
  if (c.includes('catering') || c.includes('bebida') || c.includes('reposteria') || c.includes('repostería') || c.includes('menu') || c.includes('menú') || c.includes('gastro')) return <Utensils className="h-8 w-8" />;
  if (c.includes('decoracion') || c.includes('decoración')) return <Palette className="h-8 w-8" />;
  if (c.includes('personal') || c.includes('coordinac')) return <Users className="h-8 w-8" />;
  if (c.includes('entretenimiento') || c.includes('show') || c.includes('animac')) return <Zap className="h-8 w-8" />;
  if (c.includes('regalo')) return <Gift className="h-8 w-8" />;
  return <Sparkles className="h-8 w-8" />;
}

function formatPrice(servicio: ServicioEmpresa): string | null {
  if (servicio.calculationMethod === 'porPersona' && servicio.precioPorPersona) {
    return `$${servicio.precioPorPersona.toLocaleString('es-UY')} / persona`;
  }
  if (servicio.precioVenta) {
    return `$${servicio.precioVenta.toLocaleString('es-UY')}`;
  }
  return null;
}

function getCatalogSpecsForService(categoria?: string, nombre?: string): string[] {
  if (!categoria && !nombre) return [];
  const lower = (categoria ?? '').toLowerCase();
  const nombreLower = (nombre ?? '').toLowerCase();
  const match = SERVICES.find(s => {
    const sLabel = s.label.toLowerCase();
    const sId = s.id.toLowerCase();
    return lower.includes(sId) || lower.includes(sLabel) ||
      nombreLower.includes(sId) || nombreLower.includes(sLabel);
  });
  if (match) return match.specs;
  return [];
}

function findPhotoForService(
  servicio: ServicioEmpresa,
  catalogoFotos: CatalogoFoto[],
  tipoFiesta: string,
  usedUrls: Set<string>,
): string | null {
  const safeFotos = catalogoFotos.filter(f => isSafeHttpsUrl(f.url) && !usedUrls.has(f.url));
  const nombreLower = normalizeText(servicio.nombre);

  const byNombre = safeFotos.filter(f => {
    const tituloLower = normalizeText(f.titulo);
    return tituloLower && nombreLower && (
      tituloLower.includes(nombreLower) || nombreLower.includes(tituloLower)
    );
  });

  const byCategoria = safeFotos.filter(f =>
    categoryMatchesCatalog(f.categoriaServicio, servicio.categoria ?? ''),
  );

  const candidates = byNombre.length > 0 ? byNombre : byCategoria;
  if (candidates.length === 0) return null;

  if (tipoFiesta) {
    const byTipo = candidates.filter(
      f => f.tipoFiesta && normalizeText(f.tipoFiesta) === normalizeText(tipoFiesta),
    );
    if (byTipo.length > 0) return byTipo[0].url;
  }
  const generic = candidates.filter(f => !f.tipoFiesta);
  if (generic.length > 0) return generic[0].url;
  return candidates[0].url;
}

function ServicioCard({
  servicio,
  isSelected,
  onToggle,
  mostrarPrecios,
  fotoUrl,
  fallbackUrl,
  onOpenGallery,
}: {
  servicio: ServicioEmpresa;
  isSelected: boolean;
  onToggle: () => void;
  mostrarPrecios: boolean;
  fotoUrl: string;
  fallbackUrl: string;
  onOpenGallery?: (categoria: string, subcategoria?: string) => void;
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const specs = getCatalogSpecsForService(servicio.categoria, servicio.nombre);
  const price = mostrarPrecios ? formatPrice(servicio) : null;
  const activeSrc = !imgFailed && isSafeHttpsUrl(fotoUrl) ? fotoUrl : fallbackUrl;

  const handleGallery = () => {
    if (onOpenGallery) {
      onOpenGallery(servicio.categoria ?? '', servicio.subcategoria ?? undefined);
    }
  };

  return (
    <div
      data-testid="servicio-card"
      className={cn(
        'overflow-hidden rounded-2xl border-2 transition-all duration-200',
        isSelected
          ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_32px_rgba(16,185,129,0.16)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      )}
    >
      <div className="relative h-28 w-full md:h-32 overflow-hidden bg-slate-900">
        <Image
          src={activeSrc}
          alt={servicio.nombre}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
          unoptimized
          className="object-cover"
          onError={() => {
            if (!imgFailed) setImgFailed(true);
          }}
        />
      </div>
      <div className="p-3 md:p-3.5">
        <div className="flex items-start gap-2.5">
          <button
            onClick={onToggle}
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-white/30 hover:border-white/60',
            )}
            aria-label={isSelected ? 'Quitar de la propuesta' : 'Agregar a la propuesta'}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-black leading-tight text-white md:text-base">{servicio.nombre}</h3>
              {price && (
                <span className="shrink-0 text-xs font-black text-emerald-300">{price}</span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Agregar a propuesta</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-3">
          {servicio.notas && (
            <button
              onClick={() => setShowDesc(v => !v)}
              className="flex items-center gap-1 text-xs font-bold text-red-200 transition-colors hover:text-red-100"
            >
              <Info className="h-3.5 w-3.5" />
              {showDesc ? 'Ocultar' : 'Detalle'}
            </button>
          )}
          <button
            onClick={handleGallery}
            className="flex items-center gap-1 text-xs font-bold text-emerald-200 transition-colors hover:text-emerald-100"
          >
            <Images className="h-3.5 w-3.5" />
            Ver experiencia visual
          </button>
          {specs.length > 0 && (
            <button
              onClick={() => setShowSpecs(v => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white/70"
            >
              <ListChecks className="h-3.5 w-3.5" />
              {showSpecs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showDesc && servicio.notas && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-2.5 border-t border-white/10 pt-2.5 text-xs leading-relaxed text-white/66">
                {servicio.notas}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSpecs && specs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-3.5 pb-3 pt-2.5">
              <ul className="space-y-1">
                {specs.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CategoriaServiciosSlide({
  categoria,
  servicios,
  selectedServices,
  onToggleSelect,
  mostrarPrecios,
  categoriaIndex,
  totalCategorias,
  catalogoFotos = [],
  tipoFiesta = '',
  ledFotoMap = {},
  onOpenGallery,
}: CategoriaServiciosSlideProps) {
  const allSelected = servicios.every(s => selectedServices.includes(s.id));
  const anySelected = servicios.some(s => selectedServices.includes(s.id));
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const fotosCategoria = useMemo(() => {
    const byCategoria = catalogoFotos.filter(
      f => isSafeHttpsUrl(f.url) && categoryMatchesCatalog(f.categoriaServicio, categoria),
    );

    if (tipoFiesta) {
      const byTipo = byCategoria.filter(
        f => f.tipoFiesta && normalizeText(f.tipoFiesta) === normalizeText(tipoFiesta),
      );
      if (byTipo.length > 0) return byTipo.slice(0, 4);
    }

    const genericas = byCategoria.filter(f => !f.tipoFiesta);
    if (genericas.length > 0) return genericas.slice(0, 4);

    return byCategoria.slice(0, 4);
  }, [catalogoFotos, categoria, tipoFiesta]);

  const visibleFotos = useMemo(
    () => fotosCategoria.filter(f => !failedIds.has(f.id)),
    [fotosCategoria, failedIds],
  );

  const categoryHeroFallback = useMemo(
    () => getCategoryHeroFallback(categoria),
    [categoria],
  );

  // Asignamos una foto única por tarjeta dentro de la misma lámina.
  const servicePhotos = useMemo(() => {
    const usedUrls = new Set<string>();
    const map: Record<string, { primary: string; fallback: string }> = {};

    for (const servicio of servicios) {
      const pool = getServiceThemePool(servicio);
      let chosen: string | null = null;

      const ledUrl = ledFotoMap[servicio.id];
      if (ledUrl && isSafeHttpsUrl(ledUrl) && !usedUrls.has(ledUrl)) {
        chosen = ledUrl;
      }

      if (!chosen && servicio.imageUrl && isSafeHttpsUrl(servicio.imageUrl) && !usedUrls.has(servicio.imageUrl)) {
        chosen = servicio.imageUrl;
      }

      if (!chosen) {
        const catPhoto = findPhotoForService(servicio, catalogoFotos, tipoFiesta, usedUrls);
        if (catPhoto && !usedUrls.has(catPhoto)) {
          chosen = catPhoto;
        }
      }

      if (!chosen) {
        chosen = pool.find(url => !usedUrls.has(url)) ?? null;
      }

      if (!chosen) {
        chosen = POOL_GLOBAL_FALLBACK.find(url => !usedUrls.has(url)) ?? pool[0] ?? categoryHeroFallback;
      }

      usedUrls.add(chosen);
      const fallback = pool.find(url => url !== chosen) ?? categoryHeroFallback;
      map[servicio.id] = { primary: chosen, fallback };
    }

    return map;
  }, [servicios, ledFotoMap, catalogoFotos, tipoFiesta, categoryHeroFallback]);

  return (
    <SlideLayout overflowScroll>
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1680px]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/85 md:h-14 md:w-14">
            {getServiceIcon(categoria)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className="border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-black uppercase tracking-widest text-white/64">
                Experiencia {categoriaIndex + 1} de {totalCategorias}
              </Badge>
              {anySelected && (
                <Badge className="border border-emerald-400/30 bg-emerald-500/20 px-3 py-0.5 text-xs text-emerald-300">
                  <Check className="mr-1 h-3 w-3" />
                  {servicios.filter(s => selectedServices.includes(s.id)).length} en propuesta
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-normal text-white drop-shadow-lg md:text-4xl xl:text-5xl">
              {categoria}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr] 2xl:gap-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            {visibleFotos.length > 0 ? (
              <div className={cn(
                'grid gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2',
                visibleFotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}>
                {visibleFotos.map((foto) => (
                  <div
                    key={foto.id}
                    className={cn(
                      'relative w-full rounded-xl overflow-hidden',
                      visibleFotos.length === 1 ? 'aspect-[16/10]' : 'aspect-[4/3]',
                    )}
                  >
                    <Image
                      src={foto.url}
                      alt={foto.titulo ?? categoria}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      unoptimized
                      className="object-cover"
                      onError={() => setFailedIds(prev => new Set(prev).add(foto.id))}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                <div className="relative h-full w-full rounded-xl overflow-hidden">
                  <Image
                    src={categoryHeroFallback}
                    alt={categoria}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {onOpenGallery && (
              <button
                onClick={() => onOpenGallery(categoria)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 py-2 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-500/25 hover:text-indigo-200"
              >
                <Images className="h-3.5 w-3.5" />
                Ver galería completa
              </button>
            )}

            {servicios.length > 1 && (
              <button
                onClick={() => {
                  if (allSelected) {
                    servicios.forEach(s => { if (selectedServices.includes(s.id)) onToggleSelect(s.id); });
                  } else {
                    servicios.forEach(s => { if (!selectedServices.includes(s.id)) onToggleSelect(s.id); });
                  }
                }}
                className={cn(
                  'w-full rounded-xl border py-2.5 text-sm font-black transition-all',
                  allSelected
                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    : 'border-white/20 bg-white/5 text-white/64 hover:bg-white/10',
                )}
              >
                {allSelected ? 'Todo incluido en la propuesta' : 'Incluir todas las opciones'}
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            {servicios.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 md:col-span-2">
                Elegí el tipo de fiesta para ver opciones personalizadas.
              </div>
            ) : (
              servicios.map((servicio, i) => {
                const fotoInfo = servicePhotos[servicio.id] ?? {
                  primary: categoryHeroFallback,
                  fallback: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
                };
                return (
                  <motion.div
                    key={servicio.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                  >
                    <ServicioCard
                      servicio={servicio}
                      isSelected={selectedServices.includes(servicio.id)}
                      onToggle={() => onToggleSelect(servicio.id)}
                      mostrarPrecios={mostrarPrecios}
                      fotoUrl={fotoInfo.primary}
                      fallbackUrl={fotoInfo.fallback}
                      onOpenGallery={onOpenGallery}
                    />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

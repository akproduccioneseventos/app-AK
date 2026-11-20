import type { InvitacionDigitalConfig } from '@/types/fiesta';

export type TipoFiestaFondo = '15' | 'boda' | 'cumpleanos' | 'empresa';
export type CategoriaMovimientoFondo = 'quieto' | 'animado';
export type AnimacionFondoTipo =
  | 'ninguna'
  | 'degradado_suave'
  | 'shimmer_dorado'
  | 'aurora'
  | 'brillos'
  | 'particulas_fiesta'
  | 'ondas'
  | 'destellos'
  | 'confeti';

export interface PaletaFondoSugerida {
  primary: string;
  secondary: string;
  accent: string;
}

export interface FondoInvitacion {
  id: string;
  nombre: string;
  tipoFiesta: TipoFiestaFondo;
  enMovimiento: boolean;
  movimiento: CategoriaMovimientoFondo;
  origen: 'css' | 'foto' | 'particulas';
  cssBackground: string;
  imagenUrl?: string;
  animacionTipo: AnimacionFondoTipo;
  particulasTipo?: string;
  paletaSugerida: PaletaFondoSugerida;
  etiqueta?: string;
}

export type FuenteInvitacionId = 'elegante' | 'moderna' | 'romantica' | 'editorial' | 'impacto';

export interface FuenteInvitacionPreset {
  id: FuenteInvitacionId;
  nombre: string;
  descripcion: string;
  headingClass: string;
  bodyClass: string;
}

export const FUENTES_INVITACION: FuenteInvitacionPreset[] = [
  {
    id: 'elegante',
    nombre: 'Clásica Elegante',
    descripcion: 'Serif fina y distinguida',
    headingClass: 'font-playfair font-bold tracking-wide',
    bodyClass: 'font-body',
  },
  {
    id: 'moderna',
    nombre: 'Moderna Limpia',
    descripcion: 'Sans-serif minimalista',
    headingClass: 'font-body font-semibold tracking-tight',
    bodyClass: 'font-body',
  },
  {
    id: 'romantica',
    nombre: 'Romántica Script',
    descripcion: 'Trazos suaves y cálidos',
    headingClass: 'font-dancing text-4xl sm:text-5xl font-semibold',
    bodyClass: 'font-body',
  },
  {
    id: 'editorial',
    nombre: 'Editorial Vogue',
    descripcion: 'Itálica sofisticada',
    headingClass: 'font-playfair italic font-medium tracking-wider',
    bodyClass: 'font-body font-light',
  },
  {
    id: 'impacto',
    nombre: 'Fiesta Impacto',
    descripcion: 'Mayúsculas con presencia',
    headingClass: 'font-body font-black tracking-widest uppercase',
    bodyClass: 'font-body',
  },
];

export type InvitacionConfigConEstilo = InvitacionDigitalConfig & {
  fondoId?: string;
  fuenteId?: FuenteInvitacionId;
};

type SeedFondo = {
  slug: string;
  nombre: string;
  cssBackground: string;
  paletaSugerida: PaletaFondoSugerida;
  imagenUrl?: string;
  particulasTipo?: string;
  animacionTipo?: AnimacionFondoTipo;
  etiqueta?: string;
};

function crearFondosPorTipo(
  tipoFiesta: TipoFiestaFondo,
  quietosSeed: SeedFondo[],
  animadosSeed: SeedFondo[]
): FondoInvitacion[] {
  const quietos: FondoInvitacion[] = quietosSeed.map((item) => ({
    id: `${tipoFiesta}-q-${item.slug}`,
    nombre: item.nombre,
    tipoFiesta,
    enMovimiento: false,
    movimiento: 'quieto',
    origen: item.imagenUrl ? 'foto' : 'css',
    cssBackground: item.cssBackground,
    imagenUrl: item.imagenUrl,
    animacionTipo: 'ninguna',
    paletaSugerida: item.paletaSugerida,
    etiqueta: item.etiqueta ?? (item.imagenUrl ? 'Foto AK' : 'Quieto'),
  }));

  const animados: FondoInvitacion[] = animadosSeed.map((item) => ({
    id: `${tipoFiesta}-a-${item.slug}`,
    nombre: item.nombre,
    tipoFiesta,
    enMovimiento: true,
    movimiento: 'animado',
    origen: item.imagenUrl ? 'foto' : item.particulasTipo ? 'particulas' : 'css',
    cssBackground: item.cssBackground,
    imagenUrl: item.imagenUrl,
    animacionTipo: item.animacionTipo ?? (item.particulasTipo ? 'particulas_fiesta' : 'degradado_suave'),
    particulasTipo: item.particulasTipo,
    paletaSugerida: item.paletaSugerida,
    etiqueta: item.etiqueta ?? (item.particulasTipo ? 'Partículas' : 'En movimiento'),
  }));

  return [...quietos, ...animados];
}

// ─── 15 AÑOS (20 quietos + 20 en movimiento = 40) ───────────────────────────
const FONDOS_15_QUIETOS: SeedFondo[] = [
  { slug: 'rosa-champagne', nombre: 'Rosa Champagne', cssBackground: 'linear-gradient(135deg, #be185d 0%, #f9a8d4 52%, #fef3c7 100%)', paletaSugerida: { primary: '#be185d', secondary: '#fce7f3', accent: '#d97706' } },
  { slug: 'lila-imperial', nombre: 'Lila Imperial', cssBackground: 'linear-gradient(145deg, #581c87 0%, #9333ea 55%, #f3e8ff 100%)', paletaSugerida: { primary: '#7e22ce', secondary: '#f3e8ff', accent: '#c084fc' } },
  { slug: 'noche-neon', nombre: 'Noche Neón', cssBackground: 'radial-gradient(circle at 25% 20%, #d946ef 0%, #3b0764 48%, #020617 100%)', paletaSugerida: { primary: '#d946ef', secondary: '#1e1b4b', accent: '#22d3ee' } },
  { slug: 'dorado-princesa', nombre: 'Dorado Princesa', cssBackground: 'linear-gradient(135deg, #78350f 0%, #d4a574 50%, #fef9c3 100%)', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#78350f' } },
  { slug: 'turquesa-caribe', nombre: 'Turquesa Caribe', cssBackground: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 55%, #ecfeff 100%)', paletaSugerida: { primary: '#0d9488', secondary: '#ccfbf1', accent: '#115e59' } },
  { slug: 'azul-zafiro', nombre: 'Azul Zafiro', cssBackground: 'radial-gradient(ellipse at top, #1d4ed8 0%, #1e1b4b 55%, #09090b 100%)', paletaSugerida: { primary: '#2563eb', secondary: '#e0e7ff', accent: '#60a5fa' } },
  { slug: 'coral-atardecer', nombre: 'Coral Atardecer', cssBackground: 'linear-gradient(135deg, #e11d48 0%, #fb7185 50%, #ffedd5 100%)', paletaSugerida: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#f97316' } },
  { slug: 'violeta-aterciopelado', nombre: 'Violeta Aterciopelado', cssBackground: 'linear-gradient(160deg, #2e1065 0%, #6d28d9 60%, #a78bfa 100%)', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#c4b5fd' } },
  { slug: 'esmeralda-glam', nombre: 'Esmeralda Glam', cssBackground: 'linear-gradient(135deg, #064e3b 0%, #10b981 55%, #d1fae5 100%)', paletaSugerida: { primary: '#059669', secondary: '#d1fae5', accent: '#fbbf24' } },
  { slug: 'petalo-suave', nombre: 'Pétalo Suave', cssBackground: 'linear-gradient(135deg, #9d174d 0%, #f472b6 50%, #fff1f2 100%)', paletaSugerida: { primary: '#db2777', secondary: '#fdf2f8', accent: '#be185d' } },
  { slug: 'silver-minimal', nombre: 'Plata Minimal', cssBackground: 'linear-gradient(145deg, #334155 0%, #94a3b8 52%, #f8fafc 100%)', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#64748b' } },
  { slug: 'fucsia-electrico', nombre: 'Fucsia Eléctrico', cssBackground: 'radial-gradient(circle at 75% 25%, #f43f5e 0%, #831843 50%, #18020c 100%)', paletaSugerida: { primary: '#f43f5e', secondary: '#ffe4e6', accent: '#fbbf24' } },
  { slug: 'lavanda-suenos', nombre: 'Lavanda Sueños', cssBackground: 'linear-gradient(135deg, #4338ca 0%, #a5b4fc 55%, #eef2ff 100%)', paletaSugerida: { primary: '#4f46e5', secondary: '#e0e7ff', accent: '#818cf8' } },
  { slug: 'negro-oro-xv', nombre: 'Negro & Oro XV', cssBackground: 'radial-gradient(circle at 50% 30%, #451a03 0%, #18181b 55%, #09090b 100%)', paletaSugerida: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' } },
  { slug: 'foto-quinceanera-hero', nombre: 'Gala de XV AK', cssBackground: 'linear-gradient(135deg, #4c1d95 0%, #db2777 100%)', imagenUrl: '/media/catalogo-servicios/quinceanera_hero.png', paletaSugerida: { primary: '#be185d', secondary: '#fce7f3', accent: '#9333ea' } },
  { slug: 'foto-quinceanera-persuasiva', nombre: 'Noche de Reina', cssBackground: 'linear-gradient(135deg, #701a75 0%, #1e1b4b 100%)', imagenUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png', paletaSugerida: { primary: '#a21caf', secondary: '#fae8ff', accent: '#f59e0b' } },
  { slug: 'foto-xv-rosa', nombre: 'Decoración Rosa XV', cssBackground: 'linear-gradient(135deg, #9d174d 0%, #f472b6 100%)', imagenUrl: '/media/catalogo-servicios/xv-decoracion-rosa-01.jpeg', paletaSugerida: { primary: '#db2777', secondary: '#fdf2f8', accent: '#f472b6' } },
  { slug: 'foto-xv-lila', nombre: 'Ambientación Lila XV', cssBackground: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)', imagenUrl: '/media/catalogo-servicios/decoracion-xv-lila-01.jpeg', paletaSugerida: { primary: '#7e22ce', secondary: '#f3e8ff', accent: '#c084fc' } },
  { slug: 'foto-xv-luces', nombre: 'Luces Mágicas XV', cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 100%)', imagenUrl: '/media/catalogo-servicios/decoracion-xv-luces-01.jpeg', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#38bdf8' } },
  { slug: 'foto-xv-pista', nombre: 'Pista Iluminada XV', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)', imagenUrl: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', paletaSugerida: { primary: '#4f46e5', secondary: '#e0e7ff', accent: '#ec4899' } },
];

const FONDOS_15_ANIMADOS: SeedFondo[] = [
  { slug: 'aurora-xv', nombre: 'Aurora Boreal XV', cssBackground: 'linear-gradient(125deg, #4c1d95 0%, #db2777 45%, #06b6d4 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#db2777', secondary: '#fae8ff', accent: '#06b6d4' } },
  { slug: 'mariposas-rosa', nombre: 'Mariposas & Flores', cssBackground: 'linear-gradient(135deg, #9d174d 0%, #ec4899 50%, #fbcfe8 100%)', particulasTipo: 'XV Años', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#db2777', secondary: '#fce7f3', accent: '#9d174d' } },
  { slug: 'destellos-reina', nombre: 'Destellos de Reina', cssBackground: 'radial-gradient(circle at 30% 30%, #a855f7 0%, #3b0764 55%, #090514 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#9333ea', secondary: '#f3e8ff', accent: '#fbbf24' } },
  { slug: 'shimmer-gold-xv', nombre: 'Lluvia Dorada XV', cssBackground: 'linear-gradient(135deg, #451a03 0%, #d97706 48%, #fde68a 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#f59e0b' } },
  { slug: 'ondas-magenta', nombre: 'Ondas Magenta', cssBackground: 'linear-gradient(135deg, #701a75 0%, #e879f9 55%, #311042 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#c026d3', secondary: '#fae8ff', accent: '#f472b6' } },
  { slug: 'galaxia-cyan', nombre: 'Galaxia Cyan & Rosa', cssBackground: 'linear-gradient(135deg, #083344 0%, #7c3aed 52%, #ec4899 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#7c3aed', secondary: '#e0f2fe', accent: '#ec4899' } },
  { slug: 'brillos-champagne', nombre: 'Brillos Champagne', cssBackground: 'linear-gradient(140deg, #831843 0%, #be185d 45%, #fde68a 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#be185d', secondary: '#fff1f2', accent: '#d97706' } },
  { slug: 'degradado-neon-club', nombre: 'Club Neón Vivo', cssBackground: 'linear-gradient(125deg, #0f172a 0%, #c026d3 50%, #06b6d4 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#c026d3', secondary: '#ecfeff', accent: '#06b6d4' } },
  { slug: 'mariposas-lila', nombre: 'Vuelo Lila Mágico', cssBackground: 'linear-gradient(135deg, #3b0764 0%, #7e22ce 50%, #e9d5ff 100%)', particulasTipo: 'XV Años', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#7e22ce', secondary: '#f3e8ff', accent: '#a855f7' } },
  { slug: 'ondas-esmeralda', nombre: 'Esmeralda Fluida', cssBackground: 'linear-gradient(135deg, #022c22 0%, #059669 52%, #34d399 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#059669', secondary: '#d1fae5', accent: '#fbbf24' } },
  { slug: 'destellos-zafiro', nombre: 'Estrellas Zafiro', cssBackground: 'radial-gradient(circle at 60% 40%, #2563eb 0%, #1e1b4b 60%, #020617 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#2563eb', secondary: '#dbeafe', accent: '#93c5fd' } },
  { slug: 'aurora-pastel', nombre: 'Aurora Pastel XV', cssBackground: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #38bdf8 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#ec4899', secondary: '#fdf2f8', accent: '#38bdf8' } },
  { slug: 'shimmer-rose-gold', nombre: 'Rose Gold Vivo', cssBackground: 'linear-gradient(135deg, #881337 0%, #fb7185 50%, #fed7aa 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#fb923c' } },
  { slug: 'particulas-turquesa', nombre: 'Brisa Turquesa', cssBackground: 'linear-gradient(135deg, #164e63 0%, #0891b2 55%, #67e8f9 100%)', particulasTipo: 'XV Años', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#0891b2', secondary: '#cffafe', accent: '#f472b6' } },
  { slug: 'degradado-rubi', nombre: 'Rubí en Movimiento', cssBackground: 'linear-gradient(135deg, #4c0519 0%, #be123c 50%, #fda4af 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#be123c', secondary: '#ffe4e6', accent: '#fbbf24' } },
  { slug: 'foto-animada-xv-hero', nombre: 'Gala XV (Zoom Vivo)', cssBackground: 'linear-gradient(135deg, #4c1d95 0%, #db2777 100%)', imagenUrl: '/media/catalogo-servicios/quinceanera_hero.png', animacionTipo: 'brillos', paletaSugerida: { primary: '#be185d', secondary: '#fce7f3', accent: '#9333ea' } },
  { slug: 'foto-animada-xv-equipo', nombre: 'Salón XV (Con Movimiento)', cssBackground: 'linear-gradient(135deg, #701a75 0%, #ec4899 100%)', imagenUrl: '/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#c026d3', secondary: '#fae8ff', accent: '#f59e0b' } },
  { slug: 'foto-animada-xv-mesa', nombre: 'Mesa Principal XV (Viva)', cssBackground: 'linear-gradient(135deg, #3b0764 0%, #db2777 100%)', imagenUrl: '/media/catalogo-servicios/xv-mesa-principal-ak-02.jpeg', particulasTipo: 'XV Años', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#9333ea', secondary: '#f3e8ff', accent: '#ec4899' } },
  { slug: 'foto-animada-candy-xv', nombre: 'Candy Bar XV (Luces)', cssBackground: 'linear-gradient(135deg, #831843 0%, #be185d 100%)', imagenUrl: '/media/catalogo-servicios/candy-bar-xv-01.jpeg', animacionTipo: 'destellos', paletaSugerida: { primary: '#db2777', secondary: '#fdf2f8', accent: '#fbbf24' } },
  { slug: 'foto-animada-candy-luces', nombre: 'Candy Luces XV (Vivo)', cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #9333ea 100%)', imagenUrl: '/media/catalogo-servicios/candy-bar-xv-luces-04.jpeg', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#7e22ce', secondary: '#f3e8ff', accent: '#ec4899' } },
];

// ─── BODA (20 quietos + 20 en movimiento = 40) ──────────────────────────────
const FONDOS_BODA_QUIETOS: SeedFondo[] = [
  { slug: 'marfil-dorado', nombre: 'Marfil & Oro', cssBackground: 'linear-gradient(135deg, #78350f 0%, #d4a574 52%, #fdfbf7 100%)', paletaSugerida: { primary: '#92400e', secondary: '#fef3c7', accent: '#b45309' } },
  { slug: 'verde-oliva', nombre: 'Oliva & Crema', cssBackground: 'linear-gradient(135deg, #365314 0%, #65a30d 45%, #f7fee7 100%)', paletaSugerida: { primary: '#4d7c0f', secondary: '#ecfccb', accent: '#a16207' } },
  { slug: 'borgoña-clasico', nombre: 'Borgoña Clásico', cssBackground: 'radial-gradient(circle at 30% 30%, #881337 0%, #4c0519 60%, #1c050d 100%)', paletaSugerida: { primary: '#9f1239', secondary: '#ffe4e6', accent: '#d97706' } },
  { slug: 'eucalipto-campo', nombre: 'Eucalipto Campo', cssBackground: 'linear-gradient(135deg, #115e59 0%, #5eead4 55%, #f0fdfa 100%)', paletaSugerida: { primary: '#0f766e', secondary: '#ccfbf1', accent: '#92400e' } },
  { slug: 'rosa-empolvado', nombre: 'Rosa Empolvado', cssBackground: 'linear-gradient(135deg, #9d174d 0%, #f9a8d4 55%, #fff1f2 100%)', paletaSugerida: { primary: '#be185d', secondary: '#fce7f3', accent: '#9f1239' } },
  { slug: 'azul-marino-gala', nombre: 'Azul Marino Gala', cssBackground: 'linear-gradient(145deg, #0f172a 0%, #1e3a8a 55%, #bfdbfe 100%)', paletaSugerida: { primary: '#1e3a8a', secondary: '#dbeafe', accent: '#d97706' } },
  { slug: 'terracota-boho', nombre: 'Terracota Boho', cssBackground: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 52%, #ffedd5 100%)', paletaSugerida: { primary: '#c2410c', secondary: '#ffedd5', accent: '#78350f' } },
  { slug: 'perla-minimal', nombre: 'Perla Minimalista', cssBackground: 'linear-gradient(135deg, #44403c 0%, #a8a29e 52%, #fafaf9 100%)', paletaSugerida: { primary: '#57534e', secondary: '#f5f5f4', accent: '#b45309' } },
  { slug: 'champagne-noche', nombre: 'Champagne Nocturno', cssBackground: 'radial-gradient(ellipse at top, #451a03 0%, #1c1917 65%, #09090b 100%)', paletaSugerida: { primary: '#d97706', secondary: '#fef3c7', accent: '#e7e5e4' } },
  { slug: 'lavanda-romantica', nombre: 'Lavanda Romántica', cssBackground: 'linear-gradient(135deg, #4c1d95 0%, #c4b5fd 55%, #faf5ff 100%)', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#a78bfa' } },
  { slug: 'salvia-elegante', nombre: 'Salvia Elegante', cssBackground: 'linear-gradient(135deg, #14532d 0%, #86efac 55%, #f0fdf4 100%)', paletaSugerida: { primary: '#15803d', secondary: '#dcfce7', accent: '#a16207' } },
  { slug: 'marsala-romance', nombre: 'Marsala Romance', cssBackground: 'linear-gradient(135deg, #450a0a 0%, #991b1b 52%, #fecaca 100%)', paletaSugerida: { primary: '#991b1b', secondary: '#fee2e2', accent: '#d97706' } },
  { slug: 'celeste-cielo', nombre: 'Celeste Sereno', cssBackground: 'linear-gradient(135deg, #0369a1 0%, #7dd3fc 55%, #f0f9ff 100%)', paletaSugerida: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#0369a1' } },
  { slug: 'negro-smoking', nombre: 'Smoking Clásico', cssBackground: 'radial-gradient(circle at 50% 25%, #27272a 0%, #18181b 60%, #09090b 100%)', paletaSugerida: { primary: '#18181b', secondary: '#f4f4f5', accent: '#d4a574' } },
  { slug: 'foto-boda-dorada', nombre: 'Boda Dorada AK', cssBackground: 'linear-gradient(135deg, #78350f 0%, #d4a574 100%)', imagenUrl: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#78350f' } },
  { slug: 'foto-boda-persuasiva', nombre: 'Ceremonia Elegante', cssBackground: 'linear-gradient(135deg, #44403c 0%, #d4a574 100%)', imagenUrl: '/media/catalogo-servicios/boda_persuasiva.png', paletaSugerida: { primary: '#92400e', secondary: '#fef3c7', accent: '#57534e' } },
  { slug: 'foto-boda-mesa', nombre: 'Mesa de Boda AK', cssBackground: 'linear-gradient(135deg, #57534e 0%, #d6d3d1 100%)', imagenUrl: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg', paletaSugerida: { primary: '#78716c', secondary: '#f5f5f4', accent: '#b45309' } },
  { slug: 'foto-boda-centro', nombre: 'Centros de Mesa', cssBackground: 'linear-gradient(135deg, #78350f 0%, #a16207 100%)', imagenUrl: '/media/catalogo-servicios/decoracion-centro-mesa-01.jpeg', paletaSugerida: { primary: '#a16207', secondary: '#fef9c3', accent: '#78350f' } },
  { slug: 'foto-boda-catering', nombre: 'Banquete de Gala', cssBackground: 'linear-gradient(135deg, #292524 0%, #78716c 100%)', imagenUrl: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg', paletaSugerida: { primary: '#57534e', secondary: '#f5f5f4', accent: '#d97706' } },
  { slug: 'foto-boda-salon', nombre: 'Salón Iluminado', cssBackground: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', imagenUrl: '/media/catalogo-servicios/blog_salon.png', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#d97706' } },
];

const FONDOS_BODA_ANIMADOS: SeedFondo[] = [
  { slug: 'anillos-luz', nombre: 'Anillos & Destellos', cssBackground: 'linear-gradient(135deg, #78350f 0%, #d4a574 52%, #fffbeb 100%)', particulasTipo: 'Boda', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#78350f' } },
  { slug: 'shimmer-champagne', nombre: 'Brillo Champagne', cssBackground: 'linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #fef3c7 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#b45309', secondary: '#fffbeb', accent: '#d97706' } },
  { slug: 'aurora-romantica', nombre: 'Aurora Romántica', cssBackground: 'linear-gradient(135deg, #881337 0%, #db2777 50%, #fda4af 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#be185d', secondary: '#ffe4e6', accent: '#9f1239' } },
  { slug: 'destellos-estrella-boda', nombre: 'Noche Bajo Estrellas', cssBackground: 'radial-gradient(circle at 50% 35%, #1e3a8a 0%, #0f172a 60%, #020617 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#1e40af', secondary: '#dbeafe', accent: '#fbbf24' } },
  { slug: 'ondas-seda', nombre: 'Seda en Movimiento', cssBackground: 'linear-gradient(135deg, #57534e 0%, #d6d3d1 50%, #fafaf9 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#57534e', secondary: '#f5f5f4', accent: '#b45309' } },
  { slug: 'brillos-eucalipto', nombre: 'Jardín Encantado', cssBackground: 'linear-gradient(135deg, #064e3b 0%, #10b981 52%, #ecfdf5 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#047857', secondary: '#d1fae5', accent: '#b45309' } },
  { slug: 'degradado-atardecer', nombre: 'Atardecer de Amor', cssBackground: 'linear-gradient(135deg, #9a3412 0%, #fb7185 50%, #fef3c7 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#c2410c', secondary: '#fff7ed', accent: '#e11d48' } },
  { slug: 'particulas-blancas', nombre: 'Destellos Blancos', cssBackground: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #f1f5f9 100%)', particulasTipo: 'Boda', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#334155', secondary: '#f8fafc', accent: '#d4a574' } },
  { slug: 'aurora-vino', nombre: 'Vino & Dorado', cssBackground: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #f59e0b 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#9f1239', secondary: '#ffe4e6', accent: '#d97706' } },
  { slug: 'shimmer-perla', nombre: 'Perla Luminosa', cssBackground: 'linear-gradient(135deg, #78716c 0%, #e7e5e4 55%, #ffffff 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#57534e', secondary: '#f5f5f4', accent: '#a16207' } },
  { slug: 'ondas-lavanda', nombre: 'Brisa Lavanda', cssBackground: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 52%, #f5f3ff 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#a78bfa' } },
  { slug: 'brillos-marfil', nombre: 'Luces Cálidas', cssBackground: 'radial-gradient(circle at 50% 50%, #92400e 0%, #451a03 55%, #1c1917 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' } },
  { slug: 'degradado-oliva', nombre: 'Oliva Vivo', cssBackground: 'linear-gradient(135deg, #365314 0%, #84cc16 50%, #f7fee7 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#4d7c0f', secondary: '#ecfccb', accent: '#92400e' } },
  { slug: 'destellos-rosa', nombre: 'Pétalos de Luz', cssBackground: 'linear-gradient(135deg, #9d174d 0%, #f472b6 55%, #fdf2f8 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#db2777', secondary: '#fce7f3', accent: '#be185d' } },
  { slug: 'particulas-champagne', nombre: 'Burbujas Brindis', cssBackground: 'linear-gradient(135deg, #713f12 0%, #ca8a04 52%, #fef9c3 100%)', particulasTipo: 'Boda', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#a16207', secondary: '#fef9c3', accent: '#713f12' } },
  { slug: 'foto-animada-boda-dorada', nombre: 'Boda Dorada (Viva)', cssBackground: 'linear-gradient(135deg, #78350f 0%, #d4a574 100%)', imagenUrl: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#78350f' } },
  { slug: 'foto-animada-boda-persuasiva', nombre: 'Ceremonia (Con Luz)', cssBackground: 'linear-gradient(135deg, #44403c 0%, #d4a574 100%)', imagenUrl: '/media/catalogo-servicios/boda_persuasiva.png', particulasTipo: 'Boda', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#92400e', secondary: '#fef3c7', accent: '#57534e' } },
  { slug: 'foto-animada-boda-mesa', nombre: 'Mesa Gala (Zoom)', cssBackground: 'linear-gradient(135deg, #57534e 0%, #d6d3d1 100%)', imagenUrl: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#78716c', secondary: '#f5f5f4', accent: '#b45309' } },
  { slug: 'foto-animada-boda-recepcion', nombre: 'Recepción (Brillos)', cssBackground: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)', imagenUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg', animacionTipo: 'brillos', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#d97706' } },
  { slug: 'foto-animada-boda-luces', nombre: 'Iluminación Boda', cssBackground: 'linear-gradient(135deg, #1c1917 0%, #78350f 100%)', imagenUrl: '/media/catalogo-servicios/blog_iluminacion.png', animacionTipo: 'destellos', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#f59e0b' } },
];

// ─── CUMPLEAÑOS (20 quietos + 20 en movimiento = 40) ────────────────────────
const FONDOS_CUMPLEANOS_QUIETOS: SeedFondo[] = [
  { slug: 'fiesta-pop', nombre: 'Fiesta Pop', cssBackground: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 52%, #f59e0b 100%)', paletaSugerida: { primary: '#7c3aed', secondary: '#f3e8ff', accent: '#ec4899' } },
  { slug: 'tropical-sunset', nombre: 'Atardecer Tropical', cssBackground: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 52%, #fef08a 100%)', paletaSugerida: { primary: '#ea580c', secondary: '#ffedd5', accent: '#eab308' } },
  { slug: 'azul-electrico', nombre: 'Azul Eléctrico', cssBackground: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 55%, #cffafe 100%)', paletaSugerida: { primary: '#2563eb', secondary: '#dbeafe', accent: '#06b6d4' } },
  { slug: 'negro-dorado-vip', nombre: 'Negro & Oro VIP', cssBackground: 'radial-gradient(circle at 50% 30%, #78350f 0%, #18181b 55%, #09090b 100%)', paletaSugerida: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' } },
  { slug: 'verde-lima-fest', nombre: 'Lima Fest', cssBackground: 'linear-gradient(135deg, #15803d 0%, #84cc16 55%, #ecfccb 100%)', paletaSugerida: { primary: '#16a34a', secondary: '#dcfce7', accent: '#65a30d' } },
  { slug: 'disco-violeta', nombre: 'Disco Violeta', cssBackground: 'radial-gradient(circle at 70% 25%, #a855f7 0%, #3b0764 55%, #090514 100%)', paletaSugerida: { primary: '#9333ea', secondary: '#f3e8ff', accent: '#22d3ee' } },
  { slug: 'rojo-pasion', nombre: 'Rojo Celebración', cssBackground: 'linear-gradient(135deg, #991b1b 0%, #ef4444 55%, #fee2e2 100%)', paletaSugerida: { primary: '#dc2626', secondary: '#fee2e2', accent: '#f59e0b' } },
  { slug: 'menta-fresca', nombre: 'Menta Fresca', cssBackground: 'linear-gradient(135deg, #0d9488 0%, #5eead4 55%, #f0fdfa 100%)', paletaSugerida: { primary: '#0d9488', secondary: '#ccfbf1', accent: '#14b8a6' } },
  { slug: 'retro-ochre', nombre: 'Retro 80s', cssBackground: 'linear-gradient(135deg, #be185d 0%, #f97316 52%, #fde047 100%)', paletaSugerida: { primary: '#db2777', secondary: '#ffedd5', accent: '#eab308' } },
  { slug: 'indigo-nocturno', nombre: 'Índigo Nocturno', cssBackground: 'linear-gradient(150deg, #1e1b4b 0%, #4338ca 55%, #a5b4fc 100%)', paletaSugerida: { primary: '#4338ca', secondary: '#e0e7ff', accent: '#f43f5e' } },
  { slug: 'caramelo-dulce', nombre: 'Caramelo Dulce', cssBackground: 'linear-gradient(135deg, #db2777 0%, #f472b6 50%, #bae6fd 100%)', paletaSugerida: { primary: '#db2777', secondary: '#fce7f3', accent: '#0284c7' } },
  { slug: 'cobre-urbano', nombre: 'Cobre Urbano', cssBackground: 'linear-gradient(135deg, #431407 0%, #c2410c 55%, #fed7aa 100%)', paletaSugerida: { primary: '#c2410c', secondary: '#ffedd5', accent: '#78350f' } },
  { slug: 'aqua-verano', nombre: 'Aqua Verano', cssBackground: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 55%, #e0f2fe 100%)', paletaSugerida: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#f59e0b' } },
  { slug: 'grafito-cool', nombre: 'Grafito Moderno', cssBackground: 'linear-gradient(145deg, #18181b 0%, #52525b 55%, #e4e4e7 100%)', paletaSugerida: { primary: '#27272a', secondary: '#f4f4f5', accent: '#ef4444' } },
  { slug: 'foto-cumple-familia', nombre: 'Momentos Felices', cssBackground: 'linear-gradient(135deg, #7c3aed 0%, #f59e0b 100%)', imagenUrl: '/media/catalogo-servicios/familia_feliz_evento.png', paletaSugerida: { primary: '#7c3aed', secondary: '#f3e8ff', accent: '#f59e0b' } },
  { slug: 'foto-cumple-bolas', nombre: 'Bolas Disco AK', cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)', imagenUrl: '/media/catalogo-servicios/discoteca-iluminacion-bolas-01.jpeg', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#06b6d4' } },
  { slug: 'foto-cumple-salon', nombre: 'Pista & Luces', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #db2777 100%)', imagenUrl: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg', paletaSugerida: { primary: '#db2777', secondary: '#fce7f3', accent: '#3b82f6' } },
  { slug: 'foto-cumple-glitter', nombre: 'Glitter Party', cssBackground: 'linear-gradient(135deg, #831843 0%, #f59e0b 100%)', imagenUrl: '/media/catalogo-servicios/glitter-bar-01.jpeg', paletaSugerida: { primary: '#be185d', secondary: '#fdf2f8', accent: '#f59e0b' } },
  { slug: 'foto-cumple-barra', nombre: 'Barra de Tragos', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #0ea5e9 100%)', imagenUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg', paletaSugerida: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#f59e0b' } },
  { slug: 'foto-cumple-cotillon', nombre: 'Cotillón & Fiesta', cssBackground: 'linear-gradient(135deg, #7c2d12 0%, #ec4899 100%)', imagenUrl: '/media/catalogo-servicios/souvenirs-cotillon-01.jpeg', paletaSugerida: { primary: '#ec4899', secondary: '#fce7f3', accent: '#f97316' } },
];

const FONDOS_CUMPLEANOS_ANIMADOS: SeedFondo[] = [
  { slug: 'confeti-fiesta', nombre: 'Lluvia de Confeti', cssBackground: 'linear-gradient(135deg, #4c1d95 0%, #ec4899 50%, #f59e0b 100%)', particulasTipo: 'Cumpleaños', animacionTipo: 'confeti', paletaSugerida: { primary: '#ec4899', secondary: '#fdf2f8', accent: '#f59e0b' } },
  { slug: 'aurora-disco', nombre: 'Aurora Disco', cssBackground: 'linear-gradient(135deg, #1d4ed8 0%, #9333ea 50%, #ec4899 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#9333ea', secondary: '#f3e8ff', accent: '#22d3ee' } },
  { slug: 'ondas-tropicales', nombre: 'Ondas Tropicales', cssBackground: 'linear-gradient(135deg, #ea580c 0%, #eab308 50%, #10b981 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#ea580c', secondary: '#ffedd5', accent: '#10b981' } },
  { slug: 'destellos-cumple', nombre: 'Estrellas Cumple', cssBackground: 'radial-gradient(circle at 50% 40%, #7c3aed 0%, #1e1b4b 58%, #020617 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#7c3aed', secondary: '#ede9fe', accent: '#fbbf24' } },
  { slug: 'shimmer-vip-cumple', nombre: 'Oro VIP Vivo', cssBackground: 'linear-gradient(135deg, #27272a 0%, #b45309 50%, #fde047 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#eab308' } },
  { slug: 'brillos-neon', nombre: 'Brillos Neón', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #06b6d4 50%, #d946ef 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#06b6d4', secondary: '#ecfeff', accent: '#d946ef' } },
  { slug: 'degradado-fuego', nombre: 'Energía Viva', cssBackground: 'linear-gradient(135deg, #991b1b 0%, #f97316 50%, #facc15 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#dc2626', secondary: '#ffedd5', accent: '#f59e0b' } },
  { slug: 'confeti-azul', nombre: 'Confeti Azul & Oro', cssBackground: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #38bdf8 100%)', particulasTipo: 'Cumpleaños', animacionTipo: 'confeti', paletaSugerida: { primary: '#2563eb', secondary: '#dbeafe', accent: '#f59e0b' } },
  { slug: 'particulas-infantiles', nombre: 'Globos & Estrellas', cssBackground: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 52%, #10b981 100%)', particulasTipo: 'Infantil', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#3b82f6', secondary: '#dbeafe', accent: '#f59e0b' } },
  { slug: 'ondas-magenta-cumple', nombre: 'Ondas Fiesta', cssBackground: 'linear-gradient(135deg, #831843 0%, #ec4899 52%, #8b5cf6 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#ec4899', secondary: '#fce7f3', accent: '#8b5cf6' } },
  { slug: 'aurora-esmeralda-cumple', nombre: 'Aurora Verde Lima', cssBackground: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #a3e635 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#10b981', secondary: '#d1fae5', accent: '#65a30d' } },
  { slug: 'degradado-sunset', nombre: 'Sunset Vibrante', cssBackground: 'linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #fb923c 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#f97316' } },
  { slug: 'destellos-cyan', nombre: 'Chispas Cyan', cssBackground: 'linear-gradient(135deg, #083344 0%, #0e7490 52%, #22d3ee 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#0891b2', secondary: '#cffafe', accent: '#f43f5e' } },
  { slug: 'brillos-violeta', nombre: 'Luces Violeta', cssBackground: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 52%, #c084fc 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#ec4899' } },
  { slug: 'shimmer-cobre', nombre: 'Cobre Festivo', cssBackground: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 52%, #fdba74 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#ea580c', secondary: '#ffedd5', accent: '#b45309' } },
  { slug: 'foto-animada-cumple-familia', nombre: 'Celebración (Viva)', cssBackground: 'linear-gradient(135deg, #7c3aed 0%, #f59e0b 100%)', imagenUrl: '/media/catalogo-servicios/familia_feliz_evento.png', particulasTipo: 'Cumpleaños', animacionTipo: 'confeti', paletaSugerida: { primary: '#7c3aed', secondary: '#f3e8ff', accent: '#f59e0b' } },
  { slug: 'foto-animada-cumple-bolas', nombre: 'Disco Bolas (Luces)', cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)', imagenUrl: '/media/catalogo-servicios/discoteca-iluminacion-bolas-01.jpeg', animacionTipo: 'destellos', paletaSugerida: { primary: '#6d28d9', secondary: '#ede9fe', accent: '#06b6d4' } },
  { slug: 'foto-animada-cumple-salon', nombre: 'Salón Fiesta (Vivo)', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #ec4899 100%)', imagenUrl: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#ec4899', secondary: '#fce7f3', accent: '#3b82f6' } },
  { slug: 'foto-animada-cumple-glitter', nombre: 'Glitter (Destellos)', cssBackground: 'linear-gradient(135deg, #831843 0%, #f59e0b 100%)', imagenUrl: '/media/catalogo-servicios/glitter-bar-01.jpeg', animacionTipo: 'brillos', paletaSugerida: { primary: '#be185d', secondary: '#fdf2f8', accent: '#f59e0b' } },
  { slug: 'foto-animada-cumple-candy', nombre: 'Mesa Dulce (Confeti)', cssBackground: 'linear-gradient(135deg, #9d174d 0%, #f472b6 100%)', imagenUrl: '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg', particulasTipo: 'Cumpleaños', animacionTipo: 'confeti', paletaSugerida: { primary: '#db2777', secondary: '#fce7f3', accent: '#f59e0b' } },
];

// ─── EMPRESA / CORPORATIVO (20 quietos + 20 en movimiento = 40) ─────────────
const FONDOS_EMPRESA_QUIETOS: SeedFondo[] = [
  { slug: 'azul-ejecutivo', nombre: 'Azul Ejecutivo', cssBackground: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 55%, #3b82f6 100%)', paletaSugerida: { primary: '#1e40af', secondary: '#dbeafe', accent: '#0ea5e9' } },
  { slug: 'grafito-corporativo', nombre: 'Grafito Corporativo', cssBackground: 'linear-gradient(145deg, #09090b 0%, #27272a 55%, #52525b 100%)', paletaSugerida: { primary: '#18181b', secondary: '#f4f4f5', accent: '#dc2626' } },
  { slug: 'esmeralda-banca', nombre: 'Esmeralda Gala', cssBackground: 'linear-gradient(145deg, #022c22 0%, #065f46 55%, #34d399 100%)', paletaSugerida: { primary: '#065f46', secondary: '#d1fae5', accent: '#d97706' } },
  { slug: 'rojo-ak-premium', nombre: 'Rojo Marca AK', cssBackground: 'linear-gradient(140deg, #18181b 0%, #991b1b 55%, #ef4444 100%)', paletaSugerida: { primary: '#dc2626', secondary: '#fee2e2', accent: '#18181b' } },
  { slug: 'plata-clean', nombre: 'Plata Clean', cssBackground: 'linear-gradient(135deg, #334155 0%, #94a3b8 55%, #f8fafc 100%)', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#2563eb' } },
  { slug: 'petroleo-tech', nombre: 'Petróleo Tech', cssBackground: 'linear-gradient(135deg, #083344 0%, #155e75 55%, #67e8f9 100%)', paletaSugerida: { primary: '#0e7490', secondary: '#cffafe', accent: '#06b6d4' } },
  { slug: 'oro-premios', nombre: 'Oro Premiación', cssBackground: 'radial-gradient(circle at 50% 25%, #78350f 0%, #1c1917 55%, #09090b 100%)', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#f59e0b' } },
  { slug: 'indigo-congreso', nombre: 'Índigo Congreso', cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 55%, #818cf8 100%)', paletaSugerida: { primary: '#3730a3', secondary: '#e0e7ff', accent: '#6366f1' } },
  { slug: 'blanco-minimal-pro', nombre: 'Blanco Editorial', cssBackground: 'linear-gradient(135deg, #475569 0%, #cbd5e1 55%, #ffffff 100%)', paletaSugerida: { primary: '#1e293b', secondary: '#f8fafc', accent: '#0284c7' } },
  { slug: 'cobalto-summit', nombre: 'Cobalto Summit', cssBackground: 'linear-gradient(135deg, #172554 0%, #1d4ed8 55%, #60a5fa 100%)', paletaSugerida: { primary: '#1d4ed8', secondary: '#dbeafe', accent: '#fbbf24' } },
  { slug: 'bordo-directorio', nombre: 'Bordó Directorio', cssBackground: 'linear-gradient(145deg, #1c050d 0%, #881337 55%, #e11d48 100%)', paletaSugerida: { primary: '#9f1239', secondary: '#ffe4e6', accent: '#d97706' } },
  { slug: 'bronce-networking', nombre: 'Bronce Networking', cssBackground: 'linear-gradient(135deg, #292524 0%, #78350f 55%, #d97706 100%)', paletaSugerida: { primary: '#92400e', secondary: '#fef3c7', accent: '#57534e' } },
  { slug: 'cyan-innovacion', nombre: 'Cyan Innovación', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #0284c7 55%, #38bdf8 100%)', paletaSugerida: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#0f172a' } },
  { slug: 'carbon-elegante', nombre: 'Carbón Elegante', cssBackground: 'radial-gradient(ellipse at top, #3f3f46 0%, #18181b 60%, #09090b 100%)', paletaSugerida: { primary: '#27272a', secondary: '#f4f4f5', accent: '#f59e0b' } },
  { slug: 'foto-corp-persuasivo', nombre: 'Evento Corporativo', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', imagenUrl: '/media/catalogo-servicios/corporativo_persuasivo.png', paletaSugerida: { primary: '#1e40af', secondary: '#dbeafe', accent: '#0ea5e9' } },
  { slug: 'foto-corp-tecnologia', nombre: 'Tecnología & Pantallas', cssBackground: 'linear-gradient(135deg, #09090b 0%, #1d4ed8 100%)', imagenUrl: '/media/catalogo-servicios/tecnologia_fiesta.png', paletaSugerida: { primary: '#2563eb', secondary: '#dbeafe', accent: '#dc2626' } },
  { slug: 'foto-corp-montaje', nombre: 'Producción AK', cssBackground: 'linear-gradient(135deg, #18181b 0%, #334155 100%)', imagenUrl: '/media/catalogo-servicios/montaje_equipo.png', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#d97706' } },
  { slug: 'foto-corp-equipo', nombre: 'Equipo Organizador', cssBackground: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', imagenUrl: '/media/catalogo-servicios/organizador_equipo.png', paletaSugerida: { primary: '#1e293b', secondary: '#f1f5f9', accent: '#2563eb' } },
  { slug: 'foto-corp-recepcion', nombre: 'Recepción Empresarial', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', imagenUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#0ea5e9' } },
  { slug: 'foto-corp-iluminacion', nombre: 'Iluminación Gala', cssBackground: 'linear-gradient(135deg, #09090b 0%, #1e3a8a 100%)', imagenUrl: '/media/catalogo-servicios/blog_iluminacion.png', paletaSugerida: { primary: '#1d4ed8', secondary: '#dbeafe', accent: '#f59e0b' } },
];

const FONDOS_EMPRESA_ANIMADOS: SeedFondo[] = [
  { slug: 'aurora-corporativa', nombre: 'Aurora Corporativa', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #06b6d4 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#1d4ed8', secondary: '#dbeafe', accent: '#06b6d4' } },
  { slug: 'ondas-tech', nombre: 'Ondas Tecnología', cssBackground: 'linear-gradient(135deg, #082f49 0%, #0284c7 52%, #38bdf8 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#0369a1' } },
  { slug: 'shimmer-premios', nombre: 'Brillo Premiación', cssBackground: 'linear-gradient(135deg, #1c1917 0%, #b45309 50%, #fde047 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#b45309', secondary: '#fef3c7', accent: '#f59e0b' } },
  { slug: 'destellos-ejecutivos', nombre: 'Noche Ejecutiva', cssBackground: 'radial-gradient(circle at 40% 35%, #1e3a8a 0%, #0f172a 58%, #020617 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#1e40af', secondary: '#dbeafe', accent: '#38bdf8' } },
  { slug: 'degradado-esmeralda-corp', nombre: 'Esmeralda Dinámica', cssBackground: 'linear-gradient(135deg, #022c22 0%, #059669 52%, #6ee7b7 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#059669', secondary: '#d1fae5', accent: '#f59e0b' } },
  { slug: 'brillos-marca-ak', nombre: 'Energía AK', cssBackground: 'linear-gradient(135deg, #18181b 0%, #b91c1c 50%, #f87171 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#dc2626', secondary: '#fee2e2', accent: '#18181b' } },
  { slug: 'aurora-indigo-summit', nombre: 'Summit Índigo', cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 52%, #06b6d4 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#4338ca', secondary: '#e0e7ff', accent: '#06b6d4' } },
  { slug: 'ondas-plata', nombre: 'Plata Fluida', cssBackground: 'linear-gradient(135deg, #1e293b 0%, #64748b 52%, #cbd5e1 100%)', animacionTipo: 'ondas', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#0284c7' } },
  { slug: 'particulas-gala-corp', nombre: 'Destellos de Gala', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #3b82f6 100%)', particulasTipo: 'General', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#1e40af', secondary: '#dbeafe', accent: '#fbbf24' } },
  { slug: 'degradado-bordo-corp', nombre: 'Bordó Ejecutivo', cssBackground: 'linear-gradient(135deg, #4c0519 0%, #9f1239 52%, #fb7185 100%)', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#9f1239', secondary: '#ffe4e6', accent: '#d97706' } },
  { slug: 'shimmer-platino', nombre: 'Platino Vivo', cssBackground: 'linear-gradient(135deg, #27272a 0%, #71717a 52%, #e4e4e7 100%)', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#3f3f46', secondary: '#f4f4f5', accent: '#d97706' } },
  { slug: 'destellos-petroleo', nombre: 'Petróleo Luminoso', cssBackground: 'linear-gradient(135deg, #083344 0%, #0e7490 52%, #22d3ee 100%)', animacionTipo: 'destellos', paletaSugerida: { primary: '#0e7490', secondary: '#cffafe', accent: '#38bdf8' } },
  { slug: 'brillos-congreso', nombre: 'Luces Congreso', cssBackground: 'linear-gradient(135deg, #172554 0%, #2563eb 52%, #93c5fd 100%)', animacionTipo: 'brillos', paletaSugerida: { primary: '#2563eb', secondary: '#dbeafe', accent: '#fbbf24' } },
  { slug: 'aurora-bronce', nombre: 'Bronce Moderno', cssBackground: 'linear-gradient(135deg, #292524 0%, #92400e 52%, #fbbf24 100%)', animacionTipo: 'aurora', paletaSugerida: { primary: '#92400e', secondary: '#fef3c7', accent: '#d97706' } },
  { slug: 'particulas-lanzamiento', nombre: 'Lanzamiento VIP', cssBackground: 'linear-gradient(135deg, #09090b 0%, #3730a3 52%, #6366f1 100%)', particulasTipo: 'General', animacionTipo: 'particulas_fiesta', paletaSugerida: { primary: '#4338ca', secondary: '#e0e7ff', accent: '#fbbf24' } },
  { slug: 'foto-animada-corp-persuasivo', nombre: 'Gala Empresa (Viva)', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', imagenUrl: '/media/catalogo-servicios/corporativo_persuasivo.png', animacionTipo: 'degradado_suave', paletaSugerida: { primary: '#1e40af', secondary: '#dbeafe', accent: '#0ea5e9' } },
  { slug: 'foto-animada-corp-tech', nombre: 'Tech Summit (Luces)', cssBackground: 'linear-gradient(135deg, #09090b 0%, #1d4ed8 100%)', imagenUrl: '/media/catalogo-servicios/tecnologia_fiesta.png', animacionTipo: 'destellos', paletaSugerida: { primary: '#2563eb', secondary: '#dbeafe', accent: '#dc2626' } },
  { slug: 'foto-animada-corp-barra', nombre: 'After Office (Brillos)', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #0ea5e9 100%)', imagenUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg', animacionTipo: 'brillos', paletaSugerida: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#f59e0b' } },
  { slug: 'foto-animada-corp-salon', nombre: 'Salón Gala (Vivo)', cssBackground: 'linear-gradient(135deg, #18181b 0%, #334155 100%)', imagenUrl: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg', animacionTipo: 'ondas', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#0ea5e9' } },
  { slug: 'foto-animada-corp-recepcion', nombre: 'Recepción (Shimmer)', cssBackground: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)', imagenUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg', animacionTipo: 'shimmer_dorado', paletaSugerida: { primary: '#334155', secondary: '#f1f5f9', accent: '#d97706' } },
];

export const FONDOS_INVITACION: FondoInvitacion[] = [
  ...crearFondosPorTipo('15', FONDOS_15_QUIETOS, FONDOS_15_ANIMADOS),
  ...crearFondosPorTipo('boda', FONDOS_BODA_QUIETOS, FONDOS_BODA_ANIMADOS),
  ...crearFondosPorTipo('cumpleanos', FONDOS_CUMPLEANOS_QUIETOS, FONDOS_CUMPLEANOS_ANIMADOS),
  ...crearFondosPorTipo('empresa', FONDOS_EMPRESA_QUIETOS, FONDOS_EMPRESA_ANIMADOS),
];

export const FONDOS_INVITACION_POR_ID: Record<string, FondoInvitacion> = Object.fromEntries(
  FONDOS_INVITACION.map((fondo) => [fondo.id, fondo])
);

export function mapearTipoEventoAFondo(tipoEvento?: string, tipoCelebracion?: string): TipoFiestaFondo {
  const raw = `${tipoEvento || ''} ${tipoCelebracion || ''}`.toLowerCase();
  if (raw.includes('15') || raw.includes('xv')) return '15';
  if (raw.includes('boda') || raw.includes('casamiento')) return 'boda';
  if (raw.includes('empres') || raw.includes('corp')) return 'empresa';
  return 'cumpleanos';
}

export function getFondosPorTipo(
  tipo: TipoFiestaFondo,
  filtroMovimiento: 'todos' | CategoriaMovimientoFondo = 'todos'
): FondoInvitacion[] {
  return FONDOS_INVITACION.filter((f) => {
    if (f.tipoFiesta !== tipo) return false;
    if (filtroMovimiento === 'todos') return true;
    return f.movimiento === filtroMovimiento;
  });
}

export function getFondoInvitacionById(id?: string): FondoInvitacion | undefined {
  if (!id) return undefined;
  return FONDOS_INVITACION_POR_ID[id];
}

export function getFuenteInvitacionById(id?: string): FuenteInvitacionPreset | undefined {
  if (!id) return undefined;
  return FUENTES_INVITACION.find((f) => f.id === id);
}

export function aplicarFondoAConfig(
  config: InvitacionConfigConEstilo,
  fondo: FondoInvitacion,
  aplicarPaleta = true
): InvitacionConfigConEstilo {
  return {
    ...config,
    fondoId: fondo.id,
    fotoPortada: fondo.imagenUrl ?? '',
    ...(aplicarPaleta
      ? {
          colorPrincipal: fondo.paletaSugerida.primary,
          colorSecundario: fondo.paletaSugerida.secondary,
          colorAcento: fondo.paletaSugerida.accent,
        }
      : {}),
  };
}

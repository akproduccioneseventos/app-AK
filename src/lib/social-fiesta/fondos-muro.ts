export interface FondoMuroConfig {
  id: string;
  nombre: string;
  estilo: string;
  categoria?: 'boda' | '15-anos' | 'infantil' | 'corporativo' | 'general';
  cssBackground: string;
}

export const FONDOS_MURO: Record<string, FondoMuroConfig> = {
  // Fondos clásicos
  predeterminado: {
    id: 'predeterminado',
    nombre: 'Degradado Dinámico',
    estilo: 'degradado',
    categoria: 'general',
    cssBackground: 'linear-gradient(135deg, #020617, #0f172a 52%, #020617)',
  },
  'estrellas-vip': {
    id: 'estrellas-vip',
    nombre: 'Noche Estelar VIP',
    estilo: 'estrellas',
    categoria: 'general',
    cssBackground: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #09090b 100%)',
  },
  'dorado-glamour': {
    id: 'dorado-glamour',
    nombre: 'Oro Glamour',
    estilo: 'dorado',
    categoria: 'general',
    cssBackground: 'radial-gradient(ellipse at bottom, #451a03 0%, #0c0a09 100%)',
  },
  'ondas-neon': {
    id: 'ondas-neon',
    nombre: 'Neón Fiesta',
    estilo: 'neon',
    categoria: 'general',
    cssBackground: 'linear-gradient(125deg, #2e026d 0%, #030712 60%, #172554 100%)',
  },
  'vintage-boda': {
    id: 'vintage-boda',
    nombre: 'Romántico Elegante',
    estilo: 'vintage',
    categoria: 'boda',
    cssBackground: 'radial-gradient(circle at 20% 80%, #3f182c 0%, #09090b 80%)',
  },
  'dark-techno': {
    id: 'dark-techno',
    nombre: 'Black Minimal',
    estilo: 'minimal',
    categoria: 'general',
    cssBackground: '#02040a',
  },

  // Bodas
  'boda-romance': {
    id: 'boda-romance',
    nombre: 'Boda Romance',
    estilo: 'boda',
    categoria: 'boda',
    cssBackground: 'radial-gradient(ellipse at 50% 50%, #4a1d2e 0%, #1f0b16 50%, #0a0307 100%)',
  },
  'boda-champagne': {
    id: 'boda-champagne',
    nombre: 'Champagne & Rosas',
    estilo: 'boda',
    categoria: 'boda',
    cssBackground: 'linear-gradient(135deg, #2b1d0c 0%, #17100b 45%, #35151e 100%)',
  },
  'boda-blanco-perla': {
    id: 'boda-blanco-perla',
    nombre: 'Perla Nocturna',
    estilo: 'boda',
    categoria: 'boda',
    cssBackground: 'radial-gradient(circle at 50% 20%, #292524 0%, #141211 60%, #09090b 100%)',
  },

  // 15 Años
  'xv-aurora-boreal': {
    id: 'xv-aurora-boreal',
    nombre: 'Aurora Mágica 15',
    estilo: '15-anos',
    categoria: '15-anos',
    cssBackground: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 40%, #064e3b 100%)',
  },
  'xv-glitter-magenta': {
    id: 'xv-glitter-magenta',
    nombre: 'Magenta Glow 15',
    estilo: '15-anos',
    categoria: '15-anos',
    cssBackground: 'radial-gradient(circle at 70% 30%, #701a75 0%, #2e0854 50%, #090514 100%)',
  },
  'xv-turquesa-cyber': {
    id: 'xv-turquesa-cyber',
    nombre: 'Turquesa Fest 15',
    estilo: '15-anos',
    categoria: '15-anos',
    cssBackground: 'linear-gradient(120deg, #0e7490 0%, #082f49 50%, #020617 100%)',
  },

  // Cumpleaños infantil
  'infantil-espacio': {
    id: 'infantil-espacio',
    nombre: 'Aventura Espacial',
    estilo: 'infantil',
    categoria: 'infantil',
    cssBackground: 'radial-gradient(circle at 30% 30%, #1d4ed8 0%, #0f172a 60%, #020617 100%)',
  },
  'infantil-arcoiris-pop': {
    id: 'infantil-arcoiris-pop',
    nombre: 'Colores Pop',
    estilo: 'infantil',
    categoria: 'infantil',
    cssBackground: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e3a8a 60%, #064e3b 100%)',
  },
  'infantil-dulce-caramelo': {
    id: 'infantil-dulce-caramelo',
    nombre: 'Fantasía Dulce',
    estilo: 'infantil',
    categoria: 'infantil',
    cssBackground: 'radial-gradient(ellipse at center, #831843 0%, #4c0519 55%, #180208 100%)',
  },

  // Corporativo
  'corp-azul-medianoche': {
    id: 'corp-azul-medianoche',
    nombre: 'Azul Ejecutivo',
    estilo: 'corporativo',
    categoria: 'corporativo',
    cssBackground: 'linear-gradient(160deg, #1e3a8a 0%, #0f172a 50%, #020617 100%)',
  },
  'corp-grafito-moderno': {
    id: 'corp-grafito-moderno',
    nombre: 'Grafito Premium',
    estilo: 'corporativo',
    categoria: 'corporativo',
    cssBackground: 'radial-gradient(ellipse at top, #27272a 0%, #18181b 60%, #09090b 100%)',
  },
  'corp-verde-esmeralda': {
    id: 'corp-verde-esmeralda',
    nombre: 'Esmeralda Gala',
    estilo: 'corporativo',
    categoria: 'corporativo',
    cssBackground: 'linear-gradient(135deg, #064e3b 0%, #022c22 45%, #050b0a 100%)',
  },
};

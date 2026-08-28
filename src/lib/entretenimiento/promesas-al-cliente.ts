/**
 * LAS PROMESAS QUE LA APP LE HACE AL EQUIPO, Y QUIÉN LAS CUMPLE
 *
 * En la pantalla donde se arma el entretenimiento, cada estación muestra una
 * lista de lo que sabe hacer. **Esa lista la lee el equipo y por ahí se le vende
 * al cliente.** Hasta hoy no había nada que obligara a que fuera verdad: alguien
 * escribía "Encuestas" y quedaba escrito para siempre, sin que existiera.
 *
 * Acá cada promesa declara **qué parte del código la cumple**. La prueba
 * `las-promesas-tienen-respaldo.test.ts` no deja agregar una promesa nueva sin
 * declararla, y comprueba que lo declarado exista de verdad.
 *
 * Tres estados, y ninguno se puede omitir:
 *
 *   cumple       — hay código que la cumple. Se nombra el archivo.
 *   noCumple     — está escrita y NO existe. Queda a la vista, no escondida.
 *   porVerificar — todavía nadie la comprobó con sus propios ojos.
 *
 * **Una promesa en `noCumple` no rompe la app**: rompe la ilusión de que está
 * todo bien, que es justamente lo que hacía falta.
 */

export type EstadoDeLaPromesa =
  | { estado: 'cumple'; laCumple: string }
  | { estado: 'noCumple'; queFalta: string }
  | { estado: 'porVerificar' };

export const PROMESAS_AL_CLIENTE: Record<string, Record<string, EstadoDeLaPromesa>> = {
  fotocabina: {
    Foto: { estado: 'cumple', laCumple: 'src/app/evento/fotocabina/[fiestaId]/page.tsx' },
    Marcos: { estado: 'cumple', laCumple: 'src/app/evento/fotocabina/[fiestaId]/page.tsx' },
    'Impresión 10x15': { estado: 'cumple', laCumple: 'src/lib/entretenimiento/tira-fotocabina.ts' },
    'Galería live': { estado: 'cumple', laCumple: 'src/app/evento/fotocabina/[fiestaId]/page.tsx' },
    'QR/WhatsApp': { estado: 'cumple', laCumple: 'src/app/evento/fotocabina/[fiestaId]/page.tsx' },
  },
  plataforma360: {
    'Video 360': { estado: 'cumple', laCumple: 'src/app/evento/plataforma-360/[fiestaId]/page.tsx' },
    'Slow motion': { estado: 'cumple', laCumple: 'src/app/evento/plataforma-360/[fiestaId]/page.tsx' },
    'Speed ramp': { estado: 'porVerificar' },
    'Intro/Outro': {
      estado: 'noCumple',
      queFalta: 'No hay nada de intro ni de cierre en la pantalla de la 360. Comprobado buscando en todo el archivo.',
    },
    Música: { estado: 'porVerificar' },
    'QR por video': { estado: 'cumple', laCumple: 'src/app/evento/plataforma-360/[fiestaId]/page.tsx' },
    'Overlay animado': { estado: 'porVerificar' },
    'Salida LED': { estado: 'cumple', laCumple: 'src/app/evento/plataforma-360/[fiestaId]/page.tsx' },
  },
  bogue: {
    Boomerang: { estado: 'cumple', laCumple: 'src/lib/entretenimiento/gif-generator.ts' },
    'Loop adelante/atrás': { estado: 'cumple', laCumple: 'src/app/evento/bogue/[fiestaId]/page.tsx' },
    'Video corto': { estado: 'cumple', laCumple: 'src/app/evento/bogue/[fiestaId]/page.tsx' },
    Música: {
      estado: 'noCumple',
      queFalta:
        'El Bogue no tiene música. Lo único que suena son los pitidos de la cuenta regresiva. Comprobado en las 1137 líneas.',
    },
    'Overlay animado': { estado: 'cumple', laCumple: 'src/app/evento/bogue/[fiestaId]/page.tsx' },
    'Compartir por QR': { estado: 'cumple', laCumple: 'src/app/evento/bogue/[fiestaId]/page.tsx' },
  },
  espejoMagicoFoto: {
    'Pantalla táctil': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Foto limpia': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Impresión premium': { estado: 'cumple', laCumple: 'src/lib/entretenimiento/imprimir-recuerdo.ts' },
    'Filtros de piel': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Galería QR': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Prompts animados': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
  },
  espejoMagicoFirma: {
    'Pantalla táctil': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Firma digital': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Dibujo libre': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Stickers/Props': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    Impresión: { estado: 'cumple', laCumple: 'src/lib/entretenimiento/imprimir-recuerdo.ts' },
    'Galería QR': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Asistente de voz': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
  },
  espejoMagicoIA: {
    'Face Swap': { estado: 'cumple', laCumple: 'src/app/actions/espejo-magico-ai.ts' },
    'Marvel / Fantasía / Realeza': {
      estado: 'cumple',
      laCumple: 'src/lib/entertainment/espejo-magico-templates.ts',
    },
    'Estilo Cómics': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Procesado IA en la nube': { estado: 'cumple', laCumple: 'src/app/actions/espejo-magico-ai.ts' },
    'QR de descarga': { estado: 'cumple', laCumple: 'src/app/evento/espejo-magico/[fiestaId]/page.tsx' },
    'Glow premium': { estado: 'porVerificar' },
  },
  totems: {
    'Pantalla táctil': { estado: 'porVerificar' },
    Bienvenida: { estado: 'cumple', laCumple: 'src/app/evento/totem/[fiestaId]/[totemId]/page.tsx' },
    Encuestas: {
      estado: 'noCumple',
      queFalta:
        'No hay ninguna encuesta en el tótem. La pantalla sólo muestra fotos del muro flotando. Comprobado en las 503 líneas.',
    },
    'Juegos interactivos': {
      estado: 'noCumple',
      queFalta: 'No hay ningún juego en el tótem.',
    },
    'Mapa de salón': {
      estado: 'noCumple',
      queFalta: 'No hay mapa de salón ni de mesas en el tótem.',
    },
    'Muro social en vivo': {
      estado: 'cumple',
      laCumple: 'src/app/evento/totem/[fiestaId]/[totemId]/page.tsx',
    },
  },
  capsulaTiempo: {
    'Grabar Audio': { estado: 'cumple', laCumple: 'src/app/evento/buzon/[fiestaId]/page.tsx' },
    'Grabar Video': { estado: 'cumple', laCumple: 'src/app/evento/buzon/[fiestaId]/page.tsx' },
    'Reproducción de voz': { estado: 'cumple', laCumple: 'src/app/evento/buzon/[fiestaId]/page.tsx' },
    'Descarga ZIP': { estado: 'porVerificar' },
    'Audio de bienvenida': { estado: 'cumple', laCumple: 'src/app/evento/buzon/[fiestaId]/page.tsx' },
    'Notificaciones de pantalla': { estado: 'porVerificar' },
  },
};

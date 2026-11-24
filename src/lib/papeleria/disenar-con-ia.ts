import 'server-only';

import sharp from 'sharp';
import { pedirImagen, leerImagen, MENSAJE_TOPE_IA } from '@/ai/cerebro';
import { MODELOS_GEMINI } from '@/ai/modelos';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { fotoDeReferenciaSegura } from '@/lib/ai/foto-de-referencia';
import { AK_WHATSAPP_PARA_MOSTRAR } from '@/lib/public-contact';
import type { MenuItem } from '@/types/catering';
import type {
  FiestaEnPlanificacion,
  PapeleriaIAData,
  ProgramaEventoItem,
} from '@/types/fiesta';

export type TipoPiezaPapeleriaIA = keyof PapeleriaIAData;

export type LayoutFotocabina = 'strip_3' | 'single_photo' | 'strip_4';

export const PIEZAS_PAPELERIA_IA: readonly TipoPiezaPapeleriaIA[] = [
  'cartaTragos',
  'menuMesa',
  'cronograma',
  'afiche',
  'marcoFotocabina',
  'fondoMesas',
] as const;

export const CATEGORIAS_MENU_ORDEN = [
  'Entradas',
  'Plato principal',
  'Menú niños y adolescentes',
  'Postres',
  'Bebidas',
] as const;

export type CategoriaMenuPapeleria = (typeof CATEGORIAS_MENU_ORDEN)[number];

const LIENZO_FOTOCABINA_ANCHO = 1200;
const LIENZO_FOTOCABINA_ALTO = 1800;
const MARGEN_FOTOCABINA = 48;
const SEPARACION_FOTOCABINA = 24;

export interface VentanaFotocabinaRect {
  x: number;
  y: number;
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
}

export interface ResultadoVerificacionTexto {
  ok: boolean;
  faltantes: string[];
}

export interface ResultadoProcesamientoMarco {
  pngBuffer: Buffer;
  base64: string;
  anchoPx: number;
  altoPx: number;
  ventanasOk: boolean;
  coberturas: number[];
}

export interface TragoPapeleriaDato {
  nombre: string;
  descripcion?: string;
  imageUrl?: string;
  nombreSinAlcohol?: string;
}

export interface PlatoPapeleriaDato {
  nombre: string;
  categoria: CategoriaMenuPapeleria;
  imageUrl?: string;
}

export interface MomentoPapeleriaDato {
  hora: string;
  titulo: string;
  descripcion?: string;
}

export interface DatosPapeleriaFiesta {
  pieza: TipoPiezaPapeleriaIA;
  esEmpresa: boolean;
  nombreAgasajado: string;
  motivo: string;
  fechaTexto: string;
  tematica: string;
  colores: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  coloresTexto: string[];
  protagonistaFotoUrl?: string;
  logoUrl?: string;
  whatsappAjustes?: string;
  tragos: TragoPapeleriaDato[];
  platosPorCategoria: Partial<Record<CategoriaMenuPapeleria, PlatoPapeleriaDato[]>>;
  momentos: MomentoPapeleriaDato[];
  textosEsperados: string[];
}

export interface ExtraerDatosPapeleriaOpciones {
  platosMenu?: Array<
    Omit<Partial<MenuItem>, 'type'> & {
      nombre?: string;
      categoria?: string;
      type?: string;
      imageUrl?: string;
    }
  >;
  itemsItinerario?: ProgramaEventoItem[];
  whatsappAjustes?: string;
  logoUrl?: string | null;
  printLayout?: LayoutFotocabina;
}

export interface DisenarPiezaConIAParams {
  fiesta: FiestaEnPlanificacion | Record<string, any>;
  pieza: TipoPiezaPapeleriaIA;
  platosMenu?: ExtraerDatosPapeleriaOpciones['platosMenu'];
  itemsItinerario?: ProgramaEventoItem[];
  whatsappAjustes?: string;
  logoUrl?: string | null;
  printLayout?: LayoutFotocabina;
  hayPresupuestoFn?: () => Promise<boolean>;
  fotoDeReferenciaFn?: typeof fotoDeReferenciaSegura;
  pedirImagenFn?: typeof pedirImagen;
  leerImagenFn?: typeof leerImagen;
}

export type ResultadoDisenoPapeleriaIA =
  | {
      ok: true;
      base64: string;
      mimeType: 'image/png';
      mejorFondoBase64: string;
      bajaResolucion: boolean;
      avisoResolucion?: string;
      anchoPx: number;
      altoPx: number;
      modelo: string;
      intentos: number;
      coberturas?: number[];
    }
  | {
      ok: false;
      topeAlcanzado: true;
      error: string;
    }
  | {
      ok: false;
      topeAlcanzado?: false;
      usarPlantillaConFondo?: boolean;
      mejorFondoBase64?: string | null;
      textoFaltante?: string[];
      aviso?: string;
      error?: string;
      bajaResolucion?: boolean;
      avisoResolucion?: string;
      anchoPx?: number;
      altoPx?: number;
      modelo?: string;
      intentos: number;
      coberturas?: number[];
    };

/**
 * Normaliza un texto para comparar sin acentos, sin mayúsculas ni signos suaves.
 */
export function normalizarTextoComparacion(texto: string): string {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dividirPalabrasSignificativas(textoNormalizado: string): string[] {
  const todas = textoNormalizado.split(' ').filter(Boolean);
  if (todas.length <= 1) return todas;
  const filtradas = todas.filter((w) => w.length > 1 || /^\d$/.test(w));
  return filtradas.length > 0 ? filtradas : todas;
}

/**
 * Verifica palabra por palabra normalizada que todos los textos esperados
 * aparezcan en la lectura devuelta por la IA.
 */
export function verificarTextosEnLectura(
  textosEsperados: string[],
  lecturaIA: string,
): ResultadoVerificacionTexto {
  const lecturaNorm = normalizarTextoComparacion(lecturaIA);
  const palabrasLectura = lecturaNorm.split(' ').filter(Boolean);
  const conjuntoLectura = new Set(palabrasLectura);
  const faltantes: string[] = [];

  for (const esperadoRaw of textosEsperados) {
    const limpio = String(esperadoRaw || '').trim();
    if (!limpio) continue;
    const norm = normalizarTextoComparacion(limpio);
    if (!norm) continue;

    // Para horas tipo 22:30 verificamos secuencia contigua "22 30" (o "2230")
    // para evitar falsos positivos si aparecen "22:00" y "23:30" por separado.
    const matchHora = limpio.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (matchHora) {
      const hh = matchHora[1];
      const mm = matchHora[2];
      const regexHora = new RegExp(`\\b${hh}\\s+${mm}(?:hs|h)?\\b|\\b${hh}${mm}\\b`);
      if (!regexHora.test(lecturaNorm)) {
        faltantes.push(limpio);
        continue;
      }
    }

    const palabras = dividirPalabrasSignificativas(norm);
    const faltaAlguna = palabras.some((palabra) => {
      if (conjuntoLectura.has(palabra)) return false;
      if (/^\d+$/.test(palabra)) {
        const regexNumeroPegado = new RegExp(`\\b${palabra}(?:hs|h)?\\b`);
        return !regexNumeroPegado.test(lecturaNorm);
      }
      return true;
    });

    if (faltaAlguna) {
      faltantes.push(limpio);
    }
  }

  return {
    ok: faltantes.length === 0,
    faltantes,
  };
}

function rectPxANormalizado(xPx: number, yPx: number, widthPx: number, heightPx: number): VentanaFotocabinaRect {
  const x = xPx / LIENZO_FOTOCABINA_ANCHO;
  const y = yPx / LIENZO_FOTOCABINA_ALTO;
  const width = widthPx / LIENZO_FOTOCABINA_ANCHO;
  const height = heightPx / LIENZO_FOTOCABINA_ALTO;
  return {
    x,
    y,
    width,
    height,
    xMin: x,
    xMax: (xPx + widthPx) / LIENZO_FOTOCABINA_ANCHO,
    yMin: y,
    yMax: (yPx + heightPx) / LIENZO_FOTOCABINA_ALTO,
    xPx,
    yPx,
    widthPx,
    heightPx,
  };
}

/**
 * Calcula las ventanas exactas de la fotocabina sobre el lienzo 1200 x 1800
 * usando MARGEN = 48 y SEPARACION = 24 iguales a tira-fotocabina.ts.
 */
export function obtenerVentanasFotocabina(
  layout: LayoutFotocabina = 'strip_3',
): VentanaFotocabinaRect[] {
  const anchoTotal = LIENZO_FOTOCABINA_ANCHO - MARGEN_FOTOCABINA * 2;

  if (layout === 'single_photo') {
    const altoFotoGrande = 1100;
    return [rectPxANormalizado(MARGEN_FOTOCABINA, MARGEN_FOTOCABINA, anchoTotal, altoFotoGrande)];
  }

  if (layout === 'strip_4') {
    const anchoFoto = (anchoTotal - SEPARACION_FOTOCABINA) / 2;
    const altoFoto = (1140 - SEPARACION_FOTOCABINA) / 2;
    return [
      rectPxANormalizado(MARGEN_FOTOCABINA, MARGEN_FOTOCABINA, anchoFoto, altoFoto),
      rectPxANormalizado(MARGEN_FOTOCABINA + anchoFoto + SEPARACION_FOTOCABINA, MARGEN_FOTOCABINA, anchoFoto, altoFoto),
      rectPxANormalizado(MARGEN_FOTOCABINA, MARGEN_FOTOCABINA + altoFoto + SEPARACION_FOTOCABINA, anchoFoto, altoFoto),
      rectPxANormalizado(
        MARGEN_FOTOCABINA + anchoFoto + SEPARACION_FOTOCABINA,
        MARGEN_FOTOCABINA + altoFoto + SEPARACION_FOTOCABINA,
        anchoFoto,
        altoFoto,
      ),
    ];
  }

  const altoFotoGrande = 640;
  const altoFotosChicas = 480;
  const anchoFotoChica = (anchoTotal - SEPARACION_FOTOCABINA) / 2;
  const yFotosChicas = MARGEN_FOTOCABINA + altoFotoGrande + SEPARACION_FOTOCABINA;

  return [
    rectPxANormalizado(MARGEN_FOTOCABINA, MARGEN_FOTOCABINA, anchoTotal, altoFotoGrande),
    rectPxANormalizado(MARGEN_FOTOCABINA, yFotosChicas, anchoFotoChica, altoFotosChicas),
    rectPxANormalizado(
      MARGEN_FOTOCABINA + anchoFotoChica + SEPARACION_FOTOCABINA,
      yFotosChicas,
      anchoFotoChica,
      altoFotosChicas,
    ),
  ];
}

function esVerdeChroma(r: number, g: number, b: number): boolean {
  return g >= 170 && r <= 120 && b <= 120 && g > r + 45 && g > b + 45;
}

function decodificarImagenABuffer(imagenBase64OPngBuffer: string | Buffer): Buffer {
  if (Buffer.isBuffer(imagenBase64OPngBuffer)) {
    return imagenBase64OPngBuffer;
  }
  const limpio = String(imagenBase64OPngBuffer || '')
    .replace(/^data:[^;]+;base64,/i, '')
    .trim();
  return Buffer.from(limpio, 'base64');
}

/**
 * Convierte las zonas verde chroma (#00FF00) a alpha=0 y comprueba
 * que el centro de cada ventana de la fotocabina haya quedado transparente (>= 80%).
 */
export async function procesarMarcoVerdeATransparente(
  imagenBase64OPngBuffer: string | Buffer,
  layout: LayoutFotocabina = 'strip_3',
): Promise<ResultadoProcesamientoMarco> {
  const inputBuffer = decodificarImagenABuffer(imagenBase64OPngBuffer);
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.from(data);
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    if (esVerdeChroma(r, g, b)) {
      rgba[i + 3] = 0;
    }
  }

  const ventanas = obtenerVentanasFotocabina(layout);
  const coberturas: number[] = [];

  for (const ventana of ventanas) {
    const wx0 = Math.max(0, Math.round(ventana.xMin * info.width));
    const wx1 = Math.min(info.width, Math.round(ventana.xMax * info.width));
    const wy0 = Math.max(0, Math.round(ventana.yMin * info.height));
    const wy1 = Math.min(info.height, Math.round(ventana.yMax * info.height));

    const margenX = Math.floor((wx1 - wx0) * 0.15);
    const margenY = Math.floor((wy1 - wy0) * 0.15);
    const cx0 = wx1 - wx0 > margenX * 2 ? wx0 + margenX : wx0;
    const cx1 = wx1 - wx0 > margenX * 2 ? wx1 - margenX : wx1;
    const cy0 = wy1 - wy0 > margenY * 2 ? wy0 + margenY : wy0;
    const cy1 = wy1 - wy0 > margenY * 2 ? wy1 - margenY : wy1;

    let total = 0;
    let transparentes = 0;
    for (let y = cy0; y < cy1; y++) {
      for (let x = cx0; x < cx1; x++) {
        total++;
        const alpha = rgba[(y * info.width + x) * 4 + 3];
        if (alpha <= 10) {
          transparentes++;
        }
      }
    }

    coberturas.push(total > 0 ? transparentes / total : 0);
  }

  const pngBuffer = await sharp(rgba, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  const ventanasOk = coberturas.length > 0 && coberturas.every((c) => c >= 0.8);

  return {
    pngBuffer,
    base64: pngBuffer.toString('base64'),
    anchoPx: info.width,
    altoPx: info.height,
    ventanasOk,
    coberturas,
  };
}

/**
 * Detecta si la fiesta corresponde a un evento corporativo o institucional
 * para evitar temáticas de 15 años (flores/coronas) y adaptar colores/símbolos.
 */
export function detectarEsEmpresa(fiesta: FiestaEnPlanificacion | Record<string, any> | null | undefined): boolean {
  if (!fiesta) return false;
  const f = fiesta as Record<string, any>;
  if (f.invitacionDigital?.plantilla === 'Corporativo') return true;

  const textos = [
    f.tipo,
    f.eventType,
    f.nombre,
    f.motivo,
    f.tematica,
    f.configuracion?.tipoCelebracion,
    f.configuracion?.nombreEvento,
    f.configuracion?.notesAdicionales,
    f.decoracion?.tema,
    f.decoracion?.estiloDecoracion,
    f.cartaTragos?.numeroPrincipal,
    f.cartaTragos?.titulo,
    f.menuMesa?.titulo,
    f.invitacionConfig?.tipoEvento,
  ]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(' ');

  const norm = normalizarTextoComparacion(textos);
  if (!norm) return false;

  const palabrasClave = [
    'empresa',
    'empresarial',
    'corporativ',
    'institucional',
    'funcionario',
    'lanzamiento',
    'aniversario empresa',
    'aniversario de empresa',
    'aniversario institucional',
    'congreso',
    'convencion',
    'gala empresarial',
    'correo uruguayo',
    'jornada laboral',
    'fin de ano empresa',
  ];

  return palabrasClave.some((kw) => norm.includes(kw));
}

function mapearCategoriaMenu(raw?: string): CategoriaMenuPapeleria | null {
  const norm = normalizarTextoComparacion(raw || '');
  if (!norm) return null;
  if (norm.includes('entrada')) return 'Entradas';
  if (norm.includes('principal')) return 'Plato principal';
  if (norm.includes('infantil') || norm.includes('nino') || norm.includes('adolescente')) {
    return 'Menú niños y adolescentes';
  }
  if (norm.includes('postre')) return 'Postres';
  if (norm.includes('bebida')) return 'Bebidas';
  return null;
}

function formatearFechaCorta(fechaRaw?: string): string {
  const texto = String(fechaRaw || '').trim();
  if (!texto) return '';
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1].slice(-2)}`;
  }
  const barras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (barras) {
    return `${barras[1].padStart(2, '0')}/${barras[2].padStart(2, '0')}/${barras[3].slice(-2)}`;
  }
  return texto;
}

function extraerPaletaReal(f: Record<string, any>): {
  colores: DatosPapeleriaFiesta['colores'];
  coloresTexto: string[];
} {
  const candidatos = [
    f.decoracion?.paletaColores,
    f.decoracion?.colorPalette,
    f.paletaColores,
    f.configuracion?.paletaColores,
    f.cartaTragos?.paletaColores,
    f.menuMesa?.paletaColores,
    f.invitacionDigital?.cabecera?.paletaColores,
  ].filter((c) => c && typeof c === 'object');

  const paleta: DatosPapeleriaFiesta['colores'] = {};
  for (const c of candidatos) {
    if (!paleta.primary && typeof c.primary === 'string' && c.primary.trim()) {
      paleta.primary = c.primary.trim();
    }
    if (!paleta.secondary && typeof c.secondary === 'string' && c.secondary.trim()) {
      paleta.secondary = c.secondary.trim();
    }
    if (!paleta.accent && typeof c.accent === 'string' && c.accent.trim()) {
      paleta.accent = c.accent.trim();
    }
    if (!paleta.background && typeof c.background === 'string' && c.background.trim()) {
      paleta.background = c.background.trim();
    }
  }

  if (!paleta.primary && typeof f.configuracion?.primaryColor === 'string' && f.configuracion.primaryColor.trim()) {
    paleta.primary = f.configuracion.primaryColor.trim();
  }

  const coloresTexto = Array.from(
    new Set(
      [
        paleta.primary,
        paleta.secondary,
        paleta.accent,
        typeof f.decoracion?.colorGlobos === 'string' ? f.decoracion.colorGlobos.trim() : '',
        typeof f.decoracion?.colorCubremantel === 'string' ? f.decoracion.colorCubremantel.trim() : '',
      ].filter((v): v is string => Boolean(v && v.trim())),
    ),
  );

  return { colores: paleta, coloresTexto };
}

/**
 * Extrae únicamente datos reales cargados en la fiesta (sin inventar textos ni precios).
 */
export function extraerDatosRealesFiesta(
  fiesta: FiestaEnPlanificacion | Record<string, any>,
  pieza: TipoPiezaPapeleriaIA,
  opciones: ExtraerDatosPapeleriaOpciones = {},
): DatosPapeleriaFiesta {
  const f = (fiesta || {}) as Record<string, any>;
  const esEmpresa = detectarEsEmpresa(f);

  const prot1 = String(
    f.configuracion?.protagonista1Nombre ||
      f.configuracion?.nombreAgasajado ||
      f.cartaTragos?.protagonistaNombre ||
      f.menuMesa?.protagonistaNombre ||
      f.numerosMesa?.protagonistaNombre ||
      f.invitacionDigital?.cabecera?.protagonista1 ||
      f.configuracion?.clienteNombre ||
      f.nombre ||
      f.configuracion?.nombreEvento ||
      '',
  ).trim();
  const prot2 = String(
    f.configuracion?.protagonista2Nombre || f.invitacionDigital?.cabecera?.protagonista2 || '',
  ).trim();

  const nombreAgasajado =
    prot1 && prot2 && normalizarTextoComparacion(prot1) !== normalizarTextoComparacion(prot2)
      ? `${prot1} & ${prot2}`
      : prot1;

  const tipoRaw = String(
    f.configuracion?.tipoCelebracion || f.tipo || f.eventType || f.motivo || '',
  ).trim();
  const numeroCarta = String(f.cartaTragos?.numeroPrincipal || '').trim();
  let motivo = String(f.motivo || '').trim() || numeroCarta || tipoRaw;
  if (!motivo && f.configuracion?.nombreEvento) {
    motivo = String(f.configuracion.nombreEvento).trim();
  }
  if (!esEmpresa) {
    const tipoNorm = normalizarTextoComparacion(tipoRaw);
    if (!numeroCarta && !f.motivo) {
      if (tipoNorm.includes('xv') || tipoNorm.includes('15')) {
        motivo = 'Mis 15 Años';
      } else if (tipoNorm.includes('boda') || tipoNorm.includes('casamiento')) {
        motivo = 'Nuestra Boda';
      }
    }
  }

  const fechaTexto = formatearFechaCorta(f.configuracion?.fechaEvento || f.fecha || f.numerosMesa?.fechaEvento);
  const tematica = String(
    f.decoracion?.tema || f.tematica || f.decoracion?.estiloDecoracion || (esEmpresa ? 'Corporativo e institucional' : ''),
  ).trim();

  const { colores, coloresTexto } = extraerPaletaReal(f);

  const protagonistaFotoUrl =
    [
      f.configuracion?.protagonistaFotoUrl,
      f.cartaTragos?.protagonistaFotoUrl,
      f.menuMesa?.protagonistaFotoUrl,
    ].find((u) => typeof u === 'string' && u.trim()) || undefined;

  const whatsappAjustes =
    [
      opciones.whatsappAjustes,
      f.cartaTragos?.empresa?.contacto,
      f.menuMesa?.empresa?.contacto,
      f.guestExperienceSettings?.whatsappNumber,
    ].find((w) => typeof w === 'string' && w.trim()) || AK_WHATSAPP_PARA_MOSTRAR;

  const logoUrl = typeof opciones.logoUrl === 'string' && opciones.logoUrl.trim() ? opciones.logoUrl.trim() : undefined;

  const tragos: TragoPapeleriaDato[] = Array.isArray(f.cartaTragos?.items)
    ? f.cartaTragos.items
        .filter((t: any) => t && t.activo !== false && typeof t.nombre === 'string' && t.nombre.trim())
        .map((t: any) => ({
          nombre: t.nombre.trim(),
          ...(typeof (t.descripcion || t.description) === 'string' && (t.descripcion || t.description).trim()
            ? { descripcion: (t.descripcion || t.description).trim() }
            : {}),
          ...(typeof t.imageUrl === 'string' && t.imageUrl.trim() ? { imageUrl: t.imageUrl.trim() } : {}),
          ...(typeof t.nombreSinAlcohol === 'string' && t.nombreSinAlcohol.trim()
            ? { nombreSinAlcohol: t.nombreSinAlcohol.trim() }
            : {}),
        }))
    : [];

  const platosPorCategoria: Partial<Record<CategoriaMenuPapeleria, PlatoPapeleriaDato[]>> = {};
  const agregarPlato = (cat: CategoriaMenuPapeleria, plato: PlatoPapeleriaDato) => {
    if (!platosPorCategoria[cat]) platosPorCategoria[cat] = [];
    platosPorCategoria[cat]!.push(plato);
  };

  if (Array.isArray(opciones.platosMenu)) {
    for (const p of opciones.platosMenu) {
      const nombre = String(p?.nombre || p?.name || '').trim();
      const cat = mapearCategoriaMenu(p?.categoria || p?.type);
      if (!nombre || !cat) continue;
      agregarPlato(cat, {
        nombre,
        categoria: cat,
        ...(typeof p?.imageUrl === 'string' && p.imageUrl.trim() ? { imageUrl: p.imageUrl.trim() } : {}),
      });
    }
  } else if (f.menuMesa && typeof f.menuMesa === 'object') {
    const mapaCampos: Array<[keyof typeof f.menuMesa, CategoriaMenuPapeleria]> = [
      ['entrada', 'Entradas'],
      ['platoPrincipal', 'Plato principal'],
      ['adolescentes', 'Menú niños y adolescentes'],
      ['postres', 'Postres'],
      ['bebidas', 'Bebidas'],
    ];
    for (const [campo, cat] of mapaCampos) {
      const val = String(f.menuMesa[campo] || '').trim();
      if (!val) continue;
      for (const linea of val.split(/\r?\n|;/).map((s) => s.trim()).filter(Boolean)) {
        agregarPlato(cat, { nombre: linea, categoria: cat });
      }
    }
  }

  const programaFuente = Array.isArray(opciones.itemsItinerario)
    ? opciones.itemsItinerario
    : Array.isArray(f.programa)
      ? f.programa
      : [];
  const momentos: MomentoPapeleriaDato[] = programaFuente
    .filter((m: any) => m && (String(m.hora || '').trim() || String(m.titulo || '').trim()))
    .map((m: any) => ({
      hora: String(m.hora || '').trim(),
      titulo: String(m.titulo || '').trim(),
      ...(typeof (m.descripcionCliente || m.descripcion) === 'string' &&
      (m.descripcionCliente || m.descripcion).trim()
        ? { descripcion: (m.descripcionCliente || m.descripcion).trim() }
        : {}),
    }));

  const textosEsperados: string[] = [];
  if (pieza === 'cartaTragos') {
    if (nombreAgasajado) textosEsperados.push(nombreAgasajado);
    for (const trago of tragos) {
      textosEsperados.push(trago.nombre);
    }
  } else if (pieza === 'menuMesa') {
    if (nombreAgasajado) textosEsperados.push(nombreAgasajado);
    for (const cat of CATEGORIAS_MENU_ORDEN) {
      for (const plato of platosPorCategoria[cat] || []) {
        textosEsperados.push(plato.nombre);
      }
    }
  } else if (pieza === 'cronograma') {
    if (nombreAgasajado) textosEsperados.push(nombreAgasajado);
    for (const m of momentos) {
      if (m.hora) textosEsperados.push(m.hora);
      if (m.titulo) textosEsperados.push(m.titulo);
    }
  } else if (pieza === 'afiche') {
    if (nombreAgasajado) textosEsperados.push(nombreAgasajado);
    if (motivo) textosEsperados.push(motivo);
  }

  return {
    pieza,
    esEmpresa,
    nombreAgasajado,
    motivo,
    fechaTexto,
    tematica,
    colores,
    coloresTexto,
    protagonistaFotoUrl,
    logoUrl,
    whatsappAjustes,
    tragos,
    platosPorCategoria,
    momentos,
    textosEsperados,
  };
}

/**
 * Arma el prompt detallado para Gemini según el tipo de pieza y los datos reales de la fiesta.
 */
export function armarPromptPapeleria(
  datos: DatosPapeleriaFiesta,
  piezaOpcional?: TipoPiezaPapeleriaIA,
  opciones: { printLayout?: LayoutFotocabina } = {},
): string {
  const pieza = piezaOpcional || datos.pieza;
  const coloresDesc = datos.coloresTexto.length
    ? datos.coloresTexto.join(', ')
    : datos.esEmpresa
      ? 'azul institucional, gris grafito y blanco'
      : 'dorado, tonos cálidos y elegantes';
  const tematicaDesc = datos.tematica || (datos.esEmpresa ? 'corporativa institucional sobria' : 'celebración elegante con flores y brillos suaves');

  if (pieza === 'fondoMesas') {
    return [
      'Diseñá ÚNICAMENTE un fondo decorativo artístico vertical para tarjetas de número de mesa de evento.',
      `Temática y estilo visual: ${tematicaDesc}. Paleta de colores: ${coloresDesc}.`,
      datos.esEmpresa
        ? 'Evento empresarial/corporativo: usá estética institucional moderna, líneas geométricas y texturas sobrias. PROHIBIDO poner flores de quinceañera o coronas.'
        : 'Usá ornamentación temática delicada en los bordes y textura sutil en el centro para buena legibilidad.',
      'REGLA CRÍTICA: NO escribas absolutamente NINGÚN texto, NINGUNA letra, NINGÚN número, ni fechas, ni nombres, ni "Mesa", ni logos. Sólo el fondo limpio porque la aplicación dibuja el número, el nombre y la fecha encima.',
    ].join('\n');
  }

  const estiloBloque = datos.esEmpresa
    ? [
        'Evento corporativo/institucional: diseñá papelería profesional y sobria acorde al cliente y motivo del evento, usando sus colores e identidad institucional.',
        'PROHIBIDO agregar flores de quinceañera, tiaras, coronas o adornos infantiles.',
      ].join(' ')
    : [
        `Fondo temático elegante (${tematicaDesc}) con detalles florales, brillos y textura armoniosa en paleta ${coloresDesc}.`,
        'Nombre principal destacado con letra dorada o tipografía con relieve elegante.',
        datos.protagonistaFotoUrl
          ? 'Integrá armónicamente la foto del protagonista adjunta como retrato principal en la composición.'
          : '',
      ]
        .filter(Boolean)
        .join(' ');

  const pieMarcaBloque = [
    'En la parte inferior incluí un círculo rojo con el logo de AK Producciones (usando el logo adjunto si está disponible).',
    datos.whatsappAjustes ? `Al pie incluí el WhatsApp de contacto: ${datos.whatsappAjustes}.` : '',
    'Composición vertical lista para imprimir. PROHIBIDO poner precios, signos $ o importes. PROHIBIDO inventar textos, tragos, platos u horarios que no figuren abajo.',
  ]
    .filter(Boolean)
    .join(' ');

  if (pieza === 'marcoFotocabina') {
    const layout = opciones.printLayout || 'strip_3';
    const ventanas = obtenerVentanasFotocabina(layout);
    const descVentanas = ventanas
      .map(
        (v, idx) =>
          `Ventana ${idx + 1}: x desde ${(v.xMin * 100).toFixed(1)}% hasta ${(v.xMax * 100).toFixed(1)}%, y desde ${(v.yMin * 100).toFixed(1)}% hasta ${(v.yMax * 100).toFixed(1)}%`,
      )
      .join('; ');

    return [
      'Diseñá un marco vertical de impresión 10x15 cm (proporción 2:3, 1200x1800 px) para fotocabina / espejo mágico.',
      estiloBloque,
      `REGLA CRÍTICA DE CHROMA KEY: Las ventanas donde irán las fotos deben estar rellenas de VERDE PURO PLANO SÓLIDO HEX #00FF00 (RGB 0, 255, 0), sin degradados, sin sombras ni adornos adentro.`,
      `Ubicación exacta de las ventanas #00FF00 (${layout}): ${descVentanas}.`,
      `En la franja inferior decorada (debajo de las ventanas) escribí claramente: "${datos.nombreAgasajado}"${datos.motivo ? `, "${datos.motivo}"` : ''}${datos.fechaTexto ? ` y fecha "${datos.fechaTexto}"` : ''}.`,
      pieMarcaBloque,
    ].join('\n');
  }

  if (pieza === 'cartaTragos') {
    const listaTragos = datos.tragos
      .map((t, i) => `${i + 1}. ${t.nombre}${t.nombreSinAlcohol ? ` (sin alcohol: ${t.nombreSinAlcohol})` : ''}`)
      .join('\n');
    return [
      'Diseñá una Carta de Tragos vertical de 10x15 cm (proporción 2:3) lista para imprimir con diseño editorial de alta calidad.',
      estiloBloque,
      `Título: CARTA DE TRAGOS`,
      datos.nombreAgasajado ? `Nombre principal exacto: ${datos.nombreAgasajado}` : '',
      datos.motivo ? `Motivo exacto: ${datos.motivo}` : '',
      listaTragos
        ? `Incluí exactamente estos tragos reales (con su foto de referencia junto a cada nombre si se adjuntan imágenes):\n${listaTragos}`
        : 'No agregues tragos inventados.',
      pieMarcaBloque,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (pieza === 'menuMesa') {
    const bloquesMenu: string[] = [];
    for (const cat of CATEGORIAS_MENU_ORDEN) {
      const platos = datos.platosPorCategoria[cat];
      if (!platos?.length) continue;
      bloquesMenu.push(`${cat.toUpperCase()}:\n${platos.map((p) => `- ${p.nombre}`).join('\n')}`);
    }
    return [
      'Diseñá un Menú de Mesa vertical de 10x15 cm (proporción 2:3) elegante y perfectamente legible para imprimir.',
      estiloBloque,
      'Título: MENÚ',
      datos.nombreAgasajado ? `Nombre principal exacto: ${datos.nombreAgasajado}` : '',
      datos.motivo ? `Motivo exacto: ${datos.motivo}` : '',
      bloquesMenu.length
        ? `Incluí ÚNICAMENTE estas secciones y platos reales (con su foto junto a cada plato si se adjuntan referencias):\n${bloquesMenu.join('\n\n')}`
        : 'No inventes platos.',
      pieMarcaBloque,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (pieza === 'cronograma') {
    const listaMomentos = datos.momentos
      .map((m) => `- ${m.hora} ${m.titulo}`.trim())
      .join('\n');
    return [
      'Diseñá un Cronograma / Itinerario del evento vertical tamaño A4 (210x297 mm) elegante y muy legible.',
      estiloBloque,
      'Título: CRONOGRAMA',
      datos.nombreAgasajado ? `Nombre principal exacto: ${datos.nombreAgasajado}` : '',
      datos.motivo ? `Motivo exacto: ${datos.motivo}` : '',
      listaMomentos
        ? `Incluí exactamente estos momentos con su hora y título reales:\n${listaMomentos}`
        : 'No inventes horarios ni momentos.',
      pieMarcaBloque,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // afiche
  return [
    'Diseñá un Afiche vertical tamaño A4 (210x297 mm) de bienvenida para el agasajado, calidad fotográfica e imprenta.',
    estiloBloque,
    datos.nombreAgasajado ? `Nombre principal exacto y muy protagonista: ${datos.nombreAgasajado}` : '',
    datos.motivo ? `Subtítulo o motivo exacto: ${datos.motivo}` : '',
    datos.fechaTexto ? `Fecha del evento: ${datos.fechaTexto}` : '',
    pieMarcaBloque,
  ]
    .filter(Boolean)
    .join('\n');
}

async function medirResolucion(
  base64: string,
  pieza: TipoPiezaPapeleriaIA,
): Promise<{ anchoPx: number; altoPx: number; bajaResolucion: boolean; avisoResolucion?: string }> {
  const minAncho = pieza === 'marcoFotocabina' ? 900 : 1000;
  const minAlto = pieza === 'marcoFotocabina' ? 1350 : 1400;

  let anchoPx = 0;
  let altoPx = 0;
  try {
    const buf = decodificarImagenABuffer(base64);
    if (buf.length > 0) {
      const meta = await sharp(buf).metadata();
      anchoPx = meta.width || 0;
      altoPx = meta.height || 0;
    }
  } catch {
    anchoPx = 0;
    altoPx = 0;
  }

  const bajaResolucion = anchoPx < minAncho || altoPx < minAlto;
  if (!bajaResolucion) {
    return { anchoPx, altoPx, bajaResolucion: false };
  }

  const avisoResolucion =
    anchoPx > 0 && altoPx > 0
      ? `La imagen tiene ${anchoPx}×${altoPx} px; para imprimir nítido se recomienda al menos ${minAncho}×${minAlto} px.`
      : `No se pudo confirmar que la resolución alcance los ${minAncho}×${minAlto} px recomendados para impresión.`;

  return { anchoPx, altoPx, bajaResolucion: true, avisoResolucion };
}

function aspectoPorPieza(pieza: TipoPiezaPapeleriaIA): string {
  if (pieza === 'cartaTragos' || pieza === 'menuMesa' || pieza === 'marcoFotocabina') {
    return '2:3';
  }
  return '3:4';
}

function recolectarUrlsReferencia(
  datos: DatosPapeleriaFiesta,
  pieza: TipoPiezaPapeleriaIA,
): string[] {
  if (pieza === 'fondoMesas') return [];
  const urls: string[] = [];
  if (datos.protagonistaFotoUrl) urls.push(datos.protagonistaFotoUrl);
  if (datos.logoUrl) urls.push(datos.logoUrl);

  if (pieza === 'cartaTragos') {
    for (const trago of datos.tragos) {
      if (trago.imageUrl) urls.push(trago.imageUrl);
    }
  } else if (pieza === 'menuMesa') {
    for (const cat of CATEGORIAS_MENU_ORDEN) {
      for (const plato of datos.platosPorCategoria[cat] || []) {
        if (plato.imageUrl) urls.push(plato.imageUrl);
      }
    }
  }

  return Array.from(new Set(urls)).slice(0, 10);
}

/**
 * Orquesta el diseño de una pieza de papelería con IA:
 * - Verifica tope mensual con hayPresupuestoParaIA.
 * - Carga fotos de referencia seguras con fotoDeReferenciaSegura.
 * - Valida texto leído por Gemini (hasta 3 intentos) o ventanas transparentes del marco (hasta 3 intentos).
 */
export async function disenarPiezaConIA(
  params: DisenarPiezaConIAParams,
): Promise<ResultadoDisenoPapeleriaIA> {
  const hayPresupuestoFn = params.hayPresupuestoFn || hayPresupuestoParaIA;
  const fotoDeReferenciaFn = params.fotoDeReferenciaFn || fotoDeReferenciaSegura;
  const pedirImagenFn = params.pedirImagenFn || pedirImagen;
  const leerImagenFn = params.leerImagenFn || leerImagen;

  const tienePresupuesto = await hayPresupuestoFn();
  if (!tienePresupuesto) {
    return {
      ok: false,
      topeAlcanzado: true,
      error: MENSAJE_TOPE_IA,
    };
  }

  const datos = extraerDatosRealesFiesta(params.fiesta, params.pieza, {
    platosMenu: params.platosMenu,
    itemsItinerario: params.itemsItinerario,
    whatsappAjustes: params.whatsappAjustes,
    logoUrl: params.logoUrl,
    printLayout: params.printLayout,
  });

  const urlsReferencia = recolectarUrlsReferencia(datos, params.pieza);
  const referenciasRaw = await Promise.all(urlsReferencia.map((url) => fotoDeReferenciaFn(url)));
  const referencias = referenciasRaw.filter((img): img is NonNullable<typeof img> => Boolean(img));

  const promptBase = armarPromptPapeleria(datos, params.pieza, {
    printLayout: params.printLayout,
  });
  const aspectRatio = aspectoPorPieza(params.pieza);

  if (params.pieza === 'fondoMesas') {
    const res = await pedirImagenFn({
      prompt: promptBase,
      images: referencias,
      aspectRatio,
      imageSize: '2K',
      quien: 'papeleria',
    });

    if (!res.ok) {
      if (res.topeAlcanzado) {
        return { ok: false, topeAlcanzado: true, error: res.error || MENSAJE_TOPE_IA };
      }
      return {
        ok: false,
        error: res.error || 'No se pudo generar el fondo para los números de mesa.',
        intentos: 1,
      };
    }

    if (!res.base64) {
      return {
        ok: false,
        error: 'No se pudo generar el fondo para los números de mesa.',
        intentos: 1,
      };
    }

    const resolucion = await medirResolucion(res.base64, params.pieza);
    return {
      ok: true,
      base64: res.base64,
      mimeType: 'image/png',
      mejorFondoBase64: res.base64,
      bajaResolucion: resolucion.bajaResolucion,
      ...(resolucion.avisoResolucion ? { avisoResolucion: resolucion.avisoResolucion } : {}),
      anchoPx: resolucion.anchoPx,
      altoPx: resolucion.altoPx,
      modelo: res.modelo,
      intentos: 1,
    };
  }

  if (params.pieza === 'marcoFotocabina') {
    const layout = params.printLayout || 'strip_3';
    let mejorMarco: {
      base64: string;
      promedioCobertura: number;
      coberturas: number[];
      bajaResolucion: boolean;
      avisoResolucion?: string;
      anchoPx: number;
      altoPx: number;
      modelo: string;
    } | null = null;
    let ultimoError = '';

    for (let intento = 1; intento <= 3; intento++) {
      const promptIntento =
        intento === 1
          ? promptBase
          : `${promptBase}\n\nATENCIÓN INTENTO ${intento}: En el intento anterior las ventanas no quedaron bien pintadas de verde #00FF00 en la posición pedida. Rellená cada ventana completamente de verde puro plano #00FF00 sin bordes internos ni objetos.`;

      const res = await pedirImagenFn({
        prompt: promptIntento,
        images: referencias,
        aspectRatio,
        imageSize: '2K',
        quien: 'papeleria',
      });

      if (!res.ok) {
        if (res.topeAlcanzado) {
          return { ok: false, topeAlcanzado: true, error: res.error || MENSAJE_TOPE_IA };
        }
        ultimoError = res.error || 'No se pudo generar el marco.';
        continue;
      }

      if (!res.base64) {
        ultimoError = 'No se pudo generar el marco.';
        continue;
      }

      const procesado = await procesarMarcoVerdeATransparente(res.base64, layout);
      const resolucion = await medirResolucion(procesado.base64, params.pieza);
      const promedio =
        procesado.coberturas.length > 0
          ? procesado.coberturas.reduce((acc, c) => acc + c, 0) / procesado.coberturas.length
          : 0;

      if (!mejorMarco || promedio > mejorMarco.promedioCobertura) {
        mejorMarco = {
          base64: procesado.base64,
          promedioCobertura: promedio,
          coberturas: procesado.coberturas,
          bajaResolucion: resolucion.bajaResolucion,
          avisoResolucion: resolucion.avisoResolucion,
          anchoPx: procesado.anchoPx || resolucion.anchoPx,
          altoPx: procesado.altoPx || resolucion.altoPx,
          modelo: res.modelo,
        };
      }

      if (procesado.ventanasOk) {
        return {
          ok: true,
          base64: procesado.base64,
          mimeType: 'image/png',
          mejorFondoBase64: procesado.base64,
          bajaResolucion: resolucion.bajaResolucion,
          ...(resolucion.avisoResolucion ? { avisoResolucion: resolucion.avisoResolucion } : {}),
          anchoPx: procesado.anchoPx || resolucion.anchoPx,
          altoPx: procesado.altoPx || resolucion.altoPx,
          modelo: res.modelo,
          intentos: intento,
          coberturas: procesado.coberturas,
        };
      }
    }

    if (!mejorMarco) {
      return {
        ok: false,
        error: ultimoError || 'No se pudo generar el marco de fotocabina.',
        intentos: 3,
      };
    }

    return {
      ok: false,
      usarPlantillaConFondo: true,
      mejorFondoBase64: mejorMarco.base64,
      aviso: 'Las ventanas del marco no quedaron transparentes en la posición de la fotocabina tras 3 intentos; usamos la plantilla de respaldo.',
      bajaResolucion: mejorMarco.bajaResolucion,
      ...(mejorMarco.avisoResolucion ? { avisoResolucion: mejorMarco.avisoResolucion } : {}),
      anchoPx: mejorMarco.anchoPx,
      altoPx: mejorMarco.altoPx,
      modelo: mejorMarco.modelo,
      intentos: 3,
      coberturas: mejorMarco.coberturas,
    };
  }

  // Piezas con texto validado: cartaTragos, menuMesa, cronograma, afiche
  const textosEsperados = datos.textosEsperados;
  let ultimoFaltante: string[] = [];
  let ultimoError = '';
  let mejorFondo: {
    base64: string;
    faltantes: string[];
    bajaResolucion: boolean;
    avisoResolucion?: string;
    anchoPx: number;
    altoPx: number;
    modelo: string;
  } | null = null;

  for (let intento = 1; intento <= 3; intento++) {
    const promptIntento =
      intento === 1 || ultimoFaltante.length === 0
        ? promptBase
        : `${promptBase}\n\nATENCIÓN INTENTO ${intento}: En la imagen anterior faltaron o salieron mal escritos estos textos exactos: ${ultimoFaltante.join(', ')}. Escribilos completos, bien nítidos y sin faltas.`;

    const res = await pedirImagenFn({
      prompt: promptIntento,
      images: referencias,
      aspectRatio,
      imageSize: '2K',
      quien: 'papeleria',
    });

    if (!res.ok) {
      if (res.topeAlcanzado) {
        return { ok: false, topeAlcanzado: true, error: res.error || MENSAJE_TOPE_IA };
      }
      ultimoError = res.error || 'No se pudo generar la imagen de papelería.';
      continue;
    }

    if (!res.base64) {
      ultimoError = 'No se pudo generar la imagen de papelería.';
      continue;
    }

    const resolucion = await medirResolucion(res.base64, params.pieza);

    if (textosEsperados.length === 0) {
      return {
        ok: true,
        base64: res.base64,
        mimeType: 'image/png',
        mejorFondoBase64: res.base64,
        bajaResolucion: resolucion.bajaResolucion,
        ...(resolucion.avisoResolucion ? { avisoResolucion: resolucion.avisoResolucion } : {}),
        anchoPx: resolucion.anchoPx,
        altoPx: resolucion.altoPx,
        modelo: res.modelo,
        intentos: intento,
      };
    }

    const lectura = await leerImagenFn({
      imagenBase64: res.base64,
      mimeType: 'image/png',
      prompt: 'Transcribí literalmente todo el texto visible en esta imagen (nombres, títulos, tragos, platos, horarios y números), línea por línea, sin corregir ni inventar.',
      quien: 'papeleria',
      modelos: [MODELOS_GEMINI.texto[0], ...MODELOS_GEMINI.texto.slice(1)],
    });

    if (!lectura.ok) {
      if (lectura.topeAlcanzado) {
        return { ok: false, topeAlcanzado: true, error: lectura.error || MENSAJE_TOPE_IA };
      }
      ultimoFaltante = [...textosEsperados];
      ultimoError = lectura.error || 'No se pudo verificar el texto de la imagen.';
      if (!mejorFondo) {
        mejorFondo = {
          base64: res.base64,
          faltantes: ultimoFaltante,
          bajaResolucion: resolucion.bajaResolucion,
          avisoResolucion: resolucion.avisoResolucion,
          anchoPx: resolucion.anchoPx,
          altoPx: resolucion.altoPx,
          modelo: res.modelo,
        };
      }
      continue;
    }

    const verificacion = verificarTextosEnLectura(textosEsperados, lectura.texto);
    if (verificacion.ok) {
      return {
        ok: true,
        base64: res.base64,
        mimeType: 'image/png',
        mejorFondoBase64: res.base64,
        bajaResolucion: resolucion.bajaResolucion,
        ...(resolucion.avisoResolucion ? { avisoResolucion: resolucion.avisoResolucion } : {}),
        anchoPx: resolucion.anchoPx,
        altoPx: resolucion.altoPx,
        modelo: res.modelo,
        intentos: intento,
      };
    }

    ultimoFaltante = verificacion.faltantes;
    if (!mejorFondo || verificacion.faltantes.length < mejorFondo.faltantes.length) {
      mejorFondo = {
        base64: res.base64,
        faltantes: verificacion.faltantes,
        bajaResolucion: resolucion.bajaResolucion,
        avisoResolucion: resolucion.avisoResolucion,
        anchoPx: resolucion.anchoPx,
        altoPx: resolucion.altoPx,
        modelo: res.modelo,
      };
    }
  }

  if (!mejorFondo) {
    return {
      ok: false,
      error: ultimoError || 'No se pudo generar la pieza con IA.',
      intentos: 3,
    };
  }

  const textoFaltante = mejorFondo.faltantes;
  return {
    ok: false,
    usarPlantillaConFondo: true,
    mejorFondoBase64: mejorFondo.base64,
    textoFaltante,
    aviso: `La IA no escribió bien estos textos: ${textoFaltante.join(', ')}; usamos la plantilla`,
    bajaResolucion: mejorFondo.bajaResolucion,
    ...(mejorFondo.avisoResolucion ? { avisoResolucion: mejorFondo.avisoResolucion } : {}),
    anchoPx: mejorFondo.anchoPx,
    altoPx: mejorFondo.altoPx,
    modelo: mejorFondo.modelo,
    intentos: 3,
  };
}

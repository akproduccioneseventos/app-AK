import { z } from 'zod';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { aprenderDeLoAprobado } from '@/lib/ia/aprender-de-lo-aprobado';
import type {
  FiestaEnPlanificacion,
  InvitacionDigitalConfig,
  InvitacionDigitalData,
  PaletaTipoPropuesta,
  PropuestaDeWeb,
  SeccionInvitacion,
  TonoPropuesta,
} from '@/types/fiesta';
import { generarPaletaPorTipo } from '@/lib/invitacion-paletas';

export const ArmarWebOutputSchema = z.object({
  plantilla: z.enum([
    'Grazia',
    'Allegria',
    'XvModerna',
    'XvClasica',
    'BodaMinimalista',
    'BodaCampo',
    'FiestaNoche',
    'Corporativo',
  ]),
  cabecera: z.object({
    protagonista1: z.string(),
    protagonista2: z.string().optional().default(''),
    subtitulo: z.string(),
    paletaColores: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
    }),
  }),
  bienvenida: z.object({
    titulo: z.string(),
    texto: z.string(),
  }),
  historia: z
    .object({
      titulo: z.string().optional().default('Nuestra Historia'),
      texto: z.string().optional().default(''),
    })
    .optional(),
  dressCode: z
    .object({
      tipo: z.string().optional().default(''),
      texto: z.string().optional().default(''),
    })
    .optional(),
});

export type ArmarWebOutput = z.infer<typeof ArmarWebOutputSchema>;

export interface ArmarWebInput {
  fiesta: FiestaEnPlanificacion;
  invitacionConfig?: InvitacionDigitalConfig;
  colorBase?: string;
  paletaTipo?: PaletaTipoPropuesta;
  tono?: TonoPropuesta;
  plantillaForzada?: ArmarWebOutput['plantilla'];
}

export const FOTOS_TEMA: Record<string, string> = {
  xv: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop&q=80',
  boda: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  corporativo: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  fiesta: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
};

export function getFotoTema(tipoEvento: string): string {
  const t = (tipoEvento || '').toLowerCase();
  if (t.includes('15') || t.includes('xv') || t.includes('quince')) {
    return FOTOS_TEMA.xv;
  }
  if (t.includes('boda') || t.includes('casamiento') || t.includes('matrimonio')) {
    return FOTOS_TEMA.boda;
  }
  if (t.includes('corp') || t.includes('empresa') || t.includes('empresarial')) {
    return FOTOS_TEMA.corporativo;
  }
  return FOTOS_TEMA.fiesta;
}

function limpiarNombreAgasajado(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^(mis\s+)?15(\s+a[ñn]os)?\s+(de\s+)?/i, '')
    .replace(/^(boda\s+de\s+|casamiento\s+de\s+)/i, '')
    .replace(/^(cumple\s+de\s+|cumplea[ñn]os\s+de\s+)/i, '')
    .replace(/,\s*\d{1,2}\/\d{1,2}.*$/, '')
    .trim();
}

function elegirPlantillaPorDefecto(tipoEvento: string): ArmarWebOutput['plantilla'] {
  const t = tipoEvento.toLowerCase();
  if (t.includes('15') || t.includes('xv') || t.includes('quince')) {
    return 'XvModerna';
  }
  if (t.includes('boda') || t.includes('casamiento')) {
    return 'BodaMinimalista';
  }
  if (t.includes('corp') || t.includes('empresa')) {
    return 'Corporativo';
  }
  if (t.includes('noche') || t.includes('cumple') || t.includes('18')) {
    return 'FiestaNoche';
  }
  return 'Allegria';
}

export async function armarWebDelEventoFlow(input: ArmarWebInput): Promise<InvitacionDigitalData> {
  const { fiesta } = input;
  const cfg = input.invitacionConfig || fiesta.invitacionConfig;
  const fConfig = fiesta.configuracion || ({} as any);

  // 1. Extraer datos con prioridad invitacionConfig -> fiesta
  const rawNombre1 =
    cfg?.nombreHomenajeada?.trim() ||
    fConfig.protagonista1Nombre?.trim() ||
    fConfig.nombreEvento?.trim() ||
    '';
  const nombreHomenajeada = limpiarNombreAgasajado(rawNombre1);

  const rawNombre2 =
    cfg?.nombreHomenajeado2?.trim() ||
    fConfig.protagonista2Nombre?.trim() ||
    '';
  const nombreHomenajeado2 = limpiarNombreAgasajado(rawNombre2);

  const tipoEvento =
    (cfg?.tipoEvento as string) ||
    (fConfig.tipoCelebracion as string) ||
    'otro';

  const fechaEvento = cfg?.fechaEvento?.trim() || fConfig.fechaEvento?.trim() || '';
  const horaEvento = cfg?.horaEvento?.trim() || fConfig.horaInicio?.trim() || '';

  const nombreSalon = cfg?.nombreSalon?.trim() || fConfig.nombreLugar?.trim() || '';
  const direccionSalon = cfg?.direccionSalon?.trim() || fConfig.direccionLugar?.trim() || '';
  const linkMaps = cfg?.linkMaps?.trim() || fConfig.googleMapsUrl?.trim() || '';

  const cronograma = cfg?.cronograma || (fiesta as any).itinerario || (fiesta as any).cronograma || [];
  const dressCodeSuelto = (fConfig as { dressCode?: unknown }).dressCode;
  const dressCodeInput =
    (typeof cfg?.dressCode?.tipo === 'string' ? cfg.dressCode.tipo : '') ||
    (typeof dressCodeSuelto === 'string' ? dressCodeSuelto : '') ||
    '';
  const hitos = cfg?.hitos || [];

  const fotoPortada =
    cfg?.fotoPortada?.trim() ||
    (fiesta as any).fotoPortada ||
    (fiesta as any).coverImageUrl ||
    '';

  const rawGaleria = cfg?.galeriaFotos || (fiesta as any).galeriaFotos || [];
  // Filtrar fotos que no sean de picsum
  const galeriaFotos = Array.isArray(rawGaleria)
    ? rawGaleria.filter((f: string) => typeof f === 'string' && !f.includes('picsum.photos'))
    : [];

  // 2. Control de presupuesto de IA
  const tienePresupuesto = await hayPresupuestoParaIA();
  if (!tienePresupuesto) {
    throw new Error('Se llegó al tope de IA del mes');
  }

  // 3. Preparar prompt
  const ejemplosAprobados = await aprenderDeLoAprobado('web-evento');
  const seccionEjemplos =
    ejemplosAprobados.length > 0
      ? `\n\nEJEMPLOS REALES APROBADOS POR EL DUEÑO ANTERIORMENTE:\n${ejemplosAprobados
          .map((ej, idx) => `Ejemplo ${idx + 1}:\n${ej}`)
          .join('\n---\n')}\nInspirate en el tono y estilo de estos ejemplos aprobados para redactar la bienvenida y los textos.\n`
      : '';
  const prompt = `Actuá como el diseñador web experto de AK Producciones.
Tu tarea es generar el contenido y diseño para la web de invitación digital de un evento.

DATOS DEL EVENTO:
- Tipo de evento: ${tipoEvento}
- Agasajado / Protagonista 1: ${nombreHomenajeada || 'No especificado'}
- Protagonista 2: ${nombreHomenajeado2 || 'No aplica'}
- Fecha: ${fechaEvento || 'No especificada'}
- Hora: ${horaEvento || 'No especificada'}
- Salón: ${nombreSalon || 'No especificado'}
- Dirección: ${direccionSalon || 'No especificada'}
- Dress Code: ${dressCodeInput || 'No especificado'}
- Cantidad de hitos / historia: ${hitos.length}
- Cantidad de momentos en cronograma: ${cronograma.length}

REGLAS ESTRICTAS DE TEXTO Y CONTENIDO:
1. Idioma y Tono: Escribí SIEMPRE en español rioplatense uruguayo/argentino (cálido, festivo, corto).
2. NO INVENTAR DATOS: Ni fechas, ni horas, ni direcciones, ni nombres que no vengan en la entrada.
3. PROHIBICIONES: Sin precios, sin promesas de resultado y sin nombrar a nadie del personal de la empresa.
4. REGALOS Y DATOS BANCARIOS: NUNCA escribas ni inventes datos bancarios ni números de cuenta.
5. PLANTILLA: Seleccioná exactamente una de estas 8 opciones según el tipo de evento:
   ['Grazia', 'Allegria', 'XvModerna', 'XvClasica', 'BodaMinimalista', 'BodaCampo', 'FiestaNoche', 'Corporativo']
   - 15 años: 'XvModerna' o 'XvClasica'.
   - Bodas: 'BodaMinimalista', 'BodaCampo' o 'Grazia'.
   - Corporativos: 'Corporativo'.
   - Cumpleaños / Fiesta noche: 'FiestaNoche' o 'Allegria'.
6. PROTAGONISTAS: En protagonista1 poné solo el nombre limpio del agasajado (ej. si era '15 de Sofía', debe ser 'Sofía'). En protagonista2 poné el segundo si corresponde o dejalo vacío "".
7. BIENVENIDA: Título cálido (ej. "¡Mis 15 Años!", "¡Nos Casamos!", "¡Festejamos juntos!") y texto breve rioplatense.
8. PALETA DE COLORES: Proponé colores armónicos en hex (#RRGGBB) para primary, secondary y accent.${seccionEjemplos}

Devolvé un único objeto JSON con esta estructura exacta:
{
  "plantilla": "XvModerna",
  "cabecera": {
    "protagonista1": "Sofía",
    "protagonista2": "",
    "subtitulo": "Mis 15 Años",
    "paletaColores": {
      "primary": "#d4a574",
      "secondary": "#2d3748",
      "accent": "#f7fafc"
    }
  },
  "bienvenida": {
    "titulo": "¡Mis 15!",
    "texto": "Los momentos más lindos se disfrutan con la gente que uno más quiere. Te espero para compartir una noche inolvidable."
  },
  "historia": {
    "titulo": "Nuestra Historia",
    "texto": ""
  },
  "dressCode": {
    "tipo": "${dressCodeInput || 'Elegante'}",
    "texto": "${dressCodeInput ? `Dress code: ${dressCodeInput}` : ''}"
  }
}`;

  let parsedIA: ArmarWebOutput;
  let usoFallbackSinIA = false;

  try {
    const model = getGeminiModelForAgent('fiestas_general');
    const result = await generateWithGeminiFallback({
      model,
      prompt,
      output: { format: 'json' },
    });

    const crudo = (result.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonParsed = JSON.parse(crudo);
    parsedIA = ArmarWebOutputSchema.parse(jsonParsed);
    // Solo si la IA generó exitosamente registramos consumo
    await registrarConsumoIA('armar-web-evento');
  } catch (error) {
    usoFallbackSinIA = true;
    console.error('Error al generar web con IA fallback manual:', error);
    // En caso de falla del modelo, armamos una estructura limpia y determinista sin romper
    const plantillaFallback = elegirPlantillaPorDefecto(tipoEvento);
    parsedIA = {
      plantilla: plantillaFallback,
      cabecera: {
        // Sin nombre cargado NO se inventa uno: queda vacío (la acción pide el dato antes de armar).
        protagonista1: nombreHomenajeada || '',
        protagonista2: nombreHomenajeado2 || '',
        subtitulo: tipoEvento.toLowerCase().includes('15') ? 'Mis 15 Años' : 'Nuestra Celebración',
        paletaColores: {
          primary: '#d4a574',
          secondary: '#363636',
          accent: '#A2D2B0',
        },
      },
      bienvenida: {
        titulo: tipoEvento.toLowerCase().includes('15') ? '¡Mis 15 Años!' : '¡Te Esperamos!',
        texto: 'Queremos compartir con vos este día tan especial y vivir una noche inolvidable juntos.',
      },
      historia: {
        titulo: 'Nuestra Historia',
        texto: hitos.length > 0 ? 'Cada paso nos ha traído hasta aquí.' : '',
      },
      dressCode: {
        tipo: dressCodeInput || 'Elegante',
        texto: dressCodeInput ? `Código de vestimenta: ${dressCodeInput}` : '',
      },
    };
  }

  // Asegurar protagonista1 limpio si vino 15 de X
  const protagonista1Final =
    limpiarNombreAgasajado(parsedIA.cabecera?.protagonista1) ||
    nombreHomenajeada ||
    '';

  const plantillaFinal = input.plantillaForzada || parsedIA.plantilla;
  const paleta =
    input.colorBase && input.paletaTipo
      ? generarPaletaPorTipo(input.colorBase, input.paletaTipo)
      : parsedIA.cabecera.paletaColores;

  let subtituloTexto = parsedIA.cabecera.subtitulo;
  let bienvenidaTitulo = parsedIA.bienvenida.titulo;
  let bienvenidaTexto = parsedIA.bienvenida.texto;
  let despedidaTexto = '¡Te esperamos!';

  if (input.tono === 'clasico') {
    if (tipoEvento.toLowerCase().includes('15') || tipoEvento.toLowerCase().includes('xv')) {
      bienvenidaTitulo = '¡Mis 15 Años!';
      subtituloTexto = 'Mis 15 Años';
      bienvenidaTexto = 'Los momentos más lindos de la vida se disfrutan con quienes más queremos. Te espero para compartir una noche mágica e inolvidable.';
    }
    despedidaTexto = '¡Te espero para compartir esta noche mágica!';
  } else if (input.tono === 'moderno') {
    if (tipoEvento.toLowerCase().includes('15') || tipoEvento.toLowerCase().includes('xv')) {
      bienvenidaTitulo = '¡Llegó la noche!';
      subtituloTexto = '15 Fest';
      bienvenidaTexto = 'Preparate para vivir una noche única con la mejor música, buena onda y momentos increíbles. ¡No podés faltar!';
    }
    despedidaTexto = '¡Nos vemos en la pista!';
  } else if (input.tono === 'divertido') {
    if (tipoEvento.toLowerCase().includes('15') || tipoEvento.toLowerCase().includes('xv')) {
      bienvenidaTitulo = '¡A romper la pista!';
      subtituloTexto = '¡Modo Fiesta!';
      bienvenidaTexto = '¡Se vienen mis 15 y la fiesta va a ser épica! Traé tus mejores pasos de baile y muchas ganas de divertirte hasta que salga el sol.';
    }
    despedidaTexto = '¡La fiesta la hacemos entre todos!';
  }

  const imagenFondoCabecera =
    fotoPortada && !fotoPortada.includes('picsum.photos')
      ? fotoPortada
      : getFotoTema(tipoEvento);

  const tieneDireccion = Boolean(direccionSalon && direccionSalon.trim() !== '');
  const tieneCronograma = Array.isArray(cronograma) && cronograma.length > 0;
  const tieneHitos = Array.isArray(hitos) && hitos.length > 0 && Boolean(parsedIA.historia?.texto);
  const tieneGaleria = Array.isArray(galeriaFotos) && galeriaFotos.length > 0;
  const tieneDressCode = Boolean(dressCodeInput && dressCodeInput.trim() !== '');
  const tieneFecha = Boolean(fechaEvento && fechaEvento.trim() !== '');

  const invitacionData: InvitacionDigitalData = {
    plantilla: plantillaFinal,
    category: tipoEvento.toLowerCase().includes('15') ? 'XV Años' : 'General',
    musicaFondoUrl: '',
    cabecera: {
      visible: true,
      logoUrl: '',
      protagonista1: protagonista1Final,
      protagonista2: parsedIA.cabecera.protagonista2 || '',
      subtitulo: {
        text: subtituloTexto,
        style: { fontFamily: 'Inter', fontSize: '1.25rem', color: paleta.secondary },
      },
      paletaColores: paleta,
      imagenFondoUrl: imagenFondoCabecera,
    },
    bienvenida: {
      visible: Boolean(bienvenidaTexto),
      titulo: {
        text: bienvenidaTitulo,
        style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: paleta.secondary },
      },
      texto: {
        text: bienvenidaTexto,
        style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' },
      },
    },
    cuentaRegresiva: {
      visible: tieneFecha,
    },
    detallesEvento: {
      visible: tieneDireccion,
      ceremoniaReligiosa: {
        visible: false,
        titulo: '',
        hora: '',
        nombreLugar: '',
        direccionLugar: '',
        mapaUrl: '',
        imagenUrl: '',
      },
      ceremoniaCivil: {
        visible: false,
        titulo: '',
        hora: '',
        nombreLugar: '',
        direccionLugar: '',
        mapaUrl: '',
        imagenUrl: '',
      },
      celebracion: {
        visible: tieneDireccion,
        titulo: 'Celebración',
        fecha: tieneFecha ? fechaEvento : undefined,
        hora: horaEvento || '',
        nombreLugar: nombreSalon || '',
        direccionLugar: direccionSalon || '',
        mapaUrl: linkMaps || '',
        imagenUrl: '',
      },
    },
    itinerario: {
      visible: tieneCronograma,
    },
    galeria: {
      visible: tieneGaleria,
      fotos: tieneGaleria ? galeriaFotos : [],
    },
    historia: {
      visible: tieneHitos,
      titulo: {
        text: parsedIA.historia?.titulo || 'Nuestra Historia',
        style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: paleta.accent },
      },
      texto: {
        text: parsedIA.historia?.texto || '',
        style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' },
      },
    },
    dressCode: {
      visible: tieneDressCode,
      tipo: parsedIA.dressCode?.tipo || dressCodeInput,
      texto: {
        text: parsedIA.dressCode?.texto || `Dress code: ${dressCodeInput}`,
        style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' },
      },
    },
    regalos: {
      visible: false,
      titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#363636' } },
      texto: { text: 'Tu presencia es nuestro mejor regalo.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
      datosBancarios: '',
      items: [],
    },
    confirmacion: {
      visible: true,
    },
    musica: {
      visible: false,
    },
    redesSociales: {
      visible: false,
      hashtag: '',
      texto: { text: '¡Compartí tus momentos!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#363636' } },
    },
    despedida: {
      visible: true,
      texto: {
        text: despedidaTexto,
        style: { fontFamily: 'Dancing_Script', fontSize: '3rem', color: paleta.primary },
      },
    },
    footer: {
      visible: true,
      titulo: {
        text: `Con cariño, ${protagonista1Final}${parsedIA.cabecera.protagonista2 ? ' y ' + parsedIA.cabecera.protagonista2 : ''}`,
        style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' },
      },
      nombreEmpresa: {
        text: 'AK Producciones',
        style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: paleta.primary },
      },
    },
    secciones: [],
  };

  // Secciones sincronizadas para plantillas que iteran sobre secciones
  const secciones: SeccionInvitacion[] = [
    {
      id: 'cabecera',
      tipo: 'cabecera',
      data: {
        visible: true,
        logoUrl: '',
        protagonista1: invitacionData.cabecera.protagonista1,
        protagonista2: invitacionData.cabecera.protagonista2,
        subtitulo: invitacionData.cabecera.subtitulo,
        paletaColores: invitacionData.cabecera.paletaColores,
      },
    },
    {
      id: 'bienvenida',
      tipo: 'bienvenida',
      data: {
        visible: invitacionData.bienvenida.visible,
        titulo: invitacionData.bienvenida.titulo,
        texto: invitacionData.bienvenida.texto,
        imagenFondoUrl: '',
      },
    },
    {
      id: 'cuentaRegresiva',
      tipo: 'cuentaRegresiva',
      data: { visible: invitacionData.cuentaRegresiva.visible },
    },
    {
      id: 'detallesEvento',
      tipo: 'detallesEvento',
      data: {
        visible: invitacionData.detallesEvento.visible,
        ceremoniaReligiosa: invitacionData.detallesEvento.ceremoniaReligiosa,
        ceremoniaCivil: invitacionData.detallesEvento.ceremoniaCivil,
        celebracion: invitacionData.detallesEvento.celebracion,
      },
    },
    {
      id: 'itinerario',
      tipo: 'itinerario',
      data: { visible: invitacionData.itinerario.visible },
    },
    {
      id: 'historia',
      tipo: 'historia',
      data: {
        visible: invitacionData.historia.visible,
        titulo: invitacionData.historia.titulo,
        texto: invitacionData.historia.texto,
      },
    },
    {
      id: 'galeria',
      tipo: 'galeria',
      data: {
        visible: invitacionData.galeria.visible,
        fotos: invitacionData.galeria.fotos,
      },
    },
    {
      id: 'dressCode',
      tipo: 'dressCode',
      data: {
        visible: invitacionData.dressCode.visible,
        tipo: invitacionData.dressCode.tipo,
        texto: invitacionData.dressCode.texto,
      },
    },
    {
      id: 'regalos',
      tipo: 'regalos',
      data: {
        visible: invitacionData.regalos.visible,
        titulo: invitacionData.regalos.titulo,
        texto: invitacionData.regalos.texto,
        datosBancarios: invitacionData.regalos.datosBancarios,
        items: invitacionData.regalos.items,
      },
    },
    {
      id: 'confirmacion',
      tipo: 'confirmacion',
      data: { visible: invitacionData.confirmacion.visible },
    },
    {
      id: 'redesSociales',
      tipo: 'redesSociales',
      data: {
        visible: invitacionData.redesSociales.visible,
        hashtag: invitacionData.redesSociales.hashtag,
        texto: invitacionData.redesSociales.texto,
      },
    },
    {
      id: 'despedida',
      tipo: 'despedida',
      data: { visible: invitacionData.despedida.visible, texto: invitacionData.despedida.texto },
    },
    {
      id: 'footer',
      tipo: 'footer',
      data: {
        visible: invitacionData.footer.visible,
        titulo: invitacionData.footer.titulo,
        nombreEmpresa: invitacionData.footer.nombreEmpresa,
      },
    },
  ];

  invitacionData.secciones = secciones;
  if (usoFallbackSinIA) {
    (invitacionData as any).esBaseSinIA = true;
    (invitacionData as any).aviso = 'Armé una versión base sin IA; revisala';
  }
  return invitacionData;
}

export async function generarTresPropuestasFlow(input: {
  fiesta: FiestaEnPlanificacion;
  invitacionConfig?: InvitacionDigitalConfig;
  colorBase?: string;
}): Promise<PropuestaDeWeb[]> {
  const { fiesta, colorBase } = input;
  const cfg = input.invitacionConfig || fiesta.invitacionConfig;
  const fConfig = fiesta.configuracion || ({} as any);

  const tipo = (
    (cfg?.tipoEvento as string) ||
    (fConfig.tipoCelebracion as string) ||
    (fConfig.nombreEvento as string) ||
    ''
  ).toLowerCase();

  const es15 = tipo.includes('15') || tipo.includes('xv') || tipo.includes('quince');
  const esBoda = tipo.includes('boda') || tipo.includes('casamiento') || tipo.includes('matrimonio');

  // Tres plantillas distintas de las 8
  const plantillas: ArmarWebOutput['plantilla'][] = es15
    ? ['XvClasica', 'XvModerna', 'Allegria']
    : esBoda
    ? ['Grazia', 'BodaMinimalista', 'BodaCampo']
    : ['Grazia', 'Allegria', 'FiestaNoche'];

  const configuraciones: {
    tono: TonoPropuesta;
    paletaTipo: PaletaTipoPropuesta;
    plantilla: ArmarWebOutput['plantilla'];
  }[] = [
    { tono: 'clasico', paletaTipo: 'analoga', plantilla: plantillas[0] },
    { tono: 'moderno', paletaTipo: 'contraste', plantilla: plantillas[1] },
    { tono: 'divertido', paletaTipo: 'suave', plantilla: plantillas[2] },
  ];

  const color = colorBase || cfg?.colorPrincipal || '#ec4899';
  const timestamp = Date.now();

  const propuestas: PropuestaDeWeb[] = [];

  for (let i = 0; i < configuraciones.length; i++) {
    const conf = configuraciones[i];
    const invitacionDigital = await armarWebDelEventoFlow({
      fiesta,
      invitacionConfig: cfg,
      colorBase: color,
      paletaTipo: conf.paletaTipo,
      tono: conf.tono,
      plantillaForzada: conf.plantilla,
    });

    propuestas.push({
      id: `propuesta_${i + 1}_${timestamp}`,
      invitacionDigital,
      creadaEn: new Date().toISOString(),
      paletaTipo: conf.paletaTipo,
      tono: conf.tono,
    });
  }

  return propuestas;
}

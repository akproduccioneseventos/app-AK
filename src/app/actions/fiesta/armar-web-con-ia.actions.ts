'use server';

import { requireFiestaWriteAccess, getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { armarWebDelEventoFlow, generarTresPropuestasFlow } from '@/ai/flows/armar-web-del-evento-flow';
import type { FiestaEnPlanificacion, InvitacionDigitalData, PropuestaDeWeb, SeccionInvitacion } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { createNotification } from '@/lib/notifications/create-notification';

const DEFAULT_WELCOME_TEXT = defaultInvitacionDigitalData.bienvenida.texto.text;
const DEFAULT_STORY_TEXT = defaultInvitacionDigitalData.historia.texto.text;
const DEFAULT_GIFTS_TEXT = defaultInvitacionDigitalData.regalos.texto.text;

function mezclarInvitacionConExistente(
  iaData: InvitacionDigitalData,
  existente?: InvitacionDigitalData,
  rehacer = false,
): InvitacionDigitalData {
  if (!existente || Object.keys(existente).length === 0) {
    return iaData;
  }

  const resultado: InvitacionDigitalData = {
    ...iaData,
    cabecera: { ...iaData.cabecera },
    bienvenida: { ...iaData.bienvenida },
    detallesEvento: {
      ...iaData.detallesEvento,
      celebracion: { ...iaData.detallesEvento.celebracion },
      ceremoniaReligiosa: { ...iaData.detallesEvento.ceremoniaReligiosa },
      ceremoniaCivil: { ...iaData.detallesEvento.ceremoniaCivil },
    },
    cuentaRegresiva: { ...iaData.cuentaRegresiva },
    itinerario: { ...iaData.itinerario },
    galeria: { ...iaData.galeria, fotos: [...iaData.galeria.fotos] },
    historia: { ...iaData.historia },
    dressCode: { ...iaData.dressCode },
    regalos: {
      ...iaData.regalos,
      items: Array.isArray(iaData.regalos.items) ? [...iaData.regalos.items] : [],
    },
    confirmacion: { ...iaData.confirmacion },
    musica: { ...iaData.musica },
    redesSociales: { ...iaData.redesSociales },
    despedida: { ...iaData.despedida },
    footer: { ...iaData.footer },
    secciones: [],
  };

  // 1. Datos bancarios de regalos: la IA NUNCA los escribe ni los toca.
  // Con regalos.datosBancarios cargados, siguen idénticos siempre (incluso si rehacer=true).
  if (existente.regalos?.datosBancarios && existente.regalos.datosBancarios.trim() !== '') {
    resultado.regalos.datosBancarios = existente.regalos.datosBancarios;
    resultado.regalos.visible = true;
  }
  if (Array.isArray(existente.regalos?.items) && existente.regalos.items.length > 0) {
    resultado.regalos.items = existente.regalos.items;
  }

  // Si viene rehacer: true, la IA sobreescribe textos y plantilla, preservando datos bancarios
  if (rehacer) {
    // Sincronizar secciones y devolver
    resultado.secciones = sincronizarSecciones(resultado);
    return resultado;
  }

  // 2. Mezcla, no pisa: lo que el equipo ya escribió a mano queda.
  // Cabecera protagonistas
  if (
    existente.cabecera?.protagonista1 &&
    existente.cabecera.protagonista1.trim() !== '' &&
    existente.cabecera.protagonista1 !== 'Novio/a 1' &&
    existente.cabecera.protagonista1 !== 'María'
  ) {
    resultado.cabecera.protagonista1 = existente.cabecera.protagonista1;
  }

  if (
    existente.cabecera?.protagonista2 &&
    existente.cabecera.protagonista2.trim() !== '' &&
    existente.cabecera.protagonista2 !== 'Novio/a 2' &&
    existente.cabecera.protagonista2 !== 'Juan'
  ) {
    resultado.cabecera.protagonista2 = existente.cabecera.protagonista2;
  }

  // Cabecera subtitulo
  if (
    existente.cabecera?.subtitulo?.text &&
    existente.cabecera.subtitulo.text.trim() !== '' &&
    existente.cabecera.subtitulo.text !== 'Nuestra Boda'
  ) {
    resultado.cabecera.subtitulo = existente.cabecera.subtitulo;
  }

  // Bienvenida titulo
  if (
    existente.bienvenida?.titulo?.text &&
    existente.bienvenida.titulo.text.trim() !== '' &&
    existente.bienvenida.titulo.text !== '¡Nos Casamos!' &&
    existente.bienvenida.titulo.text !== '¡Mis 15 Años!'
  ) {
    resultado.bienvenida.titulo = existente.bienvenida.titulo;
  }

  // Bienvenida texto: lo escrito a mano no cambia
  if (
    existente.bienvenida?.texto?.text &&
    existente.bienvenida.texto.text.trim() !== '' &&
    existente.bienvenida.texto.text !== DEFAULT_WELCOME_TEXT
  ) {
    resultado.bienvenida.texto = existente.bienvenida.texto;
    resultado.bienvenida.visible = true;
  }

  // Historia texto
  if (
    existente.historia?.texto?.text &&
    existente.historia.texto.text.trim() !== '' &&
    existente.historia.texto.text !== DEFAULT_STORY_TEXT
  ) {
    resultado.historia.texto = existente.historia.texto;
    resultado.historia.visible = true;
  }

  // Dress code
  if (existente.dressCode?.texto?.text && existente.dressCode.texto.text.trim() !== '') {
    resultado.dressCode.texto = existente.dressCode.texto;
    resultado.dressCode.visible = true;
  }
  if (existente.dressCode?.tipo && existente.dressCode.tipo.trim() !== '') {
    resultado.dressCode.tipo = existente.dressCode.tipo;
    resultado.dressCode.visible = true;
  }

  // Regalos texto
  if (
    existente.regalos?.texto?.text &&
    existente.regalos.texto.text.trim() !== '' &&
    existente.regalos.texto.text !== DEFAULT_GIFTS_TEXT
  ) {
    resultado.regalos.texto = existente.regalos.texto;
  }

  // Plantilla elegida manualmente (distinta del default Grazia)
  if (existente.plantilla && existente.plantilla !== 'Grazia') {
    resultado.plantilla = existente.plantilla;
  }

  resultado.secciones = sincronizarSecciones(resultado);
  return resultado;
}

function sincronizarSecciones(data: InvitacionDigitalData): SeccionInvitacion[] {
  return [
    {
      id: 'cabecera',
      tipo: 'cabecera',
      data: {
        visible: true,
        logoUrl: '',
        protagonista1: data.cabecera.protagonista1,
        protagonista2: data.cabecera.protagonista2,
        subtitulo: data.cabecera.subtitulo,
        paletaColores: data.cabecera.paletaColores,
      },
    },
    {
      id: 'bienvenida',
      tipo: 'bienvenida',
      data: {
        visible: data.bienvenida.visible,
        titulo: data.bienvenida.titulo,
        texto: data.bienvenida.texto,
        imagenFondoUrl: '',
      },
    },
    {
      id: 'cuentaRegresiva',
      tipo: 'cuentaRegresiva',
      data: { visible: data.cuentaRegresiva.visible },
    },
    {
      id: 'detallesEvento',
      tipo: 'detallesEvento',
      data: {
        visible: data.detallesEvento.visible,
        ceremoniaReligiosa: data.detallesEvento.ceremoniaReligiosa,
        ceremoniaCivil: data.detallesEvento.ceremoniaCivil,
        celebracion: data.detallesEvento.celebracion,
      },
    },
    {
      id: 'itinerario',
      tipo: 'itinerario',
      data: { visible: data.itinerario.visible },
    },
    {
      id: 'historia',
      tipo: 'historia',
      data: {
        visible: data.historia.visible,
        titulo: data.historia.titulo,
        texto: data.historia.texto,
      },
    },
    {
      id: 'galeria',
      tipo: 'galeria',
      data: {
        visible: data.galeria.visible,
        fotos: data.galeria.fotos,
      },
    },
    {
      id: 'dressCode',
      tipo: 'dressCode',
      data: {
        visible: data.dressCode.visible,
        tipo: data.dressCode.tipo,
        texto: data.dressCode.texto,
      },
    },
    {
      id: 'regalos',
      tipo: 'regalos',
      data: {
        visible: data.regalos.visible,
        titulo: data.regalos.titulo,
        texto: data.regalos.texto,
        datosBancarios: data.regalos.datosBancarios,
        items: data.regalos.items,
      },
    },
    {
      id: 'confirmacion',
      tipo: 'confirmacion',
      data: { visible: data.confirmacion.visible },
    },
    {
      id: 'musica',
      tipo: 'musica',
      data: { visible: false },
    },
    {
      id: 'redesSociales',
      tipo: 'redesSociales',
      data: {
        visible: data.redesSociales.visible,
        hashtag: data.redesSociales.hashtag,
        texto: data.redesSociales.texto,
      },
    },
    {
      id: 'despedida',
      tipo: 'despedida',
      data: { visible: data.despedida.visible, texto: data.despedida.texto },
    },
    {
      id: 'footer',
      tipo: 'footer',
      data: {
        visible: data.footer.visible,
        titulo: data.footer.titulo,
        nombreEmpresa: data.footer.nombreEmpresa,
      },
    },
  ];
}

export async function armarWebConIA(
  fiestaId: string,
  options?: { rehacer?: boolean },
): Promise<{ success: boolean; invitacionDigital?: InvitacionDigitalData; error?: string }> {
  await requireFiestaWriteAccess(fiestaId);

  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, error: 'No se encontró la fiesta solicitada.' };
    }

    const generada = await armarWebDelEventoFlow({ fiesta });
    const invitacionDigital = mezclarInvitacionConExistente(
      generada,
      fiesta.invitacionDigital,
      options?.rehacer ?? false,
    );

    return { success: true, invitacionDigital };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error inesperado al armar la web con IA.';
    return { success: false, error: errorMsg };
  }
}

export async function crearTresPropuestasDeWeb(
  fiestaId: string,
  colorBase?: string,
): Promise<{ success: boolean; propuestas?: PropuestaDeWeb[]; error?: string }> {
  await requireFiestaWriteAccess(fiestaId);

  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, error: 'No se encontró la fiesta solicitada.' };
    }

    const propuestas = await generarTresPropuestasFlow({
      fiesta,
      colorBase: colorBase || fiesta.invitacionConfig?.colorPrincipal || '#ec4899',
    });

    // Guarda las 3 versiones en fiesta.propuestasDeWeb (máximo 3, la tanda nueva reemplaza a la anterior).
    // La web publicada (invitacionDigital) no cambia hasta que alguien elige.
    const fiestaActualizada: FiestaEnPlanificacion = {
      ...fiesta,
      propuestasDeWeb: propuestas,
    };

    const guardado = await saveFiesta(fiestaActualizada);
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudieron guardar las propuestas generadas.' };
    }

    return { success: true, propuestas };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error inesperado al generar las 3 propuestas.';
    return { success: false, error: errorMsg };
  }
}

export async function elegirPropuestaDeWeb(
  fiestaId: string,
  propuestaId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Primera línea: pasa si verifyPortalSession(fiestaId) (src/lib/security/portal-session.ts) o requireFiestaWriteAccess(fiestaId). Nada más.
  const portalOk = await verifyPortalSession(fiestaId);
  if (!portalOk) {
    await requireFiestaWriteAccess(fiestaId);
  }

  // 2. Sólo copia una propuesta ya guardada a invitacionDigital. No recibe contenido del navegador: el cliente elige, no escribe.
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    throw new Error('No se encontró la fiesta solicitada.');
  }

  const propuesta = (fiesta.propuestasDeWeb || []).find((p) => p.id === propuestaId);
  if (!propuesta) {
    throw new Error('No se encontró la propuesta solicitada.');
  }

  // 3. Guarda la elegida en fiesta.propuestaDeWebElegida y avisa al equipo con createNotification.
  const fiestaActualizada: FiestaEnPlanificacion = {
    ...fiesta,
    invitacionDigital: propuesta.invitacionDigital,
    propuestaDeWebElegida: propuesta.id,
  };

  const guardado = await saveFiesta(fiestaActualizada);
  if (!guardado.success) {
    return { success: false, error: guardado.error || 'No se pudo guardar la propuesta elegida.' };
  }

  try {
    const nombre = fiesta.configuracion?.nombreEvento || fiesta.configuracion?.protagonista1Nombre || 'La quinceañera';
    const aviso = await createNotification({
      mensaje: `✨ ${nombre} eligió su propuesta de web para la fiesta.`,
      href: `/fiestas/nueva/pagina-web?fiestaId=${fiestaId}`,
      icono: 'Sparkles',
    });
    // La web ya quedó elegida y guardada; si el aviso al equipo falla no se desarma, pero queda dicho.
    if (!aviso?.success) console.warn('[armar-web-con-ia] El aviso de propuesta elegida no se creó:', aviso?.error);
  } catch (err) {
    console.warn('[armar-web-con-ia] No se pudo crear la notificación de propuesta elegida:', err);
  }

  return { success: true };
}


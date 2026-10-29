'use server';

import type { FiestaEnPlanificacion, DecoracionData, MoodboardItem, DecoItem, CostoItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta, updateFiestaPartial } from './fiesta.actions';
import { usuarioDelEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import { mutarCostosInterno } from '@/lib/fiesta/costos-interno';
import { generateGeminiImage, type GeminiImageReference } from '@/lib/ai/gemini-image';
import { fotoDeReferenciaSegura } from '@/lib/ai/foto-de-referencia';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { requireAppSession } from '@/lib/auth/require-session';
import { idDelIntento } from '@/lib/intento-en-servidor';
import { PERMISOS, puede } from '@/lib/auth/perfiles';
import { requireEventPermission } from '@/lib/auth/event-access';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { AsyncMutex } from '@/lib/mutex';
import { randomUUID } from 'crypto';
import { uploadToStorageWithDownloadToken } from '@/lib/firebase/storage';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';

/**
 * EL TURNO DE LAS IMAGENES QUE SE PAGAN.
 *
 * Cada imagen del salon decorado se paga por unidad y hay un tope de tres por
 * fiesta. El tope se controlaba mirando cuantas habia y guardando despues; entre
 * esas dos cosas cabe otro pedido. Dos toques seguidos al boton contaban las
 * mismas dos imagenes, los dos pasaban el control, y se pagaban dos generaciones
 * cuando quedaba lugar para una. Lo encontro Codex el 10 de septiembre de 2026.
 *
 * Con turno, el segundo pedido espera, vuelve a contar y ve el tope real.
 */
const visualizacionesMutex = new AsyncMutex();

export async function updateDecoracion(fiestaId: string, decoracion: DecoracionData): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  // SIN cuenta del equipo a proposito: el CLIENTE arma su tablero de decoracion
  // desde su portal. El guardado de abajo ya pide sesion del equipo O la clave del
  // cliente de esta fiesta.
  try {
    const result = await updateFiestaPartial(fiestaId, { decoracion }, { allowPortal: true });
    if (!result.success) throw new Error(result.error || 'No se pudo guardar la decoración.');

    /**
     * LOS GASTOS DE DECORACION SE SINCRONIZAN SIEMPRE, TAMBIEN CUANDO NO QUEDA NADA.
     *
     * **Antes solo se sincronizaba si habia elementos.** Al sacar toda la decoracion,
     * los gastos de la decoracion vieja **quedaban cargados igual**: el costo del
     * evento seguia contando adornos que ya no estaban, y la ganancia salia mal.
     *
     * Y no se mira "por las dudas": si la sincronizacion falla, se avisa. Antes se
     * tiraba el resultado a la basura, asi que un error ahi no lo veia nadie.
     */
    // Desde el portal del cliente no se recalculan gastos: los costos son del equipo (orden 183) y el
    // cliente no tiene por qué tocarlos. Se recalculan la próxima vez que guarda alguien del equipo.
    const equipo = await usuarioDelEquipo();
    const puedeRecalcular = Boolean(equipo)
      && [PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS, PERMISOS.ORGANIZACION].some((p) => puede(equipo, p));
    if (!puedeRecalcular) return { success: true, updatedData: decoracion };
    const sincronizado = await sincronizarGastosDeco(fiestaId, decoracion.itemsDecoracion || []);
    if (!sincronizado.success) {
      return {
        success: false,
        error: sincronizado.error || 'La decoracion se guardo, pero los gastos no se pudieron actualizar.',
        updatedData: decoracion,
      };
    }

    return { success: true, updatedData: decoracion };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addMoodboardItem(fiestaId: string, url: string, description?: string, opciones?: { idIntento?: string }): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = decoracion.moodboardItems || [];

        // Pregunta 58: si la respuesta se perdio y la persona reintenta, la imagen ya esta con ese id.
        const idDeLaPantalla = idDelIntento('mood', opciones?.idIntento);
        if (idDeLaPantalla && items.some((i) => i.id === idDeLaPantalla)) return { success: true };

        const newItem: MoodboardItem = {
            id: idDeLaPantalla ?? `mood_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            url,
            description,
            likedByClient: false,
            uploadedBy: 'Organizador',
            timestamp: new Date().toISOString()
        };

        const updatedDecoracion = { ...decoracion, moodboardItems: [...items, newItem] };
        const guardado = await updateDecoracion(fiestaId, updatedDecoracion);
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'No se pudo guardar la imagen en el moodboard.' };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).filter(i => i.id !== itemId);

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        const guardado = await updateDecoracion(fiestaId, updatedDecoracion);
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'No se pudo eliminar la imagen del moodboard.' };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleLikeMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).map(i =>
            i.id === itemId ? { ...i, likedByClient: !i.likedByClient } : i
        );

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        const guardado = await updateDecoracion(fiestaId, updatedDecoracion);
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'No se pudo actualizar la reacción en el moodboard.' };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Sincroniza los costos internos de los items de decoración con el módulo de Gestión de Costos.
 * Los items de decoración tienen costos internos (gastos) que NO se suman al presupuesto del cliente,
 * pero sí deben reflejarse en los gastos operativos del evento.
 */
export async function syncDecoGastosToModule(
  fiestaId: string,
  itemsDecoracion: DecoItem[]
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  await requireEventPermission(fiestaId, [PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS, PERMISOS.ORGANIZACION]); // Plata: no cualquier sesión (candado de plata, 6/10/2026).
  return sincronizarGastosDeco(fiestaId, itemsDecoracion);
}

/**
 * Sin permiso propio: la llaman `syncDecoGastosToModule` (que pide el suyo) y `updateDecoracion`, que
 * guarda desde el portal del cliente (orden 194, hallazgo 35: el cliente veía "no se pudo guardar").
 * No está exportada, así que el navegador no la puede llamar.
 */
async function sincronizarGastosDeco(
  fiestaId: string,
  itemsDecoracion: DecoItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const decoItems: CostoItem[] = itemsDecoracion
      .filter(item => {
        const costo = item.costoUnitario ?? item.precioUnitario ?? 0;
        return costo > 0;
      })
      .map(item => {
        const costo = item.costoUnitario ?? item.precioUnitario ?? 0;
        return {
          id: `deco_${item.id}`,
          nombre: `Decoración: ${item.nombre}${item.cantidad > 1 ? ` (x${item.cantidad})` : ''}`,
          category: 'Decoración',
          montoEstimado: Math.round(costo * item.cantidad), // Integer amount as gestionCostos uses whole currency units
          notas: item.notas || `Gasto interno de decoración - ${item.categoria}`,
        };
      });

    // Sobre los costos de ESE momento, adentro de la escritura: antes se armaba con una lectura de
    // antes y un costo cargado a mano en el medio se perdía (auditoría contable 22/10).
    const guardado = await mutarCostosInterno(fiestaId, (costos) => ({
      ...costos,
      costosItems: [...(costos.costosItems || []).filter(c => !c.id.startsWith('deco_')), ...decoItems],
    }));
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudieron sincronizar los costos de decoración.' };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function enviarOpinionDecoracion(
  fiestaId: string,
  leGusta: boolean,
  comentario?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    const decoracion = fiesta.decoracion || {};
    const updatedDecoracion: DecoracionData = {
      ...decoracion,
      opinionCliente: {
        leGusta,
        comentario: comentario?.trim() || undefined,
        fecha: new Date().toISOString(),
      },
    };

    const res = await updateDecoracion(fiestaId, updatedDecoracion);
    if (!res.success) throw new Error(res.error);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

function validarCaptura3d(capturaDel3d?: string): GeminiImageReference | null {
  if (!capturaDel3d || typeof capturaDel3d !== 'string') return null;
  const trimmed = capturaDel3d.trim();
  if (trimmed.length * 0.75 > 4 * 1024 * 1024) return null;

  const dataUrlMatch = trimmed.match(/^data:(image\/(?:png|jpeg));base64,([-_A-Za-z0-9+/=\s]+)$/i);
  if (dataUrlMatch) {
    return {
      contentType: dataUrlMatch[1].toLowerCase(),
      base64: dataUrlMatch[2].replace(/\s+/g, ''),
    };
  }

  const sinEspacios = trimmed.replace(/\s+/g, '');
  if (/^[-_A-Za-z0-9+/=]+$/.test(sinEspacios)) {
    if (sinEspacios.startsWith('iVBORw0KGgo')) {
      return { contentType: 'image/png', base64: sinEspacios };
    }
    if (sinEspacios.startsWith('/9j/')) {
      return { contentType: 'image/jpeg', base64: sinEspacios };
    }
  }

  return null;
}

async function ejecutarGeneracionSalonAi(
  fiestaId: string,
  salonFotoUrl?: string,
  capturaDel3d?: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  return visualizacionesMutex.runExclusive(async () => {
    const reservaId = randomUUID();
    let reservaActiva = false;
    let proveedorInvocado = false;
    try {
      let fiesta: FiestaEnPlanificacion | undefined;
      const reserva = await actualizarFiesta(fiestaId, (actual) => {
        fiesta = actual;
        const decoracionActual = actual.decoracion || {};
        const fotos = decoracionActual.fotosGeneradasAi || [];
        const pendientes = decoracionActual.fotosSalonAiPendientes || [];
        if (fotos.length + pendientes.length >= 3) {
          throw new Error('Se alcanzó el tope de 3 imágenes generadas con IA para esta fiesta.');
        }
        return {
          ...actual,
          decoracion: {
            ...decoracionActual,
            fotosSalonAiPendientes: [...pendientes, { id: reservaId, creadaEn: new Date().toISOString() }],
          },
        };
      });
      if (!reserva.success || !fiesta) {
        return { success: false, error: reserva.error || 'No se pudo reservar una generación para esta fiesta.' };
      }
      reservaActiva = true;
      const decoracion = fiesta.decoracion || {};
      const puede = await hayPresupuestoParaIA();
      if (!puede) {
        await liberarReservaFoto(fiestaId, reservaId);
        reservaActiva = false;
        return {
          success: false,
          error: 'Se llegó al tope de IA del mes.',
        };
      }

      const captura3dRef = validarCaptura3d(capturaDel3d);
      const fotoDelSalon = await fotoDeReferenciaSegura(salonFotoUrl || decoracion.salonPlanBackgroundImageUrl);

      const images: GeminiImageReference[] = [];
      if (captura3dRef) {
        images.push(captura3dRef);
      }
      if (fotoDelSalon) {
        images.push(fotoDelSalon);
      }

      const estilo = decoracion.estiloDecoracion || 'elegante';
      // La paleta que edita el equipo es `paletaColores`; `colorPalette` es la vieja
      // que quedo de antes. Se miran en el mismo orden que la vista 3D, si no la
      // imagen salia con colores que ya nadie eligio.
      const paleta = decoracion.paletaColores || decoracion.colorPalette || { primary: '#9333ea', secondary: '#111827', accent: '#f59e0b' };
      const items = (decoracion.itemsDecoracion || []).map(i => i.nombre).slice(0, 8).join(', ');
      const tema = decoracion.tema || fiesta.configuracion?.nombreEvento || 'Fiesta de gala';

      let prompt: string;
      if (captura3dRef) {
        prompt = `fotografía realista del mismo salón, desde el mismo ángulo y con la misma disposición de mesas, pista y escenario que la primera imagen; con la paleta principal ${paleta.primary}, secundaria ${paleta.secondary}, acento ${paleta.accent}, estilo ${estilo}, cubremantel ${decoracion.colorCubremantel || 'blanco'}, globos ${decoracion.colorGlobos || 'a tono'} y estos elementos: ${items}. Nada de personas, texto, logos ni marcas. No agregar mobiliario que no esté en la primera imagen.`;
      } else {
        const promptBase = [
          `Fotografía profesional y realista de un salón de eventos decorado para ${tema}.`,
          `Estilo de ambientación: ${estilo}.`,
          `Paleta de colores: color principal ${paleta.primary}, color secundario ${paleta.secondary}, detalles y acentos en ${paleta.accent}.`,
          items ? `Elementos decorativos presentes: ${items}.` : '',
          `Iluminación ambiental cálida con guirnaldas, luces tenues, centros de mesa y mobiliario premium. Gran angular, calidad fotográfica 4K, elegante y festivo.`,
        ].filter(Boolean).join(' ');

        prompt = fotoDelSalon
          ? `${promptBase} Respetar la arquitectura, las medidas y los ventanales del salon de la foto de referencia: es este salon decorado, no otro.`
          : promptBase;
      }

      let imageUrl: string | null = null;
      try {
        proveedorInvocado = true;
        imageUrl = await generateGeminiImage({
          prompt,
          images,
          aspectRatio: '16:9',
          imageSize: '1K',
        });
      } catch {
        // El proveedor pudo aceptar el pedido antes de perderse la respuesta; conservar
        // la reserva evita volver a cobrar una generación de resultado incierto.
        return { success: false, error: 'No se pudo armar la foto. Probá de nuevo en un rato.' };
      }

      if (!imageUrl) {
        await liberarReservaFoto(fiestaId, reservaId);
        reservaActiva = false;
        return { success: false, error: 'No se pudo armar la foto. Probá de nuevo en un rato.' };
      }

      // La imagen ya se pagó aunque venga en un formato que no sirve: se cuenta primero.
      await registrarConsumoIA('foto-del-salon');
      const imagen = normalizarImagenGemini(imageUrl);
      if (!imagen) return { success: false, error: 'Gemini devolvió una imagen con formato no válido.' };
      const urlPersistida = await uploadToStorageWithDownloadToken(
        Buffer.from(imagen.base64, 'base64'),
        `salon-ai/${fiestaId}/${reservaId}.${imagen.extension}`,
        imagen.contentType,
      );

      let confirmada = false;
      const guardado = await actualizarFiesta(fiestaId, (actual) => {
        const decoActual = actual.decoracion || {};
        const pendientes = decoActual.fotosSalonAiPendientes || [];
        if (!pendientes.some((item) => item.id === reservaId)) return actual;
        confirmada = true;
        return {
          ...actual,
          decoracion: {
            ...decoActual,
            fotosGeneradasAi: [...(decoActual.fotosGeneradasAi || []), urlPersistida],
            fotosSalonAiPendientes: pendientes.filter((item) => item.id !== reservaId),
          },
        };
      });
      if (!guardado.success || !confirmada) {
        return { success: false, error: guardado.error || 'La foto quedó pendiente de confirmación; contactá al equipo antes de volver a generarla.' };
      }

      reservaActiva = false;
      return { success: true, imageUrl: urlPersistida };
    } catch (e: any) {
      return {
        success: false,
        error: proveedorInvocado
          ? 'La generación pudo haberse completado, pero no se pudo confirmar el guardado. No vuelvas a generar; contactá al equipo para revisar el cupo.'
          : e.message || 'Error al generar la imagen con IA.',
      };
    } finally {
      if (reservaActiva && !proveedorInvocado) await liberarReservaFoto(fiestaId, reservaId);
    }
  });
}

async function liberarReservaFoto(fiestaId: string, reservaId: string): Promise<void> {
  await actualizarFiesta(fiestaId, (actual) => ({
    ...actual,
    decoracion: {
      ...(actual.decoracion || {}),
      fotosSalonAiPendientes: (actual.decoracion?.fotosSalonAiPendientes || []).filter((item) => item.id !== reservaId),
    },
  }));
}

function normalizarImagenGemini(value: string): { base64: string; contentType: string; extension: 'png' | 'jpg' } | null {
  const match = value.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=_-]+)$/i);
  const base64 = (match?.[2] || value).replace(/\s+/g, '');
  const mime = match?.[1]?.toLowerCase() || (base64.startsWith('iVBORw0KGgo') ? 'image/png' : base64.startsWith('/9j/') ? 'image/jpeg' : '');
  if (!mime || !/^[A-Za-z0-9+/=_-]+$/.test(base64)) return null;
  return { base64, contentType: mime, extension: mime === 'image/png' ? 'png' : 'jpg' };
}

export async function generarVisualizacionSalonAi(
  fiestaId: string,
  salonFotoUrl?: string,
  capturaDel3d?: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  await requireAppSession();
  return ejecutarGeneracionSalonAi(fiestaId, salonFotoUrl, capturaDel3d);
}

export async function generarFotoDelSalonDesdeElPortal(
  fiestaId: string,
  capturaDel3d?: string,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const portalOk = await verifyPortalSession(fiestaId);
  if (!portalOk) return { success: false, error: 'Sesión de portal no autorizada.' };
  if (!validarCaptura3d(capturaDel3d)) {
    return { success: false, error: 'La vista 3D todavía no está lista para crear la foto. Esperá un momento y volvé a intentar.' };
  }

  return ejecutarGeneracionSalonAi(fiestaId, undefined, capturaDel3d);
}

export async function getDisponibilidadElementosDecoracion(
  fechaEvento: string,
  fiestaActualId?: string
): Promise<Array<{ nombreItem: string; fiestaNombre: string; fiestaId: string }>> {
  await requireAppSession();
  if (!fechaEvento) return [];
  try {
    const rawFiestas = await leerFiestasCrudas();
    const result: Array<{ nombreItem: string; fiestaNombre: string; fiestaId: string }> = [];

    const targetDate = fechaEvento.split('T')[0];

    for (const f of rawFiestas) {
      if (f.id === fiestaActualId) continue;
      const fDate = f.configuracion?.fechaEvento?.split('T')[0];
      if (fDate === targetDate) {
        const items = f.decoracion?.itemsDecoracion || [];
        for (const it of items) {
          result.push({
            nombreItem: it.nombre,
            fiestaNombre: f.configuracion?.nombreEvento || 'Otra fiesta',
            fiestaId: f.id,
          });
        }
      }
    }

    return result;
  } catch (e) {
    console.error('[decoracion] error comprobando disponibilidad de elementos', e);
    return [];
  }
}

export async function generarVisualizacionSalonReunion(input: {
  tipoEvento: string;
  salonNombre?: string;
  colorHex?: string;
  salonFotoUrl?: string;
}): Promise<{ success: boolean; imagenes?: string[]; error?: string }> {
  await requireAppSession();
  try {
    const puede = await hayPresupuestoParaIA();
    if (!puede) return { success: false, error: 'Se llegó al tope de IA del mes.' };

    const color = input.colorHex || '#d97706';
    const tipo = input.tipoEvento || '15 Años';
    const salon = input.salonNombre || 'Salón de eventos';

    const prompt1 = `Fotografía profesional y realista de salón de eventos decorado para ${tipo} en ${salon}. Iluminación perimetral cálida con acentos en ${color}, mesas redondas con manteles elegantes, centros de mesa y pista de baile central iluminada. Perspectiva amplia, 4K, elegante y festivo.`;
    const prompt2 = `Vista panorámica de salón de fiestas ambientado para ${tipo}, vista desde la entrada hacia la pista y mesa principal destacada con luces LED ${color}. Centros de mesa, ambientación nocturna sofisticada. Calidad fotográfica 4K.`;

    const fotoDelSalon = await fotoDeReferenciaSegura(input.salonFotoUrl);

    const img1 = await generateGeminiImage({
      prompt: fotoDelSalon ? `${prompt1} Respetar arquitectura del salón.` : prompt1,
      images: fotoDelSalon ? [fotoDelSalon] : [],
      aspectRatio: '16:9',
      imageSize: '1K',
    }).catch(() => null);

    const img2 = await generateGeminiImage({
      prompt: fotoDelSalon ? `${prompt2} Respetar arquitectura del salón.` : prompt2,
      images: fotoDelSalon ? [fotoDelSalon] : [],
      aspectRatio: '16:9',
      imageSize: '1K',
    }).catch(() => null);

    if (img1) await registrarConsumoIA('foto-del-salon');
    if (img2) await registrarConsumoIA('foto-del-salon');

    const fallback1 = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80';
    const fallback2 = 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80';

    return {
      success: true,
      imagenes: [img1 || fallback1, img2 || fallback2],
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error al generar vista del salón.' };
  }
}

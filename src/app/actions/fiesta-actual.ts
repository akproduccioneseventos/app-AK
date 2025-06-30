

'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage, Reunion, LayoutElement, Tarea, DecoracionData, ColorPalette, EventWebPageSettings, ClientPortalSettings, SocialGallerySettings, MusicaFiesta, ReposteriaData, BebidasData, ReposteriaCategoria, BebidaCategoria, ListaDeCargaOperativa, GestionCostosData, VideoVidaData, GiftItem } from '@/types/fiesta';
import type { Invitado, NuevoInvitadoData, RsvpStatus } from '@/types/invitado';
import fs from 'fs/promises';
import path from 'path';
import {
  initialFiestaActualData,
  defaultConfiguracion,
  baseDefaultTareas as defaultTareas,
  defaultColorPalette,
  defaultDecoracion,
  defaultWebPageSettings,
  defaultClientPortalSettings,
  defaultSocialGallerySettings,
  defaultMusicaFiesta,
  defaultReposteriaData,
  defaultBebidasData,
  defaultReposteriaCategorias,
  defaultBebidasCategorias,
  defaultListaDeCargaOperativa,
  initialGestionCostosData,
  defaultVideoVidaData,
} from '@/lib/fiesta-defaults';


const FIESTA_ACTUAL_JSON_FILE = 'fiesta-actual.json';
const HISTORIAL_FIESTAS_JSON_FILE = 'historial-fiestas.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const fiestaActualFilePath = path.join(dataDirectory, FIESTA_ACTUAL_JSON_FILE);
const historialFiestasFilePath = path.join(dataDirectory, HISTORIAL_FIESTAS_JSON_FILE);


async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readFiestaActualFile(): Promise<FiestaEnPlanificacion> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(fiestaActualFilePath);
    const fileContent = await fs.readFile(fiestaActualFilePath, 'utf-8');
    if (fileContent.trim() === '') throw new Error('Fiesta actual file is empty');
    let parsedData = JSON.parse(fileContent) as FiestaEnPlanificacion;
    
    // Migration logic for old salonLayout field
    if ((parsedData as any).salonLayout) {
      const oldSalonLayout = (parsedData as any).salonLayout as DecoracionData;
      parsedData.decoracion = {
        ...(parsedData.decoracion || defaultDecoracion),
        salonPlanBackgroundImageUrl: oldSalonLayout.salonPlanBackgroundImageUrl || parsedData.decoracion?.salonPlanBackgroundImageUrl || defaultDecoracion.salonPlanBackgroundImageUrl,
        salonElements: oldSalonLayout.salonElements || parsedData.decoracion?.salonElements || defaultDecoracion.salonElements,
        generalNotesSalonLayout: oldSalonLayout.generalNotesSalonLayout || parsedData.decoracion?.generalNotesSalonLayout || defaultDecoracion.generalNotesSalonLayout,
      };
      delete (parsedData as any).salonLayout;
    }

    // Ensure decoracion and its nested properties exist with defaults
    if (!parsedData.decoracion) {
        parsedData.decoracion = { ...defaultDecoracion };
    } else {
        parsedData.decoracion.salonPlanBackgroundImageUrl = parsedData.decoracion.salonPlanBackgroundImageUrl ?? defaultDecoracion.salonPlanBackgroundImageUrl;
        parsedData.decoracion.salonElements = parsedData.decoracion.salonElements ?? defaultDecoracion.salonElements;
        parsedData.decoracion.generalNotesSalonLayout = parsedData.decoracion.generalNotesSalonLayout ?? defaultDecoracion.generalNotesSalonLayout;
        parsedData.decoracion.generalNotesDecoracion = parsedData.decoracion.generalNotesDecoracion ?? defaultDecoracion.generalNotesDecoracion;
        parsedData.decoracion.colorGlobos = parsedData.decoracion.colorGlobos ?? defaultDecoracion.colorGlobos;
    }
    
    // Migration to remove old direccionLugar field
    if (parsedData.configuracion && 'direccionLugar' in parsedData.configuracion) {
      delete (parsedData.configuracion as any).direccionLugar;
    }
    
    if (!parsedData.webPageSettings) {
      parsedData.webPageSettings = { ...defaultWebPageSettings };
    } else {
      parsedData.webPageSettings = {
        ...defaultWebPageSettings,
        ...parsedData.webPageSettings,
        galleryImageUrls: parsedData.webPageSettings.galleryImageUrls || [],
      };
    }
    if (!parsedData.clientPortalSettings) {
      parsedData.clientPortalSettings = { ...defaultClientPortalSettings };
    }
    if (!parsedData.socialGallerySettings) {
        parsedData.socialGallerySettings = { ...defaultSocialGallerySettings };
    }
    if (!parsedData.listaDeCargaOperativa) {
      parsedData.listaDeCargaOperativa = { ...defaultListaDeCargaOperativa };
    }
    if (!parsedData.gestionCostos) {
      parsedData.gestionCostos = { ...initialGestionCostosData };
    } else {
      parsedData.gestionCostos = {
        ...initialGestionCostosData,
        ...parsedData.gestionCostos,
        costosItems: parsedData.gestionCostos.costosItems || [],
      };
    }

    if (!parsedData.videoVida) {
        parsedData.videoVida = { ...defaultVideoVidaData };
    }


    return parsedData;
  } catch (error) {
    const cleanInitialData = { ...initialFiestaActualData };
    if (cleanInitialData.configuracion && 'direccionLugar' in cleanInitialData.configuracion) {
      delete (cleanInitialData.configuracion as any).direccionLugar;
    }
    await writeFiestaActualFile(cleanInitialData);
    return cleanInitialData;
  }
}

async function writeFiestaActualFile(data: FiestaEnPlanificacion): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const dataToWrite = { ...data };
    if (dataToWrite.configuracion && 'direccionLugar' in dataToWrite.configuracion) {
      delete (dataToWrite.configuracion as any).direccionLugar;
    }
    if (!dataToWrite.decoracion) {
      dataToWrite.decoracion = { ...defaultDecoracion };
    } else {
      dataToWrite.decoracion.salonPlanBackgroundImageUrl = dataToWrite.decoracion.salonPlanBackgroundImageUrl ?? defaultDecoracion.salonPlanBackgroundImageUrl;
      dataToWrite.decoracion.salonElements = dataToWrite.decoracion.salonElements ?? defaultDecoracion.salonElements;
      dataToWrite.decoracion.generalNotesSalonLayout = dataToWrite.decoracion.generalNotesSalonLayout ?? defaultDecoracion.generalNotesSalonLayout;
      dataToWrite.decoracion.generalNotesDecoracion = dataToWrite.decoracion.generalNotesDecoracion ?? defaultDecoracion.generalNotesDecoracion;
      dataToWrite.decoracion.colorGlobos = dataToWrite.decoracion.colorGlobos ?? defaultDecoracion.colorGlobos;
    }
    delete (dataToWrite as any).salonLayout; // Ensure old property is always removed
    
    if (!dataToWrite.webPageSettings) {
      dataToWrite.webPageSettings = { ...defaultWebPageSettings };
    } else {
      dataToWrite.webPageSettings = {
        ...defaultWebPageSettings,
        ...dataToWrite.webPageSettings,
        galleryImageUrls: dataToWrite.webPageSettings.galleryImageUrls || [],
      };
    }
    if (!dataToWrite.clientPortalSettings) {
      dataToWrite.clientPortalSettings = { ...defaultClientPortalSettings };
    }
     if (!dataToWrite.socialGallerySettings) {
      dataToWrite.socialGallerySettings = { ...defaultSocialGallerySettings };
    }
    if (!dataToWrite.listaDeCargaOperativa) {
      dataToWrite.listaDeCargaOperativa = { ...defaultListaDeCargaOperativa };
    }
    if (!dataToWrite.gestionCostos) {
      dataToWrite.gestionCostos = { ...initialGestionCostosData };
    } else {
      dataToWrite.gestionCostos = {
        ...initialGestionCostosData,
        ...dataToWrite.gestionCostos,
        costosItems: dataToWrite.gestionCostos.costosItems || [],
      };
    }
    if (!dataToWrite.videoVida) {
        dataToWrite.videoVida = { ...defaultVideoVidaData };
    }


    await fs.writeFile(fiestaActualFilePath, JSON.stringify(dataToWrite, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing fiesta-actual.json file:', error);
  }
}

async function writeHistorialFile(data: FiestaEnPlanificacion[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) =>
        new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime()
    );
    await fs.writeFile(historialFiestasFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing historial-fiestas.json file:', error);
  }
}

async function initializeLocalFiestaFiles() {
  await readFiestaActualFile();
  await getHistorialFiestas(); // This ensures the file exists
}
initializeLocalFiestaFiles();


export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  const data = await readFiestaActualFile();
   const validatedConfig: ConfigEventoDataStorage = {
    ...defaultConfiguracion,
    ...(data.configuracion || {}),
    clienteId: data.configuracion?.clienteId || undefined,
   };
   delete (validatedConfig as any).direccionLugar;

    const mergedReposteriaCategorias = defaultReposteriaCategorias.map(defaultCat => {
        const savedCat = data.reposteria?.categorias?.find(sc => sc.id === defaultCat.id);
        return savedCat ? { ...defaultCat, ...savedCat } : { ...defaultCat };
    });
    const validatedReposteria: ReposteriaData = {
        ...defaultReposteriaData,
        ...(data.reposteria || {}),
        categorias: mergedReposteriaCategorias,
    };

    const mergedBebidasCategorias = defaultBebidasCategorias.map(defaultCat => {
        const savedCat = data.bebidas?.categorias?.find(sc => sc.id === defaultCat.id);
        return savedCat ? { ...defaultCat, ...savedCat } : { ...defaultCat };
    });
    const validatedBebidas: BebidasData = {
        ...defaultBebidasData,
        ...(data.bebidas || {}),
        categorias: mergedBebidasCategorias,
    };

    const validatedDecoracion: DecoracionData = {
      ...defaultDecoracion,
      ...(data.decoracion || {}),
      paletaColores: {
        ...defaultColorPalette,
        ...(data.decoracion?.paletaColores || {}),
      },
      zonasContratadas: (data.decoracion?.zonasContratadas || defaultDecoracion.zonasContratadas || []).map(zc => ({ ...zc})),
      items: (data.decoracion?.items || defaultDecoracion.items || []).map(item => ({
          id: item.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          name: item.name || 'Ítem sin nombre',
          category: item.category || 'Otro',
          quantity: item.quantity === undefined ? 1 : (Number(item.quantity) || 1),
          estimatedCost: item.estimatedCost === undefined ? undefined : (Number(item.estimatedCost) || 0),
          supplier: item.supplier || undefined,
          notes: item.notes || undefined,
          imageUrl: item.imageUrl || undefined,
          dataAiHint: item.dataAiHint || undefined,
      })),
      decoracionTorta: data.decoracion?.decoracionTorta || { ...defaultDecoracion.decoracionTorta },
      salonPlanBackgroundImageUrl: data.decoracion?.salonPlanBackgroundImageUrl ?? defaultDecoracion.salonPlanBackgroundImageUrl,
      salonElements: (data.decoracion?.salonElements || defaultDecoracion.salonElements || []).map(el => ({
            id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
            name: el.name || 'Elemento sin nombre',
            quantity: el.quantity === undefined ? 1 : (Number(el.quantity) || 1),
            notes: el.notes || undefined,
            imageUrl: el.imageUrl || undefined,
            x: el.x ?? 0,
            y: el.y ?? 0,
            width: el.width ?? 50,
            height: el.height ?? 50,
            rotation: el.rotation ?? 0,
            type: el.type ?? 'custom',
            category: el.category || 'Otro',
            dataAiHint: el.dataAiHint
        })),
      generalNotesSalonLayout: data.decoracion?.generalNotesSalonLayout ?? defaultDecoracion.generalNotesSalonLayout,
      generalNotesDecoracion: data.decoracion?.generalNotesDecoracion ?? defaultDecoracion.generalNotesDecoracion,
      colorGlobos: data.decoracion?.colorGlobos ?? defaultDecoracion.colorGlobos,
    };

   const validatedWebPageSettings: EventWebPageSettings = {
      ...defaultWebPageSettings,
      ...(data.webPageSettings || {}),
      galleryImageUrls: data.webPageSettings?.galleryImageUrls || [],
      giftRegistry: data.webPageSettings?.giftRegistry || [],
    };
    
    const validatedClientPortalSettings: ClientPortalSettings = {
      ...defaultClientPortalSettings,
      ...(data.clientPortalSettings || {}),
    };

    const validatedSocialGallerySettings: SocialGallerySettings = {
      ...defaultSocialGallerySettings,
      ...(data.socialGallerySettings || {}),
    };
    
   const validatedListaDeCargaOperativa: ListaDeCargaOperativa = {
      ...defaultListaDeCargaOperativa,
      ...(data.listaDeCargaOperativa || {}),
      categorias: (data.listaDeCargaOperativa?.categorias || []).map(cat => ({
        ...cat,
        items: (cat.items || []).map(item => ({ ...item }))
      }))
    };

    const validatedGestionCostos: GestionCostosData = {
        ...initialGestionCostosData,
        ...(data.gestionCostos || {}),
        costosItems: (data.gestionCostos?.costosItems || []).map(item => ({
            ...item,
            montoEstimado: Number(item.montoEstimado) || 0,
            montoReal: item.montoReal !== undefined ? Number(item.montoReal) : undefined,
        })),
        ingresosTotalesEstimados: Number(data.gestionCostos?.ingresosTotalesEstimados) || 0,
    };
    
    const validatedVideoVida: VideoVidaData = {
      ...defaultVideoVidaData,
      ...(data.videoVida || {}),
    };


   const validatedData: FiestaEnPlanificacion = {
    id: data.id || `fiesta_${Date.now()}`,
    configuracion: validatedConfig,
    personalAsignado: data.personalAsignado || [],
    menuAsignadoId: data.menuAsignadoId || undefined,
    presupuestoId: data.presupuestoId || undefined,
    invoiceIds: data.invoiceIds || [],
    reuniones: (data.reuniones || []).map(r => ({
        id: r.id || `reunion_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        titulo: r.titulo || 'Reunión sin título',
        fecha: r.fecha,
        notas: r.notas || ''
    })),
    tareas: (data.tareas && data.tareas.length > 0 ? data.tareas : [...defaultTareas.map(t => ({...t, id: `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`}))]).map(t => ({
        id: t.id || `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        texto: t.texto || 'Tarea sin descripción',
        descripcion: t.descripcion || undefined,
        completada: t.completada || false,
        fechaLimite: t.fechaLimite,
        horaVencimiento: t.horaVencimiento || undefined,
        recordatorio: t.recordatorio || undefined,
        asignadaA: t.asignadaA,
        esPredeterminada: t.esPredeterminada || false,
    })),
    decoracion: validatedDecoracion,
    invitados: (data.invitados || []).map(inv => ({
      id: inv.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      nombre: inv.nombre || 'Invitado sin nombre',
      contacto: inv.contacto || undefined,
      rsvp: inv.rsvp || 'Pendiente',
      partySize: inv.partySize === undefined ? 1 : (Number(inv.partySize) || 1),
      tableNumber: inv.tableNumber || undefined,
      notes: inv.notes || undefined,
      companionNames: inv.companionNames || [],
      checkedIn: inv.checkedIn || false,
      checkInTimestamp: inv.checkInTimestamp || undefined,
    })),
    webPageSettings: validatedWebPageSettings,
    clientPortalSettings: validatedClientPortalSettings,
    socialGallerySettings: validatedSocialGallerySettings,
    musica: {
      ...defaultMusicaFiesta,
      ...(data.musica || {}),
    },
    reposteria: validatedReposteria,
    bebidas: validatedBebidas,
    listaDeCargaOperativa: validatedListaDeCargaOperativa,
    gestionCostos: validatedGestionCostos,
    videoVida: validatedVideoVida,
  };
  if ((validatedData as any).salonLayout) {
    delete (validatedData as any).salonLayout;
  }
  return validatedData;
}

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(historialFiestasFilePath);
    const fileContent = await fs.readFile(historialFiestasFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as FiestaEnPlanificacion[];
  } catch (error) {
    return [];
  }
}

export async function updateConfiguracionFiestaActual(
  configData: Partial<Omit<ConfigEventoDataStorage, 'direccionLugar'>>
): Promise<{ success: boolean; updatedData?: ConfigEventoDataStorage; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const { direccionLugar, ...validConfigDataFromInput } = configData as any;
    const newBaseConfig = { ...fiestaActual.configuracion };
    delete (newBaseConfig as any).direccionLugar;

    fiestaActual.configuracion = {
        ...newBaseConfig,
        ...validConfigDataFromInput,
        invitadosEstimados: configData.invitadosEstimados !== undefined ? Number(configData.invitadosEstimados) || 0 : fiestaActual.configuracion.invitadosEstimados,
        presupuestoEstimado: configData.presupuestoEstimado !== undefined ? Number(configData.presupuestoEstimado) || 0 : fiestaActual.configuracion.presupuestoEstimado,
    };

    await writeFiestaActualFile(fiestaActual);
    const finalConfig = { ...fiestaActual.configuracion };
    delete (finalConfig as any).direccionLugar;
    return { success: true, updatedData: JSON.parse(JSON.stringify(finalConfig)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración." };
  }
}

export async function updatePersonalFiestaActual(
  personalData: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; updatedData?: PersonalAsignadoDetalleStorage[]; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.personalAsignado = [...personalData];
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.personalAsignado)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el personal." };
  }
}

export async function updateMenuAsignadoFiestaActual(
  menuId?: string
): Promise<{ success: boolean; menuId?: string; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.menuAsignadoId = menuId;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, menuId: menuId };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el menú asignado." };
  }
}

export async function updatePresupuestoAsignadoFiestaActual(
  presupuestoId?: string | null
): Promise<{ success: boolean; presupuestoId?: string | null; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.presupuestoId = presupuestoId === null ? undefined : presupuestoId;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, presupuestoId: fiestaActual.presupuestoId };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el presupuesto asignado." };
  }
}

export async function addInvoiceIdToFiestaActual(
  invoiceId: string
): Promise<{ success: boolean; invoiceIds?: string[]; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    if (!fiestaActual.invoiceIds) {
      fiestaActual.invoiceIds = [];
    }
    if (!fiestaActual.invoiceIds.includes(invoiceId)) {
      fiestaActual.invoiceIds.push(invoiceId);
      await writeFiestaActualFile(fiestaActual);
    }
    return { success: true, invoiceIds: fiestaActual.invoiceIds };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir ID de factura." };
  }
}

export async function removeInvoiceIdFromFiestaActual(
  invoiceId: string
): Promise<{ success: boolean; invoiceIds?: string[]; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    if (fiestaActual.invoiceIds) {
      fiestaActual.invoiceIds = fiestaActual.invoiceIds.filter(id => id !== invoiceId);
      await writeFiestaActualFile(fiestaActual);
    }
    return { success: true, invoiceIds: fiestaActual.invoiceIds || [] };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al quitar ID de factura." };
  }
}

export async function addReunionToFiestaActual(
  reunionData: Omit<Reunion, 'id'>
): Promise<{ success: boolean; reunion?: Reunion; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const newReunion: Reunion = {
      id: `reunion_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      titulo: reunionData.titulo || 'Reunión sin título',
      fecha: reunionData.fecha,
      notas: reunionData.notas || '',
    };
    fiestaActual.reuniones = [...(fiestaActual.reuniones || []), newReunion];
    await writeFiestaActualFile(fiestaActual);
    return { success: true, reunion: JSON.parse(JSON.stringify(newReunion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir la reunión." };
  }
}

export async function updateReunionInFiestaActual(
  reunionData: Reunion
): Promise<{ success: boolean; reunion?: Reunion; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.reuniones = (fiestaActual.reuniones || []).map(r =>
      r.id === reunionData.id ? { ...reunionData } : r
    );
    await writeFiestaActualFile(fiestaActual);
    const updatedReunion = fiestaActual.reuniones.find(r => r.id === reunionData.id);
    return { success: true, reunion: updatedReunion ? JSON.parse(JSON.stringify(updatedReunion)) : undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la reunión." };
  }
}

export async function deleteReunionFromFiestaActual(
  reunionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const initialLength = (fiestaActual.reuniones || []).length;
    fiestaActual.reuniones = (fiestaActual.reuniones || []).filter(r => r.id !== reunionId);
    if ((fiestaActual.reuniones || []).length < initialLength) {
      await writeFiestaActualFile(fiestaActual);
      return { success: true };
    } else {
      return { success: false, error: `Reunión con ID ${reunionId} no encontrada para eliminar.` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al eliminar la reunión." };
  }
}

export async function updateTareasFiestaActual(
  nuevasTareas: Tarea[]
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.tareas = nuevasTareas.map(t => ({
        id: t.id || `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        texto: t.texto || 'Tarea sin descripción',
        descripcion: t.descripcion || undefined,
        completada: t.completada || false,
        fechaLimite: t.fechaLimite,
        horaVencimiento: t.horaVencimiento || undefined,
        recordatorio: t.recordatorio || undefined,
        asignadaA: t.asignadaA,
        esPredeterminada: t.esPredeterminada || false,
    }));
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.tareas)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar las tareas." };
  }
}

export async function updateDecoracionFiestaActual(
  decoracionDataInput: Partial<DecoracionData>
): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    
    const currentDecoracion = fiestaActual.decoracion || { ...defaultDecoracion };

    fiestaActual.decoracion = {
        ...currentDecoracion,
        ...decoracionDataInput,

        paletaColores: {
            ...defaultColorPalette,
            ...(currentDecoracion.paletaColores || {}),
            ...(decoracionDataInput.paletaColores || {})
        },
        decoracionTorta: {
            ...(currentDecoracion.decoracionTorta || defaultDecoracion.decoracionTorta),
            ...(decoracionDataInput.decoracionTorta || {})
        },
        items: (decoracionDataInput.items || currentDecoracion.items || []).map(item => ({
            id: item.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            name: item.name || 'Ítem sin nombre',
            category: item.category || 'Otro',
            quantity: item.quantity === undefined ? 1 : (Number(item.quantity) || 1),
            estimatedCost: item.estimatedCost === undefined ? undefined : (Number(item.estimatedCost) || 0),
            supplier: item.supplier || undefined,
            notes: item.notes || undefined,
            imageUrl: item.imageUrl || undefined,
            dataAiHint: item.dataAiHint || undefined,
        })),
        zonasContratadas: decoracionDataInput.zonasContratadas || currentDecoracion.zonasContratadas || defaultDecoracion.zonasContratadas,
        salonElements: (decoracionDataInput.salonElements || currentDecoracion.salonElements || []).map(el => ({
            id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
            name: el.name || 'Elemento sin nombre',
            quantity: el.quantity === undefined ? 1 : (Number(el.quantity) || 1),
            notes: el.notes || undefined,
            imageUrl: el.imageUrl || undefined,
            x: el.x ?? 0,
            y: el.y ?? 0,
            width: el.width ?? 50,
            height: el.height ?? 50,
            rotation: el.rotation ?? 0,
            type: el.type ?? 'custom',
            category: el.category || 'Otro',
            dataAiHint: el.dataAiHint
        })),
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.decoracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la decoración y diseño del salón." };
  }
}

export async function getInvitadosFiestaActual(): Promise<Invitado[]> {
  const fiesta = await getFiestaActual();
  return JSON.parse(JSON.stringify(fiesta.invitados || []));
}

export async function addInvitadoFiestaActual(
  invitadoData: NuevoInvitadoData
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const nuevoInvitado: Invitado = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: invitadoData.nombre || 'Invitado sin nombre',
      contacto: invitadoData.contacto || undefined,
      rsvp: invitadoData.rsvp || 'Pendiente',
      partySize: invitadoData.partySize === undefined ? 1 : Number(invitadoData.partySize) || 1,
      tableNumber: invitadoData.tableNumber || undefined,
      notes: invitadoData.notes || undefined,
      companionNames: invitadoData.companionNames || [],
      checkedIn: false,
      checkInTimestamp: undefined,
    };
    fiestaActual.invitados = [...(fiestaActual.invitados || []), nuevoInvitado];
    await writeFiestaActualFile(fiestaActual);
    return { success: true, invitado: JSON.parse(JSON.stringify(nuevoInvitado)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir el invitado." };
  }
}

export async function updateInvitadoFiestaActual(
  invitadoData: Invitado
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    let invitadoEncontrado = false;
    fiestaActual.invitados = (fiestaActual.invitados || []).map(inv => {
      if (inv.id === invitadoData.id) {
        invitadoEncontrado = true;
        return {
          ...inv,
          ...invitadoData,
          partySize: invitadoData.partySize === undefined ? 1 : Number(invitadoData.partySize) || 1,
          companionNames: invitadoData.companionNames || [],
        };
      }
      return inv;
    });

    if (!invitadoEncontrado) {
        return { success: false, error: `Invitado con ID ${invitadoData.id} no encontrado para actualizar.` };
    }

    await writeFiestaActualFile(fiestaActual);
    const updatedInvitado = fiestaActual.invitados.find(inv => inv.id === invitadoData.id);
    return { success: true, invitado: updatedInvitado ? JSON.parse(JSON.stringify(updatedInvitado)) : undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el invitado." };
  }
}

export async function deleteInvitadoFiestaActual(
  invitadoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const initialLength = (fiestaActual.invitados || []).length;
    fiestaActual.invitados = (fiestaActual.invitados || []).filter(inv => inv.id !== invitadoId);
    if ((fiestaActual.invitados || []).length < initialLength) {
      await writeFiestaActualFile(fiestaActual);
      return { success: true };
    } else {
      return { success: false, error: `Invitado con ID ${invitadoId} no encontrado para eliminar.` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al eliminar el invitado." };
  }
}

interface RsvpSubmissionData {
  nombreCompleto: string;
  email?: string;
  confirmacion: 'si' | 'no' | 'tal-vez';
  numeroAsistentes: number; // This is the TOTAL party size
  mensaje?: string;
  companionNames?: string[];
}

export async function handleRsvpSubmission(
  submissionData: RsvpSubmissionData
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    if (!fiestaActual.invitados) {
      fiestaActual.invitados = [];
    }

    const guestNameLower = submissionData.nombreCompleto.trim().toLowerCase();
    const guestIndex = fiestaActual.invitados.findIndex(
      (inv) => inv.nombre.toLowerCase() === guestNameLower
    );

    if (guestIndex === -1) {
      return { success: false, error: "Invitación no encontrada. Por favor, verifica el nombre o contacta al organizador." };
    }

    const invitadoActual = fiestaActual.invitados[guestIndex];
    let newRsvpStatus: RsvpStatus;
    const isAttending = submissionData.confirmacion === 'si';
    const isMaybe = submissionData.confirmacion === 'tal-vez';
    
    if (isAttending) {
      newRsvpStatus = 'Confirmado';
    } else if (isMaybe) {
      newRsvpStatus = 'Tal vez';
    } else {
      newRsvpStatus = 'Rechazado';
    }

    const updatedInvitado: Invitado = {
      ...invitadoActual,
      rsvp: newRsvpStatus,
      partySize: isAttending || isMaybe ? (Number(submissionData.numeroAsistentes) || 1) : 1,
      contacto: submissionData.email?.trim() || invitadoActual.contacto,
      notes: submissionData.mensaje?.trim()
        ? `${submissionData.mensaje.trim()}${invitadoActual.notes ? ` (Nota anterior: ${invitadoActual.notes})` : ''}`
        : invitadoActual.notes,
      companionNames: isAttending || isMaybe ? (submissionData.companionNames?.filter(name => name.trim() !== '') || []) : [],
    };

    fiestaActual.invitados[guestIndex] = updatedInvitado;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, invitado: JSON.parse(JSON.stringify(updatedInvitado)) };

  } catch (e: any) {
    console.error('Error procesando RSVP:', e);
    return { success: false, error: e.message || "Error al procesar la confirmación." };
  }
}

export async function checkInGuest(
  guestId: string
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    if (!fiestaActual.invitados) {
      return { success: false, error: "No hay lista de invitados para esta fiesta." };
    }
    
    let guestFound = false;
    let alreadyCheckedIn = false;
    let updatedGuest: Invitado | undefined = undefined;

    fiestaActual.invitados = fiestaActual.invitados.map(inv => {
      if (inv.id === guestId) {
        guestFound = true;
        // Check if already checked in (and not within the last second, to avoid race conditions on multiple scans)
        if (inv.checkedIn && inv.checkInTimestamp && new Date(inv.checkInTimestamp).getTime() < (Date.now() - 1000)) {
          alreadyCheckedIn = true;
          updatedGuest = inv;
          return inv;
        }
        updatedGuest = {
          ...inv,
          checkedIn: true,
          checkInTimestamp: new Date().toISOString(),
        };
        return updatedGuest;
      }
      return inv;
    });

    if (!guestFound) {
      return { success: false, error: `Invitado con ID ${guestId} no encontrado.` };
    }

    if (alreadyCheckedIn) {
      return { success: true, invitado: updatedGuest }; // Still a success, just no change
    }

    await writeFiestaActualFile(fiestaActual);
    return { success: true, invitado: updatedGuest };

  } catch (e: any) {
    console.error("Error checking in guest:", e);
    return { success: false, error: e.message || "Error al procesar el check-in." };
  }
}


export async function updateWebPageSettingsFiestaActual(
  settings: Partial<EventWebPageSettings>
): Promise<{ success: boolean; updatedData?: EventWebPageSettings; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();

    const currentWebSettings = fiestaActual.webPageSettings || {};
    const newWebSettings: EventWebPageSettings = {
        ...defaultWebPageSettings,
        ...currentWebSettings,
        ...settings,
        galleryImageUrls: settings.galleryImageUrls || currentWebSettings.galleryImageUrls || [],
        giftRegistry: settings.giftRegistry || currentWebSettings.giftRegistry || [],
    };
    newWebSettings.showCountdown = settings.showCountdown !== undefined ? settings.showCountdown : newWebSettings.showCountdown;
    newWebSettings.showOurStory = settings.showOurStory !== undefined ? settings.showOurStory : newWebSettings.showOurStory;
    newWebSettings.showEventDetails = settings.showEventDetails !== undefined ? settings.showEventDetails : newWebSettings.showEventDetails;
    newWebSettings.showDressCode = settings.showDressCode !== undefined ? settings.showDressCode : newWebSettings.showDressCode;
    newWebSettings.showGiftRegistry = settings.showGiftRegistry !== undefined ? settings.showGiftRegistry : newWebSettings.showGiftRegistry;
    newWebSettings.showGallery = settings.showGallery !== undefined ? settings.showGallery : newWebSettings.showGallery;
    newWebSettings.showRsvp = settings.showRsvp !== undefined ? settings.showRsvp : newWebSettings.showRsvp;

    fiestaActual.webPageSettings = newWebSettings;

    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.webPageSettings)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración de la página web." };
  }
}

export async function updateClientPortalSettings(
  settings: ClientPortalSettings
): Promise<{ success: boolean; updatedData?: ClientPortalSettings; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.clientPortalSettings = {
      ...defaultClientPortalSettings,
      ...(fiestaActual.clientPortalSettings || {}),
      ...settings,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.clientPortalSettings)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración del portal del cliente." };
  }
}

export async function updateSocialGallerySettings(
  settings: SocialGallerySettings
): Promise<{ success: boolean; updatedData?: SocialGallerySettings; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.socialGallerySettings = {
      ...defaultSocialGallerySettings,
      ...(fiestaActual.socialGallerySettings || {}),
      ...settings,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.socialGallerySettings)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración de la galería social." };
  }
}

export async function updateMusicaFiestaActual(
  musicaData: Partial<MusicaFiesta>
): Promise<{ success: boolean; updatedData?: MusicaFiesta; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.musica = {
        ...defaultMusicaFiesta,
        ...(fiestaActual.musica || {}),
        ...musicaData,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.musica)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la música de la fiesta." };
  }
}


export async function updateReposteriaFiestaActual(
  reposteriaData: ReposteriaData
): Promise<{ success: boolean; updatedData?: ReposteriaData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const mergedCategorias = defaultReposteriaCategorias.map(defaultCat => {
        const receivedCat = reposteriaData.categorias?.find(rc => rc.id === defaultCat.id);
        return receivedCat ? { ...defaultCat, ...receivedCat } : { ...defaultCat };
    });

    fiestaActual.reposteria = {
      ...defaultReposteriaData,
      ...reposteriaData,
      categorias: mergedCategorias,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.reposteria)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar los datos de repostería." };
  }
}

export async function updateBebidasFiestaActual(
  bebidasData: BebidasData
): Promise<{ success: boolean; updatedData?: BebidasData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
     const mergedCategorias = defaultBebidasCategorias.map(defaultCat => {
        const receivedCat = bebidasData.categorias?.find(rc => rc.id === defaultCat.id);
        return receivedCat ? { ...defaultCat, ...receivedCat } : { ...defaultCat };
    });
    fiestaActual.bebidas = {
      ...defaultBebidasData,
      ...bebidasData,
      categorias: mergedCategorias,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.bebidas)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar los datos de bebidas." };
  }
}

export async function updateListaDeCargaOperativa(
  lista: ListaDeCargaOperativa
): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.listaDeCargaOperativa = {
      ...defaultListaDeCargaOperativa, // Ensure defaults
      ...lista, // Apply incoming changes
      categorias: lista.categorias.map(cat => ({
        ...cat,
        items: (cat.items || []).map(item => ({...item})) // Deep copy items
      }))
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.listaDeCargaOperativa)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la lista de carga operativa." };
  }
}

export async function updateGestionCostosFiestaActual(
  data: Partial<GestionCostosData>
): Promise<{ success: boolean; updatedData?: GestionCostosData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.gestionCostos = {
      ...(fiestaActual.gestionCostos || initialGestionCostosData),
      ...data,
      costosItems: (data.costosItems || fiestaActual.gestionCostos?.costosItems || []).map(item => ({
        ...item,
        montoEstimado: Number(item.montoEstimado) || 0,
        montoReal: item.montoReal !== undefined ? Number(item.montoReal) : undefined,
      })),
      ingresosTotalesEstimados: data.ingresosTotalesEstimados !== undefined ? Number(data.ingresosTotalesEstimados) : (Number(fiestaActual.gestionCostos?.ingresosTotalesEstimados) || 0),
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.gestionCostos)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la gestión de costos." };
  }
}

export async function updateVideoVidaSettings(
  data: Partial<VideoVidaData>
): Promise<{ success: boolean; updatedData?: VideoVidaData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.videoVida = {
      ...(fiestaActual.videoVida || defaultVideoVidaData),
      ...data,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.videoVida)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el módulo de Video de Vida." };
  }
}


export async function resetFiestaActual(): Promise<{ success: boolean; newFiesta?: FiestaEnPlanificacion, error?: string }> {
  try {
    const newInitialDataWithDynamicId = { ...initialFiestaActualData, id: `fiesta_${Date.now()}` };
    await writeFiestaActualFile(newInitialDataWithDynamicId);
    return { success: true, newFiesta: JSON.parse(JSON.stringify(newInitialDataWithDynamicId)) };
  } catch (e: any) {
    console.error("Error al reiniciar la fiesta:", e);
    return { success: false, error: e.message || "Error al reiniciar la fiesta." };
  }
}

export async function archivarFiestaActual(): Promise<{ success: boolean; error?: string; archivada?: FiestaEnPlanificacion, nuevaFiesta?: FiestaEnPlanificacion }> {
  try {
    const fiestaParaArchivar = await getFiestaActual();
    let historial = await getHistorialFiestas();

    const archivada = { ...fiestaParaArchivar, id: fiestaParaArchivar.id || `hist_${Date.now()}` };
    historial.push(archivada);
    await writeHistorialFile(historial);

    const resetResult = await resetFiestaActual();
    if (!resetResult.success || !resetResult.newFiesta) {
      const newHistorial = await getHistorialFiestas();
      await writeHistorialFile(newHistorial.filter(f => f.id !== archivada.id));
      throw new Error(resetResult.error || "No se pudo reiniciar la fiesta actual después de archivar.");
    }

    return { success: true, archivada: archivada, nuevaFiesta: resetResult.newFiesta };
  } catch (e: any) {
    console.error("Error archivando la fiesta actual:", e);
    return { success: false, error: e.message || "Error al archivar la fiesta." };
  }
}

export async function updateGiftRegistry(
  items: GiftItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    if (!fiestaActual.webPageSettings) {
      fiestaActual.webPageSettings = { ...defaultWebPageSettings, giftRegistry: items };
    } else {
      fiestaActual.webPageSettings.giftRegistry = items;
    }
    await writeFiestaActualFile(fiestaActual);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la lista de regalos." };
  }
}

export async function claimGift(
  giftId: string,
  guestName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!guestName.trim()) {
      return { success: false, error: "Se requiere un nombre para elegir el regalo." };
    }
    let fiestaActual = await getFiestaActual();
    if (!fiestaActual.webPageSettings?.giftRegistry) {
      return { success: false, error: "La lista de regalos no está configurada." };
    }

    let giftFound = false;
    let alreadyClaimed = false;

    fiestaActual.webPageSettings.giftRegistry = fiestaActual.webPageSettings.giftRegistry.map(gift => {
      if (gift.id === giftId) {
        giftFound = true;
        if (gift.isClaimed) {
          alreadyClaimed = true;
          return gift; // Don't change if already claimed
        }
        return {
          ...gift,
          isClaimed: true,
          claimedBy: guestName.trim(),
        };
      }
      return gift;
    });

    if (!giftFound) {
      return { success: false, error: "No se encontró el regalo seleccionado." };
    }
    if (alreadyClaimed) {
      return { success: false, error: "Este regalo ya ha sido elegido por otra persona." };
    }

    await writeFiestaActualFile(fiestaActual);
    return { success: true };

  } catch (e: any) {
    return { success: false, error: e.message || "Ocurrió un error al procesar la solicitud." };
  }
}


'use server';

import type { AsistenteAkConfig, AsistenteData } from '@/types/fiesta';
import fs from 'fs/promises';
import path from 'path';
import { savePresupuesto } from '@/app/actions/presupuestos';
import type { ItemPresupuestado } from '@/types/presupuesto';


const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONFIG_FILE_PATH = path.join(DATA_DIR, 'asistente-ak-config.json');

const defaultOpcionesTipoFiesta = [
  { id: 'boda', nombre: 'Boda', costoBase: 80000, img: 'https://placehold.co/400x300.png', hint: 'wedding couple' },
  { id: 'quince', nombre: 'Quince Años', costoBase: 60000, img: 'https://placehold.co/400x300.png', hint: 'quinceanera dress' },
  { id: 'infantil', nombre: 'Cumpleaños Infantil', costoBase: 30000, img: 'https://placehold.co/400x300.png', hint: 'kids party' },
  { id: 'corporativo', nombre: 'Evento Corporativo', costoBase: 90000, img: 'https://placehold.co/400x300.png', hint: 'corporate meeting' },
  { id: 'otro', nombre: 'Otro Tipo de Evento', costoBase: 40000, img: 'https://placehold.co/400x300.png', hint: 'event celebration' },
];

const defaultConfig: AsistenteAkConfig = {
  pasos: {
    tipoFiesta: {
      pregunta: "¿Qué tipo de evento estás planeando?",
      descripcion: "Selecciona una opción para empezar.",
      opciones: defaultOpcionesTipoFiesta,
    },
    // Future steps will be defined here
  }
};

async function ensureConfigFileExists() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(CONFIG_FILE_PATH);
  } catch {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }
}

export async function getAsistenteAkConfig(): Promise<AsistenteAkConfig> {
  await ensureConfigFileExists();
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    if (fileContent.trim() === '') return defaultConfig;
    // Simple merge logic: if a top-level key from default is missing, add it.
    const savedConfig = JSON.parse(fileContent);
    let needsUpdate = false;
    for (const key in defaultConfig.pasos) {
        if (!savedConfig.pasos[key]) {
            savedConfig.pasos[key] = (defaultConfig.pasos as any)[key];
            needsUpdate = true;
        }
    }
    if (needsUpdate) {
        await saveAsistenteAkConfig(savedConfig);
    }
    return savedConfig;
  } catch (error) {
    console.error('Error reading Asistente AK config file, returning default:', error);
    return defaultConfig;
  }
}

export async function saveAsistenteAkConfig(configData: AsistenteAkConfig): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureConfigFileExists();
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Error writing Asistente AK config file:', error);
    return { success: false, error: error.message || "Unknown error saving config." };
  }
}

export async function crearPresupuestoDesdeAsistente(
  data: AsistenteData
): Promise<{ success: boolean; presupuestoId?: string; error?: string }> {
  try {
    const itemsPresupuestados: ItemPresupuestado[] = [];
    const totalInvitados = data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos;

    // Helper to add an item to the list
    const addItem = (item: { nombre: string; costoBase?: number; costoPorPersona?: number; multiplicadorCosto?: number; categoria: string; }) => {
      let costoUnitario = item.costoBase || 0;
      let cantidad = 1;
      let unidad = 'evento';

      if (item.costoPorPersona && item.costoPorPersona > 0) {
        costoUnitario = item.costoPorPersona;
        cantidad = totalInvitados;
        unidad = 'persona';
      }

      if (item.multiplicadorCosto && item.multiplicadorCosto > 1) {
        const costoBaseParaMultiplicar = data.tipoFiesta?.costoBase || 50000; // Fallback
        costoUnitario = costoBaseParaMultiplicar * (item.multiplicadorCosto - 1);
      }
      
      if (costoUnitario > 0 || (item.nombre.toLowerCase().includes('no') && costoUnitario === 0) || item.nombre.toLowerCase().includes('incluir')) {
        itemsPresupuestados.push({
          idServicioCatalogo: `asistente_${item.nombre.toLowerCase().replace(/\s+/g, '_')}`,
          nombreServicio: item.nombre,
          cantidad,
          unidad,
          precioUnitario: costoUnitario,
          costoTotalItem: costoUnitario * cantidad,
          categoriaServicio: item.categoria,
        });
      }
    };
    
    // Add items based on selections
    if(data.tipoFiesta) addItem({ ...data.tipoFiesta, categoria: 'Base Evento'});
    if(data.estiloDecoracion) addItem({ ...data.estiloDecoracion, categoria: 'Decoración'});
    if(data.catering) addItem({ ...data.catering, categoria: 'Catering'});
    if(data.bebidas) addItem({ ...data.bebidas, categoria: 'Bebidas'});
    if(data.fotoVideo) addItem({ ...data.fotoVideo, categoria: 'Foto/Video'});
    if(data.musica) addItem({ ...data.musica, categoria: 'Música'});
    if(data.reposteria) addItem({ ...data.reposteria, categoria: 'Repostería'});
    if(data.entretenimiento) addItem({ ...data.entretenimiento, categoria: 'Entretenimiento'});
    if(data.listaRegalos) addItem({nombre: 'Gestión de Lista de Regalos', costoBase: 0, categoria: 'Servicios Adicionales'});


    const costoTotalEstimado = itemsPresupuestados.reduce((sum, item) => sum + item.costoTotalItem, 0);

    const presupuestoData = {
      clienteNombre: `Cliente Asistente - ${data.tipoFiesta?.nombre || 'Evento'}`,
      eventoTipo: data.tipoFiesta?.nombre || 'Evento General',
      eventoFecha: new Date().toISOString(), // Default to today, to be confirmed by admin
      invitadosCantidad: totalInvitados,
      salonFiestas: 'A confirmar',
      itemsPresupuestados,
      costoTotalEstimado,
      notas: `Generado desde Asistente AK. Presupuesto del cliente: ${data.presupuestoCliente.toLocaleString('es-UY', {style: 'currency', currency: 'UYU'})}. Contactar para confirmar detalles.`,
      timestamp: new Date().toISOString(),
    };
    
    const result = await savePresupuesto(presupuestoData);

    if (result.success) {
      return { success: true, presupuestoId: result.id };
    } else {
      throw new Error(result.error || "No se pudo guardar el presupuesto.");
    }
  } catch (error: any) {
    console.error("Error creating budget from assistant:", error);
    return { success: false, error: error.message };
  }
}

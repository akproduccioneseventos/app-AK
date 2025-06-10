
'use server';

import type { Presupuesto, PlatoPresupuesto, ServicioAdicional } from '@/types/presupuesto'; // Added ServicioAdicional
import fs from 'fs/promises';
import path from 'path';
import type { FullMenu, MenuItem as CateringMenuItem } from '@/types/catering'; // Renamed to avoid conflict

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const presupuestosFilePath = path.join(dataDirectory, 'presupuestos.json');
const menusCateringFilePath = path.join(dataDirectory, 'menus-catering.json'); // Path to the catering menus

// Datos iniciales si el archivo no existe o está vacío
const initialMockPresupuestosDatabase: Presupuesto[] = [
  {
    id: 'pres_mock_1',
    clienteNombre: 'Ana García',
    eventoTipo: 'Cumpleaños',
    eventoFecha: new Date(2024, 10, 15).toISOString(), // Nov 15, 2024
    invitadosCantidad: 50,
    platosSeleccionados: [
      { idPlato: 'pizza', nombrePlato: 'Pizza Variada', cantidad: 50, costoUnitario: 10, costoTotalPlato: 500 },
      { idPlato: 'empanadas', nombrePlato: 'Empanadas Surtidas', cantidad: 50, costoUnitario: 5, costoTotalPlato: 250 },
    ],
    serviciosAdicionales: [
      { idServicio: 'dj', nombreServicio: 'DJ / Sonido', costoServicio: 400 },
    ],
    costoSubtotalPlatos: 750,
    costoSubtotalServicios: 400,
    costoTotalEstimado: 1150,
    timestamp: new Date().toISOString(),
    estado: 'Enviado',
    notas: 'Confirmar cantidad de invitados una semana antes.'
  },
];


async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para presupuestos:', error);
  }
}

async function readPresupuestosFile(): Promise<Presupuesto[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(presupuestosFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [...initialMockPresupuestosDatabase];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writePresupuestosFile(initialMockPresupuestosDatabase);
      return [...initialMockPresupuestosDatabase];
    }
    console.error('Error leyendo el archivo de presupuestos, usando datos iniciales:', error);
    return [...initialMockPresupuestosDatabase];
  }
}

async function writePresupuestosFile(data: Presupuesto[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(presupuestosFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de presupuestos:', error);
  }
}

// Helper function to generate simple AI hints for images
function generateDataAiHint(name: string): string {
  const commonWords = ['de', 'con', 'y', 'a', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'para', 'por', 'sin', 'sobre', 'tras'];
  const cleanedName = name.toLowerCase()
    .replace(/\((tradicional|gourmet|opción invierno|estimado por persona|lata \d+ml|botella \d+ml|porrón \d+ml|vaso|jarra \d+l)\)/gi, '') // Remove specific parenthetical phrases
    .replace(/[^\w\s]/gi, '') // Remove punctuation
    .trim();
  
  const words = cleanedName.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
  if (words.length === 0) return 'food item'; // Fallback
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1]}`; // Take first two significant words
}


export async function getPlatos(): Promise<PlatoPresupuesto[]> {
  try {
    const menusFileContent = await fs.readFile(menusCateringFilePath, 'utf-8');
    const menusData: FullMenu[] = JSON.parse(menusFileContent);
    
    const platosPresupuesto: PlatoPresupuesto[] = [];

    menusData.forEach(menu => {
      menu.items.forEach(item => {
        platosPresupuesto.push({
          id: item.id,
          nombre: item.name,
          descripcion: item.type || undefined, // Use menu item type as description
          costoPorPersona: item.totalDishCost, // Assuming totalDishCost is per person
          imagenUrl: `https://placehold.co/300x200.png`,
          dataAiHint: generateDataAiHint(item.name), // Generate AI hint
          seleccionado: false,
        });
      });
    });
    return platosPresupuesto;
  } catch (error) {
    console.error('Error leyendo o parseando menus-catering.json para getPlatos:', error);
    // Fallback to a very basic list or empty if critical
    return [
        { id: 'fallback_error', nombre: 'Error al cargar platos', descripcion: 'Contactar soporte', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 0, dataAiHint: "error sign" },
    ];
  }
}


export async function savePresupuesto(presupuestoData: Omit<Presupuesto, 'id' | 'timestamp' | 'estado'>): Promise<{ success: boolean, id?: string, error?: string }> {
  let presupuestos = await readPresupuestosFile();
  
  const nuevoPresupuesto: Presupuesto = { 
    ...presupuestoData, 
    id: `pres_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    estado: 'Borrador' // Estado inicial
  };
  presupuestos.push(nuevoPresupuesto);
  await writePresupuestosFile(presupuestos);
  
  return { success: true, id: nuevoPresupuesto.id };
}

export async function getPresupuestos(): Promise<Presupuesto[]> {
  const presupuestos = await readPresupuestosFile();
  return presupuestos.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const initialLength = presupuestos.length;
  presupuestos = presupuestos.filter(p => p.id !== id);
  
  if (presupuestos.length < initialLength) {
    await writePresupuestosFile(presupuestos);
    return { success: true };
  } else {
    return { success: false, error: `Presupuesto con ID ${id} no encontrado para eliminar.` };
  }
}

// Initialize presupuestos.json if it doesn't exist
async function initializePresupuestoData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(presupuestosFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo presupuestos.json no encontrado, creando con datos iniciales...');
            await writePresupuestosFile(initialMockPresupuestosDatabase);
        }
    }
}

initializePresupuestoData();

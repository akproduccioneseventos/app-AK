
'use server';

import type { Presupuesto, PlatoPresupuesto } from '@/types/presupuesto';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const presupuestosFilePath = path.join(dataDirectory, 'presupuestos.json');

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
  {
    id: 'pres_mock_2',
    clienteNombre: 'Carlos López',
    eventoTipo: 'Boda',
    eventoFecha: new Date(2025, 2, 22).toISOString(), // Mar 22, 2025
    invitadosCantidad: 120,
    platosSeleccionados: [
      { idPlato: 'asado', nombrePlato: 'Asado Completo', cantidad: 120, costoUnitario: 25, costoTotalPlato: 3000 },
      { idPlato: 'ensalada_premium', nombrePlato: 'Ensalada Premium', cantidad: 120, costoUnitario: 8, costoTotalPlato: 960 },
    ],
    serviciosAdicionales: [
      { idServicio: 'foto', nombreServicio: 'Fotografía', costoServicio: 300 },
      { idServicio: 'deco', nombreServicio: 'Decoración Temática', costoServicio: 500 },
    ],
    costoSubtotalPlatos: 3960,
    costoSubtotalServicios: 800,
    costoTotalEstimado: 4760,
    timestamp: new Date().toISOString(),
    estado: 'Aceptado',
  }
];

// Platos disponibles para seleccionar (esto se mantiene en memoria por ahora como en el original)
const mockPlatos: PlatoPresupuesto[] = [
  { id: 'pizza', nombre: 'Pizza Variada', descripcion: 'Muzzarella, napolitana, fugazzeta.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 10, dataAiHint: "pizza food" },
  { id: 'empanadas', nombre: 'Empanadas Surtidas', descripcion: 'Carne, pollo, jamón y queso.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 5, dataAiHint: "empanadas pastry" },
  { id: 'asado', nombre: 'Asado Completo', descripcion: 'Tira, vacío, chorizo, morcilla.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 25, dataAiHint: "barbecue meat" },
  { id: 'sushi', nombre: 'Sushi Variado (30 piezas)', descripcion: 'Rolls clásicos y especiales.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 30, dataAiHint: "sushi seafood" },
  { id: 'pasta', nombre: 'Pasta Casera con Salsa', descripcion: 'A elección: Fileto, bolognesa, crema.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 18, dataAiHint: "pasta dish" },
  { id: 'tacos', nombre: 'Tacos Mexicanos (3u)', descripcion: 'Carne, pollo o vegetarianos.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 12, dataAiHint: "tacos mexican" },
  { id: 'ensalada_premium', nombre: 'Ensalada Premium', descripcion: 'Verdes, cherry, parmesano, nueces.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 8, dataAiHint: "salad gourmet" },
  { id: 'mesa_dulce', nombre: 'Mesa Dulce Clásica', descripcion: 'Variedad de tortas y postres.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 15, dataAiHint: "dessert table" },
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

export async function getPlatos(): Promise<PlatoPresupuesto[]> {
  // Simulación con delay (como estaba antes, no interactúa con JSON por ahora)
  await new Promise(resolve => setTimeout(resolve, 100));
  return JSON.parse(JSON.stringify(mockPlatos.map(plato => ({ ...plato, imagenUrl: `${plato.imagenUrl}?${plato.dataAiHint ? `&data-ai-hint=${encodeURIComponent(plato.dataAiHint)}` : ''}`}))));
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

// Podrías añadir funciones para getPresupuestoById, updatePresupuesto, deletePresupuesto
// Ejemplo de deletePresupuesto (a implementar en UI si se requiere)
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

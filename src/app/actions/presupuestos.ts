'use server';

import type { Presupuesto, PlatoPresupuesto } from '@/types/presupuesto';

// --- SIMULACIÓN DE DATOS Y OPERACIONES CON FIRESTORE ---

let mockPresupuestos: Presupuesto[] = [
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

const mockPlatos: PlatoPresupuesto[] = [
  { id: 'pizza', nombre: 'Pizza Variada', descripcion: 'Muzzarella, napolitana, fugazzeta.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 10 },
  { id: 'empanadas', nombre: 'Empanadas Surtidas', descripcion: 'Carne, pollo, jamón y queso.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 5 },
  { id: 'asado', nombre: 'Asado Completo', descripcion: 'Tira, vacío, chorizo, morcilla.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 25 },
  { id: 'sushi', nombre: 'Sushi Variado (30 piezas)', descripcion: 'Rolls clásicos y especiales.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 30 },
  { id: 'pasta', nombre: 'Pasta Casera con Salsa', descripcion: 'A elección: Fileto, bolognesa, crema.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 18 },
  { id: 'tacos', nombre: 'Tacos Mexicanos (3u)', descripcion: 'Carne, pollo o vegetarianos.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 12 },
  { id: 'ensalada_premium', nombre: 'Ensalada Premium', descripcion: 'Verdes, cherry, parmesano, nueces.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 8 },
  { id: 'mesa_dulce', nombre: 'Mesa Dulce Clásica', descripcion: 'Variedad de tortas y postres.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 15 },
];

// Simula la obtención de platos desde Firestore (colección platos_presupuesto)
export async function getPlatos(): Promise<PlatoPresupuesto[]> {
  // En una app real, aquí harías:
  // const platosSnapshot = await firestore.collection('platos_presupuesto').get();
  // return platosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlatoPresupuesto));
  
  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(mockPlatos)); // Devuelve una copia para evitar mutaciones
}

// Simula el guardado de un presupuesto en Firestore (colección presupuestos)
export async function savePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean, id?: string, error?: string }> {
  // En una app real, aquí harías:
  // try {
  //   const docRef = await firestore.collection('presupuestos').add(presupuestoData);
  //   return { success: true, id: docRef.id };
  // } catch (e: any) {
  //   return { success: false, error: e.message };
  // }

  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const nuevoPresupuesto = { ...presupuestoData, id: `pres_mock_${Date.now()}` };
  mockPresupuestos.push(nuevoPresupuesto);
  
  // Simular un error aleatorio para pruebas
  // if (Math.random() > 0.8) {
  //   return { success: false, error: "Error simulado al guardar en Firestore." };
  // }
  
  return { success: true, id: nuevoPresupuesto.id };
}

// Simula la obtención de presupuestos guardados desde Firestore
export async function getPresupuestos(): Promise<Presupuesto[]> {
  // En una app real:
  // const presupuestosSnapshot = await firestore.collection('presupuestos').orderBy('timestamp', 'desc').get();
  // return presupuestosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Presupuesto));

  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 700));
  return JSON.parse(JSON.stringify(mockPresupuestos.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() )));
}

// Podrías añadir funciones para getPresupuestoById, updatePresupuesto, deletePresupuesto

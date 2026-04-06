/**
 * Fixture: Caso Vana Rodríguez
 *
 * Seed data to quickly load the Vana Rodríguez budget + event into the local data.
 *
 * Usage in tests or manual QA:
 *   import { VANA_PRESUPUESTO_FIXTURE, VANA_FIESTA_FIXTURE } from '@/data/seeds/vana-rodriguez-fixture';
 *   await savePresupuesto(VANA_PRESUPUESTO_FIXTURE);
 *   await saveFiesta({ ...initialFiestaActualData, ...VANA_FIESTA_FIXTURE });
 *
 * Notes:
 * - Fecha del evento: 09/05/2026 (from contract; "Mayo 2026" in the text)
 * - Presupuesto total: $338.300
 * - Seña: 20% = $67.660
 * - Saldo: $270.640
 */

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export const VANA_PRESUPUESTO_ID = 'pres_vana_rodriguez_2026';
export const VANA_FIESTA_ID = 'fiesta_vana_rodriguez_2026';

const items: ItemPresupuestado[] = [
  { idServicioCatalogo: 'imported_0', nombreServicio: 'Mozos', cantidad: 6, precioUnitario: 2900, precioUnitarioPresupuesto: 2900, costoTotalItem: 17400, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_1', nombreServicio: 'Mozo de cocina', cantidad: 6, precioUnitario: 2900, precioUnitarioPresupuesto: 2900, costoTotalItem: 17400, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_2', nombreServicio: 'Metre', cantidad: 1, precioUnitario: 3500, precioUnitarioPresupuesto: 3500, costoTotalItem: 3500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_3', nombreServicio: 'Vajilla completa', cantidad: 150, precioUnitario: 70, precioUnitarioPresupuesto: 70, costoTotalItem: 10500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_4', nombreServicio: 'Mantelería completa', cantidad: 150, precioUnitario: 70, precioUnitarioPresupuesto: 70, costoTotalItem: 10500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_5', nombreServicio: 'Entrada 23: Sandwiches y Saladitos', cantidad: 150, precioUnitario: 220, precioUnitarioPresupuesto: 220, costoTotalItem: 33000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_6', nombreServicio: 'Entrada 8: Picada de fiambres', cantidad: 150, precioUnitario: 180, precioUnitarioPresupuesto: 180, costoTotalItem: 27000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_7', nombreServicio: 'Asador', cantidad: 1, precioUnitario: 4500, precioUnitarioPresupuesto: 4500, costoTotalItem: 4500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_8', nombreServicio: 'Mesa buffets', cantidad: 100, precioUnitario: 180, precioUnitarioPresupuesto: 180, costoTotalItem: 18000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_9', nombreServicio: 'Plato principal 1: Hamburguesa c/ fritas', cantidad: 50, precioUnitario: 290, precioUnitarioPresupuesto: 290, costoTotalItem: 14500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_10', nombreServicio: 'Discoteca intermedia', cantidad: 1, precioUnitario: 15000, precioUnitarioPresupuesto: 15000, costoTotalItem: 15000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_11', nombreServicio: 'Fotografía de fiestas', cantidad: 1, precioUnitario: 9000, precioUnitarioPresupuesto: 9000, costoTotalItem: 9000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_12', nombreServicio: 'Fotografía de exteriores', cantidad: 1, precioUnitario: 3800, precioUnitarioPresupuesto: 3800, costoTotalItem: 3800, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_13', nombreServicio: 'Fotografía de la pintada', cantidad: 1, precioUnitario: 3800, precioUnitarioPresupuesto: 3800, costoTotalItem: 3800, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_14', nombreServicio: 'Filmación de la fiesta', cantidad: 1, precioUnitario: 9000, precioUnitarioPresupuesto: 9000, costoTotalItem: 9000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_15', nombreServicio: 'Fotocabina', cantidad: 1, precioUnitario: 2900, precioUnitarioPresupuesto: 2900, costoTotalItem: 2900, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_16', nombreServicio: 'Barra de tragos, canilla libre', cantidad: 150, precioUnitario: 350, precioUnitarioPresupuesto: 350, costoTotalItem: 52500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_17', nombreServicio: 'Refresco', cantidad: 150, precioUnitario: 150, precioUnitarioPresupuesto: 150, costoTotalItem: 22500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_18', nombreServicio: 'Cerveza corona', cantidad: 150, precioUnitario: 250, precioUnitarioPresupuesto: 250, costoTotalItem: 37500, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_19', nombreServicio: 'Hielo', cantidad: 8, precioUnitario: 450, precioUnitarioPresupuesto: 450, costoTotalItem: 3600, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_20', nombreServicio: 'Torta principal', cantidad: 150, precioUnitario: 100, precioUnitarioPresupuesto: 100, costoTotalItem: 15000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_21', nombreServicio: 'Mesa de postres - Chesecake', cantidad: 1, precioUnitario: 1200, precioUnitarioPresupuesto: 1200, costoTotalItem: 1200, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_22', nombreServicio: 'Mesa de postres - Rogel', cantidad: 1, precioUnitario: 1600, precioUnitarioPresupuesto: 1600, costoTotalItem: 1600, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_23', nombreServicio: 'Mesa de postres - Lemon pae', cantidad: 1, precioUnitario: 1100, precioUnitarioPresupuesto: 1100, costoTotalItem: 1100, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_24', nombreServicio: 'Postre Nro. 6: Selva Negra', cantidad: 1, precioUnitario: 1400, precioUnitarioPresupuesto: 1400, costoTotalItem: 1400, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_25', nombreServicio: 'Mesa de postres - Flan de coco', cantidad: 1, precioUnitario: 1000, precioUnitarioPresupuesto: 1000, costoTotalItem: 1000, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_26', nombreServicio: 'Mesa de postres - Tarta frutal', cantidad: 1, precioUnitario: 1100, precioUnitarioPresupuesto: 1100, costoTotalItem: 1100, calculationMethod: 'fijo', esRegalo: false },
  { idServicioCatalogo: 'imported_27', nombreServicio: 'Invitaciones digitales', cantidad: 1, precioUnitario: 2500, precioUnitarioPresupuesto: 2500, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
  { idServicioCatalogo: 'imported_28', nombreServicio: 'Video de vida', cantidad: 1, precioUnitario: 2500, precioUnitarioPresupuesto: 2500, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
  { idServicioCatalogo: 'imported_29', nombreServicio: 'Pantalla gigante y proyector', cantidad: 1, precioUnitario: 2500, precioUnitarioPresupuesto: 2500, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
  { idServicioCatalogo: 'imported_30', nombreServicio: 'Album digital personalizado', cantidad: 1, precioUnitario: 3500, precioUnitarioPresupuesto: 3500, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
  { idServicioCatalogo: 'imported_31', nombreServicio: 'Cofee break', cantidad: 1, precioUnitario: 3500, precioUnitarioPresupuesto: 3500, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
  { idServicioCatalogo: 'imported_32', nombreServicio: 'Fuegos fríos', cantidad: 1, precioUnitario: 3000, precioUnitarioPresupuesto: 3000, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
  { idServicioCatalogo: 'imported_33', nombreServicio: 'Lluvia de burbujas', cantidad: 1, precioUnitario: 1500, precioUnitarioPresupuesto: 1500, costoTotalItem: 0, calculationMethod: 'fijo', esRegalo: true },
];

export const VANA_PRESUPUESTO_FIXTURE: Presupuesto = {
  id: VANA_PRESUPUESTO_ID,
  numero: 9999,
  clienteNombre: 'Vana Rodríguez',
  eventoTipo: 'Fiesta/Evento',
  eventoFecha: new Date(2026, 4, 9).toISOString(), // 09/05/2026
  invitadosCantidad: 150,
  invitadosAdultos: 150,
  invitadosNinos: 0,
  invitadosAdolescentes: 0,
  salonFiestas: '',
  itemsPresupuestados: items,
  costoTotalEstimado: 338300,
  totalConDescuento: 338300,
  timestamp: '2025-10-19T12:00:00.000Z',
  estado: 'Borrador',
  notas:
    'Importado desde texto pegado. Fecha original: Mayo 2026 (contrato: 09/05/26). ' +
    'Seña: $67.660 (20%). Saldo: $270.640.',
  source: 'manual',
};

export const VANA_FIESTA_FIXTURE: Partial<FiestaEnPlanificacion> = {
  id: VANA_FIESTA_ID,
  presupuestoId: VANA_PRESUPUESTO_ID,
  estado: 'En Planificación',
  configuracion: {
    nombreEvento: 'Fiesta/Evento de Vana Rodríguez',
    tipoCelebracion: 'Otro',
    fechaEvento: new Date(2026, 4, 9).toISOString(),
    horaInicio: '22:00',
    horaFin: '05:00',
    nombreLugar: '',
    invitadosEstimados: 150,
    invitadosAdultos: 150,
    invitadosNinos: 0,
    invitadosAdolescentes: 0,
    presupuestoEstimado: 338300,
    notesAdicionales: '',
    clienteNombre: 'Vana Rodríguez',
  },
};

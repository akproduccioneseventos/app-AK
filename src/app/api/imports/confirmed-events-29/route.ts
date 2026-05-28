export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import confirmedEventsImport from '@/data/imports/fiestas-confirmadas-29.json';

const FILE_NAME = 'AK_IMPORTACION_29_FIESTAS_CLIENTES_PRESUPUESTOS_LISTO.json';

const DISCOTECA_UPSERT = [
  {
    id: 'serv_discoteca_basica_historica',
    nombre: 'Discoteca basica',
    tipoItem: 'Servicio',
    categoria: 'Servicio de discoteca',
    valorUnitarioEstimado: 4000,
    tipoCosto: 'Proveedor',
    precioVenta: 9900,
    calculationMethod: 'fijo',
    unidad: 'Evento',
    notas: 'Compatibilidad para presupuestos historicos anteriores al simulador por tramos.',
  },
  {
    id: 'serv_discoteca_intermedia_historica',
    nombre: 'Discoteca intermedia',
    tipoItem: 'Servicio',
    categoria: 'Servicio de discoteca',
    valorUnitarioEstimado: 4000,
    tipoCosto: 'Proveedor',
    precioVenta: 14900,
    calculationMethod: 'fijo',
    unidad: 'Evento',
    notas: 'Compatibilidad para presupuestos historicos anteriores al simulador por tramos.',
  },
  {
    id: 'serv_discoteca_premium_historica',
    nombre: 'Discoteca premium',
    tipoItem: 'Servicio',
    categoria: 'Servicio de discoteca',
    valorUnitarioEstimado: 4000,
    tipoCosto: 'Proveedor',
    precioVenta: 25900,
    calculationMethod: 'fijo',
    unidad: 'Evento',
    notas: 'Compatibilidad para presupuestos historicos anteriores al simulador por tramos.',
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function normalizeDiscotecaItems(presupuestos: any[]) {
  presupuestos.forEach((presupuesto) => {
    const seen = new Map<string, number>();
    (presupuesto.itemsPresupuestados || []).forEach((item: any) => {
      const name = normalizeText(String(item.nombreServicio || ''));
      let target: string | null = null;
      if (name.includes('discoteca') && name.includes('basic')) target = 'serv_discoteca_basica_historica';
      if (name.includes('discoteca') && name.includes('intermedia')) target = 'serv_discoteca_intermedia_historica';
      if (name.includes('discoteca') && name.includes('premium')) target = 'serv_discoteca_premium_historica';

      const currentId = target || String(item.idServicioCatalogo || `import_item_${seen.size + 1}`);
      const count = (seen.get(currentId) || 0) + 1;
      seen.set(currentId, count);
      item.idServicioCatalogo = count === 1 ? currentId : `${currentId}_${count}`;
      if (target) {
        item.descripcionServicio = 'Linea importada desde presupuesto firmado existente; precio historico conservado.';
      }
    });
  });
}

function findImportedDocument(presupuesto: any, type: string) {
  return (presupuesto.documentosImportados || []).find((documento: any) => documento?.tipo === type)?.path || '';
}

function buildCustomers(presupuestos: any[], fiestas: any[]) {
  const budgetById = new Map(presupuestos.map((presupuesto) => [presupuesto.id, presupuesto]));
  return fiestas.map((fiesta) => {
    const presupuesto = budgetById.get(fiesta.presupuestoId) || {};
    const configuracion = fiesta.configuracion || {};
    return {
      id: configuracion.clienteId || `cust_${fiesta.id}`,
      name: configuracion.clienteNombre || presupuesto.clienteNombre || configuracion.nombreEvento || 'Cliente importado',
      phone: configuracion.clienteContacto || presupuesto.clienteContacto || '',
      ci: configuracion.clienteDocumento || presupuesto.documentoIdentidad || '',
      estadoCliente: 'Actual',
      partyDate: configuracion.fechaEvento || presupuesto.eventoFecha || '',
      partyTime: configuracion.horaInicio && configuracion.horaFin ? `${configuracion.horaInicio} - ${configuracion.horaFin}` : configuracion.horaInicio || '',
      partyType: configuracion.tipoCelebracion || presupuesto.eventoTipo || '',
      partyForWhom: presupuesto.protagonista1Nombre || configuracion.clienteNombre || presupuesto.clienteNombre || '',
      guestCount: configuracion.invitadosEstimados || presupuesto.invitadosCantidad || 0,
      venueName: configuracion.nombreLugar || presupuesto.salonFiestas || '',
      contractFileName: findImportedDocument(presupuesto, 'contrato_servicio'),
      budgetFileName: findImportedDocument(presupuesto, 'presupuesto_firmado'),
      salonContractFileName: findImportedDocument(presupuesto, 'contrato_salon'),
    };
  });
}

function buildImportPayload() {
  const presupuestos = clone((confirmedEventsImport as any).presupuestos || []);
  const fiestas = clone((confirmedEventsImport as any).fiestas || []);
  normalizeDiscotecaItems(presupuestos);

  const customers = buildCustomers(presupuestos, fiestas);
  const budgetIds = new Set(presupuestos.map((presupuesto: any) => presupuesto.id));
  const customerIds = new Set(customers.map((customer: any) => customer.id));
  const duplicateItemIdsInsideBudget = presupuestos
    .filter((presupuesto: any) => {
      const ids = (presupuesto.itemsPresupuestados || []).map((item: any) => item.idServicioCatalogo).filter(Boolean);
      return ids.length !== new Set(ids).size;
    })
    .map((presupuesto: any) => presupuesto.id);

  const missingPresupuestosForFiestas = fiestas.filter((fiesta: any) => !budgetIds.has(fiesta.presupuestoId)).map((fiesta: any) => fiesta.id);
  const missingClientesForFiestas = fiestas.filter((fiesta: any) => !customerIds.has(fiesta.configuracion?.clienteId)).map((fiesta: any) => fiesta.id);

  const validation = {
    clientes: customers.length,
    presupuestos: presupuestos.length,
    fiestas: fiestas.length,
    missingPresupuestosForFiestas,
    missingClientesForFiestas,
    duplicateItemIdsInsideBudget,
    serviciosEmpresaIncluidos: 0,
    serviciosEmpresaUpsert: DISCOTECA_UPSERT.length,
    importReady: customers.length === 29 && presupuestos.length === 29 && fiestas.length === 29 && missingPresupuestosForFiestas.length === 0 && missingClientesForFiestas.length === 0 && duplicateItemIdsInsideBudget.length === 0,
  };

  return {
    metadata: {
      importType: 'ak_confirmed_events_import_v2',
      generatedAt: new Date().toISOString(),
      source: 'Contratos y presupuestos historicos futuros importados desde documentos locales',
      totalClientes: customers.length,
      totalPresupuestos: presupuestos.length,
      totalFiestas: fiestas.length,
      preserveServiciosEmpresa: true,
      replaceServiciosEmpresa: false,
      catalogPolicy: 'No reemplaza servicios-empresa.json. Solo agrega serviciosEmpresaUpsert si faltan por nombre/categoria.',
      excluded: 'Macarena Rendo cancelada y fiestas pasadas excluidas.',
    },
    validation,
    customers,
    clientes: customers,
    presupuestos,
    fiestas,
    serviciosEmpresaUpsert: DISCOTECA_UPSERT,
  };
}

export async function GET() {
  try {
    const content = JSON.stringify(buildImportPayload(), null, 2);
    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${FILE_NAME}"`);
    headers.set('Cache-Control', 'no-store');
    return new NextResponse(content, { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ error: 'No se pudo descargar la importacion.', details: error?.message }, { status: 500 });
  }
}

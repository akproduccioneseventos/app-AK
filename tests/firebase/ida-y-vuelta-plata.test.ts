/** @jest-environment node */
/**
 * Orden 293, bloque 2: toda la plata de la lista, con ida y vuelta contra la base (emulador).
 * Cada accion: se hace, se VUELVE A LEER de la base y se comprueba lo que quedo.
 * De mentira solo: la sesion, las cookies y los avisos. Nunca data-service ni firebase-sync.
 */
process.env.AK_SESSION_SECRET = 'prueba-293-plata-secreto-con-suficiente-entropia';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
delete process.env.AK_USE_LOCAL_JSON_ONLY;
jest.setTimeout(60000);

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => ({ success: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: async () => undefined }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: async () => null }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: async () => ({ scheduled: 0, errors: [] }),
}));
jest.mock('@/app/actions/scheduled-messages', () => ({ getScheduledMessages: async () => [] }));
jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: async () => ({ success: true }),
  syncAppointmentToGoogleWorkspace: async () => undefined,
}));

import fs from 'node:fs';
import path from 'node:path';
import { readData, writeData } from '@/lib/data-service';
import { saveServicioEmpresa, duplicateServicioEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
import { saveGastoGeneral, deleteGastoGeneral } from '@/app/actions/gastos';
import { saveCupon, deleteCupon } from '@/app/actions/cupones';
import {
  savePresupuesto, getPresupuestoById, addPagoToPresupuesto, deletePagoFromPresupuesto,
  addPagoClienteFromPortal, confirmPagoCliente, rejectPagoCliente, approvePresupuesto,
  recalculatePresupuestoFromCatalog, deletePresupuesto,
} from '@/app/actions/presupuestos';
import { saveInvoice, deleteInvoice, resetAllInvoices, registerBookingDeposit } from '@/app/actions/invoices';
import { saveSalon, addSalonPago, deleteSalonPago, deleteSalonFoto, deleteSalon } from '@/app/actions/salones';

const conEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const hoy = new Date().toISOString().slice(0, 10);

const ARCHIVOS_LOCALES_TOCADOS = [
  'servicios-empresa.json',
  'gastos-generales.json',
  'cupones.json',
  'presupuestos.json',
  'crm-leads.json',
  'invoices.json',
  'salones.json',
  'backup-status.json',
].flatMap((nombre) => [
  path.join(process.cwd(), 'data', nombre),
  path.join(process.cwd(), 'src', 'data', nombre),
]);

const copiasLocales = new Map<string, string | null>();

const lista = <T = any>(archivo: string) => readData<T[]>(archivo, []);
const sinCache = async () => (await import('@/lib/server-cache')).cacheInvalidate('servicios-empresa-raw');

describe('ida y vuelta contra la base: la plata', () => {
  beforeAll(() => {
    expect(conEmuladores).toBe(true);
    for (const ruta of ARCHIVOS_LOCALES_TOCADOS) {
      copiasLocales.set(ruta, fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null);
    }
  });

  afterAll(() => {
    for (const [ruta, contenido] of copiasLocales.entries()) {
      try {
        if (contenido === null) {
          if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        } else {
          fs.writeFileSync(ruta, contenido, 'utf8');
        }
      } catch {
        // ignorar errores de limpieza local
      }
    }
    for (const dir of [path.join(process.cwd(), 'data', 'fiestas'), path.join(process.cwd(), 'src', 'data', 'fiestas')]) {
      try {
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (f.includes('293')) fs.unlinkSync(path.join(dir, f));
          }
        }
      } catch {
        // ignorar errores de limpieza local
      }
    }
  });

  it('servicios: saveServicioEmpresa, duplicateServicioEmpresa y deleteServicioEmpresa', async () => {
    await writeData('servicios-empresa.json', [], undefined, { skipAutoBackup: true }).catch(() => undefined);
    await sinCache();
    const nuevo = await saveServicioEmpresa({
      nombre: 'Servicio plata 293', categoria: 'Prueba', tipoItem: 'Servicio',
      precioVenta: 500, valorUnitarioEstimado: 200, calculationMethod: 'fijo', unidad: 'Unidad',
    } as any);
    expect(nuevo.success).toBe(true);
    let guardados = await lista('servicios-empresa.json');
    expect(guardados.find((s) => s.id === nuevo.id)?.precioVenta).toBe(500);

    const copia = await duplicateServicioEmpresa(nuevo.id!);
    expect(copia.success).toBe(true);
    await sinCache();
    guardados = await lista('servicios-empresa.json');
    const laCopia = guardados.find((s) => s.id === copia.servicio?.id);
    expect(laCopia?.nombre).toBe('[COPIA] Servicio plata 293');
    expect(laCopia?.precioVenta).toBe(500);

    expect((await deleteServicioEmpresa(copia.servicio!.id)).success).toBe(true);
    expect((await deleteServicioEmpresa(nuevo.id!)).success).toBe(true);
    await sinCache();
    guardados = await lista('servicios-empresa.json');
    expect(guardados.find((s) => s.id === nuevo.id)).toBeUndefined();
    expect(guardados.find((s) => s.id === copia.servicio?.id)).toBeUndefined();
  });

  it('gastos: saveGastoGeneral y deleteGastoGeneral', async () => {
    const r = await saveGastoGeneral({ fecha: hoy, concepto: 'Gasto 293', categoria: 'Otro', monto: 1234 });
    expect(r.success).toBe(true);
    let guardados = await lista('gastos-generales.json');
    expect(guardados.find((g) => g.id === r.gasto!.id)?.monto).toBe(1234);

    expect((await deleteGastoGeneral(r.gasto!.id)).success).toBe(true);
    guardados = await lista('gastos-generales.json');
    expect(guardados.find((g) => g.id === r.gasto!.id)).toBeUndefined();
  });

  it('cupones: saveCupon y deleteCupon', async () => {
    const r = await saveCupon({
      codigo: 'PRUEBA293', nombre: 'Cupon 293', tipo: 'porcentaje', valor: 10,
      fechaInicio: '2030-01-01', fechaFin: '2030-12-31', usosMaximos: 5, activo: true, creadoPor: 'prueba',
    } as any);
    expect(r.success).toBe(true);
    let guardados = await lista('cupones.json');
    expect(guardados.find((c) => c.id === r.cupon!.id)?.codigo).toBe('PRUEBA293');

    expect((await deleteCupon(r.cupon!.id)).success).toBe(true);
    guardados = await lista('cupones.json');
    expect(guardados.find((c) => c.id === r.cupon!.id)).toBeUndefined();
  });

  it('presupuestos: los cobros van, se confirman, se rechazan y se borran; el total no se pierde', async () => {
    await writeData('servicios-empresa.json', [
      { id: 'serv_p293', nombre: 'Servicio presupuesto 293', categoria: 'Prueba', tipoItem: 'Servicio', precioVenta: 1000, valorUnitarioEstimado: 400, calculationMethod: 'fijo' },
    ], undefined, { skipAutoBackup: true });
    await sinCache();

    const creado = await savePresupuesto({
      clienteNombre: 'Cliente plata 293', eventoTipo: 'Cumpleaños', eventoFecha: '2030-06-15',
      invitadosCantidad: 10, invitadosAdultos: 10, invitadosNinos: 0, invitadosAdolescentes: 0,
      itemsPresupuestados: [{
        idServicioCatalogo: 'serv_p293', nombreServicio: 'Servicio presupuesto 293', cantidad: 1,
        precioUnitario: 400, precioUnitarioPresupuesto: 1000, costoTotalItem: 1000, tipoItem: 'Servicio', calculationMethod: 'fijo',
      }],
      costoTotalEstimado: 1000, totalConDescuento: 1000, estado: 'Borrador', timestamp: new Date().toISOString(),
    } as any);
    expect(creado.success).toBe(true);
    const id = creado.id!;

    // Se guardo en la base.
    let p: any = await getPresupuestoById(id);
    expect(p?.clienteNombre).toBe('Cliente plata 293');

    // Enviar (antes de cobrar: uno con cobros ya no se puede volver a marcar como enviado).
    expect((await approvePresupuesto(id)).success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    expect(p.estado).toBe('Enviado');

    // Cobro del equipo: entra, y se lee de nuevo.
    const cobro = await addPagoToPresupuesto(id, { fecha: hoy, monto: 300, metodoPago: 'Efectivo', estadoPago: 'confirmado' } as any);
    expect(cobro.success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    expect(p.pagosCliente).toHaveLength(1);
    expect(p.pagosCliente[0].monto).toBe(300);

    // Cobro informado por el cliente (pendiente), confirmar y rechazar.
    const informado = await addPagoClienteFromPortal(id, { fecha: hoy, monto: 200, metodoPago: 'Transferencia Bancaria' } as any);
    expect(informado.success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    const pendiente = p.pagosCliente.find((x: any) => x.estadoPago === 'pendiente_confirmacion');
    expect(pendiente?.monto).toBe(200);

    expect((await confirmPagoCliente(id, pendiente.id)).success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    expect(p.pagosCliente.find((x: any) => x.id === pendiente.id).estadoPago).toBe('confirmado');

    const otro = await addPagoClienteFromPortal(id, { fecha: hoy, monto: 100, metodoPago: 'Efectivo' } as any);
    expect(otro.success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    const aRechazar = p.pagosCliente.find((x: any) => x.monto === 100);
    expect((await rejectPagoCliente(id, aRechazar.id, 'No llego la plata')).success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    const rechazado = p.pagosCliente.find((x: any) => x.id === aRechazar.id);
    expect(rechazado.estadoPago).toBe('rechazado');
    expect(rechazado.motivoRechazo).toBe('No llego la plata');

    // Vuelta: borrar el cobro y quedan los otros dos.
    expect((await deletePagoFromPresupuesto(id, aRechazar.id)).success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    expect(p.pagosCliente.map((x: any) => x.monto).sort()).toEqual([200, 300]);

    // Recalcular con el catalogo: cambia el precio en el catalogo y el presupuesto lo sigue.
    await writeData('servicios-empresa.json', [
      { id: 'serv_p293', nombre: 'Servicio presupuesto 293', categoria: 'Prueba', tipoItem: 'Servicio', precioVenta: 1500, valorUnitarioEstimado: 400, calculationMethod: 'fijo' },
    ], undefined, { skipAutoBackup: true });
    await sinCache();
    const recalculado = await recalculatePresupuestoFromCatalog(id);
    expect(recalculado.success).toBe(true);
    p = (await lista<any>('presupuestos.json')).find((x) => x.id === id);
    expect(p.itemsPresupuestados[0].precioUnitarioPresupuesto).toBe(1500);
    expect(p.pagosCliente).toHaveLength(2); // recalcular no se lleva los cobros

    // Con cobros no se borra (se archiva): sigue en la base.
    const bloqueado = await deletePresupuesto(id);
    expect(bloqueado.success).toBe(false);
    expect((await lista<any>('presupuestos.json')).find((x) => x.id === id)).toBeDefined();

    // Sacados los cobros, si se borra, y no queda en la base.
    for (const cobro of (await lista<any>('presupuestos.json')).find((x) => x.id === id).pagosCliente) {
      expect((await deletePagoFromPresupuesto(id, cobro.id)).success).toBe(true);
    }
    expect((await deletePresupuesto(id)).success).toBe(true);
    expect((await lista<any>('presupuestos.json')).find((x) => x.id === id)).toBeUndefined();
  });

  it('facturas: deleteInvoice borra la que no tiene cobros; resetAllInvoices vacia todo', async () => {
    const base = {
      customer: { id: 'cli_293', name: 'Cliente factura 293' }, issueDate: hoy, dueDate: hoy,
      items: [{ description: 'Item', quantity: 1, unitPrice: 100, total: 100 }],
      subtotal: 100, taxRate: 0, taxAmount: 0, totalAmount: 100, status: 'Draft', currency: 'UYU', vendorName: 'AK',
    };
    const a = await saveInvoice({ ...base, invoiceNumber: 'F-293-A' } as any);
    const b = await saveInvoice({ ...base, invoiceNumber: 'F-293-B' } as any);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    let guardadas = await lista('invoices.json');
    expect(guardadas.map((f) => f.id)).toEqual(expect.arrayContaining([a.id, b.id]));

    expect((await deleteInvoice(a.id!)).success).toBe(true);
    guardadas = await lista('invoices.json');
    expect(guardadas.find((f) => f.id === a.id)).toBeUndefined();
    expect(guardadas.find((f) => f.id === b.id)).toBeDefined();

    const reset = await resetAllInvoices();
    expect(reset.success).toBe(true);
    const { dbAdmin } = await import('@/lib/firebase/server');
    const quedan = await dbAdmin!.collection('facturas').get();
    expect(quedan.size).toBe(0);
  });

  it('seña: registerBookingDeposit deja el recibo y el cobro en el presupuesto de la fiesta', async () => {
    await writeData('servicios-empresa.json', [], undefined, { skipAutoBackup: true }).catch(() => undefined);
    const pres = await savePresupuesto({
      clienteNombre: 'Cliente sena 293', eventoTipo: 'Boda', eventoFecha: '2031-02-10',
      invitadosCantidad: 10, invitadosAdultos: 10, invitadosNinos: 0, invitadosAdolescentes: 0,
      itemsPresupuestados: [{
        idServicioCatalogo: 'x', nombreServicio: 'Item sena', cantidad: 1, precioUnitario: 0,
        precioUnitarioPresupuesto: 5000, costoTotalItem: 5000, tipoItem: 'Servicio', calculationMethod: 'fijo',
      }],
      costoTotalEstimado: 5000, totalConDescuento: 5000, estado: 'Enviado', timestamp: new Date().toISOString(),
    } as any);
    expect(pres.success).toBe(true);
    const fiestaId = `fiesta-sena-293-${Date.now()}`;
    await writeData(`fiestas/${fiestaId}.json`, {
      id: fiestaId, presupuestoId: pres.id, estado: 'En Planificación',
      configuracion: { nombreEvento: 'Boda de Cliente sena 293', clienteNombre: 'Cliente sena 293', fechaEvento: '2031-02-10' },
    }, undefined, { skipAutoBackup: true });

    const r = await registerBookingDeposit({ fiestaId, amount: 1000, method: 'Efectivo', date: hoy });
    expect(r.error).toBeUndefined();
    expect(r.success).toBe(true);
    const facturas = await lista('invoices.json');
    const recibo = facturas.find((f) => f.id === r.invoiceId);
    expect(recibo?.totalAmount).toBe(1000);
    const p = (await lista<any>('presupuestos.json')).find((x) => x.id === pres.id);
    expect((p.pagosCliente || []).reduce((s: number, x: any) => s + x.monto, 0)).toBe(1000);
  });

  it('salones: saveSalon, addSalonPago, deleteSalonPago, deleteSalonFoto y deleteSalon', async () => {
    const creado = await saveSalon({ nombre: 'Salon 293', capacidad: 100, fotos: ['https://ejemplo.com/a.jpg', 'https://ejemplo.com/b.jpg'] } as any);
    expect(creado.success).toBe(true);
    const id = creado.salon!.id;
    let s = (await lista<any>('salones.json')).find((x) => x.id === id);
    expect(s.nombre).toBe('Salon 293');

    const pago = await addSalonPago(id, { fecha: hoy, monto: 700, concepto: 'Alquiler' } as any);
    expect(pago.success).toBe(true);
    s = (await lista<any>('salones.json')).find((x) => x.id === id);
    expect(s.pagos).toHaveLength(1);
    expect(s.pagos[0].monto).toBe(700);

    expect((await deleteSalonPago(id, pago.pago!.id)).success).toBe(true);
    s = (await lista<any>('salones.json')).find((x) => x.id === id);
    expect(s.pagos || []).toHaveLength(0);

    expect((await deleteSalonFoto(id, 'https://ejemplo.com/a.jpg')).success).toBe(true);
    s = (await lista<any>('salones.json')).find((x) => x.id === id);
    expect(s.fotos).toEqual(['https://ejemplo.com/b.jpg']);

    expect((await deleteSalon(id)).success).toBe(true);
    expect((await lista<any>('salones.json')).find((x) => x.id === id)).toBeUndefined();
  });
});

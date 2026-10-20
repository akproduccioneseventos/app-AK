/** @jest-environment node */
import { randomUUID } from 'crypto';
import type { Presupuesto } from '@/types/presupuesto';

const mockRecords = new Map<string, any>();
let mockQueue: Promise<unknown> = Promise.resolve();
let mockFail = false;
let mockPerfil = 'dueno';
const copy = (v: any) => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const mockDb = {
  collection: (name: string) => ({
    doc: (id: string) => ({ path: name + '/' + id, id }),
    select: () => ({ query: name }),
  }),
  runTransaction: (fn: any) => {
    const task = mockQueue.then(async () => {
      if (mockFail) throw new Error('base caida');
      const writes: Array<[string, any]> = [];
      const result = await fn({
        get: async (ref: any) => ref.query
          ? { docs: [...mockRecords].filter(([p]) => p.startsWith(ref.query + '/')).map(([,v]) => ({ data: () => copy(v) })) }
          : { exists: mockRecords.has(ref.path), data: () => copy(mockRecords.get(ref.path)) },
        create: (ref: any, value: any) => { if (mockRecords.has(ref.path)) throw new Error('ya existe'); writes.push([ref.path,copy(value)]); },
        set: (ref: any, value: any) => writes.push([ref.path,copy(value)]),
      });
      for (const [p,v] of writes) mockRecords.set(p,v);
      return result;
    });
    mockQueue = task.catch(() => undefined); return task;
  },
};
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: mockDb }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string,fallback: any) => file === 'presupuestos.json'
    ? [...mockRecords].filter(([p])=>p.startsWith('presupuestos/')).map(([,v])=>copy(v)) : fallback),
  writeData: jest.fn(),
  mutateDataItem: jest.fn(async (_f: string,c: string,id: string,fn: any) => {
  const key=c+'/'+id, current=mockRecords.get(key); if (!current) return null;
  const next=fn(copy(current)); if (next) mockRecords.set(key,copy(next)); return next;
}) }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({success:true,user:{userId:'actor',email:'qa@example.test',perfil:mockPerfil}})) }));
jest.mock('@/app/actions/crm', () => ({ findLeadByBudgetOrCreate: jest.fn(async ()=>({lead:{id:'lead1'}})), getCrmStages:jest.fn(async()=>[]), moveCrmLead:jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({createNotification:jest.fn(async()=>undefined)}));
// Los costos que recalcula el servidor se guardan por costos-interno (orden 183): mismo destino que
// el updateFiestaPartial de mentira de esta prueba.
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: async (id: string, costos: unknown) => {
    const r = await require('@/app/actions/fiesta/fiesta.actions').updateFiestaPartial(id, { gestionCostos: costos });
    return r?.success ? { success: true, updatedData: costos } : { success: false, error: r?.error };
  },
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({getAllFiestas:jest.fn(async()=>[]),saveFiesta:jest.fn(),syncFiestaFromBudget:jest.fn()}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({syncLaundryCosts:jest.fn()}));
jest.mock('@/app/actions/servicios-empresa', () => ({getServiciosEmpresa:jest.fn(async()=>[])}));
jest.mock('@/app/actions/menus-catering', () => ({getMenus:jest.fn(async()=>[])}));
jest.mock('@/lib/whatsapp-automation-engine', () => ({triggerWhatsAppAutomation:jest.fn(async()=>undefined)}));
jest.mock('@/lib/firebase-sync', () => ({forceDeleteDocFromFirestore:jest.fn(),forceDeleteCollectionFromFirestore:jest.fn()}));
import { prepararSolicitudGuardado, crearPresupuestoSolicitado, confirmarSeguimientoSolicitud } from '@/lib/budget/solicitud-guardado';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { findLeadByBudgetOrCreate } from '@/app/actions/crm';
import { createNotification } from '@/lib/notifications/create-notification';
import { writeData } from '@/lib/data-service';
const budget = { id:'ignored', clienteNombre:'Familia QA', clienteContacto:'099000117', itemsPresupuestados:[], estado:'Borrador', totalConDescuento:850 } as unknown as Presupuesto;
beforeEach(() => { mockRecords.clear(); mockQueue=Promise.resolve(); mockFail=false; mockPerfil='dueno'; jest.clearAllMocks(); });

it('valida clave y actor antes de escribir', () => {
  expect(() => prepararSolicitudGuardado('../x','actor',budget)).toThrow();
  expect(() => prepararSolicitudGuardado(randomUUID(),'',budget)).toThrow();
});
it('timestamp y orden de claves no cambian el intento; actores diferentes no acceden al mismo recurso', () => {
  const key=randomUUID();
  const a=prepararSolicitudGuardado(key,'a',{nombre:'QA',total:850,timestamp:'ayer'});
  const b=prepararSolicitudGuardado(key,'a',{timestamp:'hoy',total:850,nombre:'QA'});
  expect(a).toEqual(b); expect(prepararSolicitudGuardado(key,'b',budget).id).not.toBe(a.id);
});
it('dos consumidores simultaneos de la misma operacion crean uno y reutilizan el ID', async () => {
  const op=prepararSolicitudGuardado(randomUUID(),'a',budget);
  const results=await Promise.all([crearPresupuestoSolicitado(budget,op),crearPresupuestoSolicitado(budget,op)]);
  expect(results.map(r=>r.reused)).toEqual([false,true]);
  expect(results.map(r=>r.presupuesto.id)).toEqual([op.id,op.id]);
  expect(mockRecords.get('commercial_counters/presupuestos').lastNumber).toBe(1);
  expect([...mockRecords.keys()].filter(k=>k.startsWith('presupuestos/'))).toHaveLength(1);
});
it('nueva cotizacion legitima con mismo telefono y precios conserva dos documentos y numeros', async () => {
  mockRecords.set('presupuestos/legacy',{numero:19});
  const a=await crearPresupuestoSolicitado(budget,prepararSolicitudGuardado(randomUUID(),'a',budget));
  const b=await crearPresupuestoSolicitado(budget,prepararSolicitudGuardado(randomUUID(),'a',budget));
  expect(a.presupuesto.id).not.toBe(b.presupuesto.id);
  expect([a.presupuesto.numero,b.presupuesto.numero]).toEqual([20,21]);
});
it('misma clave con carga diferente rechaza sin sobrescribir ni aumentar el contador', async () => {
  const key=randomUUID(), first=prepararSolicitudGuardado(key,'a',budget);
  await crearPresupuestoSolicitado(budget,first);
  await expect(crearPresupuestoSolicitado({...budget,totalConDescuento:1200},prepararSolicitudGuardado(key,'a',{...budget,totalConDescuento:1200}))).rejects.toThrow('otra cotizacion');
  expect(mockRecords.get('presupuestos/'+first.id).totalConDescuento).toBe(850);
  expect(mockRecords.get('commercial_counters/presupuestos').lastNumber).toBe(1);
});
it('fallo de base no usa JSON ni crea otro identificador; recuperacion conserva el intento', async () => {
  const op=prepararSolicitudGuardado(randomUUID(),'a',budget); mockFail=true;
  await expect(crearPresupuestoSolicitado(budget,op)).rejects.toThrow('base caida'); expect(mockRecords.size).toBe(0);
  mockFail=false; expect((await crearPresupuestoSolicitado(budget,op)).presupuesto.id).toBe(op.id);
});
it('confirmar CRM modifica solo su vinculo y conserva cobros concurrentes; retry no los pisa', async () => {
  const op=prepararSolicitudGuardado(randomUUID(),'a',budget); await crearPresupuestoSolicitado(budget,op);
  const ref=mockRecords.get('presupuestos/'+op.id); ref.pagosCliente=[{id:'p1',monto:20}]; ref.estado='Aceptado';
  await confirmarSeguimientoSolicitud(op.id,'lead1');
  const repeated=await crearPresupuestoSolicitado(budget,op);
  expect(repeated.seguimientoConfirmado).toBe(true); expect(repeated.presupuesto.leadId).toBe('lead1');
  expect(repeated.presupuesto.pagosCliente).toEqual([{id:'p1',monto:20}]); expect(repeated.presupuesto.estado).toBe('Aceptado');
});
it('operacion guardada con CRM incompleto se distingue sin inventar la confirmacion', async () => {
  const op=prepararSolicitudGuardado(randomUUID(),'a',budget); await crearPresupuestoSolicitado(budget,op);
  expect((await crearPresupuestoSolicitado(budget,op)).seguimientoConfirmado).toBe(false);
});

const input: any = { ...budget, invitadosCantidad:100, invitadosAdultos:100, invitadosNinos:0, invitadosAdolescentes:0,
  eventoTipo:'XV',eventoFecha:'2027-08-08',salonFiestas:'QA',timestamp:'ayer',descuentoTipo:'porcentaje',descuentoValor:15,
  itemsPresupuestados:[{idServicioCatalogo:'dj',nombreServicio:'DJ',cantidad:1,precioUnitario:1000,precioUnitarioPresupuesto:1000,costoTotalItem:1000,calculationMethod:'fijo',precioBase:1000}] };
it('consumidor savePresupuesto reutiliza ID/numero sin repetir CRM, notificacion ni snapshot; nueva clave conserva otra propuesta', async () => {
  const operationId=randomUUID();
  const a=await savePresupuesto(input,{operationId});
  const b=await savePresupuesto({...input,timestamp:'hoy'},{operationId});
  expect(a.success).toBe(true); expect(b.id).toBe(a.id); expect(b.presupuesto?.numero).toBe(a.presupuesto?.numero);
  expect(a.presupuesto?.totalConDescuento).toBe(850); expect(findLeadByBudgetOrCreate).toHaveBeenCalledTimes(1);
  expect(createNotification).toHaveBeenCalledTimes(1); expect(writeData).not.toHaveBeenCalled();
  const c=await savePresupuesto(input,{operationId:randomUUID()});
  expect(c.id).not.toBe(a.id); expect(c.presupuesto?.numero).toBe(2);
});
it('permiso se verifica antes de clave/transaccion', async () => {
  mockPerfil='personal'; expect((await savePresupuesto(input,{operationId:randomUUID()})).success).toBe(false);
  expect(mockRecords.size).toBe(0); expect(findLeadByBudgetOrCreate).not.toHaveBeenCalled();
});
it('operador no crea cobros ni lee cobros que contabilidad agrego entre intentos', async () => {
  mockPerfil='operador'; const operationId=randomUUID();
  const unsafe={...input,estado:'Facturado',pagosCliente:[{id:'hack',monto:999}]};
  const first=await savePresupuesto(unsafe,{operationId}); expect(first.success).toBe(true);
  const stored=mockRecords.get('presupuestos/'+first.id); expect(stored.pagosCliente??[]).toEqual([]); expect(stored.estado).toBe('Enviado');
  stored.pagosCliente=[{id:'p1',monto:20}];
  const repeated=await savePresupuesto(unsafe,{operationId}); expect(repeated.presupuesto?.pagosCliente).toEqual([]);
  expect(mockRecords.get('presupuestos/'+first.id).pagosCliente).toEqual([{id:'p1',monto:20}]);
});
it('fallo de CRM mantiene presupuesto y aviso, sin crear un segundo prospecto en retry', async () => {
  jest.mocked(findLeadByBudgetOrCreate).mockRejectedValueOnce(new Error('CRM caido'));
  const operationId=randomUUID();
  const a=await savePresupuesto(input,{operationId}), b=await savePresupuesto(input,{operationId});
  expect(a.success).toBe(true); expect(a.avisoCrm).toBeTruthy(); expect(b.id).toBe(a.id); expect(b.avisoCrm).toBeTruthy();
  expect(findLeadByBudgetOrCreate).toHaveBeenCalledTimes(1);
});
it('respuesta del primer guardado tampoco expone un cobro agregado durante la confirmacion CRM', async () => {
  mockPerfil='operador';
  jest.mocked(findLeadByBudgetOrCreate).mockImplementationOnce(async () => {
    const key=[...mockRecords.keys()].find(k=>k.startsWith('presupuestos/'))!;
    mockRecords.get(key).pagosCliente=[{id:'p-concurrente',monto:80}];
    return {lead:{id:'lead1'}} as any;
  });
  const result=await savePresupuesto(input,{operationId:randomUUID()});
  expect(result.success).toBe(true); expect(result.presupuesto?.pagosCliente??[]).toEqual([]);
  expect(mockRecords.get('presupuestos/'+result.id).pagosCliente).toEqual([{id:'p-concurrente',monto:80}]);
});
it('notificacion usa numero confirmado por transaccion, no maximo leido antes', async () => {
  mockRecords.set('commercial_counters/presupuestos',{lastNumber:99});
  const result=await savePresupuesto(input,{operationId:randomUUID()});
  expect(result.presupuesto?.numero).toBe(100);
  expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({mensaje:expect.stringContaining('#100')}));
});

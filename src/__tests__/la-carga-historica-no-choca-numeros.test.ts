/** @jest-environment node */
// Sonda 743 de Codex (C6): dos cargas históricas distintas cuyo intento termina igual no chocan en el número
// de factura, y el reintento de la misma carga no crea otra. Copiada sin cambiar sus aserciones.

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
  getCrmStages: jest.fn().mockResolvedValue([]),
  moveCrmLead: jest.fn(),
}));

jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn(),
}));

jest.mock('@/lib/firebase-sync', () => ({
  isFirebaseAvailable: jest.fn().mockReturnValue(false),
  forceDeleteDocFromFirestore: jest.fn(),
  forceDeleteCollectionFromFirestore: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const almacen: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return {
      valor: guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado)),
      huboFalla: false,
    };
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = JSON.parse(JSON.stringify(datos));
  }),
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    const lista = almacen[archivo] || [];
    if (lista.some((x: any) => x.id === id)) throw new Error('ALREADY_EXISTS');
    lista.push(JSON.parse(JSON.stringify(item)));
    almacen[archivo] = lista;
  }),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (x: any) => any) => {
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return null;
    const nuevo = cambiar(JSON.parse(JSON.stringify(lista[indice])));
    if (!nuevo) return null;
    lista[indice] = JSON.parse(JSON.stringify(nuevo));
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

let shouldFailSaveInvoice = false;

jest.mock('@/app/actions/invoices', () => {
  const actual = jest.requireActual('@/app/actions/invoices');
  return {
    ...actual,
    saveInvoice: jest.fn(async (...args: any[]) => {
      if (shouldFailSaveInvoice) {
        throw new Error('Fallo de red simulado al guardar factura');
      }
      return actual.saveInvoice(...args);
    }),
  };
});

import { processHistoricRecord } from '@/app/actions/historicos';


import fsSync from 'fs';
import {getInvoicesByPresupuestoId} from '@/app/actions/invoices';
const obs:any[]=[];
beforeEach(()=>{for(const k of Object.keys(almacen))delete almacen[k];shouldFailSaveInvoice=false;});
function form(id:string,name:string,amount:number){const fd=new FormData();fd.set('idIntento',id);fd.set('clienteNombre',name);fd.set('eventoFecha','2025-10-15T00:00:00.000Z');fd.set('montoTotal',String(amount));return fd;}
test('control dos cargas deliberadas con sufijos distintos conservan dos facturas',async()=>{const a=await processHistoricRecord(form('carga-A-11111','A739',1000));const b=await processHistoricRecord(form('carga-B-22222','B739',2000));obs.push({case:'different-suffix',a,b,invoices:almacen['invoices.json'],fiestas:Object.keys(almacen).filter(k=>k.startsWith('fiestas/'))});expect(a.success).toBe(true);expect(b.success).toBe(true);expect(almacen['invoices.json']).toHaveLength(2);});
test('dos cargas distintas con iguales cinco caracteres finales NO comparten factura',async()=>{const a=await processHistoricRecord(form('carga-A-abcde','A739',1000));const b=await processHistoricRecord(form('carga-B-abcde','B739',2000));obs.push({case:'same-suffix',a,b,invoices:almacen['invoices.json'],budgets:almacen['presupuestos.json'],fiestas:Object.fromEntries(Object.entries(almacen).filter(([k])=>k.startsWith('fiestas/')))});expect(a.success).toBe(true);expect(b.success).toBe(true);expect(almacen['invoices.json']).toHaveLength(2);});
test('helper no devuelve factura cuyo presupuestoId explicito pertenece a otra carga',async()=>{almacen['invoices.json']=[{id:'inv-other',invoiceNumber:'HIST-abcde',sourcePresupuestoId:'pres_hist_carga-A-abcde',payments:[{amount:1000}]}];const result=await getInvoicesByPresupuestoId('pres_hist_carga-B-abcde');obs.push({case:'foreign-budget-id',result});expect(result).toEqual([]);});


test('el reintento de la misma carga no crea otra factura', async () => {
  await processHistoricRecord(form('carga-R-zzzzz', 'R739', 1500));
  await processHistoricRecord(form('carga-R-zzzzz', 'R739', 1500));
  expect(almacen['invoices.json']).toHaveLength(1);
});

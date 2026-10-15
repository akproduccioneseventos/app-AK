/** @jest-environment node */
import fs from 'fs';
const stored: any[]=[];
jest.mock('@/lib/auth/require-session',()=>({requireAppSession:jest.fn(),requirePermiso:jest.fn(async()=>({ok:true}))}));
jest.mock('@/lib/security/portal-session',()=>({verifyPortalSession:jest.fn(async()=>true)}));
jest.mock('next/headers',()=>({headers:jest.fn(async()=>new Map())}));
jest.mock('@/lib/firebase/storage',()=>({uploadToStorage:jest.fn(async()=>undefined),deleteFromStorage:jest.fn()}));
jest.mock('@/lib/notifications/create-notification',()=>({createNotification:jest.fn(async()=>undefined)}));
jest.mock('@/lib/invoices/leer-facturas',()=>({leerFacturasSinGuardia:jest.fn(async()=>[])}));
jest.mock('@/app/actions/presupuestos',()=>({getPresupuestoById:jest.fn(async()=>null)}));
jest.mock('@/app/actions/invoices',()=>({registerBookingDeposit:jest.fn()}));
jest.mock('@/app/actions/fiesta/fiesta.actions',()=>({
  getFiestaById:jest.fn(async()=>({id:'qa128-contrato',configuracion:{nombreEvento:'Contrato ficticio QA128'},estado:'Presupuestada',tareas:[]})),
  saveFiesta:jest.fn(async(value:any)=>{stored.push(JSON.parse(JSON.stringify(value)));return {success:true};}),
}));
import {registerBookingDeposit} from '@/app/actions/invoices';
import {uploadPhysicalContract} from '@/app/actions/fiesta/documentos.actions';

const form=()=>({get:(name:string)=>name==='fiestaId'?'qa128-contrato':name==='file'?{
  name:'qa128.pdf',type:'application/pdf',arrayBuffer:async()=>new Uint8Array([37,80,68,70,45]).buffer,
}:null} as unknown as FormData);
beforeEach(()=>{stored.length=0;jest.clearAllMocks();});

test('control: si recibo y contrato se guardan, quedan enlazados y devuelve exito',async()=>{
  (registerBookingDeposit as jest.Mock).mockResolvedValue({success:true,invoiceId:'qa128-recibo'});
  const result=await uploadPhysicalContract(form());
  expect(result.success).toBe(true);
  expect(stored[0].invoiceIds).toEqual(['qa128-recibo']);
  expect(stored[0].estado).toBe('Contratada');
});

test('si falla el recibo automatico, informa el resultado parcial sin exigir descontratar',async()=>{
  (registerBookingDeposit as jest.Mock).mockResolvedValue({success:false,error:'QA128 no se pudo guardar el recibo'});
  const result:any=await uploadPhysicalContract(form());
  fs.writeFileSync('docs/evidencias/128-contrato-recibo-parcial-observado.json',JSON.stringify({
    applicationSourceSha:'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
    type:'REAL_ACTION_WITH_STORAGE_DATA_AUTH_AND_INVOICE_DOUBLES_NOT_NATIVE_BROWSER',
    failureInjected:'registerBookingDeposit returned success:false',result,
    eventState:stored[0]?.estado,invoiceIds:stored[0]?.invoiceIds||[],
    expected:'Error o advertencia explicita de recibo pendiente; no se exige revertir contrato ni cambiar politica de cobro',
    realMoneyTouched:false,
  },null,2)+'\n');
  expect(result.success===false||Boolean(result.warning)||result.partial===true).toBe(true);
});

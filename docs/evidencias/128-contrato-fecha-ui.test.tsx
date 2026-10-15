import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import fs from 'fs';

const toast=jest.fn();
const fiesta=()=>({id:'qa128-contrato',configuracion:{nombreEvento:'Fiesta ficticia QA128',fechaEvento:'2027-08-08',nombreLugar:'Salon ficticio'},contratoServicioTexto:'CONTRATO FICTICIO QA128. Sin reserva real.'});
jest.mock('next/navigation',()=>({useParams:()=>({fiestaId:'qa128-contrato'})}));
jest.mock('next/link',()=>({__esModule:true,default:({children}:any)=><a>{children}</a>}));
jest.mock('next/image',()=>({__esModule:true,default:()=>null}));
jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast})}));
jest.mock('@/components/legal/AvisoDeDatos',()=>({AvisoDeDatos:()=>null}));
jest.mock('@/lib/security/portal-session',()=>({verifyPortalSession:jest.fn(async()=>true)}));
jest.mock('@/lib/auth/require-session',()=>({requireAppSession:jest.fn(),requirePermiso:jest.fn(async()=>({ok:true}))}));
jest.mock('next/headers',()=>({headers:jest.fn(async()=>new Map())}));
jest.mock('@/lib/notifications/create-notification',()=>({createNotification:jest.fn(async()=>undefined)}));
jest.mock('@/lib/firebase/storage',()=>({uploadToStorage:jest.fn(),deleteFromStorage:jest.fn()}));
jest.mock('@/lib/invoices/leer-facturas',()=>({leerFacturasSinGuardia:jest.fn(async()=>[])}));
jest.mock('@/app/actions/presupuestos',()=>({getPresupuestoById:jest.fn(async()=>null)}));
jest.mock('@/app/actions/invoices',()=>({registerBookingDeposit:jest.fn()}));
jest.mock('@/app/actions/settings',()=>({getCompanyInfoPublica:jest.fn(async()=>({name:'Empresa ficticia QA128'}))}));
jest.mock('@/app/actions/fiesta/portal.actions',()=>({getFiestaForPortalSession:jest.fn(async()=>fiesta())}));
jest.mock('@/app/actions/fiesta/fiesta.actions',()=>({getFiestaById:jest.fn(async()=>fiesta()),saveFiesta:jest.fn(),updateFiestaPartial:jest.fn()}));
jest.mock('@/app/actions/fiesta-actual',()=>({
  getContractSigningSummary:(...args:unknown[])=>jest.requireActual('@/app/actions/fiesta/documentos.actions').getContractSigningSummary(...args),
  signContractDigitally:jest.fn(),
}));

import Page from '@/app/portal/[fiestaId]/contrato/page';
beforeAll(()=>Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{configurable:true,value:true}));
afterAll(()=>{Reflect.deleteProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT');});

test('el resumen real y la pantalla de contrato conservan el dia civil en Uruguay',async()=>{
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Montevideo');
  const host=document.body.appendChild(document.createElement('div')),root=createRoot(host);
  try {
    await act(async()=>{root.render(<Page/>);});
    expect(host.textContent).toContain('Resumen del Contrato');
    const label=Array.from(host.querySelectorAll('p')).find(p=>p.textContent==='Fecha del Evento');
    const observed=label?.nextElementSibling?.textContent;
    fs.writeFileSync('docs/evidencias/128-contrato-fecha-ui-observado.json',JSON.stringify({
      applicationSourceSha:'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
      type:'REAL_REACT_COMPONENT_AND_REAL_SUMMARY_ACTION_WITH_DATA_AUTH_DOUBLES_NOT_NATIVE_BROWSER',
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,input:fiesta().configuracion.fechaEvento,
      observed,expected:'08 de agosto de 2027',status:observed==='08 de agosto de 2027'?'PASS':'FAIL',realDataTouched:false
    },null,2)+'\n');
    expect(observed).toBe('08 de agosto de 2027');
  } finally {await act(async()=>root.unmount());host.remove();}
});

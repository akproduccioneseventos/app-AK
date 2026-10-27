/** @jest-environment node */
import fs from 'fs';
let actor:any={userId:'personal739',email:'p@qa.invalid',role:'user',perfil:'personal'};
const store:Record<string,any>={};
const copy=(x:any)=>JSON.parse(JSON.stringify(x));
jest.mock('@/lib/firebase/server',()=>({dbAdmin:null}));
jest.mock('@/lib/auth/session-token',()=>({verifySession:async()=>({success:true,user:actor})}));
jest.mock('@/lib/security/portal-session',()=>({verifyPortalSession:async()=>false}));
jest.mock('@/app/actions/empleados',()=>({getEmpleados:async()=>[{id:'op739',email:'op@qa.invalid'}]}));
jest.mock('@/lib/data-service',()=>({readData:async(p:string,d:any)=>store[p]===undefined?d:copy(store[p]),writeData:async(p:string,d:any)=>{store[p]=copy(d)},updateDataPartial:async()=>{}}));
jest.mock('@/lib/generic-json-store',()=>({mutarDocumentoConTransaccion:async(p:string,_d:any,fn:any)=>{const next=await fn(copy(store[p]));store[p]=copy(next);return copy(next);}}));
jest.mock('@/lib/fiesta/leer-fiestas',()=>({leerFiestasCrudas:async()=>[],leerHistorialCrudo:async()=>[]}));
import {actualizarFiesta} from '@/app/actions/fiesta/fiesta.actions';
const observations:any[]=[];
beforeEach(()=>{actor={userId:'personal739',email:'p@qa.invalid',role:'user',perfil:'personal'};store['fiestas/f739.json']={id:'f739',estado:'Cotizado',configuracion:{nombreEvento:'Evento ficticio739'},personalAsignado:[{empleadoId:'op739'}],clientPortalSettings:{enabled:true,accessKey:'FAKE-SECRET-739'},planDePagos:{cuotas:[{id:'c739',monto:1000,pagado:true,montoPagado:1000}]},musica:{preferencias:'Original'}};});
afterAll(()=>fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT!.replace('.json','-fiesta.json'),JSON.stringify(observations,null,2)));
test('control: personal no asignado sin opcion interna no escribe',async()=>{const result=await actualizarFiesta('f739',{planDePagos:{cuotas:[]} as any});observations.push({case:'personal-no-flag',result});expect(result.success).toBe(false);expect(store['fiestas/f739.json'].planDePagos.cuotas).toHaveLength(1);});
test('personal no asignado no debe poder elegir publicRsvp para vaciar cobros ni leer secretos',async()=>{const result=await actualizarFiesta('f739',{planDePagos:{cuotas:[]} as any},{publicRsvp:true});observations.push({case:'personal-flag',result,stored:copy(store['fiestas/f739.json'])});expect(result.success).toBe(false);expect(store['fiestas/f739.json'].planDePagos.cuotas).toHaveLength(1);});
test('operador asignado sin contabilidad no debe modificar plan ni recibir clave de cliente',async()=>{actor={userId:'op739',email:'op@qa.invalid',role:'user',perfil:'operador'};const result=await actualizarFiesta('f739',{planDePagos:{cuotas:[]} as any});observations.push({case:'assigned-operator',result,stored:copy(store['fiestas/f739.json'])});expect(store['fiestas/f739.json'].planDePagos.cuotas).toHaveLength(1);expect(result.updatedFiesta?.clientPortalSettings?.accessKey).toBeUndefined();});
test('control: dueno modifica musica en Cotizado',async()=>{actor={userId:'a',role:'admin',perfil:'dueno'};const result=await actualizarFiesta('f739',{musica:{preferencias:'Cambio'} as any});observations.push({case:'owner-cotizado',result});expect(result.success).toBe(true);expect(store['fiestas/f739.json'].musica.preferencias).toBe('Cambio');});
test('fiesta YA en Sena permite guardar musica sin cambiar estado',async()=>{actor={userId:'a',role:'admin',perfil:'dueno'};store['fiestas/f739.json'].estado='Seña';const result=await actualizarFiesta('f739',{musica:{preferencias:'Cambio'} as any});observations.push({case:'owner-already-sena',result});expect(result.success).toBe(true);expect(store['fiestas/f739.json'].estado).toBe('Seña');expect(store['fiestas/f739.json'].musica.preferencias).toBe('Cambio');});


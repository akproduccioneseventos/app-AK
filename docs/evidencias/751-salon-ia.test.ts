/** @jest-environment node */
import fs from 'fs';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
let base:any,portal=true,budget=true,saveFail=false,actions:any,calls=0,charge=0;
let barrier:Promise<void>|null=null,release:(()=>void)|null=null;
const copy=(v:any)=>JSON.parse(JSON.stringify(v));
const obs:any[]=[];
jest.mock('@/lib/firebase/server',()=>({dbAdmin:null}));
jest.mock('@/lib/auth/require-session',()=>({requireAppSession:async()=>({userId:'qa751',perfil:'dueno',role:'admin'})}));
jest.mock('@/lib/security/portal-session',()=>({verifyPortalSession:async()=>portal}));
jest.mock('@/lib/ai/foto-de-referencia',()=>({fotoDeReferenciaSegura:async()=>null}));
jest.mock('@/lib/ai/consumo-servidor',()=>({hayPresupuestoParaIA:async()=>budget,registrarConsumoIA:async()=>{charge++;}}));
jest.mock('@/lib/auth/equipo-de-la-fiesta',()=>({usuarioDelEquipo:async()=>null}));
jest.mock('@/lib/auth/event-access',()=>({requireEventPermission:async()=>({})}));
jest.mock('@/lib/fiesta/leer-fiestas',()=>({leerFiestasCrudas:async()=>[]}));
jest.mock('@/lib/fiesta/costos-interno',()=>({mutarCostosInterno:async()=>({success:true})}));
jest.mock('@/app/actions/fiesta/fiesta.actions',()=>({getFiestaById:async()=>copy(base),saveFiesta:async()=>({success:true}),updateFiestaPartial:async(_id:string,p:any)=>{if(saveFail)return {success:false,error:'No se pudo guardar.'};base={...base,...copy(p)};return {success:true,updatedData:copy(base)};}}));
beforeEach(async()=>{base={id:'qa751',configuracion:{nombreEvento:'Evento ficticio'},decoracion:{fotosGeneradasAi:[],paletaColores:{primary:'#ff0000'}}};portal=true;budget=true;saveFail=false;calls=0;charge=0;barrier=null;release=null;process.env.GEMINI_API_KEY='QA751-FICTIONAL-NOT-A-REAL-KEY';global.fetch=jest.fn(async(_url:any,opts:any)=>{calls++;if(barrier){if(calls===2)release?.();await barrier;}return {ok:true,json:async()=>({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:PNG}}]}}]})} as any;});await jest.isolateModulesAsync(async()=>{actions=require('@/app/actions/fiesta/decoracion.actions');});});
afterAll(()=>{delete process.env.GEMINI_API_KEY;fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT!,JSON.stringify(obs,null,2));});
test('control portal ajeno no llama proveedor ni consume',async()=>{portal=false;const r=await actions.generarFotoDelSalonDesdeElPortal('qa751');obs.push({case:'portal-denied',r,calls,charge});expect(r.success).toBe(false);expect(calls).toBe(0);expect(charge).toBe(0);});
test('resultado del generador REAL con protocolo local debe tener src utilizable',async()=>{const r=await actions.generarFotoDelSalonDesdeElPortal('qa751','data:image/png;base64,'+PNG);obs.push({case:'real-helper-return-format',r,stored:copy(base.decoracion.fotosGeneradasAi),calls,charge});expect(r.success).toBe(true);expect(calls).toBe(1);expect(charge).toBe(1);expect(r.imageUrl).toMatch(/^(data:image\/|https?:\/\/|\/media\/)/);});
test('control tope mensual bloqueado no llama al modelo',async()=>{budget=false;const r=await actions.generarFotoDelSalonDesdeElPortal('qa751');obs.push({case:'monthly-denied',r,calls,charge});expect(r.success).toBe(false);expect(calls).toBe(0);expect(charge).toBe(0);});
test('control fallo proveedor no guarda ni cuenta una imagen inexistente',async()=>{global.fetch=jest.fn(async()=>{calls++;throw Error('Fallo local de proveedor');});const r=await actions.generarFotoDelSalonDesdeElPortal('qa751');obs.push({case:'provider-fail',r,calls,charge,photos:base.decoracion.fotosGeneradasAi});expect(r.success).toBe(false);expect(base.decoracion.fotosGeneradasAi).toHaveLength(0);expect(charge).toBe(0);});
test('dos instancias con dos fotos existentes no deben gastar DOS generaciones por el ultimo cupo',async()=>{base.decoracion.fotosGeneradasAi=['/media/a.png','/media/b.png'];let other:any;await jest.isolateModulesAsync(async()=>{other=require('@/app/actions/fiesta/decoracion.actions');});barrier=new Promise(r=>{release=r;});const results=await Promise.all([actions.generarVisualizacionSalonAi('qa751',undefined,'data:image/png;base64,'+PNG),other.generarFotoDelSalonDesdeElPortal('qa751','data:image/png;base64,'+PNG)]);obs.push({case:'two-module-instances',results,calls,charge,stored:base.decoracion.fotosGeneradasAi,previousPaidPhotos:2});expect(calls).toBe(1);expect(charge).toBe(1);expect(results.filter((r:any)=>r.success)).toHaveLength(1);});
test('control una imagen realmente generada se cuenta aunque falle persistencia',async()=>{saveFail=true;const r=await actions.generarFotoDelSalonDesdeElPortal('qa751');obs.push({case:'save-fail',r,calls,charge,stored:base.decoracion.fotosGeneradasAi});expect(r.success).toBe(false);expect(charge).toBe(1);expect(base.decoracion.fotosGeneradasAi).toHaveLength(0);});


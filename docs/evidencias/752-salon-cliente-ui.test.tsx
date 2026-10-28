/** @jest-environment jsdom */
import React,{act} from 'react';
import {createRoot,Root} from 'react-dom/client';
import fs from 'fs';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const DATA='data:image/png;base64,'+PNG;
let ready=true,result:any;
const api=jest.fn(async(..._args:any[])=>result);
jest.mock('@/app/actions/fiesta/decoracion.actions',()=>({generarFotoDelSalonDesdeElPortal:(...args:any[])=>api(...args)}));
jest.mock('next/image',()=>({__esModule:true,default:({fill,unoptimized,...props}:any)=>React.createElement('img',props)}));
jest.mock('next/dynamic',()=>({__esModule:true,default:()=>function Scene(p:any){p.captureRef.current=ready?{captureScreenshot:()=>DATA}:null;return React.createElement('div',{'data-testid':'scene-local'});}}));
import {Salon3DClienteView} from '@/components/salon-3d/Salon3DClienteView';
let root:Root,container:HTMLDivElement;const obs:any[]=[];
const deco={salonElements:[{id:'table1',type:'mesa-redonda'}],fotosGeneradasAi:[]} as any;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;ready=true;result={success:false,error:'Se llegó al tope de IA del mes.'};api.mockClear();api.mockImplementation(async()=>result);jest.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>({}) as any);container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.restoreAllMocks();});
afterAll(()=>fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT!,JSON.stringify(obs,null,2)));
async function mount(photos:string[]=[]){await act(async()=>root.render(<Salon3DClienteView fiestaId="qa751" decoracion={deco} fotosAi={photos}/>));}
async function click(){const b=document.querySelector('[data-testid="btn-asi-va-a-quedar"]') as HTMLButtonElement;expect(b).not.toBeNull();await act(async()=>b.click());}
test('control captura lista se envia a la accion',async()=>{await mount();await click();obs.push({case:'capture-ready',args:api.mock.calls[0]});expect(api).toHaveBeenCalledWith('qa751',DATA);});
test('error devuelto por servidor debe ser visible al cliente',async()=>{await mount();await click();obs.push({case:'server-error',text:container.textContent,args:api.mock.calls});expect(container.textContent).toContain(result.error);});
test('excepcion de transporte debe dejar aviso visible',async()=>{api.mockImplementation(async()=>{throw Error('Corte local de red');});await mount();await click();obs.push({case:'transport-error',text:container.textContent});expect(container.textContent).toMatch(/No se pudo|error|intent[aá]/i);});
test('respuesta base64 real debe convertirse antes de imagen descarga o WhatsApp',async()=>{result={success:true,imageUrl:PNG};await mount();await click();const img=container.querySelector('[data-testid="seccion-foto-generada"] img')!;const dl=container.querySelector('[data-testid="btn-descargar-foto"]')!;const wa=container.querySelector('[data-testid="btn-whatsapp-foto"]')!;obs.push({case:'raw-format',src:img.getAttribute('src'),download:dl.getAttribute('href'),whatsapp:wa.getAttribute('href'),counter:container.querySelector('[data-testid="contador-fotos-restantes"]')?.textContent});expect(img.getAttribute('src')).toMatch(/^(data:image\/|https?:\/\/|\/media\/)/);});
test('sin escena lista no debe cobrarse una foto que ignora la distribucion3D',async()=>{ready=false;await mount();await click();obs.push({case:'capture-not-ready',args:api.mock.calls,text:container.textContent});expect(api).not.toHaveBeenCalled();});
test('control con tres fotos boton bloqueado y aviso de tope visible',async()=>{await mount(['/media/1.png','/media/2.png','/media/3.png']);const b=container.querySelector('[data-testid="btn-asi-va-a-quedar"]') as HTMLButtonElement;obs.push({case:'three-photos',disabled:b.disabled,text:container.textContent});expect(b.disabled).toBe(true);expect(container.textContent).toContain('Ya armaste tus 3 fotos');expect(api).not.toHaveBeenCalled();});


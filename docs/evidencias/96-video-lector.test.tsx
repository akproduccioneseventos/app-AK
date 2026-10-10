// @ts-nocheck -- Actual reader + actual page; only external SDK/chrome furniture mocked.
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
const mockList=jest.fn(),mockUpload=jest.fn(),mockToast=jest.fn();
const mockFiesta={id:'qa96_video',configuracion:{nombreEvento:'Evento ficticio96'},videoVida:{galleryEnabled:true,photoCount:2,photosUploaded:true}};
jest.mock('firebase-admin',()=>({__esModule:true,default:{apps:[{}],storage:()=>({bucket:()=>({getFiles:mockList})})}}));
jest.mock('@/app/actions/fiesta-actual',()=>({getFiestaById:jest.fn(async()=>mockFiesta)}));
jest.mock('@/app/actions/fiesta/fiesta.actions',()=>({saveFiesta:jest.fn()}));
jest.mock('@/lib/firebase/storage',()=>({uploadToStorage:(...args)=>mockUpload(...args),deleteFromStorage:jest.fn()}));
jest.mock('next/navigation',()=>({useParams:()=>({fiestaId:'qa96_video'})}));
jest.mock('next/image',()=>({__esModule:true,default:({src,alt})=><img src={src} alt={alt}/> }));
jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:mockToast})}));
jest.mock('@/components/company-logo',()=>({CompanyLogo:()=>null}));
jest.mock('@/components/public-footer',()=>({PublicFooter:()=>null}));
jest.mock('@/components/ayuda/VideoDeAyuda',()=>({VideoDeAyuda:()=>null}));
jest.mock('@/components/legal/AvisoDeDatos',()=>({AvisoDeDatos:()=>null}));
import VideoVidaPage from '@/app/video-vida/[fiestaId]/page';
import {getLifeStoryVideoPhotos} from '@/app/actions/fiesta/video-vida.actions';
const publicFile=n=>({name:'video-vida-photos/qa96_video/'+n+'.jpg',getMetadata:jest.fn(async()=>[{acl:[{entity:'allUsers'}]}])});
let root;
const text=()=>document.body.textContent||'';
const photo=()=>document.querySelector('img[alt="Foto 1"]');
async function mount(){await act(async()=>{root=createRoot(document.body.appendChild(document.createElement('div')));root.render(<VideoVidaPage/>);});}
async function wait(check){for(let i=0;i<60;i++){if(check())return;await act(async()=>new Promise(r=>setTimeout(r,50)));}throw new Error('QA DOM did not reach expected state: '+text());}
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;mockList.mockReset();mockUpload.mockReset();mockToast.mockReset();});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;document.body.replaceChildren();});
test('control sano: lector real devuelve la foto y pagina muestra un recuadro ocupado',async()=>{
  mockList.mockResolvedValue([[publicFile('01')]]);
  await mount();
  await wait(()=>text().includes('Tu Galer\u00eda (1 de 2)'));
  expect(photo().getAttribute('src')).toContain('/01.jpg');
  expect(mockList).toHaveBeenCalledTimes(1);
});
test('si Storage no responde la pagina informa fallo, no cero fotos',async()=>{
  mockList.mockRejectedValue(new Error('QA96: Storage temporalmente no disponible'));
  await mount();
  await wait(()=>text().includes('Tu Galer\u00eda (0 de 2)'));
  console.log('QA96_READ_FAILURE '+JSON.stringify({heading:'Tu Galer\u00eda (0 de 2)',
    errorVisible:text().includes('Error de Acceso'),uploadControls:document.querySelectorAll('input[type=file]').length}));
  expect(text().includes('Tu Galer\u00eda (0 de 2)')).toBe(false);
});
test('si falla una firma no hace pasar toda la lista como vacia',async()=>{
  const bad={name:'video-vida-photos/qa96_video/01.jpg',getMetadata:jest.fn(async()=>[{}]),
    getSignedUrl:jest.fn(async()=>{throw new Error('QA96: no se pudo firmar una URL');})};
  mockList.mockResolvedValue([[bad,publicFile('02')]]);
  const result=await getLifeStoryVideoPhotos('qa96_video');
  console.log('QA96_SIGN_FAILURE '+JSON.stringify({filesListed:2,publicReadable:1,result}));
  expect(result).not.toEqual([]);
});
test('reemplazo fallido conserva vista y contador de la foto anterior',async()=>{
  mockList.mockResolvedValue([[publicFile('01')]]);
  mockUpload.mockRejectedValue(new Error('QA96: subida rechazada antes de guardar'));
  await mount();
  await wait(()=>text().includes('Tu Galer\u00eda (1 de 2)'));
  const old=photo().getAttribute('src');
  const file=new File(['fakebytes'],'new.jpg',{type:'image/jpeg'});
  file.arrayBuffer=async()=>new Uint8Array([1,2,3]).buffer;
  const input=document.querySelector('#upload-1');Object.defineProperty(input,'files',{configurable:true,value:[file]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
  await wait(()=>mockToast.mock.calls.some(([entry])=>entry.title==='Error al subir'));
  expect(mockUpload).toHaveBeenCalledTimes(1);
  expect(photo().getAttribute('src')).toBe(old);
  expect(text().includes('Tu Galer\u00eda (1 de 2)')).toBe(true);
});

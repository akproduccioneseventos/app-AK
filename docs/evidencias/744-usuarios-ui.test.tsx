/** @jest-environment jsdom */
import React,{act} from 'react';
import {createRoot,Root} from 'react-dom/client';
import fs from 'fs';
const save=jest.fn(async(..._args:any[])=>({success:true}));const toast=jest.fn();
jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast})}));
jest.mock('@/app/actions/auth',()=>({listUsers:async()=>({success:true,users:[{id:'u739',email:'staff@qa.invalid',role:'user',perfil:'secretaria',modules:['crm'],hasSecurityQuestions:true,createdAt:'2026-10-27'}]}),createUser:jest.fn(),deleteUser:jest.fn(),updateUserModules:(...args:any[])=>save(...args),adminResetUserPassword:jest.fn()}));
import AdminUsuariosPage from '@/app/(app)/admin/usuarios/page';
let root:Root,container:HTMLDivElement;const obs:any[]=[];
beforeEach(async()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;save.mockClear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);await act(async()=>root.render(<AdminUsuariosPage/>));});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
afterAll(()=>fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT!.replace('.json','-ui.json'),JSON.stringify(obs,null,2)));
function button(text:string){const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim()===text);if(!b)throw Error('Boton no encontrado '+text);return b;}
async function open(){await act(async()=>button('Permisos').click());expect(document.querySelector('[role="dialog"]')).not.toBeNull();}
test('orden247 la pantalla no debe ofrecer casillas de modulos sin efecto de permiso',async()=>{await open();const boxes=document.querySelectorAll('[id^="edit-mod-"]');obs.push({case:'legacy-controls',count:boxes.length,ids:[...boxes].map(e=>e.id),profileLine:document.body.textContent?.includes('Lo que ve cada persona depende de su perfil')});expect(boxes.length).toBe(0);});
test('si se ofrecen casillas editables, no debe descartarse silenciosamente el cambio',async()=>{await open();const box=document.getElementById('edit-mod-contabilidad')!;expect(box).not.toBeNull();await act(async()=>box.click());expect(box.getAttribute('data-state')).toBe('checked');await act(async()=>button('Guardar Cambios').click());expect(save).toHaveBeenCalled();obs.push({case:'edited-module-save',args:save.mock.calls[0]});expect(save.mock.calls[0][1]).toEqual(expect.arrayContaining(['crm','contabilidad']));});


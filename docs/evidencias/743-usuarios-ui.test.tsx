/** @jest-environment jsdom */
import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
const save=jest.fn(async()=>({success:true}));const toast=jest.fn();
jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast})}));
jest.mock('@/app/actions/auth',()=>({listUsers:async()=>({success:true,users:[{id:'u739',email:'staff@qa.invalid',role:'user',perfil:'secretaria',modules:['crm'],hasSecurityQuestions:true,createdAt:'2026-10-27'}]}),createUser:jest.fn(),deleteUser:jest.fn(),updateUserModules:(...args:any[])=>save(...args),adminResetUserPassword:jest.fn()}));
import AdminUsuariosPage from '@/app/(app)/admin/usuarios/page';
test('orden247: la edicion no debe ofrecer casillas de modulos que no deciden los permisos',async()=>{render(<AdminUsuariosPage/>);fireEvent.click(await screen.findByRole('button',{name:/Permisos$/}));await screen.findByRole('dialog');expect(document.querySelector('#edit-mod-crm')).toBeNull();});
test('si el formulario mantiene la casilla visible, no debe ignorar lo editado al guardar',async()=>{render(<AdminUsuariosPage/>);fireEvent.click(await screen.findByRole('button',{name:/Permisos$/}));await screen.findByRole('dialog');const box=document.querySelector('#edit-mod-contabilidad') as HTMLElement;expect(box).not.toBeNull();fireEvent.click(box);expect(box.getAttribute('data-state')).toBe('checked');fireEvent.click(screen.getByRole('button',{name:'Guardar Cambios'}));await waitFor(()=>expect(save).toHaveBeenCalled());expect(save.mock.calls[0][1]).toEqual(expect.arrayContaining(['crm','contabilidad']));});


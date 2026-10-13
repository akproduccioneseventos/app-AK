/** @jest-environment node */
import { clavePresupuestoChat } from '@/lib/multiagent/intento-presupuesto';
import { prepararSolicitudGuardado } from '@/lib/budget/solicitud-guardado';

const requestId='01234567-89ab-4cde-8f01-23456789abcd';
it('un reintento conserva clave UUID pero otro pedido u otro presupuesto no',()=>{
  const key=clavePresupuestoChat(requestId,1);
  expect(key).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
  expect(clavePresupuestoChat(requestId.toUpperCase(),1)).toBe(key);
  expect(clavePresupuestoChat(requestId,2)).not.toBe(key);
  expect(clavePresupuestoChat('01234567-89ab-4cde-8f01-23456789abce',1)).not.toBe(key);
});
it.each([undefined,'','../x','01234567-89ab-1cde-8f01-23456789abcd'])('identidad invalida %s no genera clave financiera',id=>{
  expect(()=>clavePresupuestoChat(id,1)).toThrow('identificar');
});
it.each([0,-1,1.5,NaN])('ordinal invalido %s no genera clave',ordinal=>{
  expect(()=>clavePresupuestoChat(requestId,ordinal)).toThrow();
});
it('clave del chat se liga al actor y otra carga no puede reutilizar su huella',()=>{
  const key=clavePresupuestoChat(requestId,1),data={clienteNombre:'QA',clienteContacto:'099000121',total:1000};
  const first=prepararSolicitudGuardado(key,'actor-a',data);
  expect(prepararSolicitudGuardado(key,'actor-b',data).id).not.toBe(first.id);
  expect(prepararSolicitudGuardado(key,'actor-a',{...data,total:2000}).cargaHash).not.toBe(first.cargaHash);
});

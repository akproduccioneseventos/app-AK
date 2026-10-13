/** @jest-environment node */
import { webcrypto } from 'crypto';
import { obtenerIntentoConfigurador, terminarIntentoConfigurador, obtenerIntentoPresupuestoManual, terminarIntentoPresupuestoManual } from '@/lib/budget/intento-configurador';
const mockStorage = new Map<string,string>();
beforeEach(() => {
  mockStorage.clear();
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{
    getItem:(k:string)=>mockStorage.get(k) || null,
    setItem:(k:string,v:string)=>{mockStorage.set(k,v);}, removeItem:(k:string)=>{mockStorage.delete(k);},
  }});
});
const data={clienteNombre:'QA',clienteContacto:'099000117',total:850};
it('reintento y timestamp nuevo mantienen clave sin almacenar nombre ni telefono', async () => {
  const a=await obtenerIntentoConfigurador({...data,timestamp:'ayer'});
  expect(await obtenerIntentoConfigurador({...data,timestamp:'hoy'})).toBe(a);
  expect([...mockStorage.values()].join()).not.toContain('099000117'); expect([...mockStorage.values()].join()).not.toContain('clienteNombre');
});
it('recarga del modulo mantiene la operacion en sessionStorage', async () => {
  const id=await obtenerIntentoConfigurador(data);
  jest.resetModules(); const reloaded=await import('@/lib/budget/intento-configurador');
  expect(await reloaded.obtenerIntentoConfigurador(data)).toBe(id);
});
it('tras confirmar se puede crear otro presupuesto con exactamente los mismos datos', async () => {
  const id=await obtenerIntentoConfigurador(data); terminarIntentoConfigurador();
  expect(await obtenerIntentoConfigurador(data)).not.toBe(id);
});
it('cambiar deliberadamente cotizacion genera otra operacion', async () => {
  const id=await obtenerIntentoConfigurador(data);
  expect(await obtenerIntentoConfigurador({...data,total:1200})).not.toBe(id);
});
it('almacenamiento no disponible impide preparar un envio inseguro', async () => {
  sessionStorage.setItem=()=>{throw new Error('storage bloqueado');};
  await expect(obtenerIntentoConfigurador(data)).rejects.toThrow('storage bloqueado');
});
it('manual conserva su intento tras error y recarga sin pisar el configurador', async () => {
  const configurador = await obtenerIntentoConfigurador(data);
  const manual = await obtenerIntentoPresupuestoManual({...data,timestamp:'ayer'});
  expect(manual).not.toBe(configurador);
  jest.resetModules(); const reloaded=await import('@/lib/budget/intento-configurador');
  expect(await reloaded.obtenerIntentoPresupuestoManual({...data,timestamp:'hoy'})).toBe(manual);
  expect(await obtenerIntentoConfigurador(data)).toBe(configurador);
  terminarIntentoPresupuestoManual();
  expect(await obtenerIntentoPresupuestoManual(data)).not.toBe(manual);
  expect(await obtenerIntentoConfigurador(data)).toBe(configurador);
});
it('manual cambia clave para otra carga o lead, sin deduplicar por telefono', async () => {
  const manual = await obtenerIntentoPresupuestoManual({...data,leadId:'lead-a'});
  expect(await obtenerIntentoPresupuestoManual({...data,leadId:'lead-b'})).not.toBe(manual);
  expect(await obtenerIntentoPresupuestoManual({...data,total:1200,leadId:'lead-b'})).not.toBe(manual);
  expect([...mockStorage.values()].join()).not.toContain('099000117');
});

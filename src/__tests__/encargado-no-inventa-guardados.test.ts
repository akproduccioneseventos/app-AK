import { ejecutarEncargado } from '@/lib/multiagent/encargado';
import { confirmAndSaveAssistantBudget } from '@/lib/multiagent/assistant-crm-actions';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { savePresupuesto, getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import type { Presupuesto } from '@/types/presupuesto';

jest.mock('@/ai/genkit',()=>({generateWithGeminiFallback:jest.fn()}));
jest.mock('@/ai/flows/multiagent-flow',()=>({runMultiAgent:jest.fn()}));
jest.mock('@/lib/ai/consumo-servidor',()=>({hayPresupuestoParaIA:jest.fn().mockResolvedValue(true),registrarConsumoIA:jest.fn().mockResolvedValue(undefined)}));
jest.mock('@/app/actions/presupuestos',()=>({savePresupuesto:jest.fn(),getPresupuestos:jest.fn().mockResolvedValue([])}));
jest.mock('@/app/actions/crm',()=>({getCrmLeads:jest.fn().mockResolvedValue([]),addCrmLead:jest.fn()}));
jest.mock('@/app/actions/servicios-empresa',()=>({getServiciosEmpresaPublicos:jest.fn().mockResolvedValue([{id:'qa120-dj',nombre:'DJ QA120',precioBase:1000,calculationMethod:'fijo'}])}));
jest.mock('@/app/actions/fiesta/fiesta.actions',()=>({getFiestaById:jest.fn(),getFiestas:jest.fn().mockResolvedValue([])}));
jest.mock('@/app/actions/multiagent',()=>({crearTareaDesdeMultiagente:jest.fn(),crearRecordatorioDesdeMultiagente:jest.fn()}));
const model=generateWithGeminiFallback as jest.Mock, save=savePresupuesto as jest.Mock;
const budget={id:'qa120-budget',clienteNombre:'QA120',itemsPresupuestados:[],estado:'Borrador'} as unknown as Presupuesto;
const decision=(accion:string,argumentos:Record<string,unknown>,pensamiento?:string)=>({text:JSON.stringify({accion,argumentos,pensamiento})});
const input={message:'Armá un presupuesto para QA120',history:[],requestId:'01234567-89ab-4cde-8f01-23456789abcd'};
beforeEach(()=>{jest.clearAllMocks(); model.mockReset();save.mockReset();(getPresupuestos as jest.Mock).mockResolvedValue([]);(getCrmLeads as jest.Mock).mockResolvedValue([]);(getFiestas as jest.Mock).mockResolvedValue([]);});

it('confirmacion propaga fracaso del guardado sin inventar ID ni exito',async()=>{
  save.mockResolvedValue({success:false,error:'No autorizado QA120'});
  expect(await confirmAndSaveAssistantBudget(budget)).toEqual({success:false,error:'No autorizado QA120'});
});
it('confirmacion no acepta success sin ID persistido',async()=>{
  save.mockResolvedValue({success:true});
  expect((await confirmAndSaveAssistantBudget(budget)).success).toBe(false);
});
it('confirmacion conserva error arrojado por backend',async()=>{
  save.mockRejectedValue(new Error('Base no disponible QA120'));
  expect(await confirmAndSaveAssistantBudget(budget)).toEqual({success:false,error:'Base no disponible QA120'});
});
it('Encargado no deja al modelo afirmar guardado despues de un rechazo',async()=>{
  save.mockResolvedValue({success:false,error:'No autorizado QA120'});
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']},'Voy a armarlo'));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'Ya quedó guardado y comprobado.'}));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(false);expect(result.response).toContain('No autorizado QA120');
  expect(result.response).not.toContain('Ya quedó guardado y comprobado');
  expect(model).toHaveBeenCalledTimes(1);
});
it('fallo de modelo antes de cualquier accion no se convierte en guardado comprobado',async()=>{
  model.mockRejectedValue(new Error('Proveedor QA120 fuera de servicio'));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(false);expect(result.response).not.toMatch(/guardado|quedaron organizados/);
  expect(save).not.toHaveBeenCalled();
});
it('servicios desconocidos no crean un presupuesto vacio como trabajo terminado',async()=>{
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['NO EXISTE QA120']}));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'Todo pronto'}));
  save.mockResolvedValue({success:true,id:'qa120-empty'});
  const result=await ejecutarEncargado(input);
  expect(save).not.toHaveBeenCalled();expect(result.success).toBe(false);expect(result.response).toMatch(/catálogo|servicios/i);
});
it('presupuesto valido confirma solamente el ID que devolvio el backend',async()=>{
  save.mockResolvedValue({success:true,id:'qa120-budget'});
  expect(await confirmAndSaveAssistantBudget(budget)).toEqual({success:true,presupuestoId:'qa120-budget'});
});
it('terminar sin haber usado herramientas no permite inventar una entrega',async()=>{
  model.mockResolvedValueOnce(decision('terminar',{resumen:'Ya quedo todo guardado y comprobado.'}));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(false);expect(result.response).toContain('No ejecute ninguna accion');
  expect(result.pasosEjecutados).toEqual([]);expect(save).not.toHaveBeenCalled();
});
it('pasos y respuesta de un guardado real no repiten pensamiento ni resumen inventados',async()=>{
  save.mockResolvedValue({success:true,id:'qa120-budget'});
  (getPresupuestos as jest.Mock).mockResolvedValue([{id:'qa120-budget',costoTotalEstimado:1000,estado:'Borrador'}]);
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']},'Ya envie un contrato que no existe'));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'Cobre 90000 y envie un contrato'}));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(true);expect(result.response).toContain('presupuesto guardado');
  expect(result.response).not.toMatch(/90000|contrato/);expect(result.pasosEjecutados).toEqual([result.response]);
});
it.each([
  ['buscar_persona_o_prospecto',{query:'QA120'},getCrmLeads],
  ['leer_presupuesto',{id:'qa120-budget'},getPresupuestos],
  ['buscar_fiestas',{query:'QA120'},getFiestas],
])('lectura fallida %s no se informa como lista vacia',async(accion,argumentos,reader)=>{
  (reader as jest.Mock).mockRejectedValueOnce(new Error('Lectura QA120 no disponible'));
  model.mockResolvedValueOnce(decision(accion as string,argumentos as Record<string,unknown>));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'No hay registros'}));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(false);expect(result.response).toContain('Lectura QA120 no disponible');expect(model).toHaveBeenCalledTimes(1);
});
it('texto WhatsApp se entrega sin afirmar que se envio o guardo en una bandeja',async()=>{
  model.mockResolvedValueOnce(decision('preparar_whatsapp',{destinatario:'QA120',motivo:'general'}));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'WhatsApp enviado a todos'}));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(true);expect(result.response).toContain('no se envio');expect(result.response).toContain('Hola QA120');expect(save).not.toHaveBeenCalled();
});
it('la respuesta comprobada de lectura mantiene nombres reales y explicita el limite de tres',async()=>{
  (getFiestas as jest.Mock).mockResolvedValue(['uno','dos','tres','cuatro'].map(n=>({id:n,configuracion:{nombreEvento:'QA120 '+n,fechaEvento:'2027-08-08'}})));
  model.mockResolvedValueOnce(decision('buscar_fiestas',{query:'QA120'}));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'Una fiesta inventada'}));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(true);expect(result.response).toContain('QA120 uno');expect(result.response).toContain('mostrando hasta 3');expect(result.response).not.toContain('inventada');
});
it('fallo del modelo tras un guardado conserva la confirmacion pero no dice todo completado',async()=>{
  save.mockResolvedValue({success:true,id:'qa120-budget'});
  (getPresupuestos as jest.Mock).mockResolvedValue([{id:'qa120-budget',costoTotalEstimado:1000,estado:'Borrador'}]);
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']})).mockRejectedValueOnce(new Error('Modelo QA120 fallo despues'));
  const result=await ejecutarEncargado(input);
  expect(result.success).toBe(false);expect(result.response).toContain('No pude completar la coordinacion');expect(result.response).toContain('presupuesto guardado');expect(save).toHaveBeenCalledTimes(1);
});

it('identidad del pedido llega al guardado atomico y otra cotizacion tiene otra clave',async()=>{
  save.mockResolvedValue({success:true,id:'qa121-budget'});
  const run=async(requestId:string)=>{
    model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']}));
    model.mockResolvedValueOnce(decision('terminar',{resumen:'Fin'}));
    expect((await ejecutarEncargado({...input,requestId})).success).toBe(true);
  };
  await run(input.requestId);await run(input.requestId);
  const first=save.mock.calls[0][1].operationId;
  expect(save.mock.calls[1][1].operationId).toBe(first);
  await run('01234567-89ab-4cde-8f01-23456789abce');
  expect(save.mock.calls[2][1].operationId).not.toBe(first);
});
it('sin identidad estable no guarda un presupuesto del chat',async()=>{
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']}));
  const result=await ejecutarEncargado({...input,requestId:undefined});
  expect(result.success).toBe(false);expect(result.response).toContain('identificar');expect(save).not.toHaveBeenCalled();
});
it('dos presupuestos dentro de un pedido conservan identidades separadas',async()=>{
  save.mockResolvedValue({success:true,id:'qa121-budget'});
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']}));
  model.mockResolvedValueOnce(decision('armar_presupuesto',{nombreCliente:'QA120',servicios:['DJ QA120']}));
  model.mockResolvedValueOnce(decision('terminar',{resumen:'Fin'}));
  expect((await ejecutarEncargado(input)).success).toBe(true);
  expect(save.mock.calls[0][1].operationId).not.toBe(save.mock.calls[1][1].operationId);
});

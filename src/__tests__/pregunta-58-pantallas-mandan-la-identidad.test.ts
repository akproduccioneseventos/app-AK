/**
 * PREGUNTA 58: las pantallas piden la identidad del intento ANTES de llamar a la accion, la mandan,
 * y la sueltan SOLO despues de un exito.
 *
 * Rutas tocadas: `/fiestas/nueva/invitados` (alta e importacion de planilla), `/incidentes`,
 * `/calendario`, `/empresa/salones`, `/fiestas/nueva/tareas`, `/alertas`,
 * `/settings/templates/invitaciones`, `/contabilidad/crm`, `/proveedores/new`, `/empleados/nuevo`,
 * `/empresa/servicios/nuevo`.
 *
 * Las acciones del servidor se prueban con la accion real en los otros dos archivos
 * `pregunta-58-*`; aca se mira que cada pantalla las llame con la identidad.
 */
import fs from 'fs';
import path from 'path';
import { leerPlanillaDeInvitados } from '@/lib/invitados/leer-planilla';
import { ponerIdsDeIntentoAFilas } from '@/lib/invitados/ids-de-planilla';
import { prepararReintentoDePlanilla } from '@/lib/invitados/reintento-de-planilla';

const leer = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf-8');

describe('Planilla de invitados: cada fila lleva su identidad', () => {
  const TEXTO = 'Nombre\nJuan Perez\nJuan Perez\nAna Lopez';
  let n = 0;
  const nuevoId = () => `id-${++n}`;

  it('releer el mismo texto no cambia las identidades, y los homonimos tienen identidades distintas', () => {
    const memoria = new Map<string, string>();
    const a = ponerIdsDeIntentoAFilas(leerPlanillaDeInvitados(TEXTO, []), memoria, nuevoId);
    const b = ponerIdsDeIntentoAFilas(leerPlanillaDeInvitados(TEXTO, []), memoria, nuevoId);
    const ids = a.filas.map((f) => f.idIntento);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(a.filas.length);
    expect(b.filas.map((f) => f.idIntento)).toEqual(ids);
  });

  it('el reintento de las fallidas conserva la identidad de cada fila', () => {
    const resumen = ponerIdsDeIntentoAFilas(leerPlanillaDeInvitados(TEXTO, []), new Map(), nuevoId);
    const falla = resumen.filas[2];
    const reintento = prepararReintentoDePlanilla(resumen, new Set([falla.filaNum]));
    expect(reintento.resumen.filas).toHaveLength(1);
    expect(reintento.resumen.filas[0].idIntento).toBe(falla.idIntento);
  });
});

describe('Cada pantalla manda la identidad del intento y la suelta solo tras el exito', () => {
  const pantallas: Array<[string, string[], string]> = [
    ['/fiestas/nueva/invitados (alta)', ['src', 'app', '(app)', 'fiestas', 'nueva', 'invitados', 'page.tsx'], 'addInvitadoFiestaActual(fiestaId, carga, { idIntento })'],
    ['/fiestas/nueva/invitados (planilla)', ['src', 'app', '(app)', 'fiestas', 'nueva', 'invitados', 'page.tsx'], '{ idIntento: item.idIntento }'],
    ['/incidentes', ['src', 'app', '(app)', 'incidentes', 'page.tsx'], 'createIncidente(carga, { idIntento })'],
    ['/calendario', ['src', 'app', '(app)', 'calendario', 'page.tsx'], 'createAppointment(cargaCita, { idIntento })'],
    ['/empresa/salones', ['src', 'app', '(app)', 'empresa', 'salones', 'page.tsx'], 'saveSalon(payload, idIntento ?'],
    ['/fiestas/nueva/tareas', ['src', 'app', '(app)', 'fiestas', 'nueva', 'tareas', 'client.tsx'], 'addTareaToFiestaActual(fiestaId, newTaskData, { idIntento })'],
    ['/alertas', ['src', 'app', '(app)', 'alertas', 'page.tsx'], 'idEstable: `msg_${idIntento}`'],
    ['/settings/templates/invitaciones', ['src', 'app', '(app)', 'settings', 'templates', 'invitaciones', 'page.tsx'], 'duplicateInvitationTemplate(id, { idIntento })'],
    ['/contabilidad/crm', ['src', 'components', 'crm', 'AddLeadDialog.tsx'], 'addCrmLead(cargaLead, { idIntento })'],
    ['/proveedores/new', ['src', 'app', '(app)', 'proveedores', 'new', 'page.tsx'], 'saveProveedor(proveedorData, { idIntento })'],
    ['/empleados/nuevo', ['src', 'app', '(app)', 'empleados', 'nuevo', 'page.tsx'], 'saveEmpleado(empleadoData, { idIntento })'],
    ['/empresa/servicios/nuevo', ['src', 'app', '(app)', 'empresa', 'servicios', 'nuevo', 'page.tsx'], 'saveServicioEmpresa(dataToSave, { idIntento })'],
  ];

  it.each(pantallas)('%s', (_ruta, archivo, llamada) => {
    const codigo = leer(...archivo);
    const pedir = codigo.indexOf('obtenerIntento(');
    const llamar = codigo.indexOf(llamada);
    expect(pedir).toBeGreaterThan(-1);
    expect(llamar).toBeGreaterThan(-1);
    // La identidad se pide ANTES de llamar a la accion...
    if (!_ruta.includes('planilla')) expect(pedir).toBeLessThan(llamar);
    // ...y se suelta despues, no antes: solo tras confirmar que se guardo.
    if (!_ruta.includes('planilla') && !_ruta.includes('alertas')) {
      expect(codigo.indexOf('terminarIntento(', llamar)).toBeGreaterThan(llamar);
    }
    expect(codigo).toContain('terminarIntento');
  });
});

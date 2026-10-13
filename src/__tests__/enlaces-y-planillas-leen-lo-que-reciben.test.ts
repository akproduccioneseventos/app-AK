/**
 * @jest-environment node
 *
 * MATAFUEGO (13/10/2026) - Un enlace con un dato lo tiene que leer el destino, y un campo que se
 * lee tiene que existir en el tipo.
 *
 *  - Los botones mandaban `?id=` a pantallas que leen `?fiestaId=`; `/presupuestos/nuevo` no leia
 *    `fiestaId` ni el CRM `leadId` ni la agenda `date`.
 *  - El reintento de la importacion de invitados leia `lineaOriginal` (no existia) y filtraba los
 *    fallidos por nombre: perdia mesa/categoria y duplicaba homonimos.
 *  - "Menu sin definir" leia `seleccionPrincipalId` (no existe; el campo es `principal`).
 *  - Los avisos de reunion leian `lugar`, `conQuien` y `nombreCliente` (no existen).
 * Se probo rompiendolo: cada una se pone en rojo al volver a la version vieja.
 */
import fs from 'fs';
import path from 'path';
import { leerPlanillaDeInvitados } from '@/lib/invitados/leer-planilla';
import { prepararReintentoDePlanilla } from '@/lib/invitados/reintento-de-planilla';
import { precargaDesdeFiesta } from '@/lib/presupuestos/precarga-desde-fiesta';
import { datosDeLaReunion } from '@/lib/reuniones/datos-de-la-reunion';
import { detectarErroresHumanos } from '@/lib/alertas/errores-humanos';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('enlaces: el destino lee el dato que le mandan', () => {
  it('post-evento y control de entretenimiento mandan fiestaId (no id)', () => {
    const post = leer('src/app/(app)/fiestas/nueva/post-evento/page.tsx');
    expect(post).toContain('/fiestas/nueva?fiestaId=${fiestaId}');
    expect(post).toContain('reporte?fiestaId=${fiestaId}');
    expect(post).not.toMatch(/\?id=\$\{fiestaId\}/);
    const control = leer('src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx');
    expect(control).toContain('/fiestas/nueva/entretenimiento?fiestaId=${fiestaId}');
    expect(control).not.toMatch(/\?id=\$\{fiestaId\}/);
    // y las pantallas de destino leen exactamente ese nombre
    for (const destino of [
      'src/app/(app)/fiestas/nueva/page.tsx',
      'src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx',
      'src/app/(app)/fiestas/nueva/entretenimiento/page.tsx',
    ]) expect(leer(destino)).toContain("searchParams.get('fiestaId')");
  });

  it('el formulario de presupuesto, la central, el CRM y la agenda leen lo que les mandan', () => {
    const crear = leer('src/app/(app)/presupuestos/nuevo/crear/page.tsx');
    expect(crear).toContain("searchParams.get('fiestaId')");
    expect(crear).toContain('precargaDesdeFiesta');
    expect(crear).toContain('updateFiestaPresupuestoId'); // se enlaza al guardar
    expect(crear).toContain('Presupuesto para la fiesta');
    const central = leer('src/app/(app)/presupuestos/nuevo/page.tsx');
    expect(central).toContain("searchParams.get('fiestaId')");
    expect(central).toContain("searchParams.get('leadId')");
    expect(leer('src/app/(app)/contabilidad/crm/page.tsx')).toContain("searchParams.get('leadId')");
    expect(leer('src/app/(app)/contabilidad/crm/agenda/page.tsx')).toContain("get('date')");
  });
});

describe('presupuesto para una fiesta: se adelantan los datos que la fiesta ya tiene', () => {
  it('cliente, tipo, fecha, lugar e invitados', () => {
    const p = precargaDesdeFiesta({
      id: 'f1',
      configuracion: {
        clienteNombre: 'Ana Pérez', tipoCelebracion: 'XV años', fechaEvento: '2026-11-21', horaInicio: '21:00',
        nombreLugar: 'Club Uruguay', invitadosAdultos: 80, invitadosNinos: 10, invitadosAdolescentes: 5,
      },
    } as any);
    expect(p.clienteNombre).toBe('Ana Pérez');
    expect(p.eventoTipo).toBe('XV años');
    expect(p.salonFiestas).toBe('Club Uruguay');
    expect(p.invitadosCantidad).toBe(95);
    expect(p.invitadosAdultos).toBe(80);
    expect(p.eventoFecha?.getFullYear()).toBe(2026);
    expect(p.eventoFecha?.getMonth()).toBe(10);
    expect(p.eventoFecha?.getDate()).toBe(21);
  });
  it('no inventa campos que la fiesta no tiene', () => {
    expect(precargaDesdeFiesta({ id: 'f2', configuracion: { invitadosEstimados: 0 } } as any)).toEqual({});
  });
});

describe('importar invitados: el reintento conserva la fila entera y no mira el nombre', () => {
  const planilla = [
    'Nombre;Mesa;Categoria;Restriccion',
    'Juan Pérez;3;Niño;Celiaco',
    'Juan Pérez;5;Adulto;Vegano',
    'Ana Gómez;1;Adulto;',
  ].join('\n');

  it('con dos homonimos, solo se reintenta el que fallo, con su mesa y su restriccion', () => {
    const resumen = leerPlanillaDeInvitados(planilla);
    expect(resumen.encabezado).toContain('Nombre');
    const segundoJuan = resumen.filas[1];
    const r = prepararReintentoDePlanilla(resumen, new Set([segundoJuan.filaNum]));
    expect(r.resumen.filas).toHaveLength(1);
    expect(r.resumen.filas[0].tableNumber).toBe('5');
    expect(r.texto).toBe('Nombre;Mesa;Categoria;Restriccion\nJuan Pérez;5;Adulto;Vegano');
    // el texto del reintento se vuelve a leer igual: mesa, categoria y restriccion intactas
    const reLeida = leerPlanillaDeInvitados(r.texto);
    expect(reLeida.filas).toHaveLength(1);
    expect(reLeida.filas[0]).toMatchObject({ nombre: 'Juan Pérez', tableNumber: '5', categoria: 'Adulto', dietaryRestriction: 'Vegano' });
  });

  it('la pantalla ya no usa "as any" ni filtra por nombre', () => {
    const pantalla = leer('src/app/(app)/fiestas/nueva/invitados/page.tsx');
    expect(pantalla).not.toContain('lineaOriginal ||');
    expect(pantalla).not.toContain('nombresFallidos');
    expect(pantalla).toContain('filasFallidas');
  });
});

describe('alertas y avisos leen campos que existen', () => {
  const enDiez = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  const fiesta = (extra: any) => ({
    id: 'f1', estado: 'Planificada',
    configuracion: { nombreEvento: 'XV de Ana', fechaEvento: enDiez },
    ...extra,
  });
  const hayAlertaDeMenu = (f: any) => detectarErroresHumanos([f], [], [], new Date()).some((a) => a.id === 'menu_sin_definir_f1');

  it('con el plato principal elegido en el portal, no sale "Menu sin definir"', () => {
    expect(hayAlertaDeMenu(fiesta({ menuSeleccionPortal: { principal: 'Milanesa' } }))).toBe(false);
  });
  it('sin menu de ningun tipo, si sale', () => {
    expect(hayAlertaDeMenu(fiesta({}))).toBe(true);
  });

  it('el lugar y el contacto de una reunion son los de la fiesta', () => {
    expect(datosDeLaReunion({ configuracion: { nombreLugar: 'Club', clienteNombre: 'Ana', nombreEvento: 'XV' } } as any))
      .toEqual({ lugar: 'Club', contacto: 'Ana' });
    expect(datosDeLaReunion({ configuracion: { protagonista1Nombre: 'Lu', nombreEvento: 'XV' } } as any).contacto).toBe('Lu');
    for (const archivo of ['src/app/actions/notifications.ts', 'src/app/actions/agenda.ts']) {
      const codigo = leer(archivo);
      expect(codigo).not.toContain('conQuien');
      expect(codigo).not.toContain('nombreCliente');
    }
  });
});

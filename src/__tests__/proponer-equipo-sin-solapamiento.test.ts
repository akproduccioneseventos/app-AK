import { proponerEquipoParaFiesta } from '@/lib/personal/proponer-equipo';
import type { Empleado } from '@/types/empleado';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Rol } from '@/types/rol';

describe('Orden 86 Bloque 5: Proponer turnos de personal solos', () => {
  const rolDj: Rol = {
    id: 'rol-dj',
    nombre: 'DJ Principal',
    sueldoPorEvento: 3500,
    categoria: 'tecnica',
    activo: true,
  };

  const rolFotografo: Rol = {
    id: 'rol-foto',
    nombre: 'Fotógrafo',
    sueldoPorEvento: 2500,
    categoria: 'tecnica',
    activo: true,
  };

  const roles: Rol[] = [rolDj, rolFotografo];

  const empleado1: Empleado = {
    id: 'emp-1',
    nombre: 'Lucas Silva',
    cedula: '41234567',
    fechaNacimiento: '1995-05-10',
    rolIds: ['rol-dj', 'rol-foto'],
  };

  const empleado2: Empleado = {
    id: 'emp-2',
    nombre: 'Martín Pérez',
    cedula: '42345678',
    fechaNacimiento: '1996-08-15',
    rolIds: ['rol-dj'],
  };

  const empleado3: Empleado = {
    id: 'emp-3',
    nombre: 'Sofía Rossi',
    cedula: '43456789',
    fechaNacimiento: '1997-12-20',
    rolIds: ['rol-foto'],
  };

  const empleados: Empleado[] = [empleado1, empleado2, empleado3];

  it('con dos fiestas el mismo día, la propuesta no pone al mismo empleado en las dos', () => {
    const fechaMismoDia = '2026-10-15';

    // Fiesta A ya tiene a Lucas Silva (emp-1) asignado como DJ ese mismo día
    const fiestaA: FiestaEnPlanificacion = {
      id: 'fiesta-a',
      configuracion: {
        nombreEvento: 'Boda de Laura y Juan',
        fechaEvento: fechaMismoDia,
      },
      personalAsignado: [
        {
          empleadoId: 'emp-1', // Lucas está en Fiesta A
          rolId: 'rol-dj',
          eventSalary: 3500,
        },
      ],
    } as any;

    // Fiesta B se planifica para ese MISMO día y necesita un DJ y un Fotógrafo
    const fiestaB: FiestaEnPlanificacion = {
      id: 'fiesta-b',
      configuracion: {
        nombreEvento: '15 Años de Valentina',
        fechaEvento: fechaMismoDia,
      },
      personalAsignado: [],
    } as any;

    const propuesta = proponerEquipoParaFiesta({
      fiestaActual: fiestaB,
      todasLasFiestas: [fiestaA, fiestaB],
      empleados,
      roles,
      requiredRoles: [
        { roleId: 'rol-dj', roleName: 'DJ Principal', quantity: 1 },
        { roleId: 'rol-foto', roleName: 'Fotógrafo', quantity: 1 },
      ],
    });

    // 1. Lucas Silva (emp-1) NO debe estar en Fiesta B porque ya está en Fiesta A ese día
    const asignacionLucas = propuesta.find((p) => p.empleadoId === 'emp-1');
    expect(asignacionLucas).toBeUndefined();

    // 2. Para DJ debió elegir a Martín Pérez (emp-2)
    const asignacionDj = propuesta.find((p) => p.rolId === 'rol-dj');
    expect(asignacionDj?.empleadoId).toBe('emp-2');

    // 3. Para Fotógrafo debió elegir a Sofía Rossi (emp-3)
    const asignacionFoto = propuesta.find((p) => p.rolId === 'rol-foto');
    expect(asignacionFoto?.empleadoId).toBe('emp-3');
  });

  it('reparte el trabajo equitativamente entre los empleados disponibles', () => {
    // Si hay dos DJs libres, pero emp-2 ya tiene 5 fiestas históricas y otro tiene 0
    const emp4: Empleado = {
      id: 'emp-4',
      nombre: 'Joaquín Gómez',
      cedula: '45678901',
      fechaNacimiento: '1998-03-22',
      rolIds: ['rol-dj'],
    };

    const fiestaVieja1: FiestaEnPlanificacion = {
      id: 'fiesta-vieja-1',
      configuracion: { fechaEvento: '2026-09-01' },
      personalAsignado: [{ empleadoId: 'emp-2', rolId: 'rol-dj', eventSalary: 3500 }],
    } as any;

    const fiestaActual: FiestaEnPlanificacion = {
      id: 'fiesta-hoy',
      configuracion: { fechaEvento: '2026-10-20' },
      personalAsignado: [],
    } as any;

    const propuesta = proponerEquipoParaFiesta({
      fiestaActual,
      todasLasFiestas: [fiestaVieja1, fiestaActual],
      empleados: [empleado2, emp4],
      roles,
      requiredRoles: [{ roleId: 'rol-dj', roleName: 'DJ Principal', quantity: 1 }],
    });

    // Debe preferir emp-4 que tiene 0 asignaciones previas frente a emp-2 que ya tiene 1
    expect(propuesta[0].empleadoId).toBe('emp-4');
  });
});

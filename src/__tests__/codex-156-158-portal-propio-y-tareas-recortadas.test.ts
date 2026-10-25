/** @jest-environment node */

/**
 * Codex 156 (orden 200): el empleado no podía abrir su propio portal, porque antes de mirar si era
 * el suyo se leían la lista del personal y las fiestas, que rechazan al perfil personal.
 * Codex 158 (orden 201): sin la clave, una tarea automática corre igual, pero contestaba con nombres
 * de clientes y fiestas a cualquiera de internet.
 */
import fs from 'fs';
import path from 'path';

let sesion: { success: boolean; user?: Record<string, unknown> } = { success: false };

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesion),
  requireAppSession: jest.fn(async () => sesion.user),
}));

const EMPLEADOS = [
  { id: 'emp-a', nombre: 'Ana', email: 'ana@ak.test', cedula: '1.111.111-1', roles: [] },
  { id: 'emp-b', nombre: 'Beto', email: 'beto@ak.test', cedula: '2.222.222-2', roles: [] },
];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) =>
    archivo === 'empleados.json' ? EMPLEADOS : porDefecto),
  writeData: jest.fn(async () => undefined),
}));

const fiesta = (id: string, asignados: Array<{ empleadoId: string; eventSalary: number }>) => ({
  id,
  estado: 'Planificacion',
  configuracion: { nombreEvento: `Fiesta ${id}`, fechaEvento: '2027-08-08', horaInicio: '21:00' },
  personalAsignado: asignados.map((a) => ({ ...a, rolId: 'mozo' })),
});

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => [
    fiesta('f1', [{ empleadoId: 'emp-a', eventSalary: 1500 }, { empleadoId: 'emp-b', eventSalary: 9000 }]),
    fiesta('f2', [{ empleadoId: 'emp-b', eventSalary: 9000 }]),
  ]),
}));

jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => [{ id: 'mozo', nombre: 'Mozo' }]),
}));

describe('el empleado abre su propio portal (orden 200)', () => {
  const portal = async (id: string) =>
    (await import('@/app/actions/google-workspace')).getEmployeeWorkspacePortal(id);

  it('el personal ve su ficha y sólo sus fiestas, con su sueldo y no el de otro', async () => {
    sesion = { success: true, user: { userId: 'emp-a', email: 'ana@ak.test', perfil: 'personal', role: 'user' } };
    const r = await portal('emp-a');
    expect(r.error).toBeUndefined();
    expect(r.employee?.id).toBe('emp-a');
    expect(r.events.map((e) => e.fiestaId)).toEqual(['f1']);
    expect(r.events[0].salary).toBe(1500);
  });

  it('también por correo verificado', async () => {
    sesion = { success: true, user: { userId: 'otro-id', email: 'ANA@ak.test', perfil: 'personal', role: 'user' } };
    expect((await portal('emp-a')).employee?.id).toBe('emp-a');
  });

  it('el portal de otro empleado no se abre', async () => {
    sesion = { success: true, user: { userId: 'emp-a', email: 'ana@ak.test', perfil: 'personal', role: 'user' } };
    const r = await portal('emp-b');
    expect(r.employee).toBeNull();
    expect(r.events).toEqual([]);
  });

  it('la secretaria no abre portales ajenos, y sin sesión no entra nadie', async () => {
    sesion = { success: true, user: { userId: 's1', email: 'sec@ak.test', perfil: 'secretaria', role: 'user' } };
    expect((await portal('emp-a')).employee).toBeNull();
    sesion = { success: false };
    expect((await portal('emp-a')).employee).toBeNull();
  });

  it('el dueño ve el portal de cualquiera', async () => {
    sesion = { success: true, user: { userId: 'd1', email: 'duenio@ak.test', perfil: 'dueno', role: 'admin' } };
    expect((await portal('emp-b')).events.map((e) => e.fiestaId)).toEqual(['f1', 'f2']);
  });
});

describe('las tareas sin clave contestan recortado (orden 201)', () => {
  it('sin clave sólo dice si salió bien; con clave, el detalle', async () => {
    const { respuestaDeLaTarea } = await import('@/lib/automatico/puerta-de-las-tareas');
    const detalle = { ok: true, resultado: { borradores: [{ cliente: 'María Pérez', evento: 'Boda' }] } };
    expect(respuestaDeLaTarea({ permitido: true, conClave: false }, detalle)).toEqual({ ok: true, recortada: true });
    expect(respuestaDeLaTarea({ permitido: true, conClave: false }, { success: false, error: 'x' }))
      .toEqual({ ok: false, recortada: true });
    expect(respuestaDeLaTarea({ permitido: true, conClave: true }, detalle)).toBe(detalle);
  });

  it('toda tarea que abre la puerta contesta con respuestaDeLaTarea', () => {
    const raiz = path.join(process.cwd(), 'src/app/api');
    const rutas: string[] = [];
    const recorrer = (dir: string) => {
      for (const n of fs.readdirSync(dir)) {
        const r = path.join(dir, n);
        if (fs.statSync(r).isDirectory()) recorrer(r);
        else if (n === 'route.ts') rutas.push(r);
      }
    };
    recorrer(raiz);
    const conPuerta = rutas.filter((r) => fs.readFileSync(r, 'utf8').includes('abrirPuertaDeLaTarea('));
    expect(conPuerta.length).toBeGreaterThan(5);
    const sinRecorte = conPuerta.filter((r) => {
      const codigo = fs.readFileSync(r, 'utf8');
      // Cada respuesta que no es un error pasa por el recorte.
      const respuestas = codigo.match(/return NextResponse\.json\([\s\S]*?\);/g) || [];
      return respuestas.some((x) => !/error/i.test(x) && !x.includes('respuestaDeLaTarea('));
    });
    expect(sinRecorte.map((r) => path.relative(process.cwd(), r))).toEqual([]);
  });
});

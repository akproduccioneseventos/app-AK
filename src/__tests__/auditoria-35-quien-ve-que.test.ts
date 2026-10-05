/**
 * Quién ve qué, con las 35 preguntas pasadas sobre TODA la app (5/10/2026).
 *
 * La auditoría encontró acciones del servidor que pedían sólo "tener sesión": cupones, activos
 * fijos, la ficha del personal (cédula y fecha de nacimiento), los enlaces del personal, los
 * menús, el CRM entero (el teléfono de cada prospecto y la seña), el contrato en papel y el menú
 * de la fiesta. El personal y el operador también tienen sesión, así que entraban.
 *
 * Dos controles:
 * 1. En esos archivos, ninguna acción exportada se queda sólo con la sesión. Las públicas a
 *    propósito están nombradas abajo, con el motivo.
 * 2. La ficha del personal: el operador ve el nombre y el teléfono para armar la noche, pero no la
 *    cédula ni la fecha de nacimiento; el personal no ve la lista.
 *
 * Se probó rompiéndolo: volviendo `getCrmLeads` a `verifySession()` el primer control se pone en
 * rojo, y sacando `sinDatosPersonales` el segundo.
 */
import fs from 'fs';
import path from 'path';

const ARCHIVOS = [
  'cupones', 'activos-fijos', 'empleados', 'accesos-personal', 'menus-catering', 'crm', 'insumos',
  'fiesta/catering.actions',
];

/** Públicas o protegidas por otro lado, a propósito. */
const SIN_PERMISO_A_PROPOSITO: Record<string, string> = {
  'empleados:getEmpleadoById': 'delega en getEmpleados, que mira el perfil',
  'empleados:fiestasDelMismoDiaConEmpleado': 'sólo devuelve nombres de fiestas del mismo día',
  'accesos-personal:getAccesoById': 'el enlace del personal: el número es la llave',
  'accesos-personal:verifyAccesoPersonalToken': 'el enlace del personal: el número es la llave',
  'menus-catering:getMenusPublicos': 'el simulador público: sin costos ni márgenes',
  'crm:saveLead': 'el formulario de la web: lo llena el prospecto',
};

const PIDE_PERMISO = /requirePermiso|requirePermisoAlguno|sesionConPermiso|requireEventPermission|puede\(|role !== 'admin'/;

describe('Ninguna acción de estas áreas se conforma con tener sesión', () => {
  it.each(ARCHIVOS)('%s', (archivo) => {
    const texto = fs.readFileSync(path.join(process.cwd(), 'src/app/actions', `${archivo}.ts`), 'utf-8');
    const sinPermiso: string[] = [];
    for (const cuerpo of texto.split(/\nexport async function /).slice(1)) {
      const fin = cuerpo.search(/\n}\n/);
      const funcion = fin === -1 ? cuerpo : cuerpo.slice(0, fin);
      const nombre = funcion.split('(')[0].split('<')[0];
      if (SIN_PERMISO_A_PROPOSITO[`${archivo}:${nombre}`]) continue;
      if (!PIDE_PERMISO.test(funcion)) sinPermiso.push(nombre);
    }
    expect(sinPermiso).toEqual([]);
  });

  it('la seña y el contrato en papel piden contabilidad', () => {
    const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf-8');
    const crm = leer('src/app/actions/crm.ts');
    for (const nombre of ['registerContractDeposit', 'confirmBookingWithContract', 'confirmBooking']) {
      const cuerpo = crm.split(`export async function ${nombre}(`)[1].slice(0, 1500);
      expect(cuerpo).toMatch(/sesionConPermiso\(PERMISOS\.CONTABILIDAD\)/);
    }
    const documentos = leer('src/app/actions/fiesta/documentos.actions.ts');
    expect(documentos.split('export async function uploadPhysicalContract(')[1].slice(0, 600))
      .toMatch(/requirePermiso\(PERMISOS\.CONTABILIDAD\)/);
    const facturas = leer('src/app/actions/invoices.ts');
    expect(facturas.split('export async function registerBookingDeposit(')[1].slice(0, 900))
      .toMatch(/requirePermiso\(PERMISOS\.CONTABILIDAD\)/);
  });
});

let perfil = 'operador';
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', email: 'u1@ak.test', perfil } })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [{
    id: 'e1', nombre: 'Juan', telefono: '099', email: 'juan@ak.test',
    cedula: '1.234.567-8', fechaNacimiento: '1990-01-01', contractFileName: 'contrato.pdf',
  }]),
  writeData: jest.fn(),
  createDataItem: jest.fn(),
  updateDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
}));

describe('La ficha del personal', () => {
  it('el operador ve nombre y teléfono, no la cédula ni la fecha de nacimiento', async () => {
    perfil = 'operador';
    const { getEmpleados } = await import('@/app/actions/empleados');
    const [juan] = await getEmpleados();
    expect(juan.nombre).toBe('Juan');
    expect(juan.telefono).toBe('099');
    expect(juan.cedula).toBeFalsy();
    expect(juan.fechaNacimiento).toBeFalsy();
    expect((juan as any).contractFileName).toBeFalsy();
  });

  it('el personal no ve la lista', async () => {
    perfil = 'personal';
    const { getEmpleados } = await import('@/app/actions/empleados');
    await expect(getEmpleados()).rejects.toThrow();
  });

  it('el dueño la ve completa', async () => {
    perfil = 'dueno';
    const { getEmpleados } = await import('@/app/actions/empleados');
    const [juan] = await getEmpleados();
    expect(juan.cedula).toBe('1.234.567-8');
  });
});

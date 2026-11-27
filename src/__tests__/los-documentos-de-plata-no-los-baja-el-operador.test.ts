/** @jest-environment node */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

let sesionActual: { success: boolean; user?: any; error?: string } = { success: false };
let portalAutorizado = false;
let fiestaPortalMock: any = null;
let soloSueldosUserId: string | null = null;

jest.mock('@/lib/auth/perfiles', () => {
  const actual = jest.requireActual('@/lib/auth/perfiles');
  return {
    ...actual,
    puede: jest.fn((user: any, permiso: any) => {
      if (soloSueldosUserId && user?.userId === soloSueldosUserId) {
        return permiso === actual.PERMISOS.SUELDOS;
      }
      return actual.puede(user, permiso);
    }),
  };
});

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesionActual),
  generateBudgetToken: jest.fn(async () => 'budget-token-test'),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => portalAutorizado),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'op-1', email: 'op1@ak.test', nombre: 'Operador Asignado' },
    { id: 'op-2', email: 'op2@ak.test', nombre: 'Operador Ajeno' },
  ]),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
  ),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => ({
    valor: almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
    huboFalla: false,
  })),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => (almacen['fiestas/f1.json'] ? [copia(almacen['fiestas/f1.json'])] : [])),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('@/lib/firebase/storage', () => ({
  downloadFromStorage: jest.fn(async () => null),
}));

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaByAccessKey: jest.fn(async () => fiestaPortalMock),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => null),
  getPresupuestos: jest.fn(async () => []),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn(async () => []),
}));

jest.mock('@/app/portal/c/[accessKey]/PublicPortalClientExperience', () => ({
  __esModule: true,
  default: (props: any) => ({ type: 'PublicPortalClientExperience', props }),
}));

import { NextRequest } from 'next/server';
import { GET as downloadDocFiestaGET } from '@/app/api/documentos-fiesta/[...parts]/route';
import { getCompanyInfoPublica } from '@/app/actions/settings';
import { getEmailContador } from '@/app/actions/reportes';
import PublicPortalPage from '@/app/portal/c/[accessKey]/page';

const DUENO = { userId: 'dueno-1', email: 'dueno@ak.test', perfil: 'dueno' };
const SECRETARIA = { userId: 'sec-1', email: 'sec@ak.test', perfil: 'secretaria' };
const OPERADOR_ASIGNADO = { userId: 'op-1', email: 'op1@ak.test', perfil: 'operador' };
const PERSONAL = { userId: 'p-1', email: 'mozo@ak.test', perfil: 'personal' };

const FIESTA_DOCS = {
  id: 'f1',
  estado: 'Contratada',
  configuracion: {
    nombreEvento: 'Boda de Sofía y Martín',
    fechaEvento: '2026-12-20',
  },
  clientPortalSettings: {
    enabled: true,
    accessKey: 'clave-portal-372',
  },
  personalAsignado: [{ empleadoId: 'op-1', rolId: 'dj', eventSalary: 7000 }],
  othersDocumentos: [
    { id: 'd1', nombre: 'Contrato de Servicio', tipo: 'contrato_servicio', fileName: 'contrato-cliente.pdf' },
    { id: 'd2', nombre: 'Recibo de Seña', tipo: 'recibo_pago', fileName: 'recibo-pago-1.pdf' },
    { id: 'd3', nombre: 'Recibo de Pago de Personal - Juan', tipo: 'recibo_personal', fileName: 'recibo-personal-juan.pdf' },
    { id: 'd4', nombre: 'Recibo de AGADU', tipo: 'recibo_agadu', fileName: 'recibo-agadu.pdf' },
    { id: 'd5', nombre: 'Cronograma de la noche', tipo: 'otro', fileName: 'cronograma-fiesta.pdf' },
    { id: 'd6', nombre: 'Adenda Cambio de Fecha', tipo: 'cambio-fecha', fileName: 'adenda-fecha.pdf' },
  ],
};

describe('Orden 372 B1: documentos de plata, portal del cliente y email del contador', () => {
  const prevEnv = { ...process.env };
  let tmpRoot = '';
  let cwdSpy: jest.SpyInstance;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-372-docs-'));
    const docsDir = path.join(tmpRoot, 'src', 'data', 'documentos-varios-fiesta', 'f1');
    fs.mkdirSync(docsDir, { recursive: true });
    for (const doc of FIESTA_DOCS.othersDocumentos) {
      fs.writeFileSync(path.join(docsDir, doc.fileName), `PDF:${doc.fileName}`, 'utf8');
    }
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
    process.env.AK_SESSION_SECRET = 'secret-de-prueba-orden-372';
  });

  afterAll(() => {
    process.env = prevEnv;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpRoot);
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['fiestas/f1.json'] = copia(FIESTA_DOCS);
    almacen['company-info.json'] = {
      companyName: 'AK Producciones',
      companyContact: '099123456',
      companyTaxId: '220372680019',
      emailContador: 'contador@estudio.com.uy',
    };
    sesionActual = { success: false };
    portalAutorizado = false;
    soloSueldosUserId = null;
    fiestaPortalMock = copia(FIESTA_DOCS);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
  });

  it('el operador asignado no puede bajar documentos de plata ni el ZIP completo, pero sí el cronograma', async () => {
    sesionActual = { success: true, user: OPERADOR_ASIGNADO };
    const req = new NextRequest('http://localhost:3000/api/documentos-fiesta/f1/doc');

    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'contrato-cliente.pdf'] }) })).status).toBe(403);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-pago-1.pdf'] }) })).status).toBe(403);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-personal-juan.pdf'] }) })).status).toBe(403);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'adenda-fecha.pdf'] }) })).status).toBe(403);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'download-all.zip'] }) })).status).toBe(403);

    const resCronograma = await downloadDocFiestaGET(req, {
      params: Promise.resolve({ parts: ['f1', 'cronograma-fiesta.pdf'] }),
    });
    expect(resCronograma.status).toBe(200);
  });

  it('la secretaria (CONTABILIDAD sin SUELDOS) baja documentos del cliente y en el ZIP omite recibos de personal; quien tiene SUELDOS sin CONTABILIDAD baja recibo personal y no contratos', async () => {
    const req = new NextRequest('http://localhost:3000/api/documentos-fiesta/f1/doc');

    sesionActual = { success: true, user: SECRETARIA };
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'contrato-cliente.pdf'] }) })).status).toBe(200);

    const zipRes = await downloadDocFiestaGET(req, {
      params: Promise.resolve({ parts: ['f1', 'download-all.zip'] }),
    });
    expect(zipRes.status).toBe(200);
    const zip = await JSZip.loadAsync(Buffer.from(await zipRes.arrayBuffer()));
    expect(Object.keys(zip.files)).not.toContain('recibo-personal-juan.pdf');
    expect(Object.keys(zip.files)).toContain('contrato-cliente.pdf');

    sesionActual = { success: true, user: DUENO };
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-personal-juan.pdf'] }) })).status).toBe(200);

    soloSueldosUserId = 'sueldos-1';
    try {
      sesionActual = { success: true, user: { userId: 'sueldos-1', email: 'sueldos@ak.test', perfil: 'secretaria' } };
      expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-personal-juan.pdf'] }) })).status).toBe(200);
      expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'contrato-cliente.pdf'] }) })).status).toBe(403);
      expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'download-all.zip'] }) })).status).toBe(403);
    } finally {
      soloSueldosUserId = null;
    }
  });

  it('el portal del cliente sólo recibe y descarga documentos del cliente, nunca recibos de personal o internos', async () => {
    const element = await PublicPortalPage({ params: Promise.resolve({ accessKey: 'clave-portal-372' }) }) as any;
    const dto = element.props.fiesta;
    const tiposEnviados = (dto.othersDocumentos || []).map((d: any) => d.tipo);

    expect(tiposEnviados).toContain('contrato_servicio');
    expect(tiposEnviados).toContain('recibo_pago');
    expect(tiposEnviados).toContain('cambio-fecha');
    expect(tiposEnviados).not.toContain('recibo_personal');
    expect(tiposEnviados).not.toContain('recibo_agadu');
    expect(tiposEnviados).not.toContain('otro');

    sesionActual = { success: false };
    portalAutorizado = true;
    const req = new NextRequest('http://localhost:3000/api/documentos-fiesta/f1/doc');

    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'contrato-cliente.pdf'] }) })).status).toBe(200);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-pago-1.pdf'] }) })).status).toBe(200);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-personal-juan.pdf'] }) })).status).toBe(403);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'recibo-agadu.pdf'] }) })).status).toBe(403);
    expect((await downloadDocFiestaGET(req, { params: Promise.resolve({ parts: ['f1', 'cronograma-fiesta.pdf'] }) })).status).toBe(403);
  });

  it('getCompanyInfoPublica omite emailContador y getEmailContador exige PERMISOS.CONTABILIDAD', async () => {
    const publica = await getCompanyInfoPublica();
    expect(publica.companyName).toBe('AK Producciones');
    expect(publica.emailContador).toBeUndefined();
    expect('emailContador' in publica).toBe(false);

    sesionActual = { success: true, user: OPERADOR_ASIGNADO };
    await expect(getEmailContador()).rejects.toThrow();

    sesionActual = { success: true, user: PERSONAL };
    await expect(getEmailContador()).rejects.toThrow();

    sesionActual = { success: true, user: SECRETARIA };
    await expect(getEmailContador()).resolves.toBe('contador@estudio.com.uy');
  });
});

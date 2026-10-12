/**
 * @jest-environment node
 *
 * Orden 155 (Codex, auditoría 109): cinco rutas servían contratos, presupuestos, comprobantes y
 * contratos laborales a cualquiera con sesión. El operador y el personal tienen sesión: bajaban
 * documentos de plata y sueldos. Ahora cada ruta pide el permiso del área (con los perfiles de
 * verdad, no un permiso inventado) y el firmador genérico de archivos también.
 *
 * Se prueba con la sesión de cada perfil y un archivo de mentira: el permitido recibe los bytes,
 * el resto 403 y sin sesión 401.
 */
import { NextRequest } from 'next/server';

let usuario: { perfil?: string; role?: string } | null = null;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (usuario ? { success: true, user: usuario } : { success: false, error: 'sin sesión' })),
}));

const BYTES = Buffer.from('%PDF-1.4 ficticio');
jest.mock('fs/promises', () => ({
  __esModule: true,
  default: { access: jest.fn(async () => undefined), readFile: jest.fn(async () => BYTES) },
  access: jest.fn(async () => undefined),
  readFile: jest.fn(async () => BYTES),
}));

jest.mock('@/lib/firebase/storage', () => ({
  extractStoragePath: (p: string) => p,
  getSignedUrl: jest.fn(async () => 'https://storage.example/firmado'),
}));

import { GET as contratoLaboral } from '@/app/api/employee-contracts/[filename]/route';
import { GET as contrato } from '@/app/api/contracts/[filename]/route';
import { GET as comprobante } from '@/app/api/payment-proofs/[filename]/route';
import { GET as presupuesto } from '@/app/api/budgets/[filename]/route';
import { GET as contratoSalon } from '@/app/api/salon-contracts/[filename]/route';
import { GET as contratoFiesta } from '@/app/api/contracts/fiestas/[...parts]/route';
import { GET as firmador } from '@/app/api/storage/signed-url/route';

const req = (url = 'http://localhost/api/x') => new NextRequest(url);
const archivo = (filename: string) => ({ params: Promise.resolve({ filename }) });

type Caso = { nombre: string; pedir: () => Promise<Response>; permitidos: string[] };
const PLATA = ['dueno', 'secretaria'];
const casos: Caso[] = [
  { nombre: 'contrato laboral', pedir: () => contratoLaboral(req(), archivo('emp.pdf')), permitidos: ['dueno'] },
  { nombre: 'contrato del cliente', pedir: () => contrato(req(), archivo('c.pdf')), permitidos: PLATA },
  { nombre: 'comprobante de pago', pedir: () => comprobante(req(), archivo('p.pdf')), permitidos: PLATA },
  { nombre: 'presupuesto', pedir: () => presupuesto(req(), archivo('b.pdf')), permitidos: PLATA },
  { nombre: 'contrato del salón', pedir: () => contratoSalon(req(), archivo('s.pdf')), permitidos: PLATA },
  {
    nombre: 'contrato de la fiesta',
    pedir: () => contratoFiesta(req(), { params: Promise.resolve({ parts: ['f1', 'c.pdf'] }) }),
    permitidos: PLATA,
  },
  {
    nombre: 'firmador de archivos',
    pedir: () => firmador(req('http://localhost/api/storage/signed-url?path=contratos/x.pdf')),
    permitidos: PLATA,
  },
];

const PERFILES = ['dueno', 'secretaria', 'operador', 'personal', 'cliente', 'invitado'];

describe('los documentos de plata y sueldos piden el permiso del área', () => {
  afterEach(() => { usuario = null; });

  for (const caso of casos) {
    for (const perfil of PERFILES) {
      const permitido = caso.permitidos.includes(perfil);
      it(`${caso.nombre}: ${perfil} ${permitido ? 'lo baja' : 'recibe 403'}`, async () => {
        usuario = { perfil };
        const res = await caso.pedir();
        if (permitido) {
          expect([200, 307]).toContain(res.status);
        } else {
          expect(res.status).toBe(403);
        }
      });
    }

    it(`${caso.nombre}: sin sesión recibe 401`, async () => {
      usuario = null;
      const res = await caso.pedir();
      expect(res.status).toBe(401);
    });
  }

  it('el dueño recibe los bytes exactos del documento', async () => {
    usuario = { perfil: 'dueno' };
    const res = await contrato(req(), archivo('c.pdf'));
    expect(Buffer.from(await res.arrayBuffer()).equals(BYTES)).toBe(true);
  });
});

describe('la exportación de presupuestos para el tablero externo', () => {
  it('con sesión de operador o personal recibe 403', async () => {
    const { GET } = await import('@/app/api/analytics/looker-export/route');
    for (const perfil of ['operador', 'personal']) {
      usuario = { perfil };
      const res = await GET(new Request('http://localhost/api/analytics/looker-export'));
      expect(res.status).toBe(403);
    }
    usuario = null;
  });
});

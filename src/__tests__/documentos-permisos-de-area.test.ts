/** @jest-environment node */

jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('fs/promises', () => ({ access: jest.fn(), readFile: jest.fn() }));

import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import { verifySession } from '@/lib/auth/session-token';
import { GET as getEmployeeContract } from '@/app/api/employee-contracts/[filename]/route';
import { GET as getContract } from '@/app/api/contracts/[filename]/route';
import { GET as getPaymentProof } from '@/app/api/payment-proofs/[filename]/route';
import { GET as getBudget } from '@/app/api/budgets/[filename]/route';
import { GET as getSalonContract } from '@/app/api/salon-contracts/[filename]/route';
import { GET as getFiestaContract } from '@/app/api/contracts/fiestas/[...parts]/route';

const pdf = Buffer.from('%PDF-anonimo');
const archivos = [
  { nombre: 'contrato de empleado', get: getEmployeeContract, params: { filename: 'empleado.pdf' } },
  { nombre: 'contrato', get: getContract, params: { filename: 'contrato.pdf' } },
  { nombre: 'comprobante de pago', get: getPaymentProof, params: { filename: 'pago.pdf' } },
  { nombre: 'presupuesto', get: getBudget, params: { filename: 'presupuesto.pdf' } },
  { nombre: 'contrato de salon', get: getSalonContract, params: { filename: 'salon.pdf' } },
  { nombre: 'contrato de fiesta', get: getFiestaContract, params: { parts: ['fiesta-1', 'contrato.pdf'] } },
];

type Archivo = (typeof archivos)[number];

function request(archivo: Archivo) {
  return new NextRequest('http://localhost/api/documento');
}

function get(archivo: Archivo, params: Record<string, unknown> = archivo.params) {
  return archivo.get(request(archivo), { params: Promise.resolve(params) } as never);
}

function sesion(perfil: string | undefined, role = 'user') {
  (verifySession as jest.Mock).mockResolvedValue(perfil
    ? { success: true, user: { userId: `u-${perfil}`, role, perfil } }
    : { success: false, error: 'No autorizado' });
}

beforeEach(() => {
  jest.clearAllMocks();
  (fs.access as jest.Mock).mockResolvedValue(undefined);
  (fs.readFile as jest.Mock).mockResolvedValue(pdf);
});

describe.each(archivos)('$nombre', (archivo) => {
  it('permite al dueno y responde con el PDF y sus cabeceras', async () => {
    sesion('dueno');
    const response = await get(archivo);
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(pdf);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('inline; filename=');
    expect(fs.access).toHaveBeenCalledTimes(1);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });

  it('permite a secretaria documentos financieros, pero no contratos de empleados', async () => {
    sesion('secretaria');
    const response = await get(archivo);
    if (archivo === archivos[0]) {
      expect(response.status).toBe(403);
      expect(fs.access).not.toHaveBeenCalled();
      expect(fs.readFile).not.toHaveBeenCalled();
    } else {
      expect(response.status).toBe(200);
      expect(fs.access).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    }
  });

  it.each(['operador', 'personal', 'cliente', 'invitado', 'prospecto'])('%s no puede leer el archivo ni tocar el disco', async (perfil) => {
    sesion(perfil);
    expect((await get(archivo)).status).toBe(403);
    expect(fs.access).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('rechaza anónimos antes de consultar el disco', async () => {
    sesion(undefined);
    expect((await get(archivo)).status).toBe(401);
    expect(fs.access).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('rechaza traversal antes de acceder al disco', async () => {
    sesion('dueno');
    const params = archivo === archivos[5]
      ? { parts: ['fiesta-1', '../contrato.pdf'] }
      : { filename: '../secreto.pdf' };
    expect((await get(archivo, params)).status).toBe(400);
    expect(fs.access).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('devuelve 404 si falta un archivo autorizado, sin leer contenido', async () => {
    sesion('dueno');
    (fs.access as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect((await get(archivo)).status).toBe(404);
      expect(fs.access).toHaveBeenCalledTimes(1);
      expect(fs.readFile).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it('devuelve 403 y no busca un archivo aunque exista cuando el perfil está restringido', async () => {
    sesion(archivo === archivos[0] ? 'secretaria' : 'operador');
    expect((await get(archivo)).status).toBe(403);
    expect(fs.access).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});

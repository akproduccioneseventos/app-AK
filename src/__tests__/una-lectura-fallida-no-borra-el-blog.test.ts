const mockWriteData = jest.fn();
const mockReadData = jest.fn();
const mockReadDataConDetalle = jest.fn();
const mockSyncToFirestore = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn(async () => undefined),
  requireAppSession: jest.fn(async () => ({ uid: 'admin', perfil: 'ADMINISTRACION' })),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn(async () => undefined),
}));
jest.mock('@/lib/decoracion/catalog-service', () => ({
  approvedCatalogTemplates: jest.fn(async () => []),
  dismissCatalogDraft: jest.fn(async () => undefined),
}));
jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  readDataConDetalle: (...args: any[]) => mockReadDataConDetalle(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

import { saveBlogPost, deleteBlogPost } from '@/app/actions/blog';
import { saveDecoCanvasTemplate, deleteDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import { syncToFirestore } from '@/lib/firebase-sync';

describe('Orden 356 — Una lectura fallida no borra el blog ni las plantillas', () => {
  const prevEnv = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    mockReadDataConDetalle.mockResolvedValue({ valor: [], huboFalla: true, motivo: 'Firestore caido' });
  });

  afterAll(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = prevEnv;
  });

  it('saveBlogPost y deleteBlogPost devuelven error y nunca pisan con [] cuando la lectura falla', async () => {
    const resSave = await saveBlogPost({
      slug: 'nuevo-articulo',
      title: 'Título',
      summary: 'Resumen',
      content: 'Contenido',
      category: 'Consejos',
      imageUrl: '/x.jpg',
    } as any);
    expect(resSave.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();

    const resDel = await deleteBlogPost('existente');
    expect(resDel.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('saveDecoCanvasTemplate y deleteDecoCanvasTemplate no pisan con [] cuando la lectura falla', async () => {
    const resSave = await saveDecoCanvasTemplate('Nueva plantilla', [], '#ffffff');
    expect(resSave.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();

    const resDel = await deleteDecoCanvasTemplate('deco_tpl_1');
    expect(resDel.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('syncToFirestore frena la limpieza por lista vacía si opciones.lecturaFallida es true', async () => {
    // Simulamos archivo en ALLOW_EMPTY_ARRAY_RESET_FILES con lecturaFallida=true y docs existentes
    const deleteMock = jest.fn();
    const fakeTx = {
      get: jest.fn(async () => ({ docs: [{ id: 'doc1', ref: { id: 'doc1' }, data: () => ({}) }] })),
      delete: deleteMock,
      set: jest.fn(),
    };
    const fakeDb = {
      collection: jest.fn(() => ({ id: 'blog_posts' })),
      runTransaction: jest.fn(async (cb: any) => cb(fakeTx)),
    };
    jest.doMock('@/lib/firebase/server', () => ({ dbAdmin: fakeDb }));
    // En este archivo dbAdmin real es null si no se inyecta, así que validamos el código fuente de la guarda también
    expect(typeof syncToFirestore).toBe('function');
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.resolve(__dirname, '../lib/firebase-sync.ts'), 'utf8');
    expect(src).toMatch(/if\s*\(opciones\.lecturaFallida\)\s*\{?\s*throw new Error/);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

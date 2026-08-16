jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    access: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

import { readData, writeData } from '@/lib/data-service';
import { requirePermiso } from '@/lib/auth/require-session';
import { syncInstagramPosts } from '@/app/actions/social-media';
import { MARKETING_AUTOMATION_INTERNAL_TOKEN } from '@/lib/marketing/internal-token';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockRequirePermiso = requirePermiso as jest.MockedFunction<typeof requirePermiso>;

describe('sincronizacion real de Instagram', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.META_INSTAGRAM_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    delete process.env.INSTAGRAM_USER_ID;
    delete process.env.AK_ALLOW_DEMO_INSTAGRAM;
    mockReadData.mockResolvedValue([]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('no presenta publicaciones simuladas como una sincronizacion exitosa', async () => {
    const result = await syncInstagramPosts(MARKETING_AUTOMATION_INTERNAL_TOKEN);

    expect(result).toMatchObject({
      success: false,
      photosCount: 0,
      videosCount: 0,
      plannerCount: 0,
    });
    // Lo que importa es que avise que Instagram no esta conectado y no guarde
    // nada. Antes se exigia que el texto dijera "Graph API": eso es jerga que el
    // usuario no entiende, y atar la prueba a esa palabra impedia mejorar el
    // mensaje sin romperla.
    expect(result.error).toMatch(/instagram/i);
    expect(result.error).toMatch(/no esta conectado|no está conectado/i);
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockRequirePermiso).not.toHaveBeenCalled();
  });

  it('mantiene la sincronizacion manual protegida por sesion', async () => {
    await syncInstagramPosts();

    expect(mockRequirePermiso).toHaveBeenCalledTimes(1);
  });
});

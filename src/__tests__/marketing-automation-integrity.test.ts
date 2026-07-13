jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/blog-ai-generator', () => ({
  generateBlogPostAndSocialDraft: jest.fn(),
}));

jest.mock('@/app/actions/social-media', () => ({
  syncInstagramPosts: jest.fn(),
}));

import { readData, writeData } from '@/lib/data-service';
import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';
import { syncInstagramPosts } from '@/app/actions/social-media';
import { runMarketingAutomation } from '@/lib/marketing-automation';
import { MARKETING_AUTOMATION_INTERNAL_TOKEN } from '@/lib/marketing/internal-token';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockGenerateBlog = generateBlogPostAndSocialDraft as jest.MockedFunction<typeof generateBlogPostAndSocialDraft>;
const mockSyncInstagram = syncInstagramPosts as jest.MockedFunction<typeof syncInstagramPosts>;

describe('automatizacion de marketing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GOOGLE_API_KEY: 'test-key' };
    mockReadData.mockResolvedValue({});
    mockGenerateBlog.mockResolvedValue({
      blogPost: { slug: 'consejo-eventos', title: 'Consejo para tu evento', category: 'Consejos' },
      socialPost: { id: 'social_1', platform: 'Instagram' },
    } as Awaited<ReturnType<typeof generateBlogPostAndSocialDraft>>);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('genera SEO aunque Instagram todavia no este conectado', async () => {
    mockSyncInstagram.mockResolvedValue({
      success: false,
      photosCount: 0,
      videosCount: 0,
      plannerCount: 0,
      error: 'Instagram no configurado.',
    });

    const result = await runMarketingAutomation({ force: true, source: 'cron' });

    expect(mockSyncInstagram).toHaveBeenCalledWith(MARKETING_AUTOMATION_INTERNAL_TOKEN);
    expect(mockGenerateBlog).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      success: true,
      ranSeo: true,
      ranInstagram: false,
      warning: 'Instagram no configurado.',
    });
    expect(mockWriteData).toHaveBeenCalledWith(
      'marketing-automation-state.json',
      expect.objectContaining({ lastSeoRunAt: expect.any(String) }),
      undefined,
      { skipAutoBackup: true }
    );
    const savedState = mockWriteData.mock.calls[0][1] as Record<string, unknown>;
    expect(savedState).not.toHaveProperty('lastInstagramSyncAt');
  });

  it('no llama a Gemini cuando la clave no esta configurada', async () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    mockSyncInstagram.mockResolvedValue({
      success: true,
      photosCount: 1,
      videosCount: 0,
      plannerCount: 1,
    });

    const result = await runMarketingAutomation({ force: true, source: 'admin' });

    expect(mockGenerateBlog).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      ranSeo: false,
      ranInstagram: true,
    });
    expect(result.warning).toMatch(/Gemini/i);
  });

  it('no guarda una ejecucion cuando ninguna tarea pudo completarse', async () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    mockSyncInstagram.mockResolvedValue({
      success: false,
      photosCount: 0,
      videosCount: 0,
      plannerCount: 0,
      error: 'Instagram no configurado.',
    });

    const result = await runMarketingAutomation({ force: true, source: 'admin' });

    expect(result.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});

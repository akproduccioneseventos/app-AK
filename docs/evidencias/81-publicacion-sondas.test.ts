import * as dataService from '@/lib/data-service';
import { publishToFacebookPage } from '@/lib/social-media/meta-publisher';
import { publishToTikTok } from '@/lib/social-media/tiktok-publisher';
import {
  procesarPosteosProgramados,
  publishPostInternal,
} from '@/lib/presencia-digital/publicador';

jest.mock('@/lib/data-service');
jest.mock('@/lib/social-media/meta-publisher', () => ({
  publishToFacebookPage: jest.fn(),
  publishToInstagramBusiness: jest.fn(),
}));
jest.mock('@/lib/social-media/tiktok-publisher', () => ({
  publishToTikTok: jest.fn(),
}));
jest.mock('@/lib/social-media/youtube-publisher', () => ({ publishToYouTube: jest.fn() }));
jest.mock('@/lib/social-media/google-business-publisher', () => ({ publishToGoogleBusiness: jest.fn() }));
jest.mock('@/lib/social-media/pinterest-publisher', () => ({ publishToPinterest: jest.fn() }));
jest.mock('@/lib/social-media/threads-publisher', () => ({ publishToThreads: jest.fn() }));
jest.mock('@/lib/social-media/x-publisher', () => ({ publishToX: jest.fn() }));
jest.mock('@/lib/social-media/unified-gateway-publisher', () => ({ publishToUnifiedGateway: jest.fn() }));

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

describe('Sondas de publicación 81', () => {
  let storedPosts: any[];
  let connections: any[];
  const previousLocalMode = process.env.AK_USE_LOCAL_JSON_ONLY;
  afterAll(() => {
    if (previousLocalMode === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = previousLocalMode;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    storedPosts = [];
    connections = [];

    (dataService.readData as jest.Mock).mockImplementation(async (file: string, fallback: any) => {
      if (file === 'social-posts.json') return clone(storedPosts);
      if (file === 'social-connections.json') return clone(connections);
      return clone(fallback);
    });
    (dataService.writeData as jest.Mock).mockImplementation(async (file: string, value: any) => {
      if (file === 'social-posts.json') storedPosts = clone(value);
    });
    (dataService.createDataItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('no reenvía a TikTok un post que sigue PROCESSING en la siguiente corrida', async () => {
    storedPosts = [{
      id: 'post-tiktok-processing-81',
      platform: 'TikTok',
      isGeneralCampaign: true,
      publishDate: '2026-10-08T10:00:00.000Z',
      text: 'Sonda de publicación',
      mediaUrl: 'https://example.com/video.mp4',
      mediaType: 'video',
      status: 'Programado',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    }];
    connections = [{ platform: 'TikTok', isConnected: true, accessToken: 'mock-token' }];
    (publishToTikTok as jest.Mock).mockResolvedValue({
      success: true,
      status: 'PROCESSING',
      publishId: 'mock-processing-81',
    });

    await procesarPosteosProgramados(3, new Date('2026-10-09T10:00:00.000Z'));
    await procesarPosteosProgramados(3, new Date('2026-10-09T10:01:00.000Z'));

    expect(publishToTikTok).toHaveBeenCalledTimes(1);
  });

  it('no entrega dos veces el mismo post ante dos publicaciones concurrentes', async () => {
    storedPosts = [{
      id: 'post-facebook-concurrente-81',
      platform: 'Facebook',
      isGeneralCampaign: true,
      publishDate: '2026-10-08T10:00:00.000Z',
      text: 'Sonda de concurrencia',
      status: 'Programado',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    }];
    connections = [{
      platform: 'Facebook',
      isConnected: true,
      pageId: 'mock-page',
      pageAccessToken: 'mock-token',
    }];

    let releaseProvider!: () => void;
    const providerGate = new Promise<void>((resolve) => { releaseProvider = resolve; });
    (publishToFacebookPage as jest.Mock).mockImplementation(async () => {
      await providerGate;
      return { success: true, postId: 'mock-facebook-delivery-81' };
    });

    const deliveries = Promise.all([
      publishPostInternal('post-facebook-concurrente-81'),
      publishPostInternal('post-facebook-concurrente-81'),
    ]);
    // Release independently: a correct single delivery must not deadlock this probe.
    await new Promise<void>((resolve) => setImmediate(resolve));
    releaseProvider();
    await deliveries;

    expect(publishToFacebookPage).toHaveBeenCalledTimes(1);
  });
});

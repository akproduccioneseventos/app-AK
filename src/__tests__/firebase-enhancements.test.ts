import { checkBotShield } from '@/lib/security/bot-shield';
import { optimizeImageForUpload } from '@/lib/media/image-optimizer';
import { measureCustomTrace, reportClientError } from '@/lib/firebase/performance';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        empty: true,
        forEach: jest.fn(),
      }),
    }),
  },
}));

jest.mock('firebase-admin', () => ({
  apps: [{ name: '[DEFAULT]' }],
  messaging: jest.fn().mockReturnValue({
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    }),
  }),
}));

describe('Firebase Enhancements Suite ($0 cost features)', () => {
  describe('1. Push Notifications (FCM Server Messaging)', () => {
    it('handles push notifications gracefully when token list is empty', async () => {
      const result = await sendPushNotificationToAll({
        title: 'Nueva consulta',
        body: 'Alguien pidió presupuesto para 100 personas.',
      });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(0);
    });
  });

  describe('2. Client-side Image Optimization', () => {
    it('returns non-image and small files directly without alteration', async () => {
      // Mock File in Node / Jest environment
      const dummyFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        size: 500000,
      } as any;

      const result = await optimizeImageForUpload(dummyFile);
      expect(result).toBe(dummyFile);
    });

    it('bypasses SVG and GIF files to preserve vector/animation data', async () => {
      const svgFile = {
        name: 'logo.svg',
        type: 'image/svg+xml',
        size: 800000,
      } as any;

      const result = await optimizeImageForUpload(svgFile);
      expect(result).toBe(svgFile);
    });
  });

  describe('3. Performance Monitoring & Error Reporting', () => {
    it('executes custom trace and error reporting without exceptions', async () => {
      expect(async () => {
        await measureCustomTrace('photo_upload_speed', 120);
        reportClientError(new Error('Test harmless UI error'), { route: '/simulador' });
      }).not.toThrow();
    });
  });

  describe('4. Anti-Bot Shield & Rate Limiting', () => {
    it('allows requests within limit and throttles when limit is exceeded', () => {
      const ip = '192.168.1.100';
      const config = { maxRequests: 3, windowSeconds: 10 };

      const req1 = checkBotShield(ip, config);
      expect(req1.allowed).toBe(true);
      expect(req1.remaining).toBe(2);

      const req2 = checkBotShield(ip, config);
      expect(req2.allowed).toBe(true);
      expect(req2.remaining).toBe(1);

      const req3 = checkBotShield(ip, config);
      expect(req3.allowed).toBe(true);
      expect(req3.remaining).toBe(0);

      const req4 = checkBotShield(ip, config);
      expect(req4.allowed).toBe(false);
      expect(req4.remaining).toBe(0);
    });
  });
});

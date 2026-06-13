const getTokenMock = jest.fn();
const getMessagingMock = jest.fn(() => ({ name: 'messaging' }));
const isSupportedMock = jest.fn(async () => true);
const saveFcmTokenMock = jest.fn(async () => ({ success: true }));

jest.mock('@/lib/firebase/config', () => ({
  app: { name: 'test-app' },
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: getMessagingMock,
  getToken: getTokenMock,
  isSupported: isSupportedMock,
  onMessage: jest.fn(),
}));

jest.mock('@/app/actions/fcm-tokens', () => ({
  saveFcmToken: saveFcmTokenMock,
}));

import {
  FCM_SERVICE_WORKER_SCOPE,
  FCM_SERVICE_WORKER_URL,
  requestAndSaveFcmToken,
} from './messaging';

describe('Firebase messaging service worker registration', () => {
  const registration = { scope: `https://ak.test${FCM_SERVICE_WORKER_SCOPE}/` };
  const pwaRegistration = { scope: 'https://ak.test/' };
  const registerMock = jest.fn(async () => registration);
  const requestPermissionMock = jest.fn(async () => 'granted');

  beforeEach(() => {
    jest.clearAllMocks();
    getTokenMock.mockResolvedValue('fcm-token-test');

    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: requestPermissionMock,
      },
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve(pwaRegistration),
        register: registerMock,
      },
    });

    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'AK test browser',
    });
  });

  it('registers the dedicated FCM worker without replacing the root PWA worker', async () => {
    const token = await requestAndSaveFcmToken('user-1');

    expect(token).toBe('fcm-token-test');
    expect(registerMock).toHaveBeenCalledWith(FCM_SERVICE_WORKER_URL, {
      scope: FCM_SERVICE_WORKER_SCOPE,
      updateViaCache: 'none',
    });
    expect(getTokenMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        serviceWorkerRegistration: registration,
      })
    );
    expect(getTokenMock.mock.calls[0][1].serviceWorkerRegistration).not.toBe(pwaRegistration);
    expect(saveFcmTokenMock).toHaveBeenCalledWith(
      'fcm-token-test',
      'user-1',
      'AK test browser'
    );
  });

  it('does not request a token when notification permission is denied', async () => {
    requestPermissionMock.mockResolvedValueOnce('denied');

    await expect(requestAndSaveFcmToken()).resolves.toBeNull();
    expect(registerMock).not.toHaveBeenCalled();
    expect(getTokenMock).not.toHaveBeenCalled();
  });

  it('fails safely when the dedicated worker cannot be registered', async () => {
    registerMock.mockRejectedValueOnce(new Error('registration failed'));

    await expect(requestAndSaveFcmToken()).resolves.toBeNull();
    expect(getTokenMock).not.toHaveBeenCalled();
    expect(saveFcmTokenMock).not.toHaveBeenCalled();
  });
});

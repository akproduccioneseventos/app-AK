const mockHasControlAccess = jest.fn();
const mockHasGuestAccess = jest.fn();
const mockGetFiestaById = jest.fn();
const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();
const mockDocumentSet = jest.fn();

const mockDocumentRef = { id: 'fiesta-1_fotocabina' };
const mockTransaction = {
  get: (...args: unknown[]) => mockTransactionGet(...args),
  set: (...args: unknown[]) => mockTransactionSet(...args),
};

jest.mock('@/lib/auth/entertainment-token', () => ({
  hasEntertainmentControlAccess: (...args: unknown[]) => mockHasControlAccess(...args),
  hasEntertainmentGuestAccess: (...args: unknown[]) => mockHasGuestAccess(...args),
}));

jest.mock('@/lib/entertainment/station-config', () => ({
  isEntertainmentModuleId: jest.fn(() => true),
  getEntertainmentStationConfig: jest.fn(() => ({ enabled: true })),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ ...mockDocumentRef, set: mockDocumentSet })),
    })),
    runTransaction: jest.fn(async (callback) => callback(mockTransaction)),
  },
}));

import {
  completeEntertainmentSessionCycle,
  resetEntertainmentSession,
  updateEntertainmentSessionStatus,
} from '@/app/actions/fiesta/sesion-entretenimiento';

describe('entertainment session permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasControlAccess.mockResolvedValue(false);
    mockHasGuestAccess.mockResolvedValue(true);
    mockGetFiestaById.mockResolvedValue({ id: 'fiesta-1' });
    mockDocumentSet.mockResolvedValue(undefined);
  });

  it('rejects a full reset requested with guest-only access', async () => {
    const result = await resetEntertainmentSession('fiesta-1', 'fotocabina', 'guest-token');

    expect(result.success).toBe(false);
    expect(mockDocumentSet).not.toHaveBeenCalled();
  });

  it('does not let a guest interrupt an active recording', async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ fiestaId: 'fiesta-1', moduleId: 'fotocabina', status: 'recording' }),
    });

    const result = await completeEntertainmentSessionCycle('fiesta-1', 'fotocabina', 'guest-token');

    expect(result.success).toBe(false);
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('allows the display to return an already completed cycle to idle', async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ fiestaId: 'fiesta-1', moduleId: 'fotocabina', status: 'done' }),
    });

    const result = await completeEntertainmentSessionCycle('fiesta-1', 'fotocabina', 'guest-token');

    expect(result.success).toBe(true);
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fiesta-1_fotocabina' }),
      expect.objectContaining({ status: 'idle' }),
    );
  });

  it('rejects a guest transition that skips the capture lifecycle', async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ fiestaId: 'fiesta-1', moduleId: 'fotocabina', status: 'idle' }),
    });

    const result = await updateEntertainmentSessionStatus(
      'fiesta-1',
      'fotocabina',
      'done',
      {},
      'guest-token',
    );

    expect(result.success).toBe(false);
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('sanitizes guest session data before writing a valid transition', async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        fiestaId: 'fiesta-1',
        moduleId: 'fotocabina',
        status: 'recording',
        version: 2,
        captureId: 'capture-1',
      }),
    });

    const result = await updateEntertainmentSessionStatus(
      'fiesta-1',
      'fotocabina',
      'done',
      {
        fiestaId: 'another-fiesta',
        settings: { mode: 'admin' },
        mediaUrl: 'javascript:alert(1)',
        reviewPending: false,
      },
      'guest-token',
    );

    expect(result.success).toBe(true);
    const payload = mockTransactionSet.mock.calls[0][1];
    expect(payload.fiestaId).toBe('fiesta-1');
    expect(payload.moduleId).toBe('fotocabina');
    expect(payload.captureId).toBe('capture-1');
    expect(payload.version).toBe(3);
    expect(payload.mediaUrl).toBeUndefined();
    expect(payload.settings).toBeUndefined();
    expect(payload.reviewPending).toBe(false);
  });
});

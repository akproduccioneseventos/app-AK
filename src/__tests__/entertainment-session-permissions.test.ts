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
});

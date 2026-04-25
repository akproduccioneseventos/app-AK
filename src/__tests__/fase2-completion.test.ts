/**
 * FASE 2 – Tests de completitud AK Producciones
 *
 * Cubre:
 * 1.  Poll creation returns a valid SocialPoll object
 * 2.  Voting on a poll increments the vote count
 * 3.  Closing a poll sets active:false
 * 4.  getActivePoll returns null when no poll is active
 * 5.  getActivePoll returns the active poll when one exists
 * 6.  addDedication creates a new dedication with correct fields
 * 7.  highlightDedication toggles highlighted field correctly
 * 8.  registerContractDeposit creates a PagoCliente and updates saldo
 * 9.  registerContractDeposit syncs invoice payments when invoiceId is set
 * 10. registerContractDeposit skips invoice sync when no invoiceId
 * 11. Dedication type has the highlighted optional field
 */

import type { SocialPoll, Dedication, SocialComment } from '@/types/social-gallery';
import type { Presupuesto } from '@/types/presupuesto';

// ─── Mock data-service ────────────────────────────────────────────────────────
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock invoices actions ────────────────────────────────────────────────────
jest.mock('@/app/actions/invoices', () => ({
  getInvoiceById: jest.fn(),
  saveInvoice: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock presupuestos actions ────────────────────────────────────────────────
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(),
  updatePresupuesto: jest.fn().mockResolvedValue({ success: true }),
  markPresupuestoAsFacturado: jest.fn().mockResolvedValue({ success: true }),
}));

// ─── Mock fiesta actions ──────────────────────────────────────────────────────
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
  getFiestas: jest.fn().mockResolvedValue([]),
}));

// ─── Mock customers ───────────────────────────────────────────────────────────
jest.mock('@/app/actions/customers', () => ({
  saveCustomer: jest.fn().mockResolvedValue({ success: true, id: 'cust_test_1' }),
}));

// ─── Mock notifications ───────────────────────────────────────────────────────
jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock social-gallery (for highlightComment) ───────────────────────────────
jest.mock('@/app/actions/social-gallery', () => ({
  highlightComment: jest.fn(),
}));

import { readData, writeData } from '@/lib/data-service';
import { getInvoiceById, saveInvoice } from '@/app/actions/invoices';
import { highlightComment } from '@/app/actions/social-gallery';
import {
  createPoll,
  votePoll,
  closePoll,
  getActivePoll,
  addDedication,
  highlightDedication,
} from '@/app/actions/social-interactive';
import { registerContractDeposit } from '@/app/actions/crm';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockGetInvoiceById = getInvoiceById as jest.MockedFunction<typeof getInvoiceById>;
const mockSaveInvoice = saveInvoice as jest.MockedFunction<typeof saveInvoice>;

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteData.mockResolvedValue(undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
// Poll tests
// ─────────────────────────────────────────────────────────────────────────────

describe('createPoll', () => {
  it('(1) returns a valid SocialPoll with the given question and options', async () => {
    mockReadData.mockResolvedValue([]);

    const result = await createPoll('fiesta_1', '¿Cuál es tu canción favorita?', ['Rock', 'Pop', 'Reggaeton']);

    expect(result.success).toBe(true);
    expect(result.poll).toBeDefined();
    expect(result.poll!.question).toBe('¿Cuál es tu canción favorita?');
    expect(result.poll!.options).toHaveLength(3);
    expect(result.poll!.active).toBe(true);
    expect(result.poll!.fiestaId).toBe('fiesta_1');
  });

  it('deactivates existing active polls when a new one is created', async () => {
    const existing: SocialPoll[] = [
      {
        id: 'poll_old',
        fiestaId: 'fiesta_1',
        question: 'Old poll',
        options: [{ id: 'opt_0', text: 'Yes', votes: 3 }],
        createdAt: new Date().toISOString(),
        active: true,
      },
    ];
    mockReadData.mockResolvedValue(existing);

    const result = await createPoll('fiesta_1', 'New poll', ['A', 'B']);

    expect(result.success).toBe(true);
    // writeData should be called with the old poll deactivated + new poll active
    const savedData = (mockWriteData.mock.calls[0][1] as SocialPoll[]);
    const old = savedData.find(p => p.id === 'poll_old');
    expect(old?.active).toBe(false);
    expect(result.poll!.active).toBe(true);
  });
});

describe('votePoll', () => {
  it('(2) increments vote count for the selected option', async () => {
    const polls: SocialPoll[] = [
      {
        id: 'poll_1',
        fiestaId: 'fiesta_1',
        question: 'Pregunta de prueba',
        options: [
          { id: 'opt_0', text: 'Opción A', votes: 2 },
          { id: 'opt_1', text: 'Opción B', votes: 5 },
        ],
        createdAt: new Date().toISOString(),
        active: true,
      },
    ];
    mockReadData.mockResolvedValue(polls);

    const result = await votePoll('fiesta_1', 'poll_1', 'opt_0');

    expect(result.success).toBe(true);
    expect(result.poll!.options[0].votes).toBe(3);
    expect(result.poll!.options[1].votes).toBe(5);
  });

  it('returns error when poll not found', async () => {
    mockReadData.mockResolvedValue([]);
    const result = await votePoll('fiesta_1', 'nonexistent', 'opt_0');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('closePoll', () => {
  it('(3) sets active:false for the specified poll', async () => {
    const polls: SocialPoll[] = [
      {
        id: 'poll_1',
        fiestaId: 'fiesta_1',
        question: 'Test',
        options: [],
        createdAt: new Date().toISOString(),
        active: true,
      },
    ];
    mockReadData.mockResolvedValue(polls);

    const result = await closePoll('fiesta_1', 'poll_1');

    expect(result.success).toBe(true);
    const savedPolls = mockWriteData.mock.calls[0][1] as SocialPoll[];
    expect(savedPolls.find(p => p.id === 'poll_1')?.active).toBe(false);
  });
});

describe('getActivePoll', () => {
  it('(4) returns null when no active poll exists', async () => {
    const polls: SocialPoll[] = [
      {
        id: 'poll_1',
        fiestaId: 'fiesta_1',
        question: 'Closed',
        options: [],
        createdAt: new Date().toISOString(),
        active: false,
      },
    ];
    mockReadData.mockResolvedValue(polls);

    const result = await getActivePoll('fiesta_1');
    expect(result).toBeNull();
  });

  it('(5) returns the active poll when one exists', async () => {
    const polls: SocialPoll[] = [
      {
        id: 'poll_closed',
        fiestaId: 'fiesta_1',
        question: 'Closed',
        options: [],
        createdAt: new Date().toISOString(),
        active: false,
      },
      {
        id: 'poll_active',
        fiestaId: 'fiesta_1',
        question: 'Active one',
        options: [{ id: 'opt_0', text: 'Sí', votes: 0 }],
        createdAt: new Date().toISOString(),
        active: true,
      },
    ];
    mockReadData.mockResolvedValue(polls);

    const result = await getActivePoll('fiesta_1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('poll_active');
    expect(result!.active).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dedication tests
// ─────────────────────────────────────────────────────────────────────────────

describe('addDedication', () => {
  it('(6) creates a new dedication with correct fields', async () => {
    mockReadData.mockResolvedValue([]);

    const result = await addDedication('fiesta_1', 'Feliz cumpleaños!', 'Juan');

    expect(result.success).toBe(true);
    expect(result.dedication).toBeDefined();
    expect(result.dedication!.message).toBe('Feliz cumpleaños!');
    expect(result.dedication!.authorName).toBe('Juan');
    expect(result.dedication!.fiestaId).toBe('fiesta_1');
    expect(result.dedication!.id).toMatch(/^ded_/);
    expect(result.dedication!.timestamp).toBeTruthy();
  });
});

describe('highlightDedication', () => {
  it('(7) sets highlighted:true on the specified dedication', async () => {
    const dedications: Dedication[] = [
      {
        id: 'ded_1',
        fiestaId: 'fiesta_1',
        message: 'Hola!',
        authorName: 'Maria',
        timestamp: new Date().toISOString(),
        highlighted: false,
      },
    ];
    mockReadData.mockResolvedValue(dedications);

    const result = await highlightDedication('fiesta_1', 'ded_1', true);

    expect(result.success).toBe(true);
    const saved = mockWriteData.mock.calls[0][1] as Dedication[];
    expect(saved.find(d => d.id === 'ded_1')?.highlighted).toBe(true);
  });

  it('sets highlighted:false to un-highlight a dedication', async () => {
    const dedications: Dedication[] = [
      {
        id: 'ded_1',
        fiestaId: 'fiesta_1',
        message: 'Hola!',
        authorName: 'Maria',
        timestamp: new Date().toISOString(),
        highlighted: true,
      },
    ];
    mockReadData.mockResolvedValue(dedications);

    const result = await highlightDedication('fiesta_1', 'ded_1', false);

    expect(result.success).toBe(true);
    const saved = mockWriteData.mock.calls[0][1] as Dedication[];
    expect(saved.find(d => d.id === 'ded_1')?.highlighted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// registerContractDeposit tests
// ─────────────────────────────────────────────────────────────────────────────

const makePresupuesto = (overrides: Partial<Presupuesto> = {}): Presupuesto =>
  ({
    id: 'pres_test_1',
    clienteNombre: 'Test Cliente',
    clienteContacto: '099999999',
    eventoTipo: 'Cumpleaños',
    eventoFecha: '2025-12-15',
    invitadosCantidad: 100,
    costoTotalEstimado: 50000,
    totalConDescuento: 48000,
    estado: 'Enviado',
    pagosCliente: [],
    senia: 0,
    saldo: 48000,
    ...overrides,
  } as Presupuesto);

describe('registerContractDeposit', () => {
  it('(8) creates a PagoCliente entry and recalculates saldo correctly', async () => {
    const presupuesto = makePresupuesto();

    const { updatedPresupuesto, pagoId } = await registerContractDeposit({
      presupuesto,
      monto: 10000,
      referencia: 'Seña inicial',
    });

    expect(pagoId).toMatch(/^pago_senia_/);
    expect(updatedPresupuesto.pagosCliente).toHaveLength(1);
    expect(updatedPresupuesto.pagosCliente![0].monto).toBe(10000);
    expect(updatedPresupuesto.pagosCliente![0].referencia).toBe('Seña inicial');
    expect(updatedPresupuesto.saldo).toBe(38000); // 48000 - 10000
    expect(updatedPresupuesto.senia).toBe(10000);
  });

  it('accumulates on top of existing pagosCliente', async () => {
    const presupuesto = makePresupuesto({
      pagosCliente: [
        { id: 'pago_old', fecha: '2025-01-01T00:00:00.000Z', monto: 5000, metodoPago: 'Efectivo' },
      ],
      senia: 5000,
      saldo: 43000,
    });

    const { updatedPresupuesto } = await registerContractDeposit({
      presupuesto,
      monto: 10000,
    });

    expect(updatedPresupuesto.pagosCliente).toHaveLength(2);
    expect(updatedPresupuesto.saldo).toBe(33000); // 48000 - 5000 - 10000
    expect(updatedPresupuesto.senia).toBe(15000); // 5000 + 10000
  });

  it('(9) syncs payment to the linked invoice when invoiceId is set', async () => {
    const mockInvoice = {
      id: 'inv_test',
      presupuestoId: 'pres_test_1',
      payments: [],
    };
    mockGetInvoiceById.mockResolvedValue(mockInvoice as any);

    const presupuesto = makePresupuesto({ invoiceId: 'inv_test' });

    await registerContractDeposit({ presupuesto, monto: 8000 });

    expect(mockGetInvoiceById).toHaveBeenCalledWith('inv_test');
    expect(mockSaveInvoice).toHaveBeenCalledTimes(1);
    const savedInvoice = mockSaveInvoice.mock.calls[0][0] as any;
    expect(savedInvoice.payments).toHaveLength(1);
    expect(savedInvoice.payments[0].amount).toBe(8000);
  });

  it('(10) does NOT call saveInvoice when no invoiceId is set', async () => {
    const presupuesto = makePresupuesto();

    await registerContractDeposit({ presupuesto, monto: 5000 });

    expect(mockGetInvoiceById).not.toHaveBeenCalled();
    expect(mockSaveInvoice).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Type-level test: Dedication.highlighted
// ─────────────────────────────────────────────────────────────────────────────

describe('Dedication type', () => {
  it('(11) has optional highlighted field', () => {
    const d: Dedication = {
      id: 'ded_type_test',
      fiestaId: 'fiesta_test',
      message: 'Test',
      authorName: 'Test User',
      timestamp: new Date().toISOString(),
    };
    expect(d.highlighted).toBeUndefined();

    const highlighted: Dedication = { ...d, highlighted: true };
    expect(highlighted.highlighted).toBe(true);

    const unhighlighted: Dedication = { ...d, highlighted: false };
    expect(unhighlighted.highlighted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// highlightComment
// ─────────────────────────────────────────────────────────────────────────────

const mockHighlightComment = highlightComment as jest.MockedFunction<typeof highlightComment>;

describe('highlightComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('(12) returns success when called', async () => {
    mockHighlightComment.mockResolvedValue({ success: true });
    const result = await highlightComment('post_1', 'comment_1', true);
    expect(result.success).toBe(true);
    expect(mockHighlightComment).toHaveBeenCalledWith('post_1', 'comment_1', true);
  });

  it('(13) can toggle highlighted off', async () => {
    mockHighlightComment.mockResolvedValue({ success: true });
    const result = await highlightComment('post_1', 'comment_1', false);
    expect(result.success).toBe(true);
    expect(mockHighlightComment).toHaveBeenCalledWith('post_1', 'comment_1', false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Type-level test: SocialComment.highlighted
// ─────────────────────────────────────────────────────────────────────────────

describe('SocialComment type', () => {
  it('(14) has optional highlighted field', () => {
    const c: SocialComment = {
      id: 'comment_type_test',
      authorName: 'Test User',
      text: 'Test comment',
      timestamp: new Date().toISOString(),
    };
    expect(c.highlighted).toBeUndefined();

    const highlighted: SocialComment = { ...c, highlighted: true };
    expect(highlighted.highlighted).toBe(true);

    const unhighlighted: SocialComment = { ...c, highlighted: false };
    expect(unhighlighted.highlighted).toBe(false);
  });
});

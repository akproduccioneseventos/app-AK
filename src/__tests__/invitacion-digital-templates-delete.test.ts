import { deleteInvitationTemplate } from '@/app/actions/invitacion-digital-templates';
import { deleteDataItem, readData, writeData } from '@/lib/data-service';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
  deleteDataItem: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
}));

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockDelete = deleteDataItem as jest.MockedFunction<typeof deleteDataItem>;

describe('deleteInvitationTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadData.mockResolvedValue([]);
    mockWriteData.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(true);
  });

  it('rechaza una plantilla incorporada sin escribir ni reportar éxito', async () => {
    const result = await deleteInvitationTemplate('tpl_grazia_default');

    expect(result).toEqual({
      success: false,
      error: 'Esta es una plantilla base de la app y no se puede eliminar.',
    });
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('elimina el ultimo template por ID sin reescribir la lista', async () => {
    mockReadData.mockResolvedValue([
      { id: 'tpl_custom', name: 'Mi invitación' } as any,
    ]);

    const result = await deleteInvitationTemplate('tpl_custom');

    expect(result).toEqual({ success: true });
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith('invitacion-digital-templates.json', 'invitacion_digital_templates', 'tpl_custom');
  });

  it('devuelve fallo si la persistencia del borrado falla', async () => {
    mockReadData.mockResolvedValue([
      { id: 'tpl_custom', name: 'Mi invitación' } as any,
    ]);
    mockDelete.mockRejectedValue(new Error('storage unavailable'));

    await expect(deleteInvitationTemplate('tpl_custom')).rejects.toThrow('storage unavailable');
  });

  it('no informa exito si otra persona borro primero', async () => {
    mockReadData.mockResolvedValue([{ id: 'tpl_custom', name: 'Mi invitación' } as any]);
    mockDelete.mockResolvedValue(false);
    expect((await deleteInvitationTemplate('tpl_custom')).success).toBe(false);
  });
});

import { getClientPortalHealth } from '@/lib/portal/client-portal-health';

describe('getClientPortalHealth', () => {
  it('marks a complete portal as ready', () => {
    const result = getClientPortalHealth({
      eventDate: '2099-12-01',
      totalDue: 1000,
      totalPaid: 1000,
      pendingApprovals: 0,
      pendingClientTasks: 0,
    });

    expect(result.status).toBe('ready');
    expect(result.score).toBe(100);
  });

  it('marks missing payment and tasks as attention', () => {
    const result = getClientPortalHealth({
      eventDate: '2099-12-01',
      totalDue: 1000,
      totalPaid: 600,
      pendingClientTasks: 2,
    });

    expect(result.status).toBe('attention');
    expect(result.messages.join(' ')).toContain('saldo pendiente');
  });

  it('marks many missing sections as critical', () => {
    const result = getClientPortalHealth({ missingSections: ['pagos', 'contrato', 'menu', 'musica', 'invitados'] });
    expect(result.status).toBe('critical');
  });
});

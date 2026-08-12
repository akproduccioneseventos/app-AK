import {
  ESPERA_RECONTACTO_MS,
  elegirCandidatosDeRecontacto,
} from '@/lib/marketing/candidatos-recontacto';
import type { CrmLead, CrmStage } from '@/types/crm';

/**
 * Mandar un WhatsApp a un cliente no se puede deshacer. Estas pruebas cuidan que
 * el mensaje automático no le llegue a quien no corresponde.
 */

const AHORA = new Date('2026-08-12T12:00:00.000Z');
const HACE_TRES_DIAS = new Date(AHORA.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
const HACE_UNA_HORA = new Date(AHORA.getTime() - 60 * 60 * 1000).toISOString();

function etapa(id: string, name: string, extra: Partial<CrmStage> = {}): CrmStage {
  return {
    id,
    name,
    order: 1,
    bgColor: '',
    borderColor: '',
    textColor: '',
    headerBgColor: '',
    headerTextColor: '',
    ...extra,
  };
}

const ETAPAS = [
  etapa('s1', 'Consultó'),
  etapa('s4', 'Firmó contrato', { isConversionStage: true }),
  etapa('s5', 'No contrató'),
];

function lead(id: string, extra: Partial<CrmLead> = {}): CrmLead {
  return {
    id,
    name: 'Ana Pérez',
    phone: '099123456',
    createdAt: HACE_TRES_DIAS,
    updatedAt: HACE_TRES_DIAS,
    currentStageId: 's1',
    partyType: 'Casamiento',
    marketingConsent: true,
    ...extra,
  };
}

function idsElegidos(leads: CrmLead[]) {
  return elegirCandidatosDeRecontacto(leads, ETAPAS, AHORA).candidatos.map((c) => c.id);
}

function motivoDe(leads: CrmLead[], leadId: string) {
  return elegirCandidatosDeRecontacto(leads, ETAPAS, AHORA).descartados.find(
    (d) => d.leadId === leadId,
  )?.motivo;
}

describe('a quién se le manda el recontacto automático', () => {
  it('elige al que consultó hace tres días, dio permiso y no contrató', () => {
    expect(idsElegidos([lead('l1')])).toEqual(['l1']);
  });

  it('NO le escribe al que no dio permiso de marketing', () => {
    const sinPermiso = [lead('l1', { marketingConsent: false }), lead('l2', { marketingConsent: undefined })];

    expect(idsElegidos(sinPermiso)).toEqual([]);
    expect(motivoDe(sinPermiso, 'l1')).toBe('no dio permiso de marketing');
  });

  it('NO le escribe dos veces a la misma persona', () => {
    const yaEscrito = [lead('l1', { recontactoAutomaticoAt: HACE_UNA_HORA })];

    expect(idsElegidos(yaEscrito)).toEqual([]);
    expect(motivoDe(yaEscrito, 'l1')).toBe('ya se le escribio antes');
  });

  it('NO le escribe al que ya contrató', () => {
    const clientes = [
      lead('aceptado', { presupuestoEstado: 'Aceptado' }),
      lead('facturado', { presupuestoEstado: 'Facturado' }),
      lead('conFactura', { invoiceId: 'inv_1' }),
    ];

    expect(idsElegidos(clientes)).toEqual([]);
    expect(motivoDe(clientes, 'aceptado')).toBe('ya contrato');
  });

  it('NO le escribe al que está en una etapa terminada del embudo', () => {
    const terminados = [lead('firmo', { currentStageId: 's4' }), lead('perdido', { currentStageId: 's5' })];

    expect(idsElegidos(terminados)).toEqual([]);
    expect(motivoDe(terminados, 'perdido')).toBe('esta en una etapa terminada del embudo');
  });

  it('NO le escribe antes de que pasen las 48 horas', () => {
    const reciente = [lead('l1', { createdAt: HACE_UNA_HORA })];

    expect(idsElegidos(reciente)).toEqual([]);
    expect(motivoDe(reciente, 'l1')).toBe('todavia no pasaron las 48 horas');
  });

  it('respeta la espera exacta: justo a las 48 horas ya entra', () => {
    const justo = new Date(AHORA.getTime() - ESPERA_RECONTACTO_MS).toISOString();

    expect(idsElegidos([lead('l1', { createdAt: justo })])).toEqual(['l1']);
  });

  it('descarta al que no tiene teléfono', () => {
    const sinTelefono = [lead('l1', { phone: '' }), lead('l2', { phone: undefined })];

    expect(idsElegidos(sinTelefono)).toEqual([]);
    expect(motivoDe(sinTelefono, 'l1')).toBe('sin telefono');
  });

  it('con la lista vacía no explota', () => {
    expect(idsElegidos([])).toEqual([]);
  });

  it('pasa el tipo de evento para que el mensaje no sea genérico', () => {
    const [candidato] = elegirCandidatosDeRecontacto(
      [lead('l1', { partyType: 'XV años' })],
      ETAPAS,
      AHORA,
    ).candidatos;

    expect(candidato.eventType).toBe('XV años');
  });
});

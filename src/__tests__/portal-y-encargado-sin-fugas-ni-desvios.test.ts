import fs from 'fs';
import path from 'path';
import { ejecutarEncargado } from '@/lib/multiagent/encargado';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { verifySession } from '@/lib/auth/session-token';

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(),
}));

jest.mock('@/ai/flows/multiagent-flow', () => ({
  runMultiAgent: jest.fn(),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  savePresupuesto: jest.fn(),
  getPresupuestos: jest.fn(),
}));

jest.mock('@/app/actions/crm', () => ({
  getCrmLeads: jest.fn().mockResolvedValue([]),
  addCrmLead: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  getFiestas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/multiagent', () => ({
  crearTareaDesdeMultiagente: jest.fn(),
  crearRecordatorioDesdeMultiagente: jest.fn(),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(),
}));

const RAIZ = process.cwd();

describe('Portal del cliente y Encargado sin desvíos ni fugas de plata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('el módulo Documentos del portal del cliente lleva al contrato y no al menú de comida', () => {
    const portalSource = fs.readFileSync(path.join(RAIZ, 'src/app/portal/page.tsx'), 'utf8');
    const lineaDocumentos = portalSource
      .split('\n')
      .find((line) => line.includes("id: 'documentos'"));

    expect(lineaDocumentos).toBeDefined();
    expect(lineaDocumentos).toContain('/portal/${id}/contrato');
    expect(lineaDocumentos).not.toContain('/portal-cliente/${id}/menu');
  });

  it('los atajos de módulos del portal nunca mandan al cliente a las pantallas privadas del equipo (/fiestas/nueva)', () => {
    const redirectSource = fs.readFileSync(
      path.join(RAIZ, 'src/app/portal/[fiestaId]/[module]/page.tsx'),
      'utf8'
    );

    expect(redirectSource).not.toContain('/fiestas/nueva/');
    expect(redirectSource).toContain('/portal-cliente/${fiestaId}/musica');
    expect(redirectSource).toContain('/portal-cliente/${fiestaId}/fotos-video');
    expect(redirectSource).toContain('/portal/${fiestaId}/contrato');
  });

  it('leer_presupuesto en el Encargado oculta los importes cuando pregunta un operador sin permiso de contabilidad', async () => {
    (getPresupuestos as jest.Mock).mockResolvedValue([
      {
        id: 'pres-sofia-15',
        clienteNombre: 'Sofía Martínez',
        eventoTipo: 'XV años',
        eventoFecha: '2026-11-20',
        estado: 'Aceptado',
        invitadosCantidad: 120,
        costoTotalEstimado: 185000,
        itemsPresupuestados: [{ id: 's1', nombreServicio: 'Salón Club Uruguay', precioAplicado: 95000 }],
      },
    ]);

    (verifySession as jest.Mock).mockResolvedValue({
      success: true,
      user: { uid: 'op-1', email: 'op@ak.uy', role: 'user', perfil: 'operador' },
    });

    (generateWithGeminiFallback as jest.Mock)
      .mockResolvedValueOnce({
        text: JSON.stringify({
          accion: 'leer_presupuesto',
          argumentos: { nombreCliente: 'Sofía' },
          pensamiento: 'Busco el presupuesto de Sofía',
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          accion: 'terminar',
          argumentos: { resumen: 'Listo' },
        }),
      });

    const resOperador = await ejecutarEncargado({
      message: 'Buscá el presupuesto de Sofía',
      history: [],
    });

    expect(resOperador.success).toBe(true);
    expect(resOperador.response).toContain('Sofía Martínez');
    expect(resOperador.response).not.toContain('185.000');
    expect(resOperador.response).not.toContain('185,000');
    expect(resOperador.response).not.toContain('185000');
  });

  it('leer_presupuesto en el Encargado muestra el total cuando pregunta el dueño con permiso de contabilidad', async () => {
    (getPresupuestos as jest.Mock).mockResolvedValue([
      {
        id: 'pres-sofia-15',
        clienteNombre: 'Sofía Martínez',
        eventoTipo: 'XV años',
        eventoFecha: '2026-11-20',
        estado: 'Aceptado',
        invitadosCantidad: 120,
        costoTotalEstimado: 185000,
        itemsPresupuestados: [{ id: 's1', nombreServicio: 'Salón Club Uruguay', precioAplicado: 95000 }],
      },
    ]);

    (verifySession as jest.Mock).mockResolvedValue({
      success: true,
      user: { uid: 'dueno-1', email: 'alex@ak.uy', role: 'admin', perfil: 'dueno' },
    });

    (generateWithGeminiFallback as jest.Mock)
      .mockResolvedValueOnce({
        text: JSON.stringify({
          accion: 'leer_presupuesto',
          argumentos: { nombreCliente: 'Sofía' },
          pensamiento: 'Busco el presupuesto de Sofía',
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          accion: 'terminar',
          argumentos: { resumen: 'Listo' },
        }),
      });

    const resDueno = await ejecutarEncargado({
      message: 'Buscá el presupuesto de Sofía',
      history: [],
    });

    expect(resDueno.success).toBe(true);
    expect(resDueno.response).toMatch(/185[.,]000/);
  });
});

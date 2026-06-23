import fs from 'node:fs';
import path from 'node:path';

describe('public simulator sales funnel', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/app/simulador-de-presupuesto/page.tsx'),
    'utf8',
  );
  const actionSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/actions/armado-rapido.ts'),
    'utf8',
  );

  it('uses a five-step public funnel with a separate commercial entry', () => {
    expect(source).toContain("const STEP_LABELS = ['Contacto', 'Evento', 'Menú', 'Paquete', 'Resumen']");
    expect(source).toContain('const [hasStarted, setHasStarted] = useState(false)');
    expect(source).toContain('Paso {step} de 5');
  });

  it('captures the lead before the final budget is generated', () => {
    expect(source).toContain('captureSimulatorLeadProgress');
    expect(actionSource).toContain("scope: 'public-simulator-progress'");
    expect(actionSource).toContain('upsertPublicCommercialLead');
  });

  it('downloads a generated PDF without sending the guest to the admin view', () => {
    expect(source).toContain("const { jsPDF } = await import('jspdf')");
    expect(source).not.toContain('imprimir=1&cliente=1&direct=1');
  });

  it('persists service deletion to the backend and checks removable rules', () => {
    expect(source).toContain('handleConfirmDeleteService');
    expect(source).toContain('await generateBudgetAndLeadFromSimulator(data,');
    expect(source).toContain('isServiceRemovable(item)');
  });

  it('correctly handles empty customized additional services configurations', () => {
    expect(source).toContain('budgetSettings?.serviciosAdicionalesVisibles !== undefined');
    expect(source).toContain('budgetSettings?.serviciosAdicionalesVisibles !== null');
  });
});

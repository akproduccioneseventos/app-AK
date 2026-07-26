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
  const assistantSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/simulador-ak/page.tsx'),
    'utf8',
  );
  const pdfSource = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/budget/simulator-budget-pdf.ts'),
    'utf8',
  );

  it('uses a five-step public funnel with a separate commercial entry', () => {
    expect(source).toContain("const STEP_LABELS = ['Presentación', 'Datos', 'Menú', 'Paquete', 'Edición']");
    expect(source).toContain('const [hasStarted, setHasStarted] = useState(false)');
    expect(source).toContain('Paso {step} de 5');
  });

  it('captures the lead before the final budget is generated', () => {
    expect(source).toContain('captureSimulatorLeadProgress');
    expect(source).toContain('const LEAD_PROGRESS_WAIT_MS = 4500');
    expect(source).toContain('new Promise<{ success: true; deferred: true }>');
    expect(actionSource).toContain("scope: 'public-simulator-progress'");
    expect(actionSource).toContain('upsertPublicCommercialLead');
  });

  it('downloads a generated PDF without sending the guest to the admin view', () => {
    expect(source).toContain("import { downloadSimulatorBudgetPdf } from '@/lib/budget/simulator-budget-pdf'");
    expect(source).toContain('await downloadSimulatorBudgetPdf({');
    expect(pdfSource).toContain('const { jsPDF } = await import("jspdf")');
    expect(pdfSource).toContain('pdf.save(`presupuesto-ak-${input.documentId}.pdf`)');
    expect(source).not.toContain('imprimir=1&cliente=1&direct=1');
    expect(assistantSource).toContain("const { jsPDF } = await import('jspdf')");
    expect(assistantSource).toContain('handleDownloadBudgetPdf');
    expect(assistantSource).not.toContain('imprimir=1&cliente=1&direct=1');
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

  it('invalidates and resaves the assistant budget when its priced selection changes', () => {
    expect(assistantSource).toContain('const changesBudget = [');
    expect(assistantSource).toContain('setGeneratedAt(null)');
    expect(assistantSource).toContain("[...selectedServices, ...selectedEntradas].sort().join(',')");
  });
});

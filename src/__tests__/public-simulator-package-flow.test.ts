import fs from 'fs';
import path from 'path';

const simulatorSource = fs.readFileSync(
  path.join(process.cwd(), 'src/app/simulador-de-presupuesto/page.tsx'),
  'utf8',
);

describe('public simulator package flow contract', () => {
  it('starts the commercial timer only after the budget is generated', () => {
    expect(simulatorSource).toContain('startCommercialTimer();\n                    setStep(6);');
    expect(simulatorSource).not.toContain('await saveProgress(true);\n                startCommercialTimer();');
    expect(simulatorSource).not.toContain('{step >= 3 && commercialTimerEndsAt && (');
  });

  it('uses one package transition and a strict recommendation selector', () => {
    expect(simulatorSource).toContain('getPackageChangeResult({');
    expect(simulatorSource).toContain('getPackageRecommendations({');
    expect(simulatorSource).toContain('selectPackage(value);');
    expect(simulatorSource).toContain('const { nextPackage: newPackage, nextManualServices } = selectPackage(paqueteId);');
  });

  it('keeps package cards compact until the prospect asks to see all services', () => {
    expect(simulatorSource).toContain("const visibleIncluded = isExpanded ? includedServices : includedServices.slice(0, 3);");
    expect(simulatorSource).toContain("{isExpanded ? 'Ver resumen' : 'Ver todo'}");
  });
});

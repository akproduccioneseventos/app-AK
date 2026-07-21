import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('internal operations integrity', () => {
  it('persists manual staff rows and rolls optimistic edits back on save failure', () => {
    const personal = read('src/app/(app)/fiestas/nueva/personal/page.tsx');

    expect(personal).toContain('Promise<boolean>');
    expect(personal).toContain('const saved = await handleAutoSave(updatedStaff)');
    expect(personal).toContain('if (!saved) setAssignedStaff(previousStaff)');
    expect(personal).toContain('const addManualAssignment = async () =>');
  });

  it('does not present a fabricated revenue projection in the executive dashboard', () => {
    const dashboard = read('src/app/(app)/empresa/dashboard/page.tsx');

    expect(dashboard).not.toContain('activeEventsCount * 2500');
    expect(dashboard).toContain('Eventos con Fecha');
    expect(dashboard).toContain('No pudimos cargar el panel');
    expect(dashboard).toContain('Reintentar');
  });

  it('shows a real event-selection state instead of an endless loader', () => {
    const component = read('src/components/fiestas/event-selection-required.tsx');
    const routes = [
      read('src/app/(app)/fiestas/nueva/catering/page.tsx'),
      read('src/app/(app)/fiestas/nueva/invitados/page.tsx'),
      read('src/app/(app)/fiestas/nueva/personal/page.tsx'),
      read('src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx'),
    ];

    expect(component).toContain('href="/eventos"');
    expect(routes.every((source) => source.includes('<EventSelectionRequired'))).toBe(true);
  });

  it('pauses administrative polling while its tab is hidden', () => {
    const carga = read('src/app/(app)/fiestas/nueva/carga-operativa/page.tsx');
    const missionControl = read('src/app/(app)/fiestas/nueva/mission-control/page.tsx');

    expect(carga).toContain("document.visibilityState !== 'visible'");
    expect(carga).toContain('15_000');
    expect(missionControl).toContain("document.visibilityState === 'visible'");
  });
});

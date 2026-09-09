import fs from 'node:fs';
import path from 'node:path';
import { MOMENTOS_APP_FIESTA } from '@/components/landing/LaAppDeTuFiestaSection';

describe('Orden 50 / TEC-01: Recorrido comercial y tecnología de la app para fiestas', () => {
  const root = process.cwd();
  const pageSource = fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8');
  const sectionSource = fs.readFileSync(path.join(root, 'src/components/landing/LaAppDeTuFiestaSection.tsx'), 'utf8');

  it('los 5 momentos del recorrido comercial están definidos según la orden 50', () => {
    expect(MOMENTOS_APP_FIESTA).toHaveLength(5);

    const ids = MOMENTOS_APP_FIESTA.map((m) => m.id);
    expect(ids).toEqual(['antes', 'invitacion', 'durante', 'barra', 'despues']);

    const antes = MOMENTOS_APP_FIESTA.find((m) => m.id === 'antes')!;
    expect(antes.loQueEntiende).toMatch(/sin perder conversaciones/i);

    const invitacion = MOMENTOS_APP_FIESTA.find((m) => m.id === 'invitacion')!;
    expect(invitacion.loQueEntiende).toMatch(/encuentra.* desde su enlace/i);

    const durante = MOMENTOS_APP_FIESTA.find((m) => m.id === 'durante')!;
    expect(durante.loQueEntiende).toMatch(/participan.*no solo miran/i);

    const barra = MOMENTOS_APP_FIESTA.find((m) => m.id === 'barra')!;
    expect(barra.loQueEntiende).toMatch(/cola separada del DJ/i);

    const despues = MOMENTOS_APP_FIESTA.find((m) => m.id === 'despues')!;
    expect(despues.loQueEntiende).toMatch(/recuerdos de tu fiesta/i);
  });

  it('la portada de ventas (src/app/page.tsx) monta la sección comercial unificada', () => {
    expect(pageSource).toContain('LaAppDeTuFiestaSection');
    expect(pageSource).toContain('<LaAppDeTuFiestaSection');
    // Mantiene LaAppDeTuFiestaSection como protagonista y los equipos complementarios replegados
    expect(pageSource).toContain('Ver estaciones de entretenimiento y equipamiento complementario');
  });

  it('el copy y la demostración cumplen con los criterios de transparencia y venta honesta', () => {
    expect(sectionSource).toContain('La app de tu fiesta');
    expect(sectionSource).toContain('Organizá los detalles, invitá a los tuyos y compartí los recuerdos');
    expect(sectionSource).toContain('DEMO EN VIVO');
    expect(sectionSource).toContain('Modo seguro');
    expect(sectionSource).toContain('Moderación activa');
    expect(sectionSource).toContain('Cola independiente del DJ');
  });
});

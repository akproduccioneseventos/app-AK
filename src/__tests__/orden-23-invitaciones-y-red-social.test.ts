import * as templates from '@/components/invitacion/templates';

describe('Orden 23 — Plantillas de Invitación y Red Social', () => {
  it('debe exportar las 8 plantillas de invitación (2 originales + 6 nuevas)', () => {
    expect(templates.GraziaTemplate).toBeDefined();
    expect(templates.AllegriaTemplate).toBeDefined();
    expect(templates.XvModernaTemplate).toBeDefined();
    expect(templates.XvClasicaTemplate).toBeDefined();
    expect(templates.BodaMinimalistaTemplate).toBeDefined();
    expect(templates.BodaCampoTemplate).toBeDefined();
    expect(templates.FiestaNocheTemplate).toBeDefined();
    expect(templates.CorporativoTemplate).toBeDefined();
  });

  it('cada componente de plantilla debe ser una función válida', () => {
    const list = [
      templates.GraziaTemplate,
      templates.AllegriaTemplate,
      templates.XvModernaTemplate,
      templates.XvClasicaTemplate,
      templates.BodaMinimalistaTemplate,
      templates.BodaCampoTemplate,
      templates.FiestaNocheTemplate,
      templates.CorporativoTemplate,
    ];
    list.forEach((tpl) => {
      expect(typeof tpl).toBe('function');
    });
  });
});

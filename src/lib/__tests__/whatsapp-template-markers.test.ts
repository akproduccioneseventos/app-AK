import { findInvalidWhatsAppTemplateMarkers } from '@/lib/whatsapp-template-markers';
import { defaultWhatsAppTemplates } from '@/types/settings';

describe('marcadores de plantillas WhatsApp', () => {
  it('acepta las plantillas predeterminadas que el motor puede completar', () => {
    expect(findInvalidWhatsAppTemplateMarkers(defaultWhatsAppTemplates)).toEqual([]);
  });

  it('rechaza una variable valida en otro mensaje pero no en bienvenida', () => {
    expect(findInvalidWhatsAppTemplateMarkers({
      ...defaultWhatsAppTemplates,
      welcomeTemplate: 'Hola {{NOMBRE}}, saldo {{SALDO}}',
    })).toEqual([{ field: 'welcomeTemplate', markers: ['{{SALDO}}'] }]);
  });

  it('rechaza marcadores desconocidos, con espacios o incompletos', () => {
    const errors = findInvalidWhatsAppTemplateMarkers({
      ...defaultWhatsAppTemplates,
      budgetShareTemplate: '{{ TOTAL }} {{DESCONOCIDO}} {{SIN_CERRAR',
    });
    expect(errors[0]).toEqual({
      field: 'budgetShareTemplate',
      markers: ['{{ TOTAL }}', '{{DESCONOCIDO}}', 'marcador incompleto'],
    });
  });
});

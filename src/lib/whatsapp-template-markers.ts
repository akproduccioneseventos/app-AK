import type { WhatsAppTemplates } from '@/types/settings';

const ALLOWED_BY_FIELD: Record<keyof WhatsAppTemplates, ReadonlySet<string>> = {
  budgetShareTemplate: new Set(['{{NOMBRE}}', '{{FECHA_EVENTO}}', '{{LINK}}']),
  contractShareTemplate: new Set(['{{NOMBRE}}', '{{FECHA_EVENTO}}', '{{LINK}}']),
  welcomeTemplate: new Set(['{{NOMBRE}}']),
  eventConfirmationTemplate: new Set(['{{NOMBRE}}', '{{FECHA_EVENTO}}', '{{SALON}}']),
};

export function findInvalidWhatsAppTemplateMarkers(
  templates: WhatsAppTemplates,
): Array<{ field: keyof WhatsAppTemplates; markers: string[] }> {
  const errors: Array<{ field: keyof WhatsAppTemplates; markers: string[] }> = [];
  for (const [field, text] of Object.entries(templates) as Array<[keyof WhatsAppTemplates, string]>) {
    const markers = text.match(/\{\{[^}]+\}\}/g) ?? [];
    const invalid = markers.filter(marker => !ALLOWED_BY_FIELD[field].has(marker));
    const withoutMarkers = text.replace(/\{\{[^}]+\}\}/g, '');
    if (withoutMarkers.includes('{{') || withoutMarkers.includes('}}')) invalid.push('marcador incompleto');
    if (invalid.length > 0) errors.push({ field, markers: Array.from(new Set(invalid)) });
  }
  return errors;
}

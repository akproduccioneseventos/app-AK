/**
 * Renders a WhatsApp message template by replacing {placeholder} tokens
 * with the provided values.
 *
 * Any unknown placeholder is left as-is (e.g. `{foo}` → `{foo}`).
 */
export interface WhatsAppTemplateData {
  clienteNombre?: string;
  eventoTipo?: string;
  eventoFecha?: string;
  totalEvento?: string;
  totalPagado?: string;
  saldoPendiente?: string;
  linkEstadoCuenta?: string;
  tareaNombre?: string;
  empresaNombre?: string;
  whatsappLink?: string;
}

export function renderWhatsAppTemplate(
  template: string,
  data: WhatsAppTemplateData
): string {
  return template.replace(/\{(\w+)\}/g, (_: string, key: string) => {
    const value = (data as Record<string, string | undefined>)[key];
    return value !== undefined ? value : `{${key}}`;
  });
}

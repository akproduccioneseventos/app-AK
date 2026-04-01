/**
 * @fileOverview WhatsApp template rendering helper.
 * Safely replaces {placeholder} variables in message templates without
 * executing any code. Missing values fall back to a sensible default.
 */

export type TemplateVars = {
  clienteNombre?: string;
  eventoFecha?: string;
  saldoPendiente?: string;
  totalEvento?: string;
  linkEstadoCuenta?: string;
  empresaNombre?: string;
  tareaNombre?: string;
};

const SAMPLE_VARS: Required<TemplateVars> = {
  clienteNombre: 'María García',
  eventoFecha: '15/08/2025',
  saldoPendiente: '$5.000',
  totalEvento: '$25.000',
  linkEstadoCuenta: 'https://ak-producciones.web.app/presupuestos/ejemplo/estado-de-cuenta',
  empresaNombre: 'AK Producciones',
  tareaNombre: 'Confirmar cantidad de invitados',
};

/**
 * All placeholder keys supported by the templates.
 */
export const AVAILABLE_PLACEHOLDERS: { key: keyof TemplateVars; label: string; description: string }[] = [
  { key: 'clienteNombre',      label: '{clienteNombre}',      description: 'Nombre del cliente'               },
  { key: 'eventoFecha',        label: '{eventoFecha}',        description: 'Fecha del evento'                  },
  { key: 'saldoPendiente',     label: '{saldoPendiente}',     description: 'Saldo pendiente de pago'           },
  { key: 'totalEvento',        label: '{totalEvento}',        description: 'Total del evento'                  },
  { key: 'linkEstadoCuenta',   label: '{linkEstadoCuenta}',   description: 'Enlace al estado de cuenta'        },
  { key: 'empresaNombre',      label: '{empresaNombre}',      description: 'Nombre de tu empresa'              },
  { key: 'tareaNombre',        label: '{tareaNombre}',        description: 'Nombre de la tarea pendiente'      },
];

/**
 * Renders a template by replacing {placeholder} tokens with real values.
 * Each placeholder is treated as a literal string key — no eval/Function calls.
 * If a variable is missing or empty the original placeholder token is preserved
 * so the user can see what is missing.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (match, key) => {
    const value = vars[key as keyof TemplateVars];
    return value !== undefined && value !== '' ? value : match;
  });
}

/**
 * Renders a template using sample/demo data — used for live preview.
 */
export function previewTemplate(template: string): string {
  return renderTemplate(template, SAMPLE_VARS);
}

/**
 * Opens the WhatsApp wa.me link in a new browser tab.
 * @param phoneNumber - Destination phone number (digits only, with country code). If empty the link opens WhatsApp without a preset contact.
 * @param message    - Pre-filled message text.
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  const encoded = encodeURIComponent(message);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

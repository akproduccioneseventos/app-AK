export type AssistantAttachmentKind =
  | 'pdf'
  | 'image'
  | 'unknown';

export type AssistantDocumentIntent =
  | 'budget'
  | 'payment_receipt'
  | 'contract'
  | 'guest_list'
  | 'event_decoration'
  | 'marketing_asset'
  | 'unknown';

export type AssistantModuleCapability = {
  module: string;
  route: string;
  canRead: boolean;
  canWrite: boolean;
  safeCommands: string[];
  protectedCommands: string[];
  preferredAction?: string;
};

const MODULE_CAPABILITIES: AssistantModuleCapability[] = [
  {
    module: 'Dashboard',
    route: '/',
    canRead: true,
    canWrite: false,
    safeCommands: ['consultar KPIs', 'ver alertas', 'resumir proximos eventos'],
    protectedCommands: [],
    preferredAction: 'query_data',
  },
  {
    module: 'CRM',
    route: '/contabilidad/crm',
    canRead: true,
    canWrite: true,
    safeCommands: ['crear prospecto', 'agendar cita', 'mover lead de etapa', 'consultar agenda'],
    protectedCommands: ['borrar lead', 'perder venta', 'cancelar reunion'],
    preferredAction: 'create_lead / schedule_meeting',
  },
  {
    module: 'Clientes',
    route: '/customers',
    canRead: true,
    canWrite: true,
    safeCommands: ['crear cliente', 'buscar cliente', 'actualizar datos basicos'],
    protectedCommands: ['borrar cliente', 'unificar clientes'],
    preferredAction: 'create_customer',
  },
  {
    module: 'Presupuestos',
    route: '/presupuestos/nuevo',
    canRead: true,
    canWrite: true,
    safeCommands: ['crear presupuesto', 'importar presupuesto desde imagen o PDF', 'listar presupuestos pendientes'],
    protectedCommands: ['cambiar precio final aprobado', 'marcar rechazado', 'borrar presupuesto'],
    preferredAction: 'create_budget / import_budget_from_image',
  },
  {
    module: 'Pagos y facturacion',
    route: '/invoices',
    canRead: true,
    canWrite: true,
    safeCommands: ['registrar pago cuando el presupuesto es claro', 'crear factura', 'consultar saldo'],
    protectedCommands: ['confirmar pago ambiguo', 'borrar pago', 'cambiar saldo manualmente'],
    preferredAction: 'register_payment / create_invoice',
  },
  {
    module: 'Planificador de fiestas',
    route: '/fiestas/nueva',
    canRead: true,
    canWrite: true,
    safeCommands: ['crear evento', 'consultar disponibilidad', 'actualizar datos generales'],
    protectedCommands: ['cancelar evento', 'cambiar fecha confirmada', 'borrar evento'],
    preferredAction: 'create_event / check_availability / update_event',
  },
  {
    module: 'Portal Cliente VIP',
    route: '/fiestas/nueva/portal-cliente',
    canRead: true,
    canWrite: true,
    safeCommands: ['explicar portal', 'activar modulos visibles', 'preparar mensaje de envio'],
    protectedCommands: ['publicar portal incompleto', 'cambiar contrasena sin confirmacion'],
    preferredAction: 'navigate / show_manual',
  },
  {
    module: 'Contratos y documentos',
    route: '/fiestas/nueva/gestion-documental',
    canRead: true,
    canWrite: true,
    safeCommands: ['generar contrato con datos claros', 'leer documento adjunto', 'resumir clausulas'],
    protectedCommands: ['firmar contrato', 'eliminar contrato', 'modificar clausulas legales sensibles'],
    preferredAction: 'generate_contract',
  },
  {
    module: 'Marketing',
    route: '/marketing',
    canRead: true,
    canWrite: true,
    safeCommands: ['crear publicacion', 'crear mensaje de WhatsApp', 'guardar idea', 'agregar tarea de marketing'],
    protectedCommands: ['publicar automaticamente en redes', 'borrar campania'],
    preferredAction: 'generate_social_post / generate_whatsapp_message / generate_promo',
  },
  {
    module: 'Empresa, empleados y proveedores',
    route: '/empresa',
    canRead: true,
    canWrite: true,
    safeCommands: ['crear empleado', 'crear proveedor', 'consultar servicios'],
    protectedCommands: ['borrar empleado', 'borrar proveedor', 'cambiar aportes o sueldos'],
    preferredAction: 'create_employee / create_supplier / update_service_price',
  },
];

export function getAssistantModuleCapabilities(): AssistantModuleCapability[] {
  return MODULE_CAPABILITIES;
}

export function detectAttachmentKind(dataUri?: string): AssistantAttachmentKind {
  if (!dataUri) return 'unknown';
  const header = dataUri.slice(0, 80).toLowerCase();
  if (header.startsWith('data:application/pdf')) return 'pdf';
  if (header.startsWith('data:image/')) return 'image';
  return 'unknown';
}

export function inferDocumentIntent(input: {
  message?: string;
  fileName?: string;
  dataUri?: string;
}): AssistantDocumentIntent {
  const text = `${input.message ?? ''} ${input.fileName ?? ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/presupuesto|cotizacion|cotizacion|servicios|subtotal|descuento|total/.test(text)) return 'budget';
  if (/comprobante|recibo|transferencia|pago|deposito|seña|senia/.test(text)) return 'payment_receipt';
  if (/contrato|clausula|firma|arrendamiento|servicio/.test(text)) return 'contract';
  if (/invitados|lista|rsvp|mesa|confirmados/.test(text)) return 'guest_list';
  if (/decoracion|decoracion|moodboard|flores|globos|ambientacion|colores/.test(text)) return 'event_decoration';
  if (/post|historia|reel|instagram|facebook|whatsapp|marketing|publicacion/.test(text)) return 'marketing_asset';

  const kind = detectAttachmentKind(input.dataUri);
  if (kind === 'image') return 'event_decoration';
  return 'unknown';
}

export function buildAssistantProCapabilitiesPrompt(): string {
  const moduleLines = MODULE_CAPABILITIES.map(capability => {
    const safe = capability.safeCommands.join('; ');
    const protectedActions = capability.protectedCommands.length > 0
      ? capability.protectedCommands.join('; ')
      : 'ninguna';
    return `- ${capability.module} (${capability.route}) — puede leer: ${capability.canRead ? 'sí' : 'no'}, puede escribir: ${capability.canWrite ? 'sí' : 'no'}. Comandos seguros: ${safe}. Acciones protegidas: ${protectedActions}. Acción preferida: ${capability.preferredAction ?? 'none'}.`;
  }).join('\n');

  return `
## ASISTENTE AK PRO — CONTROL REAL POR MÓDULOS
El operador no es programador. Interpretá órdenes simples y convertí la intención en una acción real cuando exista una herramienta disponible.

### Mapa de módulos y acciones permitidas
${moduleLines}

### Regla de ejecución real
- Si existe una acción de backend para lo pedido, usala.
- Si la orden toca varios módulos, ejecutá primero la acción más importante y explicá en una frase qué queda como siguiente paso.
- Si la acción es protegida, pedí una confirmación corta antes de ejecutarla.
- No digas que guardaste, creaste, cambiaste o registraste algo si el backend no lo confirmó.

### Lectura de archivos
- Imagen o PDF de presupuesto/cotización/lista de servicios → action.type = import_budget_from_image.
- Comprobante de pago/transferencia → action.type = register_payment si monto y cliente/presupuesto son claros; si no, pedí solo el dato faltante.
- Contrato/PDF legal → resumí y, si el usuario pide generar/actualizar contrato, usá generate_contract.
- Lista de invitados → explicá que la información debe cargarse en Invitados; si no hay herramienta directa disponible, usá navigate a /fiestas/nueva.
- Imagen de decoración/moodboard → describí, proponé paleta/estilo y ofrecé llevarlo a decoración; si no hay herramienta directa, usá navigate.
- Imagen o PDF para redes → pasalo al Agente de Marketing con generate_social_post, generate_whatsapp_message o generate_promo.

### Orden única real
Cuando el operador diga algo como “hacelo todo”, “cargá esto”, “creá el evento y el portal”, o “procesá este PDF”, no respondas con teoría. Elegí la acción real más segura disponible, ejecutala y devolvé un resultado verificable con link o módulo donde quedó.`;
}

export function buildAttachmentContext(input: { message?: string; fileName?: string; dataUri?: string }): string {
  const kind = detectAttachmentKind(input.dataUri);
  const intent = inferDocumentIntent(input);
  if (kind === 'unknown' && intent === 'unknown') return '';

  return `
ARCHIVO ADJUNTO DETECTADO:
- Tipo técnico: ${kind}
- Nombre: ${input.fileName || 'sin nombre'}
- Intención probable: ${intent}
- Regla: analizá el archivo y transformalo en acción real si hay datos suficientes.`;
}

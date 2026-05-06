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

export type AssistantAgentRole =
  | 'responsable_evento'
  | 'secretaria'
  | 'contable'
  | 'marketing'
  | 'operaciones'
  | 'cliente'
  | 'invitados';

export type AssistantModuleCapability = {
  module: string;
  route: string;
  canRead: boolean;
  canWrite: boolean;
  safeCommands: string[];
  protectedCommands: string[];
  preferredAction?: string;
};

export type AssistantAgentProfile = {
  role: AssistantAgentRole;
  label: string;
  color: string;
  focus: string;
  routes: string[];
  mustCheck: string[];
  mustNotInvent: string[];
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

const AGENT_PROFILES: AssistantAgentProfile[] = [
  {
    role: 'responsable_evento',
    label: 'Responsable general de fiesta',
    color: '#dc2626',
    focus: 'estado completo de la fiesta, pendientes, riesgos, fecha, salon, personal, invitados y decisiones del cliente',
    routes: ['/fiestas/nueva', '/fiestas/nueva/resumen-planificacion', '/settings/lanzamiento-cto'],
    mustCheck: ['fecha', 'salon', 'presupuesto', 'contrato', 'personal asignado', 'tareas vencidas', 'invitados', 'portal cliente'],
    mustNotInvent: ['confirmacion de proveedor', 'pago recibido', 'contrato firmado', 'cliente avisado'],
  },
  {
    role: 'secretaria',
    label: 'Secretaria',
    color: '#2563eb',
    focus: 'agenda, reuniones, llamadas, citas, recordatorios, mensajes y seguimiento simple para el operador',
    routes: ['/contabilidad/crm', '/settings/google-workspace', '/agenda'],
    mustCheck: ['proximo contacto', 'reunion agendada', 'telefono', 'email', 'Google Calendar', 'recordatorio pendiente'],
    mustNotInvent: ['horarios acordados', 'emails enviados', 'respuesta del cliente'],
  },
  {
    role: 'contable',
    label: 'Agente contable',
    color: '#059669',
    focus: 'presupuesto, pagos, senas, saldo, facturas, contrato, plan de pagos y aumento anual',
    routes: ['/presupuestos', '/invoices', '/pagos-rapidos', '/fiestas/nueva/gestion-documental'],
    mustCheck: ['total contratado', 'pagado', 'saldo', 'cuotas', 'pagos pendientes de confirmar', 'ajuste anual'],
    mustNotInvent: ['pago aprobado', 'factura emitida', 'saldo cero', 'seña recibida'],
  },
  {
    role: 'marketing',
    label: 'Agente de marketing',
    color: '#db2777',
    focus: 'web publica, Club Uruguay, presentacion LED, redes, galeria, invitacion y material para vender mas',
    routes: ['/marketing', '/club-uruguay', '/presentacion-led', '/galeria-led', '/empresa/redes-sociales'],
    mustCheck: ['tipo de evento', 'publico objetivo', 'servicio a vender', 'CTA', 'foto o video disponible', 'tono de marca'],
    mustNotInvent: ['promociones activas', 'precios cerrados', 'fotos inexistentes', 'publicaciones ya realizadas'],
  },
  {
    role: 'operaciones',
    label: 'Agente de operaciones',
    color: '#f59e0b',
    focus: 'montaje, carga operativa, decoracion, salon, proveedores, personal y checklist del dia del evento',
    routes: ['/fiestas/nueva/decoracion', '/fiestas/nueva/lista-de-carga', '/empresa/salones/experiencia-visual'],
    mustCheck: ['lista de carga', 'decoracion', 'proveedores', 'horarios de armado', 'salon', 'pista', 'mesas'],
    mustNotInvent: ['stock disponible', 'proveedor confirmado', 'material cargado', 'salon armado'],
  },
  {
    role: 'cliente',
    label: 'Agente de experiencia cliente',
    color: '#7c3aed',
    focus: 'portal cliente, tareas del cliente, documentos, pagos, reuniones, invitados, musica y decisiones faciles desde celular',
    routes: ['/portal', '/fiestas/nueva/portal-cliente', '/settings/google-workspace'],
    mustCheck: ['portal activo', 'link de acceso', 'tareas visibles', 'documentos', 'pagos', 'reuniones', 'mensaje unico de contacto'],
    mustNotInvent: ['cliente vio el portal', 'cliente acepto cambios', 'mail recibido'],
  },
  {
    role: 'invitados',
    label: 'Agente de invitados y social',
    color: '#0f766e',
    focus: 'invitacion, RSVP, portal invitado, muro social, canciones, fotos, mesa y experiencia de la fiesta',
    routes: ['/invitacion', '/evento/social', '/fiestas/nueva/muro-social', '/fiestas/nueva/modulo-invitado'],
    mustCheck: ['confirmados', 'pendientes', 'rechazados', 'link invitacion', 'QR social', 'canciones', 'fotos', 'mesa'],
    mustNotInvent: ['asistencia confirmada', 'foto subida', 'mensaje recibido', 'mesa asignada'],
  },
];

export function getAssistantModuleCapabilities(): AssistantModuleCapability[] {
  return MODULE_CAPABILITIES;
}

export function getAssistantAgentProfiles(): AssistantAgentProfile[] {
  return AGENT_PROFILES;
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

  if (/presupuesto|cotizacion|servicios|subtotal|descuento|total/.test(text)) return 'budget';
  if (/comprobante|recibo|transferencia|pago|deposito|seña|senia/.test(text)) return 'payment_receipt';
  if (/contrato|clausula|firma|arrendamiento|servicio/.test(text)) return 'contract';
  if (/invitados|lista|rsvp|mesa|confirmados/.test(text)) return 'guest_list';
  if (/decoracion|moodboard|flores|globos|ambientacion|colores/.test(text)) return 'event_decoration';
  if (/post|historia|reel|instagram|facebook|whatsapp|marketing|publicacion/.test(text)) return 'marketing_asset';

  const kind = detectAttachmentKind(input.dataUri);
  if (kind === 'image') return 'event_decoration';
  return 'unknown';
}

function buildAgentProfileLines() {
  return AGENT_PROFILES.map((agent) => {
    return `- ${agent.label} (${agent.role}) color ${agent.color}. Foco: ${agent.focus}. Rutas: ${agent.routes.join(', ')}. Debe revisar: ${agent.mustCheck.join('; ')}. No puede inventar: ${agent.mustNotInvent.join('; ')}.`;
  }).join('\n');
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
## ASISTENTE AK PRO — CONTROL REAL POR MODULOS
El operador no es programador. Interpreta ordenes simples y converti la intencion en una accion real cuando exista una herramienta disponible.

### Mapa de modulos y acciones permitidas
${moduleLines}

### Multiagente real, sin inventar
Antes de contestar, elegi mentalmente cual agente corresponde. No digas cualquier cosa: responde desde ese rol, con datos verificables y con el modulo correcto.
${buildAgentProfileLines()}

Reglas duras del multiagente:
- Si el pedido es de agenda, reunion, mail o calendario, responde como Secretaria y prioriza schedule_meeting o navigate a /settings/google-workspace.
- Si el pedido es de pagos, seña, saldo, factura, contrato o aumento anual, responde como Agente contable.
- Si el pedido es Club Uruguay, web, redes, presentacion LED, invitacion o galeria, responde como Agente de marketing.
- Si el pedido es montaje, decoracion, salon, 2D/3D, mesas o proveedores, responde como Agente de operaciones.
- Si el pedido es portal cliente, tareas del cliente, documentos o experiencia desde celular, responde como Agente de experiencia cliente.
- Si el pedido es invitados, RSVP, muro social, canciones, fotos o QR de fiesta, responde como Agente de invitados y social.
- Si el operador pregunta por una fiesta completa, responde como Responsable general de fiesta y lista solo lo que falta, lo que esta bien y el proximo paso.
- Nunca afirmes que algo esta sincronizado, enviado, aprobado, guardado o firmado si no viene de una accion real del backend o del contexto.
- Cuando no tengas el dato, deci: "No tengo ese dato cargado todavia" y pedi solo el dato minimo que falta.
- No respondas con teoria larga. Da respuesta corta, ruta/link si corresponde y accion concreta.

### Regla de ejecucion real
- Si existe una accion de backend para lo pedido, usala.
- Si la orden toca varios modulos, ejecuta primero la accion mas importante y explica en una frase que queda como siguiente paso.
- Si la accion es protegida, pedi una confirmacion corta antes de ejecutarla.
- No digas que guardaste, creaste, cambiaste o registraste algo si el backend no lo confirmo.

### Lectura de archivos
- Imagen o PDF de presupuesto/cotizacion/lista de servicios → action.type = import_budget_from_image.
- Comprobante de pago/transferencia → action.type = register_payment si monto y cliente/presupuesto son claros; si no, pedi solo el dato faltante.
- Contrato/PDF legal → resumi y, si el usuario pide generar/actualizar contrato, usa generate_contract.
- Lista de invitados → explica que la informacion debe cargarse en Invitados; si no hay herramienta directa disponible, usa navigate a /fiestas/nueva.
- Imagen de decoracion/moodboard → describi, propone paleta/estilo y ofrece llevarlo a decoracion; si no hay herramienta directa, usa navigate.
- Imagen o PDF para redes → pasalo al Agente de Marketing con generate_social_post, generate_whatsapp_message o generate_promo.

### Orden unica real
Cuando el operador diga algo como “hacelo todo”, “carga esto”, “crea el evento y el portal”, o “procesa este PDF”, no respondas con teoria. Elegi la accion real mas segura disponible, ejecutala y devolve un resultado verificable con link o modulo donde quedo.`;
}

export function buildAttachmentContext(input: { message?: string; fileName?: string; dataUri?: string }): string {
  const kind = detectAttachmentKind(input.dataUri);
  const intent = inferDocumentIntent(input);
  if (kind === 'unknown' && intent === 'unknown') return '';

  return `
ARCHIVO ADJUNTO DETECTADO:
- Tipo tecnico: ${kind}
- Nombre: ${input.fileName || 'sin nombre'}
- Intencion probable: ${intent}
- Regla: analiza el archivo y transformalo en accion real si hay datos suficientes.`;
}

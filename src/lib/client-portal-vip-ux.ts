export const CLIENT_PORTAL_VIP_REPLACEMENTS: Array<[string, string]> = [
  ['Configuración del Portal', 'Acceso del cliente'],
  ['Controla qué información puede ver y editar tu cliente en su portal privado.', 'Configurá el acceso, link personalizado y módulos visibles del Portal Cliente VIP.'],
  ['Contraseña de Acceso del Cliente', 'Link personalizado del portal'],
  ['Contraseña del portal copiada al portapapeles', 'Link del portal copiado al portapapeles'],
  ['Este valor actúa como contraseña de acceso. El enlace oficial para compartir con el cliente está abajo.', 'Este valor forma parte del enlace privado del portal. No es una contraseña real.'],
  ['Este es el enlace oficial para compartir con el cliente. Lleva directamente al portal sin necesidad de contraseña.', 'Este es el enlace privado para compartir con el cliente. Si querés contraseña real, debe configurarse como campo separado.'],
  ['Usá un enlace legible (ej: cliente-vip-nombre-evento) o generá uno sugerido con el botón 🔄.', 'Personalizá el link con un nombre claro. Ejemplo: cliente-vip-rocio-15. También podés generar uno sugerido con 🔄.'],
  ['Personalización de la Portada', 'Portada del portal'],
  ['Lo que debe traer el cliente', 'Tareas pendientes y bebidas del cliente'],
  ['Lo que tengo que enviar o llevar', 'Tareas pendientes del cliente'],
  ['Comida y bebidas — configuración de ítems', 'Comida, bebidas y extras'],
  ['Bebidas y extras', 'Comida y bebidas'],
  ['Calculadora de Bebidas y Extras', 'Comida, bebidas y extras'],
  ['Lista de bebidas y lo que debe traer el cliente', 'Comida, bebidas y tareas pendientes del cliente'],
  ['Notas Compartidas', 'Mensajes con AK'],
  ['FAQ', 'Preguntas frecuentes'],
  ['Panel Financiero', 'Pagos y documentos'],
  ['Pagos y saldo', 'Pagos y documentos'],
  ['Finanzas y documentos', 'Pagos y documentos'],
  ['Simulador de invitados', 'Agregar invitados o servicios'],
];

export const CLIENT_PORTAL_VIP_AREAS = [
  {
    title: 'Acceso del cliente',
    description: 'Link personalizado, copiar enlace y envío por WhatsApp.',
  },
  {
    title: 'Portada del portal',
    description: 'Imagen, color, nombre visible, fecha, salón y mensajes.',
  },
  {
    title: 'Tareas pendientes',
    description: 'Lista de cosas que el cliente debe enviar o resolver.',
  },
  {
    title: 'Mensajes con AK',
    description: 'Comunicación visible y siempre a mano.',
  },
  {
    title: 'Pagos y documentos',
    description: 'Datos bancarios, comprobantes, contrato, presupuesto y saldo.',
  },
  {
    title: 'Organización del evento',
    description: 'Itinerario, menú, música, decoración, fotos, invitados y mesas.',
  },
] as const;

export const CLIENT_PORTAL_VIP_ACCEPTANCE_ITEMS = [
  'El módulo interno se entiende desde Planificador → Portal del Cliente.',
  'El campo accessKey se presenta como link personalizado, no como contraseña.',
  'La portada queda identificada como sección principal del portal.',
  'Tareas pendientes no se mezclan conceptualmente con pagos.',
  'Comida y bebidas queda separado de tareas/documentos.',
  'Mensajes con AK reemplaza textos de notas confusos.',
  'Pagos y documentos queda como área contable principal.',
  'Preguntas frecuentes usa nombre claro para cliente.',
  'Los módulos visibles quedan agrupados por propósito.',
  'La vista pública usa los mismos nombres que el panel interno.',
  'No se crea otro portal paralelo.',
  'No se toca package.json ni package-lock.json.',
  'No se cambian datos de Firebase ni estructura persistida.',
  'Queda lista la base para reestructura funcional profunda sin confusión.',
] as const;

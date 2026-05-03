export type Post445ReleaseGroupId = 'guardado_backup' | 'base_ci_accesos' | 'social_invitacion' | 'cliente_estetica' | 'comercial_led';

export type Post445ReleasePr = {
  number: number;
  title: string;
  groupId: Post445ReleaseGroupId;
  visibleResult: string;
  originalState: 'arreglo' | 'motor_base' | 'pantalla' | 'integracion';
};

export type Post445ReleaseGroup = {
  id: Post445ReleaseGroupId;
  title: string;
  simpleGoal: string;
  route?: string;
};

export const POST445_RELEASE_GROUPS: Post445ReleaseGroup[] = [
  { id: 'guardado_backup', title: 'Guardado y backup', simpleGoal: 'Que la app guarde bien, que el backup incluya los datos nuevos y que no diga exito si algo no se guardo.' },
  { id: 'base_ci_accesos', title: 'Base tecnica, CI y accesos', simpleGoal: 'Corregir errores que frenaban deploys y ordenar archivos base que habian quedado sueltos.' },
  { id: 'social_invitacion', title: 'Social Fiesta e invitacion', simpleGoal: 'Convertir los motores de red social, RSVP, juegos, moderacion y pantalla en una entrada visible.', route: '/fiestas/nueva/social-fiesta-pro' },
  { id: 'cliente_estetica', title: 'Cliente y estetica premium', simpleGoal: 'Hacer que el modulo del cliente sea claro, lindo, simple y pensado para celular.', route: '/fiestas/nueva/portal-cliente/experiencia-mundial' },
  { id: 'comercial_led', title: 'Comercial 360 y Portal LED', simpleGoal: 'Hacer visible la presentacion comercial, simulador, CRM, galeria y Portal LED.', route: '/contabilidad/comercial-360' },
];

export const POST445_RELEASE_PRS: Post445ReleasePr[] = [
  { number: 446, title: 'Fix deploy y formato de pagos en Portal Cliente', groupId: 'base_ci_accesos', originalState: 'arreglo', visibleResult: 'Destraba deploy y mejora lectura de pagos.' },
  { number: 447, title: 'Documentacion y disparador de deploy', groupId: 'base_ci_accesos', originalState: 'arreglo', visibleResult: 'Deja mas claro como se valida y despliega.' },
  { number: 448, title: 'Soporte de archivos para asistente', groupId: 'base_ci_accesos', originalState: 'motor_base', visibleResult: 'Prepara adjuntos y trabajo asistido.' },
  { number: 449, title: 'Adjuntos para agente de marketing', groupId: 'base_ci_accesos', originalState: 'motor_base', visibleResult: 'Prepara piezas para marketing y ventas.' },
  { number: 450, title: 'Importacion operativa de presupuesto', groupId: 'base_ci_accesos', originalState: 'motor_base', visibleResult: 'Conecta presupuesto con operativa.' },
  { number: 451, title: 'Social Fiesta Pro 01: base', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Crea la configuracion general de red social de fiesta.' },
  { number: 452, title: 'Social Fiesta Pro 02: revision de contenido', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Prepara filtros para texto, fotos y mensajes.' },
  { number: 453, title: 'Social Fiesta Pro 03: feed privado', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Crea publicaciones, comentarios y reacciones.' },
  { number: 454, title: 'Social Fiesta Pro 04: entrada del invitado', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Prepara el acceso del invitado a la experiencia social.' },
  { number: 455, title: 'Social Fiesta Pro 05: invitacion conectada', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Une invitacion con red social y acciones del invitado.' },
  { number: 456, title: 'Invitacion Pro: plantillas', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Deja modelos para invitaciones mas completas.' },
  { number: 457, title: 'Invitacion Pro: control RSVP', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Ordena confirmaciones, cancelaciones e invitados.' },
  { number: 458, title: 'Social Fiesta Pro 06: live wall premium', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Prepara slides para pantalla gigante.' },
  { number: 459, title: 'Social Fiesta Pro 07: juegos y sorteos', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Crea desafios, ranking y sorteos.' },
  { number: 460, title: 'Social Fiesta Pro: album final', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Prepara entrega posterior de recuerdos.' },
  { number: 461, title: 'Social Fiesta Pro 08: automatizaciones AK', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Prepara mensajes de valor y venta invisible.' },
  { number: 462, title: 'Fix deploy: tipo de cancelacion RSVP', groupId: 'social_invitacion', originalState: 'arreglo', visibleResult: 'Corrige un error de TypeScript que rompia el build.' },
  { number: 463, title: 'Social Fiesta Pro 09: panel operador', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Prepara aprobacion, ocultado y destacado de contenido.' },
  { number: 464, title: 'Social Fiesta Pro 10: reportes', groupId: 'social_invitacion', originalState: 'motor_base', visibleResult: 'Mide participacion y valor despues de la fiesta.' },
  { number: 465, title: 'Estetica Premium 01: design system', groupId: 'cliente_estetica', originalState: 'motor_base', visibleResult: 'Crea reglas visuales globales.' },
  { number: 466, title: 'Estetica Premium 02: experiencia publica', groupId: 'cliente_estetica', originalState: 'motor_base', visibleResult: 'Prepara presets para invitacion, portales y muro.' },
  { number: 467, title: 'Estetica Premium 03: muro y app interna', groupId: 'cliente_estetica', originalState: 'motor_base', visibleResult: 'Define como deben verse operador, pantalla y app interna.' },
  { number: 468, title: 'Estetica Premium 04: portal invitado', groupId: 'cliente_estetica', originalState: 'motor_base', visibleResult: 'Prepara modelo visual para invitados.' },
  { number: 469, title: 'Estetica premium final full pro', groupId: 'cliente_estetica', originalState: 'motor_base', visibleResult: 'Cierra checklist visual premium de la app.' },
  { number: 470, title: 'Comercial 360 01: bonificacion visual', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Muestra valor comercial sin bajar el precio real.' },
  { number: 471, title: 'Comercial 360 02: vender antes del precio', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Ordena el discurso comercial antes del presupuesto.' },
  { number: 472, title: 'Comercial 360 03: conversion de simuladores', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Convierte simulaciones en seguimiento comercial.' },
  { number: 473, title: 'Comercial 360 04: presupuesto editable vivo', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Permite pensar presupuesto como edicion en entrevista.' },
  { number: 474, title: 'Comercial 360 05: resumen editable', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Prepara volver del resumen sin perder datos.' },
  { number: 475, title: 'Comercial 360 03: motor conversion duplicado', groupId: 'comercial_led', originalState: 'integracion', visibleResult: 'Refuerza la cadena de conversion comercial.' },
  { number: 476, title: 'Comercial 360 06: CRM WhatsApp', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Crea tareas de seguimiento por temperatura del lead.' },
  { number: 477, title: 'Comercial 360 07: Portal LED flujo venta', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Prepara el flujo visual de venta en pantalla.' },
  { number: 478, title: 'Comercial 360 04: presupuesto editable duplicado', groupId: 'comercial_led', originalState: 'integracion', visibleResult: 'Refuerza la parte editable del presupuesto.' },
  { number: 479, title: 'Merge de seguimiento comercial', groupId: 'comercial_led', originalState: 'integracion', visibleResult: 'Integra el bloque CRM/WhatsApp.' },
  { number: 480, title: 'Comercial 360 08: galeria comercial AK', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Clasifica fotos y videos para vender mejor.' },
  { number: 481, title: 'Portal LED technology showcase', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Explica tecnologia AK como beneficio visible.' },
  { number: 482, title: 'Comercial 360 10: Portal LED Pro visual', groupId: 'comercial_led', originalState: 'motor_base', visibleResult: 'Define la presentacion LED completa.' },
];

export function getPost445PrsByGroup(groupId: Post445ReleaseGroupId): Post445ReleasePr[] {
  return POST445_RELEASE_PRS.filter(pr => pr.groupId === groupId);
}

export function countPost445PrsByGroup(groupId: Post445ReleaseGroupId): number {
  return getPost445PrsByGroup(groupId).length;
}

export function getPost445VisibleRoutes(): string[] {
  return POST445_RELEASE_GROUPS.map(group => group.route).filter(Boolean) as string[];
}

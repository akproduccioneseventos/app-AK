export type FinalClosureAction = {
  title: string;
  description: string;
  href: string;
  result: string;
  priority: 'alta' | 'media';
};

export type FinalClosureGroup = {
  id: string;
  title: string;
  goal: string;
  actions: FinalClosureAction[];
};

export const FINAL_CLOSURE_SCORE = 96;

export const FINAL_CLOSURE_GROUPS: FinalClosureGroup[] = [
  {
    id: 'venta',
    title: 'Venta y presentacion comercial',
    goal: 'Que el prospecto entienda rapido el valor tecnologico de AK y pueda imaginar su evento antes de contratar.',
    actions: [
      {
        title: 'Portafolio LED adaptable',
        description: 'Presentacion grande para vender en pantalla, tablet o celular con servicios, experiencia y ejemplos visuales.',
        href: '/presentacion-led/portafolio',
        result: 'Sirve para mostrar la propuesta sin depender de explicar todo de palabra.',
        priority: 'alta',
      },
      {
        title: 'Centro de experiencia AK',
        description: 'Resumen visual de portal cliente, invitacion, invitados, muro social, LED y seguimiento de fiesta.',
        href: '/experiencia-ak',
        result: 'Convierte tecnologia dispersa en una historia simple para el cliente.',
        priority: 'alta',
      },
      {
        title: 'Web de empresa y Club Uruguay',
        description: 'Entrada publica para vender servicios, salones, Club Uruguay y experiencia premium.',
        href: '/',
        result: 'Refuerza imagen de marca y venta antes del primer contacto.',
        priority: 'media',
      },
    ],
  },
  {
    id: 'fiesta',
    title: 'Comando por fiesta',
    goal: 'Que cada fiesta tenga un lugar central para ver faltantes, responsables, cliente, invitados y tecnologia activa.',
    actions: [
      {
        title: 'Comando total de fiesta',
        description: 'Panel maestro por fiesta con estado, alertas, responsables, Google, Gmail, portal, invitados y social.',
        href: '/eventos',
        result: 'Evita que los modulos queden sueltos o escondidos.',
        priority: 'alta',
      },
      {
        title: 'Checklist operativo',
        description: 'Revision de datos, pagos, cliente, invitados, experiencia visual y equipo antes de mostrar o ejecutar la fiesta.',
        href: '/settings/cierre-global-producto',
        result: 'Permite detectar huecos sin revisar toda la app manualmente.',
        priority: 'alta',
      },
    ],
  },
  {
    id: 'cliente-invitado',
    title: 'Cliente, invitados y red privada',
    goal: 'Que lo que ve la gente sea claro, lindo, movil y conectado con la fiesta real.',
    actions: [
      {
        title: 'Portal cliente premium',
        description: 'Vista para cliente con pagos, documentos, tareas, reuniones, invitados y comunicacion.',
        href: '/fiestas/nueva/portal-cliente/experiencia-mundial',
        result: 'El cliente no necesita computadora ni conocimientos tecnicos.',
        priority: 'alta',
      },
      {
        title: 'Portal invitado e invitacion',
        description: 'Experiencia para confirmar asistencia, ver datos de la fiesta y sumar el evento al calendario.',
        href: '/fiestas/nueva/modulo-invitado',
        result: 'Reduce preguntas repetidas y mejora la experiencia del invitado.',
        priority: 'alta',
      },
      {
        title: 'Muro social y en vivo',
        description: 'Capa visible de la fiesta para fotos, mensajes, pantalla LED y participacion.',
        href: '/fiestas/nueva/muro-social',
        result: 'Hace que la tecnologia se vea durante el evento.',
        priority: 'alta',
      },
    ],
  },
  {
    id: 'google-gmail',
    title: 'Google Calendar y Gmail',
    goal: 'Usar calendario y correo como recordatorios reales para clientes, invitados, equipo y reuniones internas.',
    actions: [
      {
        title: 'Workspace Google',
        description: 'Centro para sincronizar agenda, reuniones, tareas, personal, clientes e invitados.',
        href: '/settings/google-workspace',
        result: 'Permite que la informacion importante llegue por calendario y correo.',
        priority: 'alta',
      },
      {
        title: 'Personal y roles',
        description: 'Cada integrante puede tener sus fiestas, rol, agenda, recordatorios y datos necesarios.',
        href: '/empleados',
        result: 'El equipo sabe que hacer sin depender de mensajes sueltos.',
        priority: 'media',
      },
    ],
  },
  {
    id: 'estabilidad',
    title: 'Estabilidad y guardado',
    goal: 'Que la app no dependa de memoria local ni de modulos incompletos para operar.',
    actions: [
      {
        title: 'Backup y guardado final',
        description: 'Revision de guardado manual, automatico y estado operativo general.',
        href: '/settings/backup-final',
        result: 'Reduce el riesgo de perder cambios o creer que algo se guardo cuando no se guardo.',
        priority: 'alta',
      },
      {
        title: 'Biblioteca visual AK',
        description: 'Lugar para organizar estilos, fotos, ejemplos, pantallas LED y recursos reutilizables.',
        href: '/settings/biblioteca-visual-ak',
        result: 'Evita que cada modulo visual se arme desde cero.',
        priority: 'media',
      },
    ],
  },
];

export function getFinalClosureTotals() {
  const actions = FINAL_CLOSURE_GROUPS.flatMap((group) => group.actions);
  return {
    groups: FINAL_CLOSURE_GROUPS.length,
    actions: actions.length,
    highPriority: actions.filter((action) => action.priority === 'alta').length,
  };
}

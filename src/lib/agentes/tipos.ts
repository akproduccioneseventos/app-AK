export type AgenteId =
  | 'vigilante_fiestas'
  | 'perseguidor_presupuestos'
  | 'cobrador'
  | 'generador_contenido'
  | 'vigilante_noche'
  | 'vigilante_publicidad';

export interface ConfiguracionAgente {
  id: AgenteId;
  nombre: string;
  rol: string;
  descripcion: string;
  activo: boolean;
  intervaloMinutos: number;
  ultimaEjecucion?: string;
  estadoUltimaEjecucion?: 'exito' | 'sin_novedades' | 'alerta';
}

export interface RegistroEjecucionAgente {
  id: string;
  agenteId: AgenteId;
  agenteNombre: string;
  ejecutadoEn: string;
  hallazgos: string[];
  accionesPreparadas: string[];
  estado: 'exito' | 'sin_novedades' | 'alerta';
}

export const AGENTES_DEFAULT_CONFIG: ConfiguracionAgente[] = [
  {
    id: 'vigilante_fiestas',
    nombre: 'Vigilante de Fiestas',
    rol: 'Supervisor de Eventos y Checklist Humano',
    descripcion: 'Revisa cada fiesta activa y alerta sobre contratos sin firmar, señas impagas, servicios faltantes, menú sin elegir o conflictos de salón y personal.',
    activo: true,
    intervaloMinutos: 15,
  },
  {
    id: 'perseguidor_presupuestos',
    nombre: 'Perseguidor de Presupuestos',
    rol: 'Seguimiento Comercial y Reactivación',
    descripcion: 'Detecta presupuestos enviados sin respuesta a los 5 días y prepara mensaje de seguimiento en la bandeja; a los 14 días prepara mensaje de reactivación. Nunca envía solo.',
    activo: true,
    intervaloMinutos: 60,
  },
  {
    id: 'cobrador',
    nombre: 'Agente Cobrador',
    rol: 'Gestión de Cobranzas y Recordatorios de Saldo',
    descripcion: 'Monitorea cuotas por vencer en los próximos 3 días y saldos de fiestas pasadas; prepara los recordatorios en la bandeja con los datos exactos.',
    activo: true,
    intervaloMinutos: 60,
  },
  {
    id: 'generador_contenido',
    nombre: 'Creador de Contenido',
    rol: 'Marketing y Borradores de Redes',
    descripcion: 'Al finalizar un evento, prepara borradores de posteo con las fotos aprobadas del muro. Si detecta días sin publicar, deja contenido preparado.',
    activo: true,
    intervaloMinutos: 180,
  },
  {
    id: 'vigilante_noche',
    nombre: 'Operador de la Noche',
    rol: 'Monitoreo de Estaciones en Vivo',
    descripcion: 'Durante eventos en vivo, verifica que las estaciones de fotos y el muro interactivo estén transmitiendo sin fallas ni colas offline trabadas.',
    activo: true,
    intervaloMinutos: 15,
  },
  {
    id: 'vigilante_publicidad',
    nombre: 'Vigilante de Publicidad & Meta Ads',
    rol: 'Supervisión de Anuncios y Rendimiento de Campañas',
    descripcion: 'Monitorea diariamente el gasto en Meta Ads y alerta si un anuncio está quemando plata sin traer consultas, si una campaña funciona muy bien para escalar, o si se agotó el presupuesto. Nunca modifica campañas ni gasta dinero.',
    activo: true,
    intervaloMinutos: 720,
  },
];


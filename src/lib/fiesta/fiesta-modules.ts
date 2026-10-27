export type PestanaFiesta =
  | 'contrato-y-pagos'
  | 'cliente-e-invitados'
  | 'comida-y-barra'
  | 'equipo-y-logistica'
  | 'noche';

export interface InfoPestanaFiesta {
  id: PestanaFiesta;
  label: string;
  descripcion: string;
}

export const PESTANAS_FIESTA: InfoPestanaFiesta[] = [
  {
    id: 'contrato-y-pagos',
    label: 'Contrato y pagos',
    descripcion: 'Configuración, tareas, reuniones, documentos y finanzas.',
  },
  {
    id: 'cliente-e-invitados',
    label: 'Cliente e invitados',
    descripcion: 'Portal, itinerario, música, fotos, diseño del salón y regalos.',
  },
  {
    id: 'comida-y-barra',
    label: 'Comida, barra e impresos',
    descripcion: 'Catering, alergias, bebidas, barra tecnológica y cartelería.',
  },
  {
    id: 'equipo-y-logistica',
    label: 'Equipo y logística',
    descripcion: 'Personal asignado, logística de utilería y coordinación con proveedores.',
  },
  {
    id: 'noche',
    label: 'La noche',
    descripcion: 'Operativa en vivo, pantallas, entretenimiento, check-in y post-evento.',
  },
];

export const MAPA_MODULO_A_PESTANA: Record<string, PestanaFiesta> = {
  // 1. Contrato y pagos (7)
  configuracion: 'contrato-y-pagos',
  resumenPlanificacion: 'contrato-y-pagos',
  tareas: 'contrato-y-pagos',
  reuniones: 'contrato-y-pagos',
  documentos: 'contrato-y-pagos',
  planPagos: 'contrato-y-pagos',
  costos: 'contrato-y-pagos',

  // 2. Cliente e invitados (10)
  portalCliente: 'cliente-e-invitados',
  invitados: 'cliente-e-invitados',
  paginaWeb: 'cliente-e-invitados',
  moduloInvitado: 'cliente-e-invitados',
  disenoSalon: 'cliente-e-invitados',
  musica: 'cliente-e-invitados',
  videoVida: 'cliente-e-invitados',
  itinerario: 'cliente-e-invitados',
  decoracion: 'cliente-e-invitados',
  regalos: 'cliente-e-invitados',

  // 3. Comida, barra e impresos (9)
  catering: 'comida-y-barra',
  alergias: 'comida-y-barra',
  listaCompras: 'comida-y-barra',
  plannerCostoFiesta: 'comida-y-barra',
  cartaTragos: 'comida-y-barra',
  barraTecnologica: 'comida-y-barra',
  carteleria: 'comida-y-barra',
  menuMesa: 'comida-y-barra',
  numerosMesa: 'comida-y-barra',

  // 4. Equipo y logística (6)
  personal: 'equipo-y-logistica',
  accesosPersonal: 'equipo-y-logistica',
  cargaOperativa: 'equipo-y-logistica',
  logistica: 'equipo-y-logistica',
  proveedoresPortal: 'equipo-y-logistica',
  resumenImprimible: 'equipo-y-logistica',

  // 5. La noche (15)
  checkin: 'noche',
  enVivo: 'noche',
  centroFiesta: 'noche',
  muroSocial: 'noche',
  redSocial: 'noche',
  zonaDigital: 'noche',
  pantallasTotem: 'noche',
  playlistPantalla: 'noche',
  entretenimiento: 'noche',
  fotografia: 'noche',
  buzon: 'noche',
  readiness: 'noche',
  fiestaLista: 'noche',
  feedback: 'noche',
  postEvento: 'noche',
};

export function obtenerPestanaDeModulo(id: string): PestanaFiesta {
  return MAPA_MODULO_A_PESTANA[id] || 'contrato-y-pagos';
}

export interface FiestaModuleDef {
  id: string;
  pestana: PestanaFiesta;
}

export const modules: FiestaModuleDef[] = Object.entries(MAPA_MODULO_A_PESTANA).map(([id, pestana]) => ({
  id,
  pestana,
}));

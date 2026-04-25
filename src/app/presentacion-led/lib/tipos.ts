import type { ServicioEmpresa } from '@/types/empresa';
import type { CompanyInfo } from '@/types/settings';
import type { FullMenu } from '@/types/catering';

export interface ClientData {
  nombre: string;
  fechaEvento: string;
  tipoFiesta: string;
  cantidadInvitados: string;
  invitadosAdultos: string;
  invitadosAdolescentes: string;
  duracionHoras: string;
  tieneSalon?: boolean;
  salon: string;
}

export interface ResourceSummary {
  invitadosTotales: number;
  mesas: number;
  sillas: number;
  vajilla: number;
  manteleria: number;
  mozos: number;
  requiereAsador: boolean;
}

export interface PageData {
  companyInfo: CompanyInfo;
  logoUrl: string | null;
  servicios: ServicioEmpresa[];
  valuePropositions: string[];
  mostrarPrecios: boolean;
  menus: FullMenu[];
}

export interface CategoriaServicio {
  nombre: string;
  servicios: ServicioEmpresa[];
}

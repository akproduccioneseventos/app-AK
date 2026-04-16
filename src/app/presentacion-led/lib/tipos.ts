import type { ServicioEmpresa } from '@/types/empresa';
import type { CompanyInfo } from '@/types/settings';
import type { FullMenu } from '@/types/catering';

export interface ClientData {
  nombre: string;
  fechaEvento: string;
  tipoFiesta: string;
  cantidadInvitados: string;
  salon: string;
  ciudad: string;
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

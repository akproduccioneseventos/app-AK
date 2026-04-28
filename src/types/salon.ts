import type { DecoracionData } from '@/types/fiesta';

export interface Salon {
  id: string;
  nombre: string;
  direccion: string;
  googleMapsUrl: string;
  capacidad: number;
  descripcion?: string;
  fotos?: string[];
  salonLayout?: DecoracionData;
  esClubUruguay?: boolean;
}

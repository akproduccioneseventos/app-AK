import type { Trago } from '@/types/fiesta';

export type BarDrinkOrderStatus = 'nuevo' | 'preparando' | 'listo' | 'entregado' | 'cancelado';

export interface BarStockMovement {
  insumoId: string;
  cantidad: number;
}

export interface BarDrinkOrder {
  id: string;
  fiestaId: string;
  drinkId: string;
  drinkName: string;
  guestName: string;
  guestId?: string;
  tableNumber?: string;
  note?: string;
  status: BarDrinkOrderStatus;
  createdAt: string;
  updatedAt: string;
  source: 'touchscreen' | 'staff';
  queuePosition?: number;
  stockMovements?: BarStockMovement[];
  stockRestoredAt?: string;
}

export interface BarTechnologySettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  guestPrompt: string;
  barmanTitle: string;
  hashtag: string;
  instagramHandle: string;
  brandText: string;
  accentColor: string;
  requireGuestName: boolean;
  allowPhotoCapture: boolean;
  autoPublishPhotos: boolean;
  showIngredients: boolean;
  showAlcoholFreeTag: boolean;
  showDrinkDescription: boolean;
  showDrinkVideo: boolean;
  requireSocialFollowForPhotos: boolean;
  socialFollowPrompt: string;
  openingTime?: string; // Formato HH:mm
  closingTime?: string; // Formato HH:mm
}

export interface BarTechnologyData {
  updatedAt?: string;
  settings: BarTechnologySettings;
  orders?: BarDrinkOrder[];
}

export interface BarTechnologyDashboard {
  fiestaId: string;
  eventName: string;
  drinks: Trago[];
  settings: BarTechnologySettings;
  orders: BarDrinkOrder[];
  backgroundImageUrl?: string;
  protagonistaFotoUrl?: string;
}

export type PublicBarDrink = Pick<
  Trago,
  'id' | 'nombre' | 'imageUrl' | 'descripcion' | 'description' | 'videoUrl' | 'ingredientes' | 'stockDisponible'
>;

export interface PublicBarTechnologyDashboard {
  fiestaId: string;
  eventName: string;
  drinks: PublicBarDrink[];
  settings: BarTechnologySettings;
  backgroundImageUrl?: string;
  protagonistaFotoUrl?: string;
}

export interface CreateBarDrinkOrderInput {
  fiestaId: string;
  drinkId: string;
  guestName?: string;
  guestId?: string;
  tableNumber?: string;
  note?: string;
}

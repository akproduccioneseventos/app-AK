import type { Trago } from '@/types/fiesta';

export type BarDrinkOrderStatus = 'nuevo' | 'preparando' | 'listo' | 'entregado' | 'cancelado';

export interface BarDrinkOrder {
  id: string;
  fiestaId: string;
  drinkId: string;
  drinkName: string;
  guestName: string;
  tableNumber?: string;
  note?: string;
  status: BarDrinkOrderStatus;
  createdAt: string;
  updatedAt: string;
  source: 'touchscreen' | 'staff';
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
}

export interface CreateBarDrinkOrderInput {
  fiestaId: string;
  drinkId: string;
  guestName?: string;
  tableNumber?: string;
  note?: string;
}

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
  /** Obligatorio si llega guestId: sin el, cualquiera podia pedir a nombre de otro invitado. */
  guestAccessToken?: string;
  /**
   * Identificador del pedido que arma el que pide, UNO por toque. Si el mismo pedido llega
   * dos veces (se corto la respuesta y se reintento, o la cola sin senal lo reenvia), el
   * segundo devuelve el primero y no descuenta botellas de nuevo.
   */
  clientRequestId?: string;
  tableNumber?: string;
  note?: string;
}

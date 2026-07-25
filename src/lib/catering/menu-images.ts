import type { MenuItem, FullMenu } from "@/types/catering";

const DEFAULT_MENU_IMAGE_BASE = "/catering/menus/xv";
const LEGACY_CANVA_IMAGE_HOST =
  "ak-producciones-fiestas-y-eventos.my.canva.site";

export const defaultCateringDishImages: Record<string, string> = {
  dish_entrada_2: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_2.jpeg`,
  dish_entrada_3: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_3.jpeg`,
  dish_entrada_4: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_4.jpeg`,
  dish_entrada_5: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_5.jpeg`,
  dish_entrada_7: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_7.jpeg`,
  dish_entrada_8: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_8.jpeg`,
  dish_entrada_9: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_9.jpeg`,
  dish_entrada_10: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_10.jpeg`,
  dish_entrada_11: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_11.jpeg`,
  dish_entrada_12: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_12.jpeg`,
  dish_entrada_14: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_14.jpeg`,
  dish_entrada_16: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_16.jpeg`,
  dish_entrada_17: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_17.jpeg`,
  dish_entrada_19: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_19.jpeg`,
  dish_entrada_20: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_20.jpeg`,
  // The source files predate the canonical audit: their filenames are swapped.
  // Keep the dish IDs stable and resolve each one to the visually verified file.
  dish_entrada_21: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_22.jpeg`,
  dish_entrada_22: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_21.jpeg`,
  dish_entrada_23: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_23.jpeg`,
  dish_entrada_24: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_24.jpeg`,
  dish_entrada_25: `${DEFAULT_MENU_IMAGE_BASE}/dish_entrada_25.jpeg`,

  dish_main_2: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_2.jpeg`,
  dish_main_3: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_3.jpeg`,
  dish_main_5: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_5.jpeg`,
  dish_main_6: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_6.jpeg`,
  dish_main_7: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_7.jpeg`,
  dish_main_8: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_8.jpeg`,
  dish_main_9: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_9.jpeg`,
  dish_main_10: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_10.jpeg`,
  dish_main_11: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_11.jpeg`,
  dish_main_12: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_12.jpeg`,
  dish_main_13: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_13.jpeg`,
  dish_main_14: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_14.jpeg`,
  dish_main_15: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_15.jpeg`,
  dish_main_16: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_16.jpeg`,
  dish_main_17: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_17.jpeg`,
  dish_main_18: `${DEFAULT_MENU_IMAGE_BASE}/dish_main_18.jpeg`,

  dish_child_2: `${DEFAULT_MENU_IMAGE_BASE}/dish_child_2.jpeg`,
  dish_child_3: `${DEFAULT_MENU_IMAGE_BASE}/dish_child_3.jpeg`,
  dish_child_4: `${DEFAULT_MENU_IMAGE_BASE}/dish_child_4.jpeg`,
};

// These IDs exist in the master catalog, but the official Canva page does not
// confirm a matching dish photo. Do not let old Firestore or Canva URLs revive
// an approximate image for them.
export const cateringDishIdsWithoutConfirmedImage = new Set<string>([
  "dish_entrada_6",
  "dish_entrada_18",
  "dish_main_4",
  "dish_main_19",
  "dish_child_1",
]);

export function getCateringDishImage(
  item: Pick<MenuItem, "id" | "imageUrl"> | null | undefined,
): string | undefined {
  if (!item) return undefined;
  const isLegacyCanvaImage = item.imageUrl?.includes(LEGACY_CANVA_IMAGE_HOST);
  if (item.imageUrl && !isLegacyCanvaImage) return item.imageUrl;

  if (cateringDishIdsWithoutConfirmedImage.has(item.id)) return undefined;
  return defaultCateringDishImages[item.id];
}

export function getCateringMenuImage(
  menu: Pick<FullMenu, "imageUrl" | "items"> | null | undefined,
): string | undefined {
  if (!menu) return undefined;
  const dishImage = (menu.items || []).map(getCateringDishImage).find(Boolean);
  if (dishImage) return dishImage;

  const isLegacyCanvaImage = menu.imageUrl?.includes(LEGACY_CANVA_IMAGE_HOST);
  return menu.imageUrl && !isLegacyCanvaImage ? menu.imageUrl : undefined;
}

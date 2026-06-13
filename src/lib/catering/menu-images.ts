import type { MenuItem, FullMenu } from '@/types/catering';

const DEFAULT_MENU_IMAGE_BASE = '/catering/menus/xv';

const CANVA_IMAGE_BASE = 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering/images';

export const defaultCateringDishImages: Record<string, string> = {
  dish_entrada_2: `${CANVA_IMAGE_BASE}/bb05990f36f2bed48ad92af7d739d8f1.jpg`,
  dish_entrada_3: `${CANVA_IMAGE_BASE}/091ebb68495858d9b29cc849763b1455.jpg`,
  dish_entrada_4: `${CANVA_IMAGE_BASE}/7f551858d4c122c3e2553cabb4710eca.jpg`,
  dish_entrada_5: `${CANVA_IMAGE_BASE}/bd861ee979a9d96acf5bf6caf2850aad.jpg`,
  dish_entrada_6: `${CANVA_IMAGE_BASE}/bd861ee979a9d96acf5bf6caf2850aad.jpg`,
  dish_entrada_7: `${CANVA_IMAGE_BASE}/8407a860b0f4f953abe17e94d36630df.jpg`,
  dish_entrada_8: `${CANVA_IMAGE_BASE}/fc2de3f16c00312894a525bd3afa08a2.jpg`,
  dish_entrada_9: `${CANVA_IMAGE_BASE}/0b29c5f0f0915b7dd3a879fc4afd673e.jpg`,
  dish_entrada_10: `${CANVA_IMAGE_BASE}/355672672221b79e73f67792beb31e70.jpg`,
  dish_entrada_11: `${CANVA_IMAGE_BASE}/35e5fc2632a2bd6fc5ed9835ed4da7c6.jpg`,
  dish_entrada_12: `${CANVA_IMAGE_BASE}/15fa77d1df475c633c716409700caebf.jpg`,
  dish_entrada_14: `${CANVA_IMAGE_BASE}/21788fef65eeea6656bf17c86706868b.jpg`,
  dish_entrada_16: `${CANVA_IMAGE_BASE}/a8a03621d15f95a669a3945d20903390.jpg`,
  dish_entrada_17: `${CANVA_IMAGE_BASE}/89792b111c41a98ad881cb78b2a9649a.jpg`,
  dish_entrada_19: `${CANVA_IMAGE_BASE}/8c21f793b9149c3b121c693b97e8bbb3.jpg`,
  dish_entrada_20: `${CANVA_IMAGE_BASE}/763afa7e08236db6707e69d5a32e95a8.jpg`,
  dish_entrada_21: `${CANVA_IMAGE_BASE}/67688d35d6d53715023131ac33deee70.jpg`,
  dish_entrada_22: `${CANVA_IMAGE_BASE}/36a980719a3f41081369e6b8b7f9cd2e.jpg`,
  dish_entrada_23: `${CANVA_IMAGE_BASE}/180b263a9802dc1b36e0eed649a8f54d.jpg`,
  dish_entrada_24: `${CANVA_IMAGE_BASE}/15e129b2d2545aa3c373e8fa7f9c0264.jpg`,
  dish_entrada_25: `${CANVA_IMAGE_BASE}/2a89aa0ea2562699c548d0058ac5d107.jpg`,
  dish_main_2: `${CANVA_IMAGE_BASE}/8d5475b4eb9db364e519628bd870de93.jpg`,
  dish_main_3: `${CANVA_IMAGE_BASE}/6a84f3efe817d75d7b25cf77fb565dfa.jpg`,
  dish_main_4: `${CANVA_IMAGE_BASE}/dea21504f075327f4c275fc55c3592b5.jpg`,
  dish_main_5: `${CANVA_IMAGE_BASE}/015589054e085c1770b7056b77c17459.jpg`,
  dish_main_6: `${CANVA_IMAGE_BASE}/eccb58e62b6452246041ef68648edb10.jpg`,
  dish_main_7: `${CANVA_IMAGE_BASE}/5008cd701d1296ea375592540e27a7e3.jpg`,
  dish_main_8: `${CANVA_IMAGE_BASE}/986d0e33bbba90b39e78b327e99357a2.jpg`,
  dish_main_9: `${CANVA_IMAGE_BASE}/ba7bf2e79345a3c6b95cb8e4dafc3a77.jpg`,
  dish_main_10: `${CANVA_IMAGE_BASE}/34f54f57f9113df32abff833555c7378.jpg`,
  dish_main_11: `${CANVA_IMAGE_BASE}/f8d5ba53b620fa79c9318a0fba5f17a4.jpg`,
  dish_main_12: `${CANVA_IMAGE_BASE}/aeb98c7a317b5574466fac391ad07408.jpg`,
  dish_main_13: `${CANVA_IMAGE_BASE}/682c2090b459d0add6f6c69cf7205ddb.jpg`,
  dish_main_14: `${CANVA_IMAGE_BASE}/fa917ea28c0456f63a061b26bceeaab9.jpg`,
  dish_main_15: `${CANVA_IMAGE_BASE}/c8e1554d239f52059e90cb22d749dab5.jpg`,
  dish_main_16: `${CANVA_IMAGE_BASE}/bf1351da006a63605be67b44a56e07af.jpg`,
  dish_main_17: `${CANVA_IMAGE_BASE}/9ca8d23607e60f67e0e712458b9550a1.jpg`,
  dish_main_18: `${CANVA_IMAGE_BASE}/caa614df1ec5f43530abc2922de7f9e0.jpg`,
  dish_main_19: `${CANVA_IMAGE_BASE}/004d05ca74e348885036538e2d20a489.jpg`,
  dish_child_1: `${CANVA_IMAGE_BASE}/c6cd55bfec5c2d4dd88edf6808a65e0f.jpg`,
  dish_child_2: `${CANVA_IMAGE_BASE}/c6cd55bfec5c2d4dd88edf6808a65e0f.jpg`,
  dish_child_3: `${CANVA_IMAGE_BASE}/6d5ea5a6835d7eac601fd95ca6151f8e.jpg`,
  dish_child_4: `${CANVA_IMAGE_BASE}/60cd06285835df375f2b45324c3406a8.jpg`,
};

export function getCateringDishImage(item: Pick<MenuItem, 'id' | 'imageUrl'> | null | undefined): string | undefined {
  if (!item) return undefined;
  return item.imageUrl || defaultCateringDishImages[item.id];
}

export function getCateringMenuImage(menu: Pick<FullMenu, 'imageUrl' | 'items'> | null | undefined): string | undefined {
  if (!menu) return undefined;
  return menu.imageUrl || (menu.items || []).map(getCateringDishImage).find(Boolean);
}

import fs from "node:fs";
import path from "node:path";
import { defaultCateringDishImages, getCateringDishImage } from "./menu-images";

describe("catering menu images", () => {
  const menuItems = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "src", "data", "menus-catering.json"),
      "utf8",
    ),
  ).flatMap((menu: { items?: Array<{ id: string; imageUrl?: string }> }) =>
    menu.items || [],
  );

  it("maps every bundled dish image to a real public file", () => {
    for (const imageUrl of Object.values(defaultCateringDishImages)) {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "public", imageUrl.replace(/^\/+/, "")),
        ),
      ).toBe(true);
    }
  });

  it("keeps an image uploaded from the master catering module", () => {
    expect(
      getCateringDishImage({
        id: "dish_entrada_2",
        imageUrl: "/uploads/catering/custom-dish.jpeg",
      }),
    ).toBe("/uploads/catering/custom-dish.jpeg");
  });

  it("replaces old Canva defaults with the verified local image", () => {
    expect(
      getCateringDishImage({
        id: "dish_entrada_2",
        imageUrl:
          "https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering/images/old.jpg",
      }),
    ).toBe("/catering/menus/xv/dish_entrada_2.jpeg");
  });

  it.each([
    ["dish_entrada_9", "bd861ee979a9d96acf5bf6caf2850aad.jpg"],
    ["dish_entrada_17", "3c9c8d8d48fbe044efb72e2dbce0eb49.jpg"],
    ["dish_main_5", "caa614df1ec5f43530abc2922de7f9e0.jpg"],
    ["dish_main_11", "986d0e33bbba90b39e78b327e99357a2.jpg"],
    ["dish_main_17", "015589054e085c1770b7056b77c17459.jpg"],
    ["dish_child_3", "bf11e7a1d5ad72114a72ca5e7e78972d.jpg"],
  ])("keeps the verified Canva association for %s", (dishId, imageFile) => {
    const dish = menuItems.find(
      (item: { id: string; imageUrl?: string }) => item.id === dishId,
    );

    expect(dish?.imageUrl?.endsWith(`/images/${imageFile}`)).toBe(true);
  });
});

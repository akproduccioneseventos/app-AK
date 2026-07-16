import fs from "node:fs";
import path from "node:path";
import { defaultCateringDishImages, getCateringDishImage } from "./menu-images";

describe("catering menu images", () => {
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
});

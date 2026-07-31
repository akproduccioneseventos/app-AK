import fs from "node:fs";
import path from "node:path";
import {
  cateringDishIdsWithoutConfirmedImage,
  defaultCateringDishImages,
  getCateringDishImage,
} from "./menu-images";

describe("catering menu images", () => {
  const jsonText = fs.readFileSync(
    path.join(process.cwd(), "src", "data", "menus-catering.json"),
    "utf8",
  ).replace(/^\uFEFF/, "");
  const menuItems = JSON.parse(jsonText).flatMap((menu: { items?: Array<{ id: string; imageUrl?: string | null }> }) =>
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

  it("keeps an image intentionally loaded from the master catering catalog", () => {
    expect(
      getCateringDishImage({
        id: "dish_entrada_9",
        imageUrl: "/uploads/catering/custom-dish.jpeg",
      }),
    ).toBe("/uploads/catering/custom-dish.jpeg");
  });

  it("does not mistake a custom filename containing canva for the legacy host", () => {
    expect(
      getCateringDishImage({
        id: "dish_entrada_9",
        imageUrl: "/uploads/catering/canva-design.jpeg",
      }),
    ).toBe("/uploads/catering/canva-design.jpeg");
  });

  it("replaces the legacy Canva URL with the verified canonical photo", () => {
    expect(
      getCateringDishImage({
        id: "dish_entrada_9",
        imageUrl:
          "https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering/images/old.jpg",
      }),
    ).toBe("/catering/menus/xv/dish_entrada_9.jpeg");
  });

  it("does not show a fallback image for dishes not confirmed on Canva", () => {
    for (const id of cateringDishIdsWithoutConfirmedImage) {
      expect(
        getCateringDishImage({
          id,
          imageUrl:
            "https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering/images/old.jpg",
        }),
      ).toBeUndefined();
    }
  });

  it.each([
    ["CERDO ARROLLADO CON MESA BUFET", "dish_main_7.jpeg"],
    ["CORDERO ASADO CON MESA BUFET", "dish_main_17.jpeg"],
    ["ASADO COMPLETO CON MESA BUFET", "dish_main_18.jpeg"],
  ])("keeps menu variants associated with the correct dish photo: %s", (name, localFile) => {
    expect(
      getCateringDishImage({
        id: `event-${name}`,
        name,
        imageUrl:
          "https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering/images/old.jpg",
      }),
    ).toBe(`/catering/menus/xv/${localFile}`);
  });

  it("has one canonical source per confirmed catalog dish", () => {
    const confirmedItems = menuItems.filter(
      (item: { id: string; imageUrl?: string | null }) =>
        !cateringDishIdsWithoutConfirmedImage.has(item.id),
    );

    const expectedIds = Array.from(
      new Set([
        ...confirmedItems
          .filter((item: { imageUrl?: string | null }) => Boolean(item.imageUrl))
          .map((item: { id: string }) => item.id),
        "dish_entrada_6",
        "dish_main_4",
      ]),
    ).sort();

    expect(Object.keys(defaultCateringDishImages).sort()).toEqual(expectedIds);

    const sourceUrls = confirmedItems
      .map((item: { imageUrl?: string | null }) => item.imageUrl)
      .filter((imageUrl: string | null | undefined): imageUrl is string => Boolean(imageUrl));
    expect(new Set(sourceUrls).size).toBe(sourceUrls.length);
  });

  it.each([
    ["dish_entrada_9", "bd861ee979a9d96acf5bf6caf2850aad.jpg", "dish_entrada_9.jpeg"],
    ["dish_entrada_17", "3c9c8d8d48fbe044efb72e2dbce0eb49.jpg", "dish_entrada_17.jpeg"],
    ["dish_entrada_21", "36a980719a3f41081369e6b8b7f9cd2e.jpg", "dish_entrada_22.jpeg"],
    ["dish_entrada_22", "8c21f793b9149c3b121c693b97e8bbb3.jpg", "dish_entrada_21.jpeg"],
    ["dish_main_5", "caa614df1ec5f43530abc2922de7f9e0.jpg", "dish_main_5.jpeg"],
    ["dish_main_11", "986d0e33bbba90b39e78b327e99357a2.jpg", "dish_main_11.jpeg"],
    ["dish_main_17", "015589054e085c1770b7056b77c17459.jpg", "dish_main_17.jpeg"],
    ["dish_child_3", "bf11e7a1d5ad72114a72ca5e7e78972d.jpg", "dish_child_3.jpeg"],
  ])("keeps the verified Canva association for %s", (dishId, imageFile, localFile) => {
    const dish = menuItems.find(
      (item: { id: string; imageUrl?: string | null }) => item.id === dishId,
    );

    expect(dish?.imageUrl?.endsWith(`/images/${imageFile}`)).toBe(true);
    expect(defaultCateringDishImages[dishId]).toBe(
      `/catering/menus/xv/${localFile}`,
    );
  });
});

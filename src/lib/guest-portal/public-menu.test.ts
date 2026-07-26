import { getPublicGuestMenuSections } from "./public-menu";

describe("public guest menu", () => {
  it("uses the table menu when it has real content", () => {
    expect(
      getPublicGuestMenuSections({
        menuMesa: {
          entrada: "Empanadas",
          platoPrincipal: "Asado",
          postres: "Torta",
        },
        menuSeleccionPortal: {
          entrada: "Entrada anterior",
          principal: "Principal anterior",
        },
      }),
    ).toEqual([
      { key: "entrada", label: "Entrada", value: "Empanadas" },
      { key: "principal", label: "Plato principal", value: "Asado" },
      { key: "postres", label: "Postres", value: "Torta" },
    ]);
  });

  it("falls back to the client selection when menuMesa is empty", () => {
    expect(
      getPublicGuestMenuSections({
        menuMesa: {
          entrada: " ",
          platoPrincipal: "",
        },
        menuSeleccionPortal: {
          entrada: "Bruschettas",
          principal: "Pollo con guarnicion",
          postre: "Torta",
          bebidas: "Refrescos",
        },
      }),
    ).toEqual([
      { key: "entrada", label: "Entrada", value: "Bruschettas" },
      {
        key: "principal",
        label: "Plato principal",
        value: "Pollo con guarnicion",
      },
      { key: "postre", label: "Postre", value: "Torta" },
      { key: "bebidas", label: "Bebidas", value: "Refrescos" },
    ]);
  });

  it("returns no sections when neither source has displayable content", () => {
    expect(
      getPublicGuestMenuSections({
        menuMesa: {},
        menuSeleccionPortal: {},
      }),
    ).toEqual([]);
  });
});

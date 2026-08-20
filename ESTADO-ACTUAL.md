# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 20 de agosto de 2026.
**Estado de la app:** sana. Los cuatro controles pasaron: acentos limpios (0 rotos), TypeScript en 0 errores, pruebas unitarias 100% en verde, build de producción Next.js OK.
**Orden vigente:** `docs/ordenes/ahora.md` — Bloques 1 a 8 completados.

## Lo que se cerró en esta tanda

- **Bloque 8 — Que lo impreso salga como sale de verdad:**
  - `src/lib/entretenimiento/tira-fotocabina.ts`:
    - Hoja de 10x15 cm vertical (1200x1800 px).
    - **Fotocabina (3 fotos):** 1 foto grande arriba a todo el ancho y 2 chicas abajo lado a lado.
    - **Espejo Mágico y 360 con IA (1 foto):** 1 sola foto grande ocupando la parte superior en la misma lámina de 10x15.
    - **Pie personalizado:** Nombre del homenajeado en letra manuscrita grande (centrado), motivo debajo ("Mis 15 Años", "Nuestra Boda", etc.), fecha del evento y logo oficial de AK Producciones abajo a la izquierda sobre el fondo decorado de la fiesta (o degradado suave liso si no tiene). Sin textos inventados ni de relleno si no hay nombre cargado.
  - `src/app/evento/espejo-magico/[fiestaId]/page.tsx` y `src/app/evento/fotocabina/[fiestaId]/page.tsx`: conectadas a `componerTiraDeFotos` con los datos reales de la fiesta.
  - Suite de pruebas unitarias `src/__tests__/impreso-10x15-reparto-y-personalizacion.test.ts` (5 tests en verde).

- **Bloque 7 — Revisión y protección de puertas de servidor:**
  - Se auditaron y protegieron con `requireAppSession()` / `requirePermiso()` funciones de servidor del panel administrativo.
  - Se actualizaron las funciones pendientes y el test `src/__tests__/auditoria-puertas-abiertas.test.ts` pasa en verde.

- **Bloques 1 a 6:**
  - Tótem de la barra con pantalla de éxito, QR grande para descarga, trago pedido y switch de redes.
  - Buzón de saludos con modo foto y acceso en el portal del invitado.
  - Fotos de estaciones con dueño (`guestId` y `guestAccessToken`).
  - Editor de historia ("Nuestra Historia") y hospedajes recomendados en la invitación web.
  - Calidad de referencia de video 360 (`ARELI 360 AK`).

## Lo que depende del dueño (no lo puede hacer ninguna IA)

1. **Reclamar la ficha de Google** y elegir bien la categoría (negocio que atiende a domicilio).
2. **Confirmar que el enlace para pedir reseñas es el suyo** en Ajustes.

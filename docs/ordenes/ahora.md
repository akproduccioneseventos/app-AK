# Que la pantalla de posicionamiento controle los títulos de verdad

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios.** Es un solo punto, pero si aparece algo más
mientras trabajás, va adentro de la misma, no en otra.

**Arrancá desde la versión principal de ahora.**

Antes de tocar nada, leé `docs/MANUAL-DE-LA-APP.md`, `docs/YA-RESUELTO.md` y
`docs/COMO-AUDITAR.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que está bien y no se toca

La tanda anterior quedó bien en casi todo: la asistente ya recibe el mapa del
menú y cancela la navegación si el modelo inventa una pantalla; el botón de
probar Instagram anda del lado del servidor y traduce los errores de Meta; el
blog quedó en una nota cada dos días. Nada de eso se rehace.

---

## El único punto: la auditoría de títulos se controla a sí misma

**El problema, en criollo:** la pantalla de posicionamiento promete avisar cuando
una página de venta se queda sin título o sin descripción. Pero no lee los
títulos de verdad: los tiene **copiados a mano** en una lista adentro de
`src/app/actions/seo-posicionamiento.ts`, y compara esa lista contra sí misma.

Si mañana una página pierde el título de verdad, la pantalla va a seguir diciendo
"óptimo". Y si alguien cambia un título en la página, la pantalla va a mostrar el
viejo. Es una promesa que no puede cumplir, que es justo lo que
`docs/COMO-AUDITAR.md` marca como lo más grave.

**Qué hay que hacer:**

1. **Sacar la lista copiada a mano** (`METADATA_PAGINAS_VENTA`) y leer los títulos
   y descripciones **donde viven de verdad**: `src/lib/seo/event-landing.ts`,
   `src/lib/seo/paginas-publicas.ts` y el `metadata` o `generateMetadata` de cada
   página pública. Una sola fuente, no dos.

2. **Que la auditoría detecte de verdad** una página de `PAGINAS_PARA_GOOGLE` que
   no tenga título o descripción, o que los tenga vacíos. Probalo: sacale el
   título a una página a propósito y verificá que la pantalla lo marca. Después
   devolvela como estaba.

3. **Dejarlo como control automático** en las pruebas, además de en la pantalla,
   para que no haga falta que alguien entre a mirar.

4. **Los términos de búsqueda que se muestran** ("fiestas de 15 en Salto", etc.)
   están escritos a mano y aparecen abajo del panel de Google, donde se pueden
   confundir con búsquedas medidas de verdad. Dejá bien claro en pantalla que son
   **las búsquedas que estamos apuntando**, no lo que la gente buscó. Si la
   conexión con Google no está, que se note que todavía no hay medición real.

5. **Sacá la jerga de los mensajes que ve el dueño.** El aviso de Instagram dice
   los nombres técnicos de las credenciales. Él no programa: decile qué le falta y
   dónde se carga, sin nombres de variables.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.

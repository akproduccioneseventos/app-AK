# Enchufar lo que quedó construido y sin usar

**Para:** Gemini (Antigravity)
**Escrita:** 18 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los dos bloques adentro.** No una por bloque:
cada fusión dispara un despliegue y eso se paga. Si un bloque se traba, entregá el
resto igual, en la misma propuesta, y avisá cuál faltó y por qué.

**Arrancá desde la versión principal de ahora**, no desde una rama vieja. Las dos
últimas entregas llegaron hechas sobre una base vieja y una de ellas traía adentro
la anterior entera: habría borrado tres correcciones sin que se notara.

Antes de tocar nada, leé `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Para qué es esto

Hay seis pantallas que alguien programó, que están terminadas, y que **ningún lado
muestra**. No están rotas: están desconectadas. Es trabajo ya pago que no rinde.

---

# BLOQUE 1 — El asistente de ventas, en las páginas de venta y en ninguna otra

**Es el importante. Empezá por acá.**

`src/components/asistente-ak/AkAssistant.tsx` está hecho: contesta con el catálogo
real, no inventa precios ni fechas y guarda al interesado en el CRM. **Ninguna
pantalla lo muestra.**

Qué pasó: aparecía en toda la aplicación —el globito de ventas salía encima de la
invitación de un casamiento, del portal de un cliente que ya contrató y de la
presentación proyectada en el salón—. Al corregirlo se lo sacó de todos lados y
**nunca se lo volvió a poner donde correspondía**.

Hoy el dueño prende el interruptor en Ajustes y no pasa nada.

## Qué hacer

Mostrarlo **únicamente** en las páginas de venta: `/bodas`, `/quinceaneras`,
`/cumpleanos`, `/fiestas`, `/corporativos`, `/aniversarios`, `/experiencia-ak` y
`/catalogo`.

**Lo que está prohibido, y no es opinable:**

> No puede aparecer sobre la invitación de un evento, el portal del cliente, el
> portal del invitado, las estaciones de la fiesta, la presentación del salón ni
> ninguna pantalla del equipo.

- **Se engancha por lista de permitidas, no por lista de prohibidas.** La lista de
  prohibidas fue exactamente lo que falló la vez pasada: siempre falta una.
  Ponerlo en las páginas de venta y en ninguna otra; si mañana nace una pantalla
  nueva, que el asistente NO aparezca solo.
- **Sigue apagado de fábrica.** Se prende en Ajustes. Si el interruptor está
  apagado, no se muestra ni se carga.
- **Y que el interruptor se note.** Hoy prenderlo no cambia nada visible; cuando
  esto funcione, que al prenderlo el dueño vea dónde va a aparecer.

## Cómo se comprueba

Una prueba que recorra las pantallas y verifique las dos puntas: que el asistente
**aparece** en las ocho páginas de venta con el interruptor prendido, y que **no
aparece** en la invitación, el portal del cliente, el portal del invitado ni las
pantallas del equipo. Y otra que confirme que con el interruptor apagado no
aparece en ninguna.

---

# BLOQUE 2 — Los otros cinco: enchufar o borrar

Cinco componentes más que nadie importa. Para cada uno, **decidí vos** y contá qué
decidiste:

| Componente | Qué es | Sugerencia |
|---|---|---|
| `CommercialJourneySection` | Sección de portada | Mirala: si suma a la venta, enchufala en la portada. Si no, borrala. |
| `AkDifferenceSection` | Sección de portada ("por qué AK") | Igual que la anterior. |
| `ConvertToClientDialog` | Pasar un prospecto a cliente | Si el CRM ya hace esa conversión por otro lado, borralo. Si no, enchufalo en la ficha del prospecto. |
| `CateringSimulator` | Simulador de comida en el portal del cliente | Ojo: si toca precios o cantidades de comida, **no lo enchufes**, avisá y dejalo. Eso lo revisa Claude. |
| `ConfigFormItem` | Campo de formulario de ajustes | Es de uso interno; si no lo usa nadie, borralo. |

**Regla para borrar:** sólo si estás seguro de que nada lo usa. Confirmá con una
búsqueda sin distinguir mayúsculas antes de borrar: ya se declaró que algo no
existía por buscar `autoSave` cuando la función se llamaba `handleAutoSaveSalary`.

---

## Los cuatro controles, antes de entregar

1. `npm run check:acentos` — sin acentos rotos.
2. `npx tsc --noEmit` — cero errores.
3. `npx jest --silent` — todas en verde.
4. `npm run build` — tiene que terminar bien.

**El build es obligatorio, no un extra.** Ya pasó que el revisor de tipos pasaba y
el build fallaba, y la aplicación estuvo seis días sin poder publicarse.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` qué hiciste con cada uno de los seis, y actualizá
`docs/QUE-HAY-EN-LA-APP.md`: hoy el asistente figura como "a medias, no enchufado".
**Va en la misma propuesta**, no en una aparte.

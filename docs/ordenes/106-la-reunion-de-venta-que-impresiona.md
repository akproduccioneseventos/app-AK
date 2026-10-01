# 106 — La reunión de venta que impresiona, y la fiesta que no pierde invitados

**Para:** Gemini.
**Escrita por:** Claude, el 1 de octubre de 2026. Pedido del dueño: mostrar en la reunión, por tipo
de fiesta, **fotos y videos de YouTube** de cada servicio (la fuente de chocolate, las tres
discotecas…); **hablarle a la IA** para que vaya agregando servicios al presupuesto; y una **demo de
toda la tecnología** (módulo del invitado, del cliente, cada entretenimiento) para que la gente la
viva antes de contratar.

## Cómo se entrega

- **UNA SOLA PROPUESTA con las órdenes 104, 101, 102, 105 y 106**, en ese orden (primero los
  arreglos de la 104). Arrancá de la rama **`claude/ponte-al-dia-qtrho3`** (tiene estas órdenes y la
  versión principal de hoy). Si un bloque se traba, entregá el resto y avisá cuál.
- `npm run "publicar?"` completo y la última pantalla pegada en la propuesta.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`. Anotá cada bloque en `docs/YA-RESUELTO.md` con su línea en
  `comprobar`.

---

## Lo que ya existe (NO rehacer)

- **Configurador de la reunión**: `src/app/(app)/empresa/configurador-reunion/page.tsx`. Se tocan los
  servicios y el total se recalcula en vivo (`calculateSimulatorPricing` ~l.216, panel "Resumen
  financiero en vivo" ~l.616-647) y "Generar presupuesto formal" lo guarda (`savePresupuesto` ~l.266).
  Ya muestra el salón en 3D (~l.385-431).
- **Presentación LED**: `src/app/presentacion-led/` (diapositivas por tipo de fiesta en
  `lib/contenido-por-tipo.ts`).
- **Demo de tecnología**: `src/app/marketing/demo-tecnologia/page.tsx` crea una fiesta de prueba
  (`createDemoFiesta`) y abre portal del cliente, invitación, muro y 360.
- **Salón 3D con medidas reales**: el equipo carga ancho y largo en
  `src/app/(app)/empresa/salones/[id]/croquis/page.tsx` (~l.471-503) y una foto del plano de fondo.

## Bloque 1 — Cada servicio con sus fotos y videos

- En el catálogo de servicios (donde se cargan hoy los servicios del presupuesto), cada servicio
  suma **una galería**: hasta 8 fotos (con el subidor que ya usa el catálogo) y hasta 3 enlaces de
  YouTube, con título. Si un enlace no es de YouTube, el formulario lo dice y no guarda.
- En el **configurador de la reunión**, cada tarjeta de servicio tiene "Ver" que abre la galería a
  pantalla completa, pensada para la pantalla LED: fotos grandes que se pasan con el dedo o las
  flechas, y el video con `youtube-nocookie.com/embed/<id>`. **Agregar al presupuesto** desde la
  misma galería.
- La presentación LED usa la misma galería en la diapositiva de cada categoría
  (`slides/categoria-servicios-slide.tsx`).

**La prueba de navegador**: cargar un servicio con 2 fotos y un video, abrir el configurador, tocar
"Ver": aparecen las 2 fotos y el reproductor con ese id; "Agregar" suma el servicio y el total cambia.

## Bloque 2 — Hablarle a la IA en la reunión

En el configurador, un botón **"Asistente"** con micrófono (reusá la voz que ya existe en
`MultiAgentWidget`, `src/components/multiagent/multiagent-widget.tsx`, o la conversación en vivo de la
orden 105 bloque 3): *"agregá la fuente de chocolate y la discoteca premium, y subí a 150 invitados"*.

- La IA sólo puede tocar **el borrador en pantalla**: agregar o sacar servicios del catálogo, cambiar
  adultos y menores. **No guarda nada**: el presupuesto se guarda recién con el botón "Generar
  presupuesto formal", como hoy. No inventa servicios ni precios: sólo elige de la lista cargada; si
  no encuentra uno, lo dice.
- Mientras habla, la pantalla muestra con una animación qué agregó y cómo cambió el total, para que
  el cliente lo vea.
- Contesta con la voz elegida en Ajustes (orden 105 bloque 2).

**La prueba**: con la IA simulada devolviendo "agregar fuente de chocolate", el servicio aparece en
el borrador, el total cambia y **no** se llamó a `savePresupuesto`; un servicio inventado no se
agrega.

## Bloque 3 — La demo de toda la tecnología, como recorrido

Desde el configurador, botón **"Mostrar la experiencia"**: crea (o reusa) la fiesta de demo con
`createDemoFiesta` y abre un **recorrido a pantalla completa**, con pasos grandes para la pantalla
LED:

1. La invitación digital y confirmar asistencia.
2. El portal del invitado (su QR, su mesa, sus fotos).
3. El portal del cliente (cuotas, invitados, menú, decoración en 3D).
4. Cada entretenimiento contratado o que se quiere mostrar: fotocabina, 360, espejo, barra de tragos,
   buzón, pantalla gigante. Cada uno se puede **probar en vivo** con la cámara.
5. El álbum del recuerdo terminado.

La fiesta de demo trae datos de ejemplo marcados como ejemplo y **no** cuenta en reportes, cobros
ni estadísticas (verificá que `createDemoFiesta` ya la marque así; si no, sumá la marca y que los
reportes la excluyan). Botón "Borrar demo" al final.

**La prueba de navegador**: el recorrido abre los cinco pasos en orden y cada uno muestra su pantalla
real; la fiesta de demo no aparece en el listado de fiestas reales ni en el reporte de ingresos.

## Bloque 4 — Confirmar asistencia y entrada al salón sin perder a nadie con dos servidores

**Qué pasa hoy.** `actualizarFiesta` (`src/lib/fiesta/actualizar-fiesta.ts` ~l.9-60) usa un turno
**en la memoria de un servidor** (`acquireFiestaUpdateLock`) y después guarda la fiesta entera. La app
puede levantar hasta 4 servidores (`apphosting.yaml`: `maxInstances: 4`). Con dos servidores a la
vez, dos confirmaciones o dos ingresos al salón leen la misma fiesta, y el que guarda segundo **borra
lo del primero**. Lo usan `submitPublicRsvp` y `checkInGuest`
(`src/app/actions/fiesta/invitados.actions.ts` ~l.321 y ~l.350).

**Qué hacer:** que esos dos cambios (confirmar o anular, y marcar la llegada) se hagan **dentro de una
transacción de la base** sobre el documento de la fiesta (como `mutarDocumentoConTransaccion` en
`src/lib/generic-json-store.ts`, con el formato que lee `readFromFirestore`). Leer el invitado adentro
de la transacción y cambiar **sólo** ese invitado. En modo local, el mutex por archivo de la orden 103.

**La prueba** (`src/__tests__/dos-servidores-no-pierden-invitados.test.ts`): con una base de mentira
que devuelve **una copia** en cada lectura y simula dos servidores (sin el turno en memoria),
dos confirmaciones de invitados distintos al mismo tiempo dejan las dos; dos escaneos del mismo QR
cuentan una sola llegada; confirmar y después anular deja "no viene" y los confirmados bajan. Tiene que
ponerse en rojo con el código de hoy.

## Bloque 5 — Que la pantalla gigante muestre TODAS las fotos

Hoy la pantalla trae las fotos cada 2 segundos (`src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`) y
ninguna prueba cuenta que lleguen todas. Sumá a `tests/e2e/la-pantalla-gigante-anda.spec.ts`: subir
**20 fotos** a la fiesta de prueba y comprobar que la pantalla las muestra a las 20 en la rotación
(contando las que pasan, no mirando que "se vea algo"); y que una foto rechazada por moderación **no**
aparece.

## Bloque 6 — Cada foto que sube un invitado se revisa sola antes de salir

**Lo que ya existe:** `checkImageSafety` (`src/lib/social-fiesta/content-safety-ai.ts` ~l.39, Google
Vision) ya frena el contenido sexual o inapropiado en `src/app/actions/social-gallery.ts` (~l.446) y en
`src/app/actions/fiesta/entretenimiento.actions.ts`; si la revisión falla, la foto va a moderación
manual (`shouldQueueForManualReview`, `src/lib/social-fiesta/guardrails.ts` ~l.50). **No lo rehagas.**

**Qué falta (pedido del dueño):**

1. **Fotos movidas, desenfocadas o negras no se suben.** Antes de subir, en el celular del invitado,
   medí la nitidez con `calcularNitidez` (`src/lib/album/elegir-las-mejores.ts` ~l.25) y el brillo
   promedio. Si la nitidez es muy baja o la foto está casi toda negra o blanca, **no se sube** y sale el
   cartel. Afiná el umbral con 10 fotos buenas y 10 malas en la prueba (no lo adivines).
2. **El cartel que ve el invitado**, para los dos casos (borrosa e inadecuada), en grande y amable:
   *"Esta foto no está permitida."* y abajo el motivo corto: *"Salió movida o muy oscura: probá de
   nuevo"* o *"No cumple las reglas de la fiesta"*. Cambiá el texto de ~l.448 (hoy dice "Archivo
   bloqueado por riesgo de contenido adulto…").
3. **La cola de subida:** cuando un invitado elige muchas fotos, o muchos suben a la vez, las fotos
   esperan en una cola **en su celular** y se suben **de a una**, con un contador "Subiendo 3 de 12".
   Si se corta la señal, siguen cuando vuelve (la página del muro ya guarda sin señal: usá esa misma
   cola, no hagas otra). El servidor no recibe todo de golpe.

**La prueba**: una imagen borrosa generada en la prueba no se sube y aparece "Esta foto no está
permitida"; una nítida sí; 12 fotos elegidas a la vez se suben de a una y llegan las 12.

## Bloque 7 — "Vista mágica" del salón en la reunión

**Lo que ya existe:** `generarVisualizacionSalonAi` (`src/app/actions/fiesta/decoracion.actions.ts`
~l.206) arma con IA una imagen del salón decorado a partir de la foto del salón, el estilo, la paleta y
los elementos de decoración, con tope de 3 por fiesta. Hoy sólo se usa en la decoración de una fiesta
ya creada (`src/app/(app)/fiestas/nueva/decoracion/page.tsx` ~l.222).

**Qué hacer:** en el configurador de la reunión, botón **"Ver el salón decorado"**: se elige el salón
(sus fotos están en `fotos` de `src/types/salon.ts` ~l.49), los colores de la fiesta (3 colores) y el
tipo de fiesta, y la IA devuelve **dos imágenes** del salón decorado con mesas y pista, a pantalla
completa, junto a la vista 3D que ya existe. Sacá la parte común de `generarVisualizacionSalonAi` a una
función que sirva sin fiesta creada. **Tope: 6 imágenes por reunión** y pasa por `registrarConsumoIA`.
Un aviso chico abajo: *"Imagen de referencia generada con IA"* (no es una promesa de cómo queda).

## Bloque 8 — La voz más real posible

La voz de la reunión y del asistente usa **la voz de Gemini** (orden 105, bloque 2): elegí en Ajustes,
con "Escuchar", entre las voces en español, y por omisión una cálida y natural. Además dejá preparada,
**apagada**, la opción de una voz de un servicio especializado (por ejemplo ElevenLabs), que suena más
humana pero **se paga por mes**: en Ajustes aparece deshabilitada con "Servicio pago: consultalo antes
de activarlo". No se contrata nada.

## Bloque 9 — "Viví la experiencia AK" en la web

Una página pública `/experiencia` (enlazada desde la portada) con el **mismo recorrido** del bloque 3,
pensado para el prospecto desde su casa:

- Usa **una fiesta de muestra fija**, de sólo lectura, con datos inventados y marcados como ejemplo.
  **Nunca** una fiesta real ni datos de clientes. Nada de lo que toque el visitante se guarda.
- Pasos: la invitación que recibirían sus invitados → confirmar asistencia → el portal del invitado
  → el portal del cliente (cuotas, menú, decoración 3D) → probar un entretenimiento con su cámara (la
  fotocabina, sin publicar en ningún muro) → el álbum terminado.
- Al final, un solo llamado: **"Armá tu presupuesto"** (al simulador) y **"Escribinos por WhatsApp"**.
- **Reglas de venta de `CLAUDE.md`:** sin garantías, sin "24/7", sin plazos ni precios congelados,
  sin nombrar personal; "+7 años" y "+200 eventos". Que se vea bien en el celular (habilidad
  `celular-primero`) y cargue rápido (`que-cargue-rapido`).
- La medición sí puede medir esta página (es de venta): sumala a `PAGINAS_DE_VENTA` en
  `src/lib/medicion-segura.ts`.

**La prueba de navegador**: el recorrido abre los seis pasos; nada de lo que se toca crea datos en la
base; y ningún texto de la página contiene "garant", "24/7" ni "cero fallas".

```comprobar
usa: idDeYoutube en src/app/(app)/empresa/configurador-reunion/page.tsx
usa: createDemoFiesta en src/app/(app)/empresa/configurador-reunion/page.tsx
prueba: src/__tests__/dos-servidores-no-pierden-invitados.test.ts
usa: calcularNitidez en src/app/evento/social/[fiestaId]/page.tsx
no-usa: Archivo bloqueado por riesgo de contenido adulto en src/app/actions/social-gallery.ts
usa: '/experiencia' en src/lib/medicion-segura.ts
```

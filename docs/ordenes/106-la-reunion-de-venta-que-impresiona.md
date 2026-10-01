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

Ordenado por **"La tecnología de tu fiesta"**, no todo como entretenimiento (pedido del dueño):
**Para tus invitados** (invitación, confirmar asistencia, su portal con QR y mesa) → **Para vos**
(portal del cliente, cuotas, menú, decoración 3D) → **En la fiesta** (pantalla gigante, tótem, barra
tecnológica) → **Entretenimiento** (fotocabina, 360, espejo, Bogue, cabina con IA, buzón, juegos) →
**Los recuerdos** (álbum, galería, Video de Vida). Los pasos:

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

## Bloque 10 — La barra de tragos completa (pedido del dueño, 01/10/2026)

**Lo que ya existe (NO rehacer):** el invitado pide con su nombre en la pantalla de la barra
(`src/app/evento/barra/[fiestaId]/page.tsx`), con foto con marco y video de 8 segundos; cada pedido
descuenta botellas por la receta (`recetaIngredientes`, tipo `TragoRecetaIngrediente` en
`src/types/fiesta.ts` ~l.1031: `insumoId`, `cantidad`, `unidad`); el barman ve los pedidos y cambia
el estado (`updateBarDrinkOrderStatus`, estados `nuevo`→`preparando`→`listo`→`entregado`) y carga
tragos pedidos de palabra (`createBarmanManualOrder`); al final está el cierre con el conteo
(`CierreDeBarra`, `getCierreDeBarra`/`guardarCierreDeBarra` en
`src/app/actions/fiesta/barra-tecnologica.actions.ts` ~l.1080-1142). La carta de la empresa se edita
en `/empresa/menus/tragos`.

**1. Las recetas reales** — cargalas en la carta de la empresa, unidas a los insumos de
`insumos.json` (creá los que falten, en ml o g). Quedan editables en `/empresa/menus/tragos`.
Medidas para vaso de 300 ml con hielo:

| Trago | Receta |
|---|---|
| Daiquiri de durazno | 50 ml ron blanco, 80 g durazno, 20 ml jugo de limón, 15 ml almíbar |
| Caipirinha | 60 ml cachaça, 1/2 lima, 10 g azúcar |
| Arizona | 50 ml vodka, 180 ml té helado, 15 ml jugo de limón |
| Daiquiri de ananá | 50 ml ron blanco, 80 g ananá, 20 ml jugo de limón, 15 ml almíbar |
| Daiquiri de frutilla | 50 ml ron blanco, 80 g frutilla, 20 ml jugo de limón, 15 ml almíbar |
| Atomic green | 40 ml **licor de durazno**, 30 ml vodka, 150 ml Sprite (decisión del dueño: durazno en vez de melón) |
| Daiquiri primavera | 50 ml ron blanco, 80 g mix de frutas, 20 ml jugo de limón, 15 ml almíbar |
| Fernet con coca | 70 ml fernet, 230 ml Coca-Cola |
| Atardecer | 50 ml tequila, 150 ml jugo de naranja, 15 ml granadina |
| Destornillador | 50 ml vodka, 150 ml jugo de naranja |
| Ron cola | 50 ml ron, 200 ml Coca-Cola |
| Gin con pomelo | 50 ml gin, 200 ml gaseosa de pomelo |

**2. La carta como carrusel en el tótem.** En la pantalla de la barra, la carta pasa a ser un
carrusel grande, que se pasa con el dedo: foto del trago, nombre, ingredientes, y **"Pedir este"**.
Un trago al que no le alcanza la bebida se ve apagado con "Se terminó". Funciona en la pantalla
vertical del tótem.

**3. Foto con el trago en la misma pantalla.** Después de pedir: "¿Te sacás una foto con tu trago?"
(la foto con marco que ya existe), y el cartel "Tu pedido es el número N: andá a la barra".

**4. Apertura de la barra.** Antes de la fiesta, el barman abre una pantalla "Recibí la barra" con la
lista de botellas que se mandaron (desde la carga operativa de la fiesta) y marca, por cada una, que
llegó y cuántas. Eso es el stock inicial de la noche.

**5. Aviso de botella por terminarse.** Con los pedidos, la app calcula lo que queda y avisa al
barman cuando una bebida baja del 20%.

**6. Pantalla "Tu trago está listo"**, opcional en la barra: muestra los nombres de los pedidos en
estado `listo`.

**7. El informe de la noche** (al guardar el cierre): cuántos tragos salieron, los 5 más pedidos,
cuánto se gastó en bebida (con el costo de cada insumo), costo promedio por trago y lo que salió sin
registrar (la diferencia del conteo). Se ve en la fiesta y suma al informe que ya existe.

**La prueba** (`src/__tests__/la-barra-cierra-la-cuenta.test.ts`): con stock inicial de 1 botella de
vodka (1000 ml), 10 destornilladores pedidos descuentan 500 ml; un trago cargado por el barman
descuenta igual; al cerrar con 400 ml contados, el informe dice 10 tragos y 100 ml sin registrar; y el
destornillador se apaga cuando quedan menos de 50 ml.

## Bloque 11 — El salón mágico: se arma con una frase y se recorre (pedido del dueño)

El dueño vio un video donde una IA arma un salón entero, decorado, con los colores de la fiesta y las
mesas, con muy pocas instrucciones. **Las piezas ya existen**: el armado automático por lo contratado
(`generarEscenaAutomatica`, `src/lib/decoracion/generar-layout-automatico.ts`, con su prueba
`src/__tests__/el-salon-se-arma-solo-con-lo-contratado.test.ts`), la escena 3D
(`src/components/salon-3d/SalonScene.tsx`, mesas con `primaryColor` en `elements/Mesa3D.tsx` ~l.60) y
las medidas reales de cada salón. **Falta que se vea mágico y que se arme hablando.**

1. **Con una frase** (escrita o dicha al asistente del bloque 2): *"quince de Morena, lila y dorado,
   120 invitados, en el Club Uruguay"*. La IA devuelve **sólo datos** (tipo, colores, invitados, salón,
   estilo) y la app arma la escena con `generarEscenaAutomatica` y las medidas de ese salón.
2. **Más vida en el 3D**, con los colores elegidos: manteles y caminos de mesa, centros de mesa según
   el estilo (flores, velas, globos), luces de color sobre la pista y guirnaldas de luz, la mesa
   principal destacada. Todo con piezas simples dibujadas en 3D, **sin modelos pesados**: tiene que
   andar fluido en la pantalla LED y en un celular común.
3. **Paseo de cámara**: botón "Recorrer" que hace una vuelta lenta por el salón (entrada, mesas, pista,
   mesa principal) a pantalla completa.
4. Junto al 3D, las **dos imágenes realistas** del bloque 7.

**La prueba**: con la IA simulada devolviendo `{colores: lila y dorado, invitados: 120, salon: club-uruguay}`,
la escena tiene la cantidad de mesas que da `contarMesas` para 120, las mesas usan el lila, y el salón
tiene las medidas guardadas del Club Uruguay; el paseo de cámara termina y vuelve al inicio.

## Bloque 12 — "La tecnología de AK": una sola página con TODO, por paneles

**Pedido del dueño:** una sección de la web, para vender, con **toda** la tecnología dividida en
paneles; *"ni yo sé cuánta tecnología tiene"*. Hoy hay una vidriera en la portada
(`InteractiveTechShowcase`, orden 27) con una parte.

1. **Una sola lista que manda**: `src/data/tecnologia-ak.ts`, con cada tecnología que ve un cliente o
   un invitado: nombre, una frase de qué hace, a qué grupo pertenece (los cinco del bloque 3: Para tus
   invitados · Para vos · En la fiesta · Entretenimiento · Los recuerdos, más **La organización**:
   simulador, presupuesto, contrato y firma, cuotas, asistente del cliente), una foto o captura, el
   video de YouTube si hay, y **el paso del recorrido de demo** donde se prueba. Armala recorriendo
   `docs/QUE-HAY-EN-LA-APP.md` y las pantallas de `src/app/evento/`, `src/app/portal*`,
   `src/app/invitacion/`; **sólo lo que existe y anda**.
2. **Página pública `/tecnologia`**: un panel por grupo, con tarjetas grandes; cada tarjeta abre su
   detalle (fotos, video) y **"Probalo"** lleva a ese paso de `/experiencia` (bloque 9). Arriba, el
   número total ("Más de N tecnologías en tu fiesta", N contado de la lista, no escrito a mano).
3. **La misma lista** alimenta la vidriera de la portada, el recorrido de la reunión (bloque 3) y la
   web `/experiencia`: **una sola fuente**, para que no se despeguen.
4. Reglas de venta de `CLAUDE.md` (sin garantías, sin plazos, sin nombrar personal). Celular primero.
5. **Las fotos y videos de las tarjetas los hace la app sola** (no hay material grabado): un script
   `npm run tecnologia:capturas` abre la fiesta de demo con el navegador de las pruebas, recorre cada
   pantalla de la lista y guarda **una captura** y **un video corto de 6-8 segundos, sin sonido**,
   de cada una (Playwright graba video), en `public/tecnologia/`, livianos (captura en WebP, video de
   menos de 1,5 MB). Así cada tarjeta muestra la pantalla real funcionando. Se vuelve a correr cuando
   cambia una pantalla.

**El control** (`src/__tests__/la-tecnologia-ak-no-se-despega.test.ts`): cada tarjeta de la lista
apunta a una pantalla que existe (`docs/MANUAL-DE-LA-APP.md` o el mapa de rutas), el total de la página
es el largo de la lista, y la vidriera de la portada lee la misma lista.

## Bloque 13 — Mis fiestas en orden: suspendidas, pasadas y quién es el cliente

**Pedido del dueño:** cargó fiestas hace tiempo; algunas se suspendieron (la de Gamboa, la de Lorena),
otras ya pasaron, y no sabe en qué quedaron. Además, a veces el nombre de **la mamá que contrata**
quedó como si fuera **la quinceañera**.

**Lo que hay hoy:** la fiesta tiene `clienteNombre`, `protagonista1Nombre`/`protagonista2Nombre` y
`nombreAgasajado` (`src/types/fiesta.ts` ~l.155-170); **no existe** el estado "suspendida", y archivar
es sólo a mano (`src/app/actions/fiesta/fiesta.actions.ts` ~l.800).

1. **Estado "Suspendida"** para una fiesta, con fecha y motivo, que se marca **a mano** desde la ficha.
   Una fiesta suspendida: sale del calendario y de los listados de próximas, **apaga** sus
   recordatorios de cuotas, avisos al cliente, invitaciones y tareas automáticas, y **no toca la
   plata**: lo cobrado queda como está, y la ficha muestra lo que dice el contrato (penalidad del 30%
   sobre el presupuesto vigente, lo pagado se descuenta) para que el dueño decida. Se puede
   "Reactivar".
2. **Pantalla "Revisar mis fiestas"** en el panel, con una fila por fiesta y lo que tiene raro, para
   resolver con un toque cada uno:
   - ya pasó y no está cerrada ni archivada → "Archivar" (con el resumen de lo cobrado);
   - no tiene presupuesto, o el presupuesto no tiene servicios → "Abrir presupuesto";
   - le faltan datos clave (fecha, salón, invitados);
   - **el nombre del cliente es igual al del agasajado** → "¿Quién contrata?" con dos campos claros;
   - tiene cuotas vencidas sin cobrar.
3. **Que no se vuelva a confundir:** en todos los formularios donde se carga una fiesta, los campos
   dicen **"Quién contrata (cliente)"** y **"Agasajada / agasajado"**, separados, y el portal del
   cliente saluda al cliente, no a la quinceañera.

**La prueba** (`src/__tests__/mis-fiestas-en-orden.test.ts`): una fiesta suspendida no aparece en
próximas, no genera recordatorios de cuotas ni avisos, y su plata cobrada queda igual; una fiesta
pasada sin archivar y otra con cliente igual al agasajado aparecen en "Revisar mis fiestas".

## Bloque 14 — El video resumen de la fiesta, sin gastar en IA de video

**Decisión del dueño (01/10/2026):** sí, si no gasta mucho y si de verdad sale bien. Por eso **no se
genera video con IA** (caro y flojo): se **arma un montaje** con lo que ya hay.

- Al día siguiente de la fiesta, una tarea elige las mejores fotos y videos cortos del muro y las
  estaciones con `evaluarFoto`/`calcularNitidez` (`src/lib/album/elegir-las-mejores.ts`, ya usado por
  el álbum, **gratis**: no llama a ninguna IA), unas 30 fotos y hasta 6 clips de 3 segundos, sin
  repetir caras de más.
- El video se arma **en el navegador** del equipo o del cliente al abrirlo (lienzo + `MediaRecorder`,
  o `ffmpeg.wasm` si hace falta), con la música de la fiesta que ya usa el álbum, transiciones
  simples, título con el nombre y la fecha, y el logo de AK al final. 60 a 90 segundos, vertical para
  compartir. **No se procesa en el servidor** (no suma gasto por mes).
- Aparece en el álbum y en el portal del cliente como "Tu video de la fiesta", con "Descargar" y
  "Compartir".

**La prueba**: con 50 fotos de prueba (10 borrosas), la selección no incluye ninguna borrosa, elige
como máximo 30 y respeta el orden de la noche.

## Bloque 15 — Los asistentes con cara y nombre: "Aki"

**Pedido del dueño:** que los asistentes no sean "un círculo con una máquina", que sean divertidos y
tengan nombre, con **K** por AK.

- El asistente se llama **Aki** (A-K-i) en todos lados: invitado (`src/components/invitacion/AsistenteDelInvitado.tsx`,
  hoy con el ícono `Bot` ~l.144), cliente (`AsistenteDelCliente`, orden 101), web
  (`src/components/concierge/ConciergeWidget.tsx`) y equipo (`MultiAgentWidget`). El nombre se puede
  cambiar en Ajustes.
- **Una mascota animada en vez del robot**: un personaje simple y simpático hecho en SVG (ojos que
  parpadean, sonríe al contestar, salta un poquito cuando llega un mensaje), con los colores de AK y,
  en la fiesta, con el color de la fiesta. Con `prefers-reduced-motion`, quieto.
- Saluda con su nombre: *"¡Hola! Soy Aki, el asistente de AK. ¿En qué te ayudo?"*. Sigue las reglas
  de siempre: sin promesas, plata y fechas las confirma el organizador.

**La prueba**: los cuatro asistentes muestran "Aki" y la mascota, ninguno usa el ícono `Bot`.

```comprobar
usa: idDeYoutube en src/app/(app)/empresa/configurador-reunion/page.tsx
usa: createDemoFiesta en src/app/(app)/empresa/configurador-reunion/page.tsx
prueba: src/__tests__/dos-servidores-no-pierden-invitados.test.ts
usa: calcularNitidez en src/app/evento/social/[fiestaId]/page.tsx
no-usa: Archivo bloqueado por riesgo de contenido adulto en src/app/actions/social-gallery.ts
usa: '/experiencia' en src/lib/medicion-segura.ts
prueba: src/__tests__/la-barra-cierra-la-cuenta.test.ts
archivo: src/data/tecnologia-ak.ts
prueba: src/__tests__/la-tecnologia-ak-no-se-despega.test.ts
prueba: src/__tests__/mis-fiestas-en-orden.test.ts
no-usa: <Bot  en src/components/invitacion/AsistenteDelInvitado.tsx
```

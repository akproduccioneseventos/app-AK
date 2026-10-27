# Orden 250 — "Así va a quedar tu fiesta": foto realista desde la vista 3D (27/10/2026)

**Para Gemini. Una sola propuesta**, rama nueva desde `main` actualizada (`gemini/orden-250-asi-va-a-quedar`). **No va
con las órdenes 242 a 249.** Si un bloque se traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` y usá las skills `celular-primero` y `animaciones-pro`.

El dueño eligió esta mejora el 27/10/2026: que la quinceañera o los novios vean una foto realista de **su** salón, con
**su** decoración, armada desde la vista 3D. Es para vender y para compartir.

## Lo que ya existe (se reusa, no se rehace)

- **La vista 3D:** `SalonScene` (`src/components/salon-3d/SalonScene.tsx:556`).
  - Saca la captura con `captureRef.current.captureScreenshot()`, que devuelve un PNG en base64 (`CaptureHelper`
    ~25-40).
- **La generación con IA:** `generarVisualizacionSalonAi(fiestaId, salonFotoUrl?)`
  (`src/app/actions/fiesta/decoracion.actions.ts:226`).
  - Usa `generateGeminiImage` (`src/lib/ai/gemini-image.ts:45`), que acepta imágenes de entrada en `images`.
  - Tiene tope de 3 por fiesta, adentro del turno (~241), y guarda en `decoracion.fotosGeneradasAi`.
- **El portal del cliente ya muestra `fotosGeneradasAi`:** `src/app/portal/[fiestaId]/decoracion/page.tsx:165,273-280`.
- **Los datos de la decoración:**
  - `paletaColores || colorPalette` (`src/types/fiesta.ts:329` y ~356);
  - `estiloDecoracion` (~365);
  - `itemsDecoracion` (~366);
  - `colorCubremantel` (~332);
  - `colorGlobos` (~333);
  - `tema` (~328).

**No se toca:**

- el dibujo del 3D (`la-vista-3d-pone-cada-mueble-en-su-lugar`, `el-3d-dibuja-lo-que-dice-el-plano`);
- el tope de 3 por fiesta;
- lo que ya llega al portal.

## Bloque 1 — la IA parte de la vista 3D, no sólo de la foto vacía

En `generarVisualizacionSalonAi` agregá un parámetro opcional `capturaDel3d?: string` (PNG en base64, máximo 4 MB, sólo
`image/png` o `image/jpeg`; si no cumple, se ignora).

- Si viene, va **primero** en `images`. Si existe, la foto real del salón (`salonPlanBackgroundImageUrl`, pasada por
  `fotoDeReferenciaSegura`) va segunda.
- **El texto del pedido:** "fotografía realista del mismo salón, desde el mismo ángulo y con la misma disposición de
  mesas, pista y escenario que la primera imagen; con la paleta {colores}, estilo {estilo}, cubremantel {color},
  globos {color} y estos elementos: {items}".
  - Nada de personas, texto, logos ni marcas.
  - No agregar mobiliario que no esté en la primera imagen.
- **Si la IA falla:** no se guarda nada y se devuelve el error en criollo, "No se pudo armar la foto. Probá de nuevo en un
  rato." No hay imagen de relleno (pregunta 92).

## Bloque 2 — el gasto se cuenta (hoy NO se cuenta: arreglalo)

Hoy `generarVisualizacionSalonAi` y `generarVisualizacionSalonReunion` (~329, dos llamadas a `generateGeminiImage`)
**no pasan por el tope de gasto mensual de IA**.

- Antes de llamar al modelo: `hayPresupuestoParaIA()` (`src/lib/ai/consumo-servidor.ts:90`). Si da no: "Se llegó al
  tope de IA del mes."
- Después de una imagen generada de verdad: `registrarConsumoIA('foto-del-salon')`, una vez por imagen.
- Sumá `'foto-del-salon'` a `FuncionConCosto` y a `COSTO_ESTIMADO_UYU` (`src/lib/ai/consumo.ts:14-35` y `:43-66`), con
  el mismo costo que la imagen del espejo mágico.
- El patrón está en `src/app/actions/espejo-magico-ai.ts:222-235`.

## Bloque 3 — el botón, para el equipo y para el cliente

- **Equipo:** en `src/app/(app)/fiestas/nueva/decoracion/page.tsx`, al lado de la vista 3D (~1994), va el botón
  **"Así va a quedar tu fiesta"**.
  - Toma la captura con el `captureRef` que ya existe (~228) y llama con `capturaDel3d`.
  - El botón que ya existe (~1136) pasa a usar la captura. No dejes dos botones que hacen lo mismo.
- **Cliente:** en `Salon3DClienteView` (`src/components/salon-3d/Salon3DClienteView.tsx`), que hoy no le pasa
  `captureRef` a `SalonScene` (~100), agregá el `captureRef` y el mismo botón.
  - Lo llama una acción nueva, `generarFotoDelSalonDesdeElPortal(fiestaId, capturaDel3d)`, en `decoracion.actions.ts`.
  - **Su primera línea:** `verifyPortalSession(fiestaId)` (`src/lib/security/portal-session.ts`; patrón en
    `armar-web-con-ia.actions.ts:405`).
  - Después llama a la misma lógica interna, con el **mismo** tope de 3 por fiesta, compartido con el equipo.
- **Mientras trabaja:** "Armando tu foto…", con animación suave. El botón queda desactivado (no se paga dos veces).
- **Al terminar:** la foto grande, con "Descargar" y "Compartir por WhatsApp" (el texto y la imagen, a un toque).
  Debajo: "Te quedan N de 3".
- **Con 3 ya usadas:** "Ya armaste tus 3 fotos. Si querés otra, pedísela al equipo."
- **Si no hay vista 3D** (sin WebGL o sin elementos): el botón no aparece.

## Pruebas

**Jest**, en `src/__tests__/asi-va-a-quedar-tu-fiesta.test.ts`, con la IA simulada. Tiene que comprobar:

- (a) Con `capturaDel3d`, la **primera** imagen que recibe el modelo es la captura.
- (b) Sin presupuesto de IA, devuelve error y **no** llama al modelo.
- (c) Con una imagen generada, se registra 1 consumo de `'foto-del-salon'`. Si la IA falla, 0, y no se guarda nada.
- (d) Una sesión de portal de **otra** fiesta se rechaza.
- (e) Equipo y cliente comparten el tope de 3: la cuarta se rechaza.
- (f) Dos toques a la vez generan una sola, con una base de mentira que devuelve copias.
- (g) `generarVisualizacionSalonReunion` también descuenta del tope mensual.

Rompé (b) a propósito y fijate que se ponga en rojo.

**Navegador**, en `tests/e2e/asi-va-a-quedar-tu-fiesta.spec.ts`, con la respuesta del servidor cortada y simulada:

- en el portal del cliente aparece el botón junto al 3D;
- al tocarlo, se ve "Armando tu foto…" y después la imagen con "Descargar";
- con 3 usadas, aparece el cartel del tope.

Corré esas solas, después `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las últimas
líneas de cada uno.

```comprobar
usa: capturaDel3d en src/app/actions/fiesta/decoracion.actions.ts
usa: hayPresupuestoParaIA en src/app/actions/fiesta/decoracion.actions.ts
usa: registrarConsumoIA en src/app/actions/fiesta/decoracion.actions.ts
usa: verifyPortalSession en src/app/actions/fiesta/decoracion.actions.ts
usa: captureRef en src/components/salon-3d/Salon3DClienteView.tsx
usa: Así va a quedar tu fiesta en src/app/(app)/fiestas/nueva/decoracion/page.tsx
usa: Así va a quedar tu fiesta en src/components/salon-3d/Salon3DClienteView.tsx
prueba: src/__tests__/asi-va-a-quedar-tu-fiesta.test.ts
prueba: tests/e2e/asi-va-a-quedar-tu-fiesta.spec.ts
```

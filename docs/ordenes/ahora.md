# LA ORDEN: cinco cosas que salieron de auditar la app entera

**Para:** Gemini (Antigravity)
**Escrita:** 23 de agosto de 2026.

**Las cuatro tandas anteriores estan entregadas y fusionadas.** Esto es lo unico
que queda, y sale de terminar de auditar las areas que faltaban.

## Como se entrega

**UNA SOLA propuesta con los cinco bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cual falto y por que.

**Arranca desde la version principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md`, `docs/YA-RESUELTO.md` y `docs/COMO-AUDITAR.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

**Y la regla que costo cara: COMPILAR NO ES ANDAR.** Si algo llama a otra cosa por
su nombre escrito, verificá que ese nombre exista. Si algo tiene que correr solo,
verificá que algo lo dispare y que este publicado. **Una prueba nueva no vale
hasta verla en rojo**: rompé a proposito lo que tiene que detectar.

---

## BLOQUE 1 — LA PLATA: la rentabilidad de la fiesta cuenta el gasto dos veces

**Verificado a mano. Es el mas importante.**

En `src/lib/costos/ganancia-evento.ts:108`, el costo real se calcula asi:

```
costoReal = realDeItems + pagosSueltos + bloques
```

`bloques` es la suma **completa** de los costos estimados de catering, bebidas,
reposteria y personal. Y `pagosSueltos` son los pagos cuyo destino **no es un
renglon**, que es exactamente el caso de los pagos cargados contra esos bloques.

**Y se pueden cargar:** la pantalla
`src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/page.tsx:171-174` ofrece
como destino de pago "Catering (Automatico)", "Bebidas (Automatico)",
"Reposteria (Automatico)" y "Personal (Automatico)".

**Que ve el dueño:** si el catering estimado es 40.000 y carga un pago de 25.000,
la app dice que gasto **65.000**. La ganancia de esa fiesta aparece 25.000 mas
baja de lo que realmente es, y empeora con cada pago que cargue.

**Que hay que hacer:** cuando hay pagos cargados contra un bloque automatico, ese
bloque **no se suma entero**: se usa lo pagado, igual que ya se hace con los
renglones (lineas 92-99). Mira como esta resuelto ahi y aplicá el mismo criterio.

**Ojo:** el reporte global de ganancias y perdidas
(`src/app/actions/reportes.ts`) **esta bien y no se toca**. El problema es solo en
la ganancia de cada evento.

**Con una prueba** que cargue un pago a un bloque y verifique que el costo real no
se duplica.

---

## BLOQUE 2 — Los respaldos fallan en silencio

Los respaldos **si se disparan** (en cada escritura de datos,
`src/lib/data-service.ts:29`). Pero:

- **Si fallan, fallan callados**: `src/app/actions/backup.ts:377` solo hace
  `console.error('AutoBackup failed', error)`, en un registro que nadie lee.
- **No hay forma de ver cuando fue el ultimo respaldo bueno.** El archivo que
  parece llevar esa cuenta, `src/data/last-auto-backup.txt`, **quedo congelado el
  26 de marzo y nadie lo escribe**: es un archivo muerto que da falsa tranquilidad.

**Que hay que hacer:**
1. **Que cada respaldo deje su marca**: cuando corrio y si salio bien o mal.
2. **Que se vea en pantalla**, en la seccion de respaldos: fecha del ultimo
   respaldo bueno, en criollo. Si hace mas de un dia que no hay uno, en rojo.
3. **Si falla dos veces seguidas, avisar** donde el dueño lo vea. Un respaldo roto
   se descubre el dia que se necesita, y ese dia ya es tarde.
4. **Borrar o actualizar `last-auto-backup.txt`.** Un archivo muerto que parece
   vivo es peor que no tenerlo.

---

## BLOQUE 3 — El cupon con servicios de regalo no entrega nada

`src/components/presupuestos/paso-3-resumen.tsx:54-66`: el campo
`serviciosRegalados` **se guarda en el cupon y nunca se aplica**. Al validar el
cupon solo se usa el descuento; los servicios regalados no se agregan al
presupuesto.

**Que ve el cliente:** le prometieron un servicio de regalo y en el presupuesto no
aparece. **Es una promesa incumplida en un papel de venta.**

**Que hay que hacer:** aplicar los servicios regalados al presupuesto al validar el
cupon, y que se vean identificados como regalo (no como un renglon cobrado). **Con
una prueba.**

---

## BLOQUE 4 — Cuatro ajustes que se guardan y no hacen nada

El dueño los edita, quedan guardados, y **nadie los lee del otro lado**. Cree que
configuro algo y no configuro nada.

1. `defaultDocumentNotes` e `invoiceCustomFooter`
   (`src/app/(app)/settings/company/page.tsx`): las notas de los documentos y el
   pie de las facturas no se usan en ningun presupuesto ni factura.
2. `videoUrl`, `recorridoUrl` y `modelo3dUrl`
   (`src/app/(app)/empresa/salones/experiencia-visual/page.tsx`): se guardan en el
   salon y ninguna pantalla los muestra.
3. `assistantFinalMessage` (`src/app/(app)/settings/budget-display/page.tsx`): se
   edita y nunca se muestra; el asistente solo usa el de bienvenida.

**Por cada uno, elegí y decilo:** o **se usa de verdad** donde el dueño espera que
se use, o **se saca de la pantalla**. Lo que no puede quedar es un campo que se
edita y no hace nada.

**Verificá antes de sacar nada**: buscá el nombre sin distinguir mayusculas y
probá variantes. Ya hubo falsos positivos por buscar mal.

---

## BLOQUE 5 — La pantalla de respaldos existe dos veces

`src/app/configuracion/backup-final/page.tsx` y
`src/app/(app)/settings/backup-final/page.tsx` son la misma pantalla en dos
lugares. **Las dos piden sesion, asi que no hay problema de seguridad**, pero
cualquier arreglo hay que hacerlo dos veces o queda a medias.

**Dejá una sola** y que la otra direccion, si alguien la tiene guardada, lleve a
la que queda. Despues **corré `npm run mapa:generar`**.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a proposito.
- Nada que aumente lo que se paga por mes.
- **Textos que ve el cliente, si no estan pedidos.**
- El WhatsApp prepara mensajes y no los manda.
- **El reporte global de ganancias y perdidas esta bien.**
- Anotá lo que hiciste en `docs/YA-RESUELTO.md` y actualizá
  `docs/COBERTURA-AUDITORIA.md`, en la misma propuesta.

---

## Y esta lista esta cerrada

**La app quedo auditada entera**: 17 areas, todas revisadas. No busques mas
problemas. Hace estos cinco bloques y nada mas. Si mientras trabajas ves algo roto
de verdad, arreglalo y decilo en una linea. Si no esta roto y el dueño no lo pidio,
no existe.

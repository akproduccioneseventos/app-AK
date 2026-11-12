# Orden 286 — Informe final del auditor: respaldo que avisa, fechas, contexto, votaciones e imágenes (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 282 a 285** (rama `gemini/orden-283-app-simple`, arrancando de
`claude/app-debug-stabilize-m70e6z`, `git pull`). **Una sola propuesta, sin fusionar.** Si un bloque se traba, entregá
el resto y avisá cuál. Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 91.

**Lo que ya hizo Claude y no se toca:** el respaldo automático lee las colecciones de a 4, con un tope propio de 45 s, no
reintenta antes de 10 minutos después de una falla y el aviso de error dice el motivo (`src/app/actions/backup.ts`,
`readAllBackupData` y `acquireAutoBackupLease`; `readDataConDetalle` acepta `{ topeMs }` y devuelve `motivo`).

## Barrido en toda la app (Claude, 12/11/2026)

Cada forma del informe se buscó en todo `src/` antes de escribir esta orden; lo que salió está en los bloques 1 a 6 (las
fechas en 20 lugares, los enlaces sin fiesta en 3, los botones ilegibles y las imágenes sin respaldo en 10 pantallas).
Preguntas nuevas del método: 119 y 120 (`docs/barridos.json`).

## Bloque 1 — "Control de backup" dice "Listo" con 333 fallos (P1)

**Hoy:** `/settings/backup-final` (`src/app/(app)/settings/backup-final/page.tsx` ~10) usa `buildBackupReadinessReport()`
(`src/lib/backup/backup-health.ts`), que sólo mira que los archivos estén en la lista `BACKUP_COLLECTIONS`. No mira si
la última copia es reciente. Mientras tanto `/settings/backup` mostraba "fallaron 333 veces seguidas".

**Qué se hace:** la pantalla separa dos cosas con su título: **"Qué cubre el respaldo"** (lo de hoy) y **"Cómo viene el
respaldo"**, que lee el mismo estado que `/settings/backup` (`getBackupStatus` en `src/app/actions/backup.ts`:
`lastSuccessfulBackup`, `consecutiveFailures`, `lastError`). En verde sólo si la última copia buena tiene menos de 24 h;
en rojo, con el motivo, si hay fallos seguidos o la última copia buena tiene más de 24 h. El cartel de arriba de la
pantalla dice "Listo" sólo si las dos están bien.

## Bloque 2 — Si el respaldo falla, al dueño le llega un aviso (P1)

**Hoy:** el contador de fallos sube y nadie se entera: estuvo un mes sin copia buena.

**Qué se hace:** en `finishAutoBackupLease` (`src/app/actions/backup.ts` ~262), cuando `consecutiveFailures` llega a **3**
(y después una vez por día mientras siga fallando, guardando `avisadoEl` en el mismo documento), avisarle al dueño con
`avisarAlDuenio` (`src/lib/asistente/avisar-al-duenio.ts:192`): "Los respaldos automáticos están fallando desde
<fecha de la última copia buena>. Motivo: <lastError>." Sin importes ni datos de clientes. Que el aviso no frene ni
rompa el respaldo si falla.

## Bloque 3 — La misma fiesta con fechas distintas: 14/10 en el equipo, 15/10 en lo público (P1)

**Hoy:** `fechaEvento` se guarda como `AAAA-MM-DD`. Varias pantallas hacen `new Date('2026-10-15')`, que es la
medianoche **de Greenwich**, y al mostrarla en Uruguay sale el **14**. Ya existe `formatearFechaEvento`
(`src/lib/fechas/formato-fecha-evento.ts:12`), que lee el día del texto.

**Qué se hace:** pasar a `formatearFechaEvento` (o a leer año, mes y día del texto) en:
- **Lo que ve el cliente o le llega:** `src/app/portal/page.tsx` ~155-176 (`parseEventDate` le agrega `T00:00:00Z`) y la
  cuenta ~190; `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` ~332 y ~546;
  `src/app/presupuestos/[id]/estado-de-cuenta/page.tsx` ~36 (el texto del WhatsApp ~161/169 y ~270);
  `src/app/(app)/fiestas/nueva/gestion-documental/cancelacion-parcial/page.tsx` ~29 (documento que firma el cliente);
  `src/components/countdown-timer.tsx` ~28 (lo usan las plantillas de invitación); `src/app/evento/impresion/[fiestaId]/page.tsx`
  ~167/225 (imprime `2026-10-15` crudo).
- **Del equipo:** `src/app/(app)/fiestas/nueva/configuracion/page.tsx` ~81/95/184 (con `src/components/date-picker-demo.tsx`
  ~49), `decoracion/pdf/page.tsx` ~20, `servicios-contratados/page.tsx` ~27, `resumen-planificacion/page.tsx` ~46,
  `resumen-imprimible/page.tsx` ~27, `itinerario/pdf/page.tsx` ~19, `carga-operativa/pdf/page.tsx` ~25,
  `reuniones/imprimir/page.tsx` ~18, `fiestas/nueva/page.tsx` ~51/514/681, `src/components/presupuestos/paso-4-resumen.tsx`
  ~155, `src/app/(app)/pagos-rapidos/page.tsx` ~50.
- **Ojo con la configuración:** el selector de fecha guarda lo que elige el usuario; al guardar tiene que seguir guardando
  `AAAA-MM-DD` del día elegido (no un `toISOString()` que en Uruguay de noche ya es el día siguiente).

## Bloque 4 — "Volver a Editar" del PDF de decoración pierde la fiesta (P1)

`src/app/(app)/fiestas/nueva/decoracion/pdf/page.tsx` ~104: `href="/fiestas/nueva/decoracion"` → con
`?fiestaId=${fiesta.id}` (como el otro botón de la misma pantalla, ~202). Revisá también
`src/app/acceso-personal/[tokenId]/page.tsx` ~21-27 y `src/app/compras/page.tsx` ~33/39: si tienen una fiesta a mano,
que la lleven; si no, que el destino pida elegir la fiesta en vez de abrir vacío.

## Bloque 5 — Votaciones ilegibles, para el invitado y para el organizador (P2)

- `src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx` ~537-538: botón `variant="outline"` (fondo blanco) con
  `text-white`: blanco sobre blanco. Darle fondo propio (`bg-white/10 border-white/30`).
- Mismo archivo ~275-294: las pestañas en el celular son sólo íconos; sumá `aria-label` a cada `TabsTrigger` y un texto
  chico debajo del ícono en el celular.
- `src/app/evento/en-vivo/[fiestaId]/organizador/page.tsx` ~370-377: botón "Desactivar/Activar" `variant="ghost"` sin
  color sobre `bg-slate-800`: `text-slate-100`. Los `CardTitle` ~365 y ~419 quedan bien con el arreglo de raíz de la
  orden 285 (bloque 13); comprobalo en pantalla. Y `aria-label` en los botones ~178 y ~187 (texto oculto en celular).

## Bloque 6 — Imágenes rotas que dejan un hueco (P3)

Un componente `src/components/ui/imagen-con-respaldo.tsx` (`ImagenConRespaldo`, mismas props que `next/image` más un
`respaldo` opcional) que, si la imagen no carga (`onError`), muestra un recuadro suave con un ícono y no deja el hueco.
Usalo en lo que ve el cliente y el invitado: `src/app/portal/[fiestaId]/moodboard/page.tsx` ~150 (el caso del auditor),
`src/app/portal-cliente/[id]/page.tsx` ~1296, `src/app/portal-cliente/[id]/muro-social/page.tsx` ~825,
`src/app/portal/[fiestaId]/decoracion/page.tsx` ~283/353/380, `src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx`
~865/1260, `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` ~410, `src/app/evento/hub/[fiestaId]/page.tsx` ~177,
`src/app/evento/video-vida/[fiestaId]/page.tsx` ~158.

## Pruebas

- `src/__tests__/el-control-del-respaldo-mira-si-anda.test.ts`: con estado `consecutiveFailures: 5` y última copia de
  hace 30 días, el informe de `/settings/backup-final` no da "Listo" y trae el motivo; con copia de hace 1 hora y 0
  fallos, sí.
- `src/__tests__/el-respaldo-que-falla-avisa.test.ts`: al tercer fallo seguido se llama a `avisarAlDuenio` una vez; al
  cuarto el mismo día, no; si `avisarAlDuenio` tira error, `finishAutoBackupLease` igual guarda el estado.
- `src/__tests__/la-fecha-del-evento-no-se-corre.test.ts`: con `TZ=America/Montevideo`, el texto que muestran el
  portal (`src/app/portal/page.tsx`, sacá `formatDate` a una función exportable), el PDF de decoración y la
  configuración para `2026-10-15` dice 15.
- `tests/e2e/votaciones-se-leen.spec.ts`: en `/evento/en-vivo/<fiesta de prueba>/invitados`, pestaña Votaciones, el
  color del texto de cada opción es distinto del fondo de su botón; y cada pestaña tiene nombre accesible.

```comprobar
usa: getBackupStatus en src/app/(app)/settings/backup-final/page.tsx
usa: avisarAlDuenio en src/app/actions/backup.ts
usa: formatearFechaEvento en src/app/(app)/fiestas/nueva/decoracion/pdf/page.tsx
usa: formatearFechaEvento en src/app/(app)/fiestas/nueva/configuracion/page.tsx
no-usa: T00:00:00Z en src/app/portal/page.tsx
no-usa: href="/fiestas/nueva/decoracion"> en src/app/(app)/fiestas/nueva/decoracion/pdf/page.tsx
usa: aria-label en src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx
archivo: src/components/ui/imagen-con-respaldo.tsx
usa: ImagenConRespaldo en src/app/portal/[fiestaId]/moodboard/page.tsx
prueba: src/__tests__/el-control-del-respaldo-mira-si-anda.test.ts
prueba: src/__tests__/el-respaldo-que-falla-avisa.test.ts
prueba: src/__tests__/la-fecha-del-evento-no-se-corre.test.ts
prueba: tests/e2e/votaciones-se-leen.spec.ts
```

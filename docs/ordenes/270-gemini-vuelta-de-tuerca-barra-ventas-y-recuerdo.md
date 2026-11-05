# Orden 270 — Vuelta de tuerca: tragos por temporada, ventas que avisan solas y la fiesta en números (05/11/2026)

**Para Gemini.** Arrancá de la versión principal **actualizada** (`git fetch origin main`), rama nueva
`gemini/orden-270-vuelta-de-tuerca`. **UNA sola entrega con los cinco bloques, no fusiones.** Si un bloque se traba,
entregá el resto igual y avisá cuál faltó. Antes de decir "terminé", repasá `docs/ANTES-DE-ENTREGAR.md`.

**Lo que NO se toca**, porque son decisiones del dueño: el reloj del simulador, el descuento del 50% del Club Uruguay,
la "Bonificación especial", el ajuste anual (ni se muestra ni se cambia), los textos de venta que ya están, y la regla
de que **la app prepara los mensajes y los manda una persona** (salvo el recontacto, que ya sale solo con su interruptor).

## Bloque 1 — La orden 269: la decoración no le paga dos veces a la IA

Está entera en `docs/ordenes/269-gemini-la-decoracion-no-le-paga-dos-veces-a-la-ia.md`. Va dentro de esta misma entrega.

## Bloque 2 — Tragos por temporada (pedido del dueño)

El dueño quiere sumar o sacar tragos de la barra según el momento del año, sin borrarlos.

- En `Trago` (`src/types/fiesta.ts`, línea ~1047) agregá dos campos opcionales:
  - `activo?: boolean`: si es `false`, el trago está guardado pero no se ofrece. Si no está, cuenta como activo.
  - `meses?: number[]`, del 1 al 12: los meses en que se ofrece. Vacío o sin el campo, se ofrece todo el año.
- Pantalla de la carta de la empresa, `src/app/(app)/empresa/menus/tragos/page.tsx`: en cada trago, un interruptor
  "Disponible" y una fila de 12 botones chicos (Ene … Dic) para elegir los meses. Arriba, atajos "Verano" (dic, ene,
  feb, mar) e "Invierno" (jun, jul, ago, sep) que marcan esos meses de una. Se guarda con el `saveCartaTragosMaster`
  que ya existe.
- Función nueva y pura en `src/lib/carta-tragos-master.ts`: `tragoSeOfreceEnLaFecha(trago, fechaEvento)`. El mes sale
  **del texto** `"YYYY-MM-DD"`, igual que hace `anioDeLaFechaDelEvento` en `src/lib/fechas/formato-fecha-evento.ts`
  (~112). **No uses `new Date(...).getMonth()`**: en Uruguay corre el día y el mes. Sin fecha, se ofrece.
- Usala en `mergeMasterTragosWithFiesta` (mismo archivo), con un tercer parámetro opcional `fechaEvento`. Un trago de
  la carta de la empresa que no se ofrece en esa fecha **no se agrega a la fiesta**. **Excepción:** si la fiesta ya lo
  tiene en su carta (`fiestaItems` con ese `id`), se respeta, porque lo eligieron para esa fiesta.
- Pasale `fiesta.configuracion?.fechaEvento` en los dos lugares que juntan las cartas: `getBarDrinks`
  (`src/app/actions/fiesta/barra-tecnologica.actions.ts`, ~150) y `handleSyncMaster`
  (`src/app/(app)/fiestas/nueva/carta-tragos/page.tsx`, ~115).
- **No se toca** el descuento de botellas ni las recetas con o sin alcohol.

## Bloque 3 — Aviso al equipo cuando el prospecto abre su presupuesto

Hoy nadie sabe si el prospecto miró el presupuesto. Es el mejor momento para llamarlo.

- En `getPresupuestoById` (`src/app/actions/presupuestos.ts`, ~152): **sólo** cuando se entra con el `token` del
  enlace y **sin** sesión del equipo, anotá la visita en el presupuesto (`vistoPorElClienteAt`, y `vecesVisto` + 1)
  con una transacción, no con la lista entera.
- La **primera** visita de cada día crea un aviso al equipo con `createNotification`
  (`src/lib/notifications/create-notification.ts`): "Martina abrió su presupuesto recién: buen momento para
  escribirle". Que llegue sólo a quien ve presupuestos (mirá cómo lo hace la orden de avisos de plata: prueba
  `src/__tests__/los-avisos-de-plata-no-llegan-a-quien-no-ve-plata.test.ts`).
- Si anotar la visita falla, **el presupuesto se muestra igual**. La visita nunca puede tapar la pantalla del cliente.
- En la ficha del prospecto del CRM, una línea: "Abrió el presupuesto 3 veces · última: hoy 21:40".

## Bloque 4 — El recontacto no le habla de una propuesta a quien no la tiene

`PASOS_RECONTACTO_DEFAULT` (`src/lib/marketing/candidatos-recontacto.ts`, ~47), paso 1: *"¿pudiste ver la propuesta que
te armamos…?"*. Se le manda **también** a quien dejó el nombre en el simulador y **nunca generó el presupuesto**
(`lead.presupuestoId` vacío). Le promete algo que no existe.

- En `evaluarPasoParaLead` (mismo archivo): si el prospecto no tiene `presupuestoId`, el paso 1 usa otra plantilla:
  *"Hola {{NOMBRE}}, vimos que empezaste a armar el presupuesto de {{EVENTO}}. Si querés, lo terminás acá en un minuto:
  {{ENLACE}}"*. `{{ENLACE}}` sale de `enlaceAlSimuladorDelProspecto` (`src/lib/asistente/por-whatsapp.ts`, ~142), con
  los datos que tenga el prospecto.
- Los pasos 2 y 3 **no se tocan**, ni el interruptor ni los días.

## Bloque 5 — "Tu fiesta en números" en el portal del cliente, después de la fiesta

Es el recuerdo hecho y es lo que hace que recomienden. Hoy el portal muestra sólo la asistencia.

- Acción nueva en `src/app/actions/fiesta/portal.actions.ts`: `resumenDeLaFiestaParaElCliente(fiestaId)`, protegida
  con `verifyPortalSession(fiestaId)` como las otras del archivo (~línea 44). Devuelve **sólo números**, sin fotos,
  enlaces ni nombres de invitados:
  - fotos y videos de las estaciones y la estación más usada: `calcularResumenNoche`
    (`src/lib/entretenimiento/resumen-noche.ts`, ~49), armando las capturas como lo hace
    `src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx` (~124-154, posts con `sourceModule`);
  - saludos del buzón (`getBuzonMessagesConDetalle`, `src/app/actions/buzon.ts:59`);
  - canciones pedidas (`getSongRequests`, `src/app/actions/social-interactive.ts:250`);
  - invitados que llegaron, como ya lo cuenta el "Resumen de Asistencia".
- Si alguna lectura falla, ese número **no se muestra**. Nunca un cero que parezca real.
- En `src/app/portal-cliente/[id]/page.tsx`, después del "Resumen de Asistencia" (~776-870), una tarjeta "Tu fiesta en
  números" con los números grandes y un movimiento suave al aparecer (skill `animaciones-pro`). Que se vea bien en el
  celular (skill `celular-primero`). Sólo aparece **después** de la fecha de la fiesta.

## Al terminar

`npx tsc --noEmit` y `npx jest --silent` con cero errores. No subas `data/` ni `src/data/`.

```comprobar
usa: tragoSeOfreceEnLaFecha en src/lib/carta-tragos-master.ts
usa: fechaEvento en src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: meses en src/app/(app)/empresa/menus/tragos/page.tsx
prueba: src/__tests__/los-tragos-salen-segun-la-temporada.test.ts
usa: vistoPorElClienteAt en src/app/actions/presupuestos.ts
prueba: src/__tests__/el-equipo-se-entera-cuando-abren-el-presupuesto.test.ts
usa: enlaceAlSimuladorDelProspecto en src/lib/marketing/candidatos-recontacto.ts
prueba: src/__tests__/el-recontacto-no-promete-una-propuesta-que-no-existe.test.ts
usa: resumenDeLaFiestaParaElCliente en src/app/portal-cliente/[id]/page.tsx
prueba: src/__tests__/la-fiesta-en-numeros-no-inventa-ceros.test.ts
prueba: tests/e2e/el-portal-muestra-la-fiesta-en-numeros.spec.ts
prueba: src/__tests__/decoracion-catalogo-sdk.test.ts
```

**Qué tiene que comprobar cada prueba**, y que dé rojo con la función apagada:

- **Tragos:** un trago de verano no sale en una fiesta de julio y sí en una de enero. Uno apagado no sale. Uno que la
  fiesta ya tenía sale igual. Fecha `"2027-01-01"`: mes 1, no diciembre.
- **Presupuesto abierto:** con token y sin sesión anota la visita y crea **un** aviso por día. Con sesión del equipo no
  anota nada. Si guardar falla, igual devuelve el presupuesto. El aviso no le llega a un perfil sin acceso a
  presupuestos.
- **Recontacto:** sin `presupuestoId`, el paso 1 lleva el enlace al simulador y no dice "propuesta". Con
  `presupuestoId`, queda el texto de siempre.
- **Fiesta en números:** sin sesión del portal no devuelve nada. Si falla la lectura del buzón, no devuelve el número
  de saludos (ni un 0). Nunca devuelve enlaces ni nombres. En el navegador, la tarjeta aparece en una fiesta pasada y
  no en una futura.

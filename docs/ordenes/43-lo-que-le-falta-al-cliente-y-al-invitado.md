# Orden 43 — Lo que le falta al cliente y al invitado

**Para Gemini. UNA SOLA PROPUESTA con los cuatro bloques.** Si uno se traba, entregá el resto en
la misma propuesta y decí cuál faltó.

**Antes de empezar:** `git fetch origin && git checkout -b feat/orden-43 origin/main`.

Estas cuatro salieron de medir la app entera contra lo que ofrecen las plataformas del rubro.
**Todo lo demás de ventas, cobros, comida y personal ya está completo.** Estas cuatro son las
únicas que quedan del lado del cliente y del invitado, y las cuatro le ahorran trabajo al equipo
o mejoran lo que ve el que paga.

**Lo que NO se toca:** cobros, precios, permisos, los textos de venta, `apphosting.yaml`.

**Y la regla de oro de esta app, que aplica a los bloques 2 y 3:** *automático para mirar,
detectar, preparar y avisar; mano humana para lo que sale para afuera.* **Ningún mensaje se manda
solo.** Se prepara y queda esperando que una persona lo toque.

---

## Bloque 1 — Importar la lista de invitados desde una planilla

**Es lo que más tiempo le come al equipo.** Hoy los invitados se cargan de a uno: con 200
invitados son 200 formularios.

- Pantalla: `src/app/(app)/fiestas/nueva/invitados/page.tsx` (componente
  `InvitadosEventoContent`, línea ~58).
- La función que agrega uno ya existe: `addInvitado(fiestaId, datos)` en
  `src/app/actions/fiesta/invitados.actions.ts:113`. **Usala, no escribas otra forma de guardar.**
- El tipo del invitado está en `src/types/invitado.ts:10`. Los campos que importan: nombre,
  categoría (`Adulto`, `Niño`), acompañantes (`companionNames`), mesa (`tableNumber`) y
  restricción alimentaria (`DietaryRestriction`, en `src/types/fiesta.ts:58`).

**Qué tiene que hacer:** aceptar un archivo CSV o Excel, **mostrar en pantalla lo que entendió
antes de guardar nada** —cuántos encontró, cuáles quedaron sin nombre, cuáles están repetidos— y
recién con un botón de confirmar, guardarlos.

**Nunca guardar sin mostrar primero.** Una importación que mete 200 invitados mal cargados y no
se puede deshacer es peor que cargarlos a mano.

**Ojo con los nombres de las columnas:** la gente manda planillas con "Nombre", "NOMBRE",
"nombre y apellido", "Invitado". Reconocelas sin distinguir mayúsculas ni acentos, y si no
entendés una columna, **preguntá en pantalla a cuál corresponde** en vez de descartarla.

## Bloque 2 — Recordarle al invitado antes de la fiesta

Hoy el cliente recibe recordatorio de cuota y **el invitado que confirmó no recibe nada**.

- El camino ya está hecho para los pagos y **se copia igual**:
  `src/app/api/cron/recordatorios-de-pago/route.ts`. Fijate cómo usa
  `abrirPuertaDeLaTarea(request, '<nombre>')` para que nadie lo dispare desde afuera, y
  `marcarCorrida('<nombre>')` **para dejar rastro de que corrió de verdad**. Las dos cosas van.
- La lista de confirmados sale de `getInvitados(fiestaId)`
  (`src/app/actions/fiesta/invitados.actions.ts:82`).
- El mensaje **se prepara, no se manda**: se guarda como `ScheduledMessage`
  (`src/types/whatsapp-automation.ts:44`) en estado `pendiente`, igual que el resto. Lo manda una
  persona desde su WhatsApp.

**Cuándo:** dos días antes y el mismo día. **Qué dice:** dónde es, a qué hora, y el enlace a su
invitación. Nada de promesas de plazo ni de precios.

## Bloque 3 — Que el cliente pueda escribirle al equipo desde su portal

Hoy el portal **avisa al equipo** cuando el cliente hace algo, pero **el cliente no tiene dónde
escribir**. Si quiere preguntar algo, tiene que salir a WhatsApp.

- Archivo: `src/app/actions/fiesta/portal.actions.ts`. **El aviso al equipo ya está resuelto y se
  copia igual**: mirá `updateClientChecklistItem` (línea ~121), que después de guardar llama a
  `createNotification({ mensaje, href, icono })`. **Usá ese mismo camino.**
- Toda función del portal empieza con `verifyPortalSession(fiestaId)`. **Sin eso no se guarda
  nada**: es lo que impide que un desconocido escriba en la fiesta de otro.
- La pantalla va en `src/app/portal-cliente/[id]/`, al lado de las que ya existen (`faq`, `menu`,
  `musica`, `decoracion`).

**Alcance:** el cliente escribe y ve lo que escribió, con la respuesta del equipo cuando la haya.
**No es un chat en vivo**: es un hilo de mensajes. Y el equipo se entera por el aviso de siempre.

## Bloque 4 — Que el cliente suba fotos de ideas para la decoración

La pantalla ya existe: `src/app/portal-cliente/[id]/decoracion/`. Y la opinión del cliente ya
llega al equipo con `enviarOpinionDecoracion` en
`src/app/actions/fiesta/decoracion.actions.ts`. **Lo que falta es que pueda subir imágenes.**

Que suba hasta seis fotos de referencia —lo que vio en internet, el vestido, los colores— y que
el equipo las vea en la pantalla de decoración de adentro. Cuando sube, **avisa al equipo con
`createNotification`**, igual que el resto del portal.

---

## Cómo se comprueba que está hecho

**Cada línea pide el RESULTADO, no el ingrediente.**

```comprobar
usa: addInvitado en src/app/(app)/fiestas/nueva/invitados/page.tsx
archivo: src/app/api/cron/recordatorio-a-los-invitados/route.ts
usa: marcarCorrida('recordatorio-a-los-invitados' en src/app/api/cron/recordatorio-a-los-invitados/route.ts
usa: verifyPortalSession en src/app/actions/fiesta/portal.actions.ts
usa: createNotification en src/app/actions/fiesta/portal.actions.ts
prueba: tests/e2e/importar-invitados-de-una-planilla.spec.ts
prueba: tests/e2e/el-cliente-le-escribe-al-equipo.spec.ts
```

**Y las pruebas de navegador tienen que mirar el resultado:**

1. `importar-invitados-de-una-planilla.spec.ts` — se sube una planilla con tres invitados, la
   pantalla **muestra los tres antes de guardar**, y después de confirmar **la lista tiene tres
   más**. Y una segunda comprobación que importa: **una planilla con una fila sin nombre no se
   guarda entera y avisa cuál fila está mal.**
2. `el-cliente-le-escribe-al-equipo.spec.ts` — el cliente escribe un mensaje y **lo ve en el
   hilo** al recargar la pantalla.

**Escribí cada prueba ANTES del código y mirá que falle.** Una prueba escrita después se acomoda
a lo que se hizo.

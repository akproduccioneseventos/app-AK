# Orden 365 — Robot, vuelta 10: sin clave, el despachador no manda mensajes ni borra, y la barra no confunde invitados por el nombre

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 364 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los dos bloques son de
permisos: Claude los revisa línea por línea.**

## Por qué
Décima vuelta del robot (26/11/2026), sobre las áreas barra y permisos, mirando quién puede hacer qué. Esto está bien: las
acciones de gestión de la barra piden el permiso de la noche o de insumos y el operador sólo maneja su fiesta, el enlace del
invitado se mira contra la fiesta del pedido, todas las claves se comparan con `clavesIguales`, y las rutas de respaldo,
contratos, comprobantes, descargas y Looker piden su permiso. Claude confirmó cada punto en el código.

## Bloque 1 — Sin clave, el despachador corre sólo lo que no manda ni borra (pregunta 238)
El 22/10 se arregló (YA-RESUELTO, "el recordatorio que manda no se dispara desde afuera") que el recordatorio a invitados no se
pudiera disparar desde internet: las rutas `cron/*` pasan por `abrirPuertaDeLaTarea` y, sin clave, la tarea que manda contesta
503. Pero `src/app/api/cron-despachador/route.ts` tiene **su propia** verificación: sin `CRON_SECRET` (~26-31) deja pasar a
cualquiera y en ~78 llama a `ponerAlDiaAlEntrar`, que corre **todas** las tareas de `src/lib/automatico/al-entrar-a-la-app.ts`
(~186-358), entre ellas `avisos_cliente`, `recordatorio_invitados` y `recordar_invitacion`, que mandan WhatsApp y Gmail, y
`empezar_2027`, que borra. Cualquiera desde internet decide **cuándo** salen esos mensajes (dentro del horario y la cadencia).
La clave todavía no existe en la app publicada (orden 278, bloque 1, pendiente a propósito), así que no se puede cerrar la ruta.
Arreglo:
1. `ponerAlDiaAlEntrar` recibe una opción `soloLasQueNoMandan: boolean`. Con `true`, se saltean las tareas que mandan mensajes
   a clientes, invitados o prospectos, o que borran. Mirá **qué hace** cada una, no cómo se llama: como mínimo
   `avisos_cliente`, `recordatorio_invitados`, `recordar_invitacion` y `empezar_2027`, y fijate si `recordatorios` y
   `prospectos_seguimiento` mandan algo o sólo preparan.
2. El despachador la pasa en `true` cuando entró **sin** clave (`verificarClave` devuelve hoy sólo `autorizado`: que diga
   también si vino con clave, como `conClave` de `src/lib/automatico/puerta-de-las-tareas.ts` ~87).
3. Al entrar el equipo a la app (`origen: 'app'`) y con clave, corre todo como hoy. No cambia nada de lo que ya corre solo.
4. Mismo criterio en `src/app/api/cron/generate-blog-post/route.ts` ~24: `force=1` sólo vale con `puerta.conClave`.

## Bloque 2 — La barra no confunde a dos personas con el mismo nombre
`src/app/actions/fiesta/barra-tecnologica.actions.ts`:
1. `orderBelongsToGuest` (~545-548): un pedido del tótem (sin `guestId`) se le asigna a **cualquier** invitado con ese nombre. Si hay
   dos "Ana" en la fiesta, una ve y puede cancelar o cambiar el trago de la otra (`getGuestBarOrders` ~941, `cancelBarDrinkOrder`
   ~959, `changeBarDrinkOrder` ~978). Que el nombre sólo cuente si en la fiesta hay **un solo** invitado con ese nombre.
2. `findBarOrder` (~560-567) no mira de qué fiesta es el pedido: que devuelva `null` si `order.fiestaId !== fiesta.id`.
3. La lista de tragos listos (~1444-1466), pública: ya la pide la orden 356, bloque 4, punto 5. No la repitas.

## Barrido en toda la app
- Rutas con su propia verificación de clave que dejan pasar sin clave (pregunta 238): `grep -rn "CRON_SECRET\|TAREAS_SECRET" src/app/api`
  y, por cada una que no pase por `abrirPuertaDeLaTarea`, ¿qué corre sin clave? ¿Manda o borra algo?
- Algo de una persona que se asocia por nombre: `grep -rn "toLocaleLowerCase('es') ===\|\.nombre\.trim()" src/app/actions src/lib`;
  ¿qué pasa con dos personas con el mismo nombre?
- Búsquedas por id que no miran la fiesta: `grep -rn "\.doc(orderId)\|\.doc(id)\.get()" src/app/actions`.
Permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cerrar el despachador sin clave ni pedir la clave en `apphosting.yaml`: eso es la orden 278, bloque 1, pendiente.
- No pedirle sesión ni enlace al tótem de la barra: pedir por nombre es a propósito.
- No cambiar el horario ni la cadencia de los recordatorios.

## Qué tiene que comprobar la prueba
- `src/__tests__/el-despachador-sin-clave-no-manda.test.ts`: sin `CRON_SECRET`, un pedido al despachador no llama a
  `correrTareaRecordatorioInvitados`, `correrTareaRecordarInvitacionNoAbierta`, `correrTareaAvisosAlCliente` ni a la tarea de
  2027, y sí corre las métricas; con la clave, corre todas.
- `src/__tests__/la-barra-no-confunde-invitados-por-nombre.test.ts`: con dos invitados "Ana", ninguno ve ni cancela el pedido
  del tótem a nombre de "Ana"; con una sola "Ana", sí; un pedido de otra fiesta da "Pedido no encontrado".

```comprobar
usa: soloLasQueNoMandan en src/lib/automatico/al-entrar-a-la-app.ts
usa: soloLasQueNoMandan en src/app/api/cron-despachador/route.ts
usa: conClave en src/app/api/cron/generate-blog-post/route.ts
usa: order.fiestaId !== fiesta.id en src/app/actions/fiesta/barra-tecnologica.actions.ts
prueba: src/__tests__/el-despachador-sin-clave-no-manda.test.ts
prueba: src/__tests__/la-barra-no-confunde-invitados-por-nombre.test.ts
```

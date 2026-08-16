# Lo que hay que hacer ahora — bajar el ruido

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. **Todo va en UNA SOLA PROPUESTA.** Si un
bloque se traba, entregá el resto igual y decí cuál faltó.

## El pedido del dueño, en sus palabras

> "No quiero muchas alertas, que me ponen nervioso. Que sean **disimuladas** y no
> un **alertadero continuo**."

No es que sobren funciones: es que la app **grita todo el tiempo**, y cuando todo
grita, lo que importa se pierde. Se contó lo que hay hoy:

- **1.405 carteles emergentes** repartidos por la aplicación.
- **11 reglas de aviso**, de las cuales **7 salen como alerta interna**.
- **120 cosas que parpadean** (`animate-pulse`, `animate-ping`, `animate-bounce`).
- **2 globitos rojos** con números.
- **13 pantallas que hacen sonido.**

**La regla que ordena todo esto: sólo la plata grita. El resto susurra.**

---

# BLOQUE A — Que no todo sea urgente

`src/lib/automatizaciones-engine.ts`

Hoy **7 de las 11 reglas** salen como alerta interna, al mismo nivel. Entre ellas
está *"decoración sin definir"* **a 30 días de la fiesta**, gritando igual que
una **cuota vencida**. Así el dueño aprende a ignorarlas todas, incluidas las que
importan.

**Quedan como urgentes sólo las cuatro de plata y contrato:**
`falta-sena`, `cuota-vencida`, `saldo-pendiente-evento-cercano`,
`contrato-sin-firmar`.

**Las otras tres bajan a un nivel tranquilo** (que no dispare el globito rojo ni
el color de urgencia): `decoracion-sin-definir`, `cronograma-vacio`,
`tareas-vencidas`.

**No borres ninguna regla ni cambies cuándo se disparan.** Sólo el nivel.

# BLOQUE B — El globito rojo cuenta sólo lo urgente

`src/components/main-nav.tsx:251` y `src/components/notifications-hub.tsx:100`

Hoy el número rojo cuenta **todo lo que no se leyó**. Con once reglas por fiesta
y varias fiestas activas, el número queda siempre alto y siempre en rojo.

**Qué hacer:** que el globito rojo cuente **sólo las urgentes** (las cuatro de
arriba). Si no hay ninguna urgente pero sí avisos tranquilos, **nada de rojo**:
un puntito gris chico, o nada. El detalle sigue estando adentro de la pantalla de
Alertas para quien quiera mirarlo.

# BLOQUE C — Una línea por fiesta, no una por aviso

`src/app/(app)/alertas/page.tsx`

Hoy es una lista larga donde la misma fiesta aparece cinco veces. **Agrupá por
fiesta:** una tarjeta por fiesta, con el nombre y la fecha, y adentro los avisos.
Si tiene algo urgente, la tarjeta lo muestra; el resto plegado.

La pantalla ya arranca mostrando sólo las que faltan mirar: eso queda.

# BLOQUE D — Dejar de festejar cada guardado

**Este es el grueso del ruido: 1.405 carteles.**

La mayoría son de éxito: guardás algo y salta un cartel a decirte que se guardó.
Multiplicado por todo lo que se guarda en un día, es el alertadero.

**Qué hacer, y sólo en estas cinco pantallas, que son las más ruidosas:**

| Pantalla | Carteles |
|---|---|
| `fiestas/nueva/muro-social` | 67 |
| `fiestas/nueva/portal-cliente` | 37 |
| `empresa/galeria` | 24 |
| `fiestas/nueva/decoracion` | 22 |
| `fiestas/nueva/entretenimiento` | 19 |

- **Los carteles de ÉXITO se van.** En su lugar, una marca discreta al lado del
  botón: un tilde y la palabra **"Guardado"**, en gris, que se desvanece sola a
  los dos segundos. Sin ocupar el medio de la pantalla.
- **Los carteles de ERROR se quedan todos.** Ésos hay que verlos.
- **Ojo:** si algo toca plata, cobros, comida o permisos, **dejá el cartel de
  éxito como está** y avisá cuál era. Ahí conviene la confirmación fuerte.

Si te sobra tiempo, seguí con las que siguen en la lista, con el mismo criterio.

# BLOQUE E — Que deje de parpadear lo que no está cargando

Hay **120** `animate-pulse`, `animate-ping` y `animate-bounce`.

- **Se quedan** los que indican que algo **está cargando** (esqueletos, ruedas de
  espera). Eso es información.
- **Se van** los decorativos: globitos que laten, botones que rebotan, tarjetas
  destacadas que pulsan solas. Eso es ruido.

Empezá por las pantallas internas del equipo, que son las que se miran ocho horas
por día. **Las estaciones de la fiesta no se tocan:** ahí el movimiento llama al
invitado a propósito.

# BLOQUE F — Los sonidos, apagados salvo en la fiesta

Hay 13 pantallas que hacen sonido.

- **En las estaciones de la fiesta se quedan** (buzón, barra, tótem, fotocabina,
  muro en vivo): ahí el sonido es parte del show.
- **En las pantallas internas del equipo, apagados**, y si alguna los necesita,
  con un interruptor en Ajustes que **venga apagado**.

# BLOQUE G — Cuando falta un dato, la app habla como programador

Salió de mirar **las 243 pantallas** de la aplicación, una por una. Casi todas
están bien. Lo que aparece es **siempre el mismo defecto**: cuando la pantalla se
abre sin el dato que necesita, en vez de explicarlo en criollo, muestra jerga.

Son cinco, todas verificadas en el código:

1. **`src/app/(app)/fiestas/nueva/readiness/page.tsx:143`** — le muestra al
   usuario, tal cual: *"No se especificó un evento. Usá el parámetro
   `?fiestaId=...` en la URL."* Con el código y todo. **Es el peor.**
2. **"No se ha especificado un ID de fiesta"**, en `fiestas/nueva/tareas/client.tsx`,
   `fiestas/nueva/reuniones/imprimir/page.tsx` y
   `empresa/todos-los-servicios/[id]/editar/page.tsx`. Aparece como cartel rojo
   de error cuando el usuario no hizo nada mal: sólo entró sin elegir fiesta.
3. **`src/app/(app)/empleados/[id]/editar/page.tsx:79`** — el aviso muestra el
   identificador interno: *"No se encontró el empleado con ID a2e_fotos_app"*.
   Ese número no le dice nada a nadie.
4. **`src/app/invitacion/[fiestaId]/rsvp/page.tsx:160`** — *"Evento no
   encontrado."* y nada más. **Esto lo ve el invitado**, no el equipo: abre el
   enlace de la invitación, algo falla, y se queda sin saber qué hacer.
5. **`src/app/actions/social-media.ts:221`** — *"Instagram no esta conectado a
   Graph API. Configura el token y la cuenta comercial..."*. Jerga pura, y encima
   sin el acento de "está".

**Qué hacer, con el mismo criterio en las cinco:**

- **Decir qué pasa en criollo y cuál es el próximo paso**, con el botón para
  darlo. Ejemplo del que ya está bien hecho en la app, copialo:
  *"Para abrir la planificación gastronómica, primero elegí la fiesta"*, con el
  botón "Ver eventos activos".
- **Nunca mostrar identificadores internos, nombres de campos, ni direcciones
  web con parámetros.**
- **Si el usuario no hizo nada mal, no es un error rojo**: es un cartel tranquilo
  que explica y ofrece el camino.
- **El de la invitación (punto 4) es el más urgente de los cinco**, porque lo ve
  el invitado: que diga que el enlace no está disponible y que le pida el nuevo a
  quien lo invitó.
- El de Instagram: que diga que Instagram todavía no está conectado y dónde se
  conecta, sin nombrar "Graph API" ni "token".

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude.
- **No borres ninguna alerta ni cambies cuándo salta.** Esto es sobre **cómo
  avisa**, no sobre **qué vigila**.

## Nada de cambios sueltos

- **No commitees `public/firebase-messaging-sw.js`**: se genera al compilar.
- **No cambies imports ni librerías que no vengan al caso.**
- Si encontrás algo roto de paso, **avisalo, no lo arregles acá**.

## Una sola propuesta

La entrega anterior vino en tres y la orden pedía una. Al juntarlas, **dos habían
arreglado la misma pantalla de maneras distintas** y quedó rota. Cuando la orden
dice una, es una.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Y **mirá las pantallas**:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts
```

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y mové
este archivo a `hechas/` en la misma propuesta.

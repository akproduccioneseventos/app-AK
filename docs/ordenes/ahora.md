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

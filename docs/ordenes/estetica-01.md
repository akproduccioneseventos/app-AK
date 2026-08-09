# Orden de trabajo — Estética 01

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 9 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

## Por qué existe esta orden

El dueño pidió revisar cómo se ve la app entera. Se auditó con tres miradas:
consistencia visual, cómo se ve en celular, y los momentos feos (pantallas
vacías, cargas y errores).

**El resultado corto: la app no está rota, está despareja.** Cada pantalla se
inventó sus colores, sus tamaños de letra y sus bordes. Eso no se nota en una
pantalla sola, se nota al recorrerla: parece armada de a pedazos. Y compite con
plataformas pagas que se ven parejas.

**Regla del dueño que atraviesa todo esto: toda la app vende.** El invitado que
usa la fotocabina es el cliente de la fiesta del año que viene.

---

## Antes de empezar, siempre

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
npm run build
```

**Si alguno falla, no subas.** Guardá en UTF-8 y cuidado con las comillas
invertidas: ya rompieron el proyecto tres veces.

Leé antes `docs/YA-RESUELTO.md` y la sección "Errores ya cometidos" de
`AGENTS.md`. **Y anotá en `docs/YA-RESUELTO.md` todo lo que modifiques, en la
misma propuesta**, con el porqué de cada decisión.

## Cómo se entrega

**Una sola propuesta con los cuatro bloques**, no una por bloque. Orden del
dueño del 9 de agosto de 2026: cada fusión dispara un despliegue y se paga.

Corré los cuatro controles sobre el conjunto entero antes de subir.

## Falsos positivos ya verificados: NO los toques

Se revisaron y no son errores:

- **Los colores en `style={{ backgroundColor: ... }}` del croquis del salón, la
  decoración, los números de mesa y las invitaciones.** Son los colores que
  **elige el usuario**. Tienen que quedar así.
- **El `bg-white` de las facturas, recibos y contratos.** Esos documentos se
  imprimen: el fondo blanco es correcto.

---

# BLOQUE A — Que la app se vea pareja

**Lo más importante de esta orden.**

Los números medidos: **925 usos de colores escritos a mano** (`bg-amber-400`,
`text-slate-800`) en vez de los del tema, repartidos en 211 pantallas. Y **8
variantes distintas de borde redondeado** conviviendo, a veces tres en la misma
pantalla.

**Qué hacer:**

1. **Elegí la escala y dejala escrita.** Un solo valor de borde redondeado para
   tarjetas, uno para botones, uno para campos. Anotá cuál es cada uno en
   `docs/YA-RESUELTO.md` para que nadie invente otro.
2. **Pasá los colores a los del tema** (`bg-primary`, `text-foreground`,
   `border-border`). **No lo hagas de una** con buscar y reemplazar en 211
   pantallas: eso es imposible de revisar y va a romper algo. Empezá por las que
   más se usan y dejá anotado hasta dónde llegaste.
3. **Prioridad, en este orden**: portal del cliente, portal del invitado,
   pantallas de fiestas, tablero central. Lo que ve el cliente primero.

**Ojo:** los colores del tema tienen que verse bien en claro y en oscuro. Probá
las dos antes de dar una pantalla por lista.

---

# BLOQUE B — Que se lea en el celular

Medido: **582 textos de menos de 12 píxeles** en 71 pantallas, algunos de 8 y 9
píxeles. Menos de 12 no se lee en un teléfono, y el equipo usa la app en el salón
con poca luz.

**Qué hacer:**

1. **Ningún texto por debajo de 12 píxeles.** Subí los `text-[8px]`,
   `text-[9px]`, `text-[10px]` y `text-[11px]` a la escala normal.
2. **Arreglá estas grillas apretadas**, verificadas una por una. En un celular de
   360 píxeles quedan columnas de 90:
   - `src/app/portal-cliente/[id]/confirmar-invitados/page.tsx:202` — las tres
     tarjetas de totales.
   - `src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx:308` — los
     botones de asistencia. **Este es el peor**, y además hay que cambiarle el
     contenido: ver el bloque E.
   - `src/app/portal-cliente/[id]/muro-social/page.tsx:436` — las cuatro
     solapas.
   - `src/app/portal/c/[accessKey]/PublicPortalProView.tsx:318` — el resumen de
     invitados del cliente.
   - `src/app/portal/page.tsx:167` — la cuenta regresiva. Es lo primero que ve el
     cliente al abrir su portal: que se luzca.
3. **Textos cortados sin poder verlos.** En
   `src/app/portal-cliente/[id]/confirmar-invitados/page.tsx:333` el mensaje del
   invitado se corta y no hay forma de leer el resto. Ese mensaje puede decir
   "soy celíaco": el equipo tiene que poder leerlo entero.

---

# BLOQUE C — Los momentos feos

Es donde más se nota la diferencia contra una plataforma paga.

**1. Pantallas vacías con gracia.**

Ya existe un componente `EmptyState` con ícono, título, explicación y botón.
**Está y casi no se usa.** En el portal del cliente hay al menos 18 lugares que
muestran una línea gris pelada:

- `src/app/portal/page.tsx` — líneas 569, 648, 656, 687, 834, 851.
- `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx:223` — la
  función `EmptyLine`, usada en 12 lugares.

Usá `EmptyState`. Cada pantalla vacía tiene que decir **qué falta y cuál es el
próximo paso**, no sólo que no hay nada.

**2. Cargas con texto.**

Varias pantallas muestran sólo una ruedita girando: el contrato del cliente
(`portal/[fiestaId]/contrato/page.tsx:97`), el moodboard
(`portal/[fiestaId]/moodboard/page.tsx:92`) y el portal
(`portal/page.tsx:922`). Sin texto, el cliente no sabe si se colgó.

Poné qué se está cargando. Y donde puedas, un esqueleto del contenido en vez de
la ruedita: se siente más rápido aunque tarde lo mismo.

**3. Nada de jerga a la vista.**

Ningún texto que vea un cliente o el equipo puede decir "Error desconocido",
"undefined", un número de error ni un nombre de función. Que diga qué pasó y qué
hacer.

---

# BLOQUE D — Jerarquía de botones

En varias pantallas hay cuatro o cinco botones del mismo color y tamaño, y no se
entiende cuál es el que hay que apretar.

**Regla: un solo botón principal por pantalla.** El resto en secundario o como
texto. Si hay dos acciones igual de importantes, es que la pantalla está haciendo
dos cosas.

Empezá por el portal del cliente y el del invitado, que los usa gente que nunca
vio el sistema.

---

# BLOQUE E — La confirmación del invitado: sacar el "Tal vez"

**Decisión del dueño, 9 de agosto de 2026: se confirma o no se confirma. El
"Tal vez" no va.**

`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx`

Hoy hay tres botones (línea 224): "Asistiré", "Tal vez" y "No puedo". Un "tal
vez" no sirve para nada: no se sabe cuánta comida encargar ni cuántas sillas
poner, y el invitado que lo elige no vuelve a responder nunca.

**Qué hacer:**

1. **Sacar el botón "Tal vez"** de la invitación. Quedan dos: asiste o no asiste.
   Con dos botones además se arregla lo del celular: entran anchos y cómodos para
   el dedo.
2. **NO saques `'Tal vez'` del tipo `RsvpStatus`** (está en `src/types/invitado.ts:1`
   y `src/types/fiesta.ts:24`). Hay invitados ya guardados con ese estado y se
   romperían las pantallas que los muestran. El equipo lo puede seguir poniendo a
   mano desde la pantalla interna de invitados si le sirve. **Sólo se saca el
   botón de la invitación.**
3. **Decirle al invitado que puede cambiar de opinión.** Esto ya funciona y nadie
   lo sabe: al responder de nuevo con el mismo nombre, el sistema actualiza su
   respuesta en vez de duplicarlo (verificado en
   `src/app/actions/fiesta/invitados.actions.ts:412-418`, busca por nombre
   normalizado). Pero la pantalla final sólo dice "Hemos guardado tu
   confirmación" y el invitado se va creyendo que quedó atado.

   En esa pantalla final agregá una línea del estilo: *"¿Te cambian los planes?
   Volvé a entrar con este mismo enlace y tu mismo nombre, y actualizá tu
   respuesta."* Y un botón para responder de nuevo ahí mismo, sin recargar.

**Por qué importa:** un invitado que confirmó y después no puede ir, si no tiene
cómo avisar, no avisa. Y esa comida se paga igual.

---

# BLOQUE F — Mostrar el aviso de los límites del contrato

**Propuesta completa.** La regla ya está escrita y probada: sólo hay que
mostrarla.

La cantidad de invitados no se puede cambiar libremente. El contrato permite
**bajar hasta 10%** y **subir hasta 30%**, y la lista final vence **siete días
antes**. Eso estaba sólo en el papel: el sistema dejaba bajar un 40% sin decir
nada, y después no había con qué respaldar el cobro.

**La regla ya está hecha por Claude**, en `src/lib/budget/cambio-de-invitados.ts`,
con diez pruebas. **No la reescribas ni cambies los topes**: si un tope cambia,
hay que cambiar también el texto del contrato.

Se usa así:

```ts
import { validarCambioDeInvitados } from '@/lib/budget/cambio-de-invitados';

const veredicto = validarCambioDeInvitados({
  contratados: fiesta.configuracion.invitadosEstimados ?? 0,
  nuevos: cantidadQueEstaPoniendoElEquipo,
  fechaDelEvento: fiesta.configuracion.fechaEvento,
});
```

Devuelve `nivel` (`'ok'`, `'atencion'` o `'fuera-de-contrato'`) y un `mensaje` ya
escrito en criollo, listo para mostrar.

**Qué hacer:**

1. **Mostrar el aviso donde el equipo cambia la cantidad de invitados**, que es
   la configuración de la fiesta. En verde si está bien, en ámbar si es
   `atencion`, en rojo si es `fuera-de-contrato`.
2. **No bloquees el cambio.** El dueño ya decidió que si vienen más se agregan y
   el presupuesto sube. El aviso es para que el equipo sepa qué está pasando y
   lo hable con el cliente, no para frenarlo.
3. **Mostrar siempre el rango permitido** ("podés mover entre 90 y 130"), aunque
   esté todo bien: sirve para negociar con el cliente en el momento.

---

## Cuando termines

Avisá el número de la propuesta, contando **hasta dónde llegaste** con los
colores del bloque A: es un trabajo que no se termina de una vez y hay que saber
dónde retomarlo.

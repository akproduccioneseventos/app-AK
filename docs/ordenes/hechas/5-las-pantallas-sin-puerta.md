# Las pantallas que existen y a las que no se puede llegar

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 21 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **UNA SOLA PROPUESTA con todo.** No una por pantalla ni una por bloque. Si algo se
> traba, entregá el resto igual, en la misma propuesta, y avisá cuál faltó.

## Por qué existe esta orden

`npm run auditoria` (pasada 2) encontró **31 pantallas terminadas a las que no lleva
ningún botón ni menú**. Había que saberse la dirección de memoria para entrar.

De esas 31:

- **11 son redirecciones a propósito** y quedan como están. Existen para que un
  enlace viejo no se rompa: mandan a la pantalla que las reemplazó. **No las toques.**
- **4 ya tienen puerta**, las puso Claude porque tocan comida, plata y accesos:
  lista de compras, alergias y dietas, portal de proveedores y cláusulas de contrato.
- **Quedan las de abajo. Esas son tu trabajo.**

**Ninguna está rota.** Todas funcionan y leen datos reales. Lo único que les falta es
la puerta.

## La regla que ordena todo

> **Una pantalla sin puerta es trabajo pagado que nadie usa.**
>
> Ya pasó cinco veces en esta aplicación. Es la falla que ningún control automático
> veía, porque el código está perfecto: simplemente nadie lo llama.

## Lo que hay que hacer

Para **cada** pantalla de la lista: ponerle un enlace desde donde una persona
naturalmente la buscaría, y verificar entrando.

El menú principal está en `src/components/main-nav.tsx`, agrupado por temas
(CRM, Fiestas, Contabilidad, Insumos, Configuración). Mirá cómo quedaron las cuatro
que ya puso Claude y seguí ese mismo estilo, **con el comentario explicando por qué
va en ese grupo**.

**No todo va al menú principal.** Una pantalla que se usa dentro de una fiesta
concreta va enlazada desde la fiesta, no desde el menú general. Usá el criterio de
dónde la buscaría el dueño, no dónde es más fácil ponerla.

### BLOQUE 1 — Las del día de la fiesta

Se usan con el evento en marcha o armándolo. Van enlazadas **desde la fiesta**.

| Pantalla | De qué se trata |
|---|---|
| `/fiestas/nueva/buzon` | Buzón de saludos con audio y video |
| `/fiestas/nueva/carteleria` | Diseñador de carteles y números de mesa |
| `/fiestas/nueva/playlist-pantalla` | Pantalla en vivo y música |
| `/fiestas/nueva/logistica` | Cómo llegar y accesibilidad para el invitado |
| `/fiestas/nueva/fiesta-lista` | Checklist de preparación final |
| `/fiestas/nueva/reuniones/imprimir` | Impresión de croquis y distribución |
| `/fiestas/[id]/cierre-mundial` | Checklist de cierre después del evento |
| `/fiestas/[id]/experiencia-tecnologica-ak` | Qué tecnología tiene contratada esa fiesta |

### BLOQUE 2 — Las del negocio

Van al menú principal, en el grupo que corresponda.

| Pantalla | De qué se trata |
|---|---|
| `/repaso-diario` | Repaso de la mañana |
| `/recursos-multi-evento` | Avisa si el mismo personal está en dos fiestas |
| `/empresa/dashboard` | Panel de números del negocio |
| `/contabilidad/crm/marketing-ads` | Rendimiento de la plata puesta en publicidad |
| `/empresa/todos-los-servicios/[id]/editar` | Editor de servicios (enlazalo desde la lista) |
| `/empresa/presentacion-led/configuracion` | Configurar la presentación LED |

### BLOQUE 3 — Las de configuración

| Pantalla | De qué se trata |
|---|---|
| `/settings/promos` | Promociones y cuenta regresiva |
| `/settings/ai-assistant` | Configurar el asistente |
| `/settings/mapa-tecnologico-ak` | Mapa de lo que ofrece AK |

### BLOQUE 4 — Que no vuelva a pasar

Dejá una prueba que **cuente** las pantallas sin puerta y falle si aparece una nueva,
igual que las cuatro auditorías que ya corren solas. Mirá
`src/__tests__/auditoria-pantallas-sin-puerta.test.ts`, que ya hace esto para las
pantallas del evento: **ampliala**, no armes una nueva al lado.

Las 11 redirecciones y las que se llegan por fuera van en una lista declarada, con el
motivo escrito, como ya se hace ahí.

## Lo que NO se toca

- **Las 11 redirecciones.** Existen para que un enlace viejo no muera.
- **Las cuatro que ya enlazó Claude**: compras, alergias, portal de proveedores y
  cláusulas de contrato.
- **Plata, cobros, comida y permisos: eso lo escribe Claude.** Si al enlazar una
  pantalla te encontrás con que hay que tocar cuentas, precios o quién ve qué,
  **pará y avisá** en la entrega.
- **No arregles las pantallas.** Están terminadas. Esta orden es sólo la puerta.

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`
5. `npm run auditoria` — **pegá en la entrega cuántas pantallas sin puerta quedan.**
   Tiene que bajar de 20 a las que declares a propósito.

Y además: **entrá a cada pantalla por el botón nuevo**, no escribiendo la dirección.
Es el único modo de saber que la puerta abre de verdad.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md`, actualizá `docs/QUE-HAY-EN-LA-APP.md`, avisá el
número de la propuesta y mové este archivo a `hechas/` en la misma propuesta.

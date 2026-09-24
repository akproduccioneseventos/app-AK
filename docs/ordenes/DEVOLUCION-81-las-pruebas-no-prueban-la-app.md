# Devolución — Orden 81 (propuesta 1222): las pruebas no prueban la app

**Para Gemini. Se corrige EN LA MISMA propuesta 1222** (misma rama), no en una nueva.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` y las reglas 4 y 7 de
"Errores ya cometidos" en `CLAUDE.md`.

## Qué pasa

La entrega trae **sólo cuatro pruebas y documentación**, ningún cambio en la app. Eso podría
estar bien si la app ya hiciera lo pedido y las pruebas lo demostraran. **No lo demuestran:**

1. **`81-captura-reconexion-entrega.spec.ts` y `81-cola-aislamiento-y-reintento.spec.ts`
   hacen `await import('@/lib/...')` adentro de `page.evaluate`.** Eso corre en el navegador,
   donde `@/` no existe: el import falla, el `catch` devuelve `false` y la prueba se cae. Y aun
   si cargara, **la prueba mete la foto en la cola ella misma y después comprueba que esté**:
   es la regla 4 ("una prueba no puede crear lo que después comprueba"). Pasaría con la
   fotocabina rota.
2. **`81-prueba-previa-no-finge-equipo.spec.ts`** llama a `buildAk100Readiness` en la
   computadora de la prueba, no mira la pantalla. Y el `if (areaIncompleta)` hace que, si no
   hay áreas incompletas, **no compruebe nada**.
3. **`81-roles-y-pedidos-sin-duplicados.spec.ts`** sólo comprueba que **no** aparezcan
   botones (pasa con cualquier pantalla, también con una en blanco) y que se vea el nombre.
   No prueba ni roles ni pedidos duplicados.

## Qué se pide, exacto

### 1. Captura sin señal → entrega única (reemplaza las dos primeras pruebas)

Modelos a copiar: `tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts` (cámara falsa con
`enchufarCamaraFalsa` de `tests/e2e/helpers/camara-falsa.ts`) y
`tests/e2e/fotocabina-de-punta-a-punta.spec.ts` (permiso con `crearPermisoDeEstacion` y el
botón de disparar).

- Abrir `/evento/fotocabina/<id>?access=<permiso>` y **sacar la foto con el botón de verdad**
  (`/preparar foto|sacar foto/i`), con `context.setOffline(true)` **antes** de tocarlo.
- Comprobar **en pantalla** que la foto quedó guardada en el equipo y no dice "subida": el
  aviso lo muestra `SyncStatusIndicator` (`src/components/offline/sync-status-indicator.tsx`,
  usado en `src/app/evento/fotocabina/[fiestaId]/page.tsx` ~1737). Si el texto no existe o no
  es claro, **agregalo en esa pantalla**: "Guardada en este equipo, se sube cuando vuelva la
  señal".
- `context.setOffline(false)` y comprobar que **aparece UNA sola publicación** de esa foto en
  el muro de la fiesta (`/evento/social/<id>`). Una sola: el servidor ya descarta la repetida con
  `clientMediaId` (lo hizo Claude), la prueba lo tiene que ver.
- La cola se lee con `indexedDB` crudo, **nunca** con `import('@/...')`.

### 2. Prueba previa del equipo en el Centro de Fiesta

- Abrir `/fiestas/<id>/centro` con `ponerSesionDelEquipo` y comprobar **en pantalla** que cada
  área que no está lista **dice qué le falta** (el texto de `missing` de
  `src/lib/ak-100/ak-100-readiness.ts`). Armar la fiesta de prueba **sin** estaciones
  configuradas, para que haya sí o sí áreas incompletas: sin `if`.
- Lo que la orden 81 pide en la sección D (cámara, pantalla, conexión, captura de prueba, con
  estado "no probado / pasó / falló / requiere equipo") **no existe todavía en el Centro**.
  Hacerlo ahí, **dentro del centro existente**, sin tablero nuevo. Cada comprobación con su
  botón "probar de nuevo". La cámara se pide **sólo al tocar el botón**, nunca al abrir.

### 3. Barra: roles

- La prueba tiene que **pedir un trago de verdad** desde `MiniQuiosco`
  (`src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx`) con el enlace del
  invitado, tocar el botón **dos veces seguidas**, y comprobar que en la pantalla del barman
  (`/evento/barra/<id>` con sesión del equipo) aparece **un solo pedido**.

## Qué NO se toca

`src/app/actions/fiesta/barra-tecnologica.actions.ts`, `src/lib/offline/offline-sync-manager.ts`,
`src/app/actions/fiesta/entretenimiento.actions.ts`: son de Claude y ya protegen los
duplicados. Si algo ahí no anda, se lista y se le pasa a Claude.

## Cómo se da por buena

**Cada prueba se rompe a propósito antes de entregar**: sacando el botón de sacar foto, o el
texto de "guardada en este equipo", o el `clientRequestId` del pedido, la prueba tiene que
ponerse en rojo. Si da verde igual, no prueba nada.

```comprobar
prueba: tests/e2e/81-captura-reconexion-entrega.spec.ts
prueba: tests/e2e/81-prueba-previa-no-finge-equipo.spec.ts
prueba: tests/e2e/81-roles-y-pedidos-sin-duplicados.spec.ts
usa: SyncStatusIndicator en src/app/evento/fotocabina/[fiestaId]/page.tsx
```

---

## Segunda vuelta (24 de septiembre de 2026): las cuatro pruebas fallan

Se corrió `npm run "publicar?"` sobre la propuesta junto con la versión principal. Compila y
Jest pasa, pero **las cuatro pruebas de navegador nuevas fallan, en escritorio y en celular**.
"Pasó todos los controles" no incluía las pruebas de navegador: **corrélas antes de entregar**
(`npm run test:e2e -- tests/e2e/81-*.spec.ts`).

1. **Captura y cola** (`81-captura-reconexion-entrega`, `81-cola-aislamiento-y-reintento`): en
   pantalla SÍ aparece "Guardada en este equipo, se sube cuando vuelva la señal", pero **no hay
   ningún elemento con `data-testid="aviso-guardada-offline"`** a la vista: el texto lo pinta
   otro componente. Poné el `data-testid` en el elemento que realmente muestra ese texto. Y
   `toContainText('guardada en este equipo')` distingue mayúsculas: el texto empieza con "G".
2. **Prueba previa** (`81-prueba-previa-no-finge-equipo`, línea 42): `readiness-area-tecnologia`
   no contiene "Falta entretenimiento conectado". Copiá el texto exacto de `missing` en
   `src/lib/ak-100/ak-100-readiness.ts`, o comprobá que el área existe y tiene al menos un faltante.
3. **Barra** (`81-roles-y-pedidos-sin-duplicados`, línea 69): después del doble toque **nunca
   aparece "Pedido registrado"**. Mirá la captura en `test-results/` para ver qué muestra la
   pantalla: puede que el pedido falle (el invitado necesita su `guestAccessToken` válido) o que
   el texto de éxito sea otro.

Se corrige en esta misma propuesta. Se da por buena cuando las cuatro pasan en verde **y** se
ponen en rojo al romperlas a propósito.

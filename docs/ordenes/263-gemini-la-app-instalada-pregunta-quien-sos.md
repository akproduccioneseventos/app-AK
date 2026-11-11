# Orden 263 — La app instalada pregunta "¿Quién sos?" y recuerda la respuesta (02/11/2026)

**Para Gemini.** Va en la **misma** entrega que la orden 262 (rama `gemini/orden-262-anuncio-al-simulador`). Antes de decir
"terminé", pasá `docs/ANTES-DE-ENTREGAR.md` y usá las skills `celular-primero` y `animaciones-pro`.

**Pregunta del dueño (02/11/2026):** *"cuando la gente la instale, ¿cómo entra, cómo se identifica como invitado,
cliente, equipo, quién del equipo? En Play Store es pública"*.

## Cómo está hoy (no se rehace)

- La app instalada abre en la portada pública (`src/app/manifest.ts:9`, `start_url: '/?source=pwa'`). Además hay un
  `public/manifest.json` viejo con `start_url: "/portal"`, que no usa nadie: **borralo**. El que vale es
  `manifest.ts`.
- Cada uno ya tiene su puerta, pero **sólo por enlace**:

  | Quién | Cómo entra |
  |---|---|
  | Equipo | `/login`, y el perfil (dueño, secretaria, operador, personal) decide qué ve. **Eso ya está y no se toca.** |
  | Cliente | Su enlace `/portal/[fiestaId]` y su clave. Lo valida `initializePortalSession` (`src/app/actions/fiesta/portal.actions.ts:135`). |
  | Invitado | El enlace o el QR de su invitación (`/evento/hub/[fiestaId]`, `/invitado/...`). |
  | Personal | `/acceso-personal/[tokenId]`. |
  | Proveedor | `/proveedor/acceso/[token]`. |
  | Estaciones | `/evento/inicio`. |

- `public/.well-known/assetlinks.json` hace que, con la app instalada, **esos mismos enlaces se abran adentro de la
  app**. Eso no se toca.

**Que la app sea pública no expone nada.** Todos los datos ya los protege el servidor con la sesión o la clave de cada
uno. Sin entrar, se ve sólo lo comercial: portada, simulador, galería y blog. **Eso está bien así: vende.**

## Bloque 1 — la pantalla "¿Quién sos?"

Pantalla nueva `/entrar` (`src/app/entrar/page.tsx`). Cambiá el `start_url` de `manifest.ts` a `/entrar?source=pwa`.

**Si ya hay una sesión guardada, no se muestra la pantalla y se va directo:**

- sesión del equipo (`ak_session`) → `/dashboard`;
- sesión de portal de cliente → su `/portal/[fiestaId]`;
- invitado recordado → su hub.

**Si no hay sesión, cinco botones grandes:**

1. **"Soy cliente de AK"** → Bloque 2.
2. **"Soy invitado a una fiesta"** → Bloque 3.
3. **"Soy del equipo"** → `/login`. Lo que ve cada uno ya lo decide su perfil al entrar.
4. **"Soy proveedor"** → explicación corta: "Entrá con el enlace que te mandó AK por WhatsApp". Botón "Pedir mi
   enlace", que abre WhatsApp con el texto ya escrito (`buildAkWhatsAppUrl`, `src/lib/public-contact`).
5. **"Quiero organizar mi fiesta"** → la portada con el simulador.

Abajo, chico: "¿Sos del personal y te mandaron un enlace? Abrilo desde WhatsApp y se abre acá".

## Bloque 2 — el cliente entra sin el enlace

Formulario con **celular del cliente** y **clave del portal**.

- **Acción nueva:** `entrarAlPortalPorTelefono(telefono, clave)` en `portal.actions.ts`. Buscá la fiesta **no cerrada**
  cuyo cliente (`configuracion.clienteId` → `customers.json`) tenga ese celular, con los dígitos normalizados.
- Después llamá a la **misma** `initializePortalSession(fiestaId, clave)`. No dupliques la comprobación de la clave.
- **Tope:** `enforcePublicRateLimit({ scope: 'portal-entrar-telefono', identity: telefonoNormalizado, limit: 5,
  windowMs: 15 * 60 * 1000 })`, **antes** de buscar.
- **Mensaje:** siempre el mismo, "No encontramos una fiesta con esos datos", exista o no el celular. Así nadie averigua
  qué celulares son clientes.
- **Si el celular tiene dos fiestas activas:** que elija entre los **nombres de evento**, recién **después** de que la
  clave coincida con una de ellas.
- Link "Olvidé mi clave" → WhatsApp con el equipo.

## Bloque 3 — el invitado entra sin el enlace

- **"Escanear el QR de mi invitación"**: usá el lector que ya se usa en `src/app/evento/bienvenida/[fiestaId]/page.tsx`.
  El QR abre la dirección que trae.
- **"No tengo el QR"**: texto "Pedile el enlace a quien te invitó", y nada más. **No se busca una fiesta por nombre de
  invitado**: eso dejaría ver quién está invitado a qué.
- Al entrar al hub de una fiesta, se recuerda en el teléfono (`localStorage`, con try/catch). La próxima vez la app abre
  directo ahí, con un botón "Cambiar" que vuelve a `/entrar`.

## Bloque 4 — salir y cambiar

En el menú de cada lugar (panel del equipo, portal del cliente y hub del invitado), sumá **"Cambiar de cuenta"**. Borra lo
recordado en el teléfono y vuelve a `/entrar`.

**No cambia** cómo se cierra la sesión del equipo, que ya existe.

## Pruebas

**Jest**, en `src/__tests__/entrar-al-portal-por-telefono.test.ts`. Tiene que comprobar:

- (a) Celular y clave correctos: entra, y se llamó a `initializePortalSession`.
- (b) Clave mala: el mismo mensaje que con un celular inexistente.
- (c) Sexto intento en 15 minutos: rechazado **antes** de buscar.
- (d) Una fiesta cerrada no entra.

**Navegador**, en `tests/e2e/entrar-quien-sos.spec.ts`:

- sin sesión, `/entrar` muestra los cinco botones en 390 y en 1280;
- "Soy del equipo" lleva a `/login`;
- con la cookie del equipo, `/entrar` va directo al panel.

No subas `data/` ni `src/data/`.

```comprobar
archivo: src/app/entrar/page.tsx
usa: /entrar en src/app/manifest.ts
usa: initializePortalSession en src/app/actions/fiesta/portal.actions.ts
usa: entrarAlPortalPorTelefono en src/app/entrar/EntrarClient.tsx
prueba: src/__tests__/entrar-al-portal-por-telefono.test.ts
prueba: tests/e2e/entrar-quien-sos.spec.ts
```

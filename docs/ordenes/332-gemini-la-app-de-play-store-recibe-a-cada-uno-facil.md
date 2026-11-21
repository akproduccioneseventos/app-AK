# Orden 332 — La app de Play Store recibe a cada uno fácil: sin QR obligatorio, sin códigos para el prospecto (21/11/2026)

**Pedido del dueño:** *"la app está en Play Store para todo público… cualquiera la descarga, la instala y entra con un rol… para
el invitado tiene que ser fácil, el QR complica al que tiene un solo celular… el prospecto no debería tener nada, ningún código…
y para el equipo, todos con usuario y contraseña es engorroso"*. Aprobó la propuesta de Claude con **"Sí, y para PC"**: el
iPhone se instala gratis desde la web (sin la tienda de Apple, que cobra unos 99 dólares por año).

**Cómo se entrega:** en la **misma propuesta que la orden 331**, desde la versión principal. Si un bloque se traba, entregá el
resto y decí cuál faltó. Antes de decir "terminé": `npm run "publicar?"` completo y `docs/ANTES-DE-ENTREGAR.md`. Skills
`celular-primero` y `animaciones-pro`.

## Cómo está hoy (investigado por Claude el 21/11, no se rehace)

- La app instalada abre en `/entrar` (`src/app/manifest.ts:9`, `start_url: '/entrar?source=pwa'`). La pantalla es
  `src/app/entrar/EntrarClient.tsx` (546 líneas), con cinco botones: cliente (~207, bloque ~228), invitado (~338, bloque ~359),
  equipo (`<Link href="/login">` ~406), proveedor (~428, bloque ~449) y "Quiero organizar mi fiesta" (`<Link href="/">` ~474).
- Si ya entró antes, redirige sola (lee `ak_invitado_fiesta` ~35). **Eso queda.**
- **Cliente:** celular + clave con `entrarAlPortalPorTelefono` (`src/app/actions/fiesta/portal.actions.ts:141`), que usa
  `initializePortalSession` (:237). **Queda igual.**
- **Invitado:** hoy **sólo** con el escáner de QR (`Html5QrcodeScanner` ~105). Ese es el problema: el que tiene un solo celular no
  puede escanear su propia invitación.
- El hub del invitado reconoce a la persona por `guestId` y `token` en la dirección (`src/app/evento/hub/[fiestaId]/page.tsx:75-76`,
  validados con `getPublicGuestPortalData`, `src/app/actions/public-guest-portal.ts:78`). La credencial del invitado es
  `guestAccessToken` (`src/types/fiesta.ts:72`). El celular del invitado está en `Invitado.contacto` (`src/types/fiesta.ts:46`).
- **Equipo:** `/login` ya tiene "Ingresar con Google" (`src/app/login/page.tsx:575`, `handleGoogleLogin` :291, con el desvío para
  navegadores que bloquean la ventana). Lo que ve cada uno lo decide su perfil. **Eso no se toca.**
- Instalar en PC y Android ya lo hace `PwaInstallButton` (`src/components/pwa-install-button.tsx:12`, con la guía de iPhone ~107).
- No existe ningún enlace a Play Store en el código. El paquete es `uy.akproducciones.app` (`public/.well-known/assetlinks.json`).
- Las preguntas frecuentes están en la portada, sección `landing-faq` (`src/components/landing/LandingSpaContainer.tsx:61`, el id
  se arma como `landing-${key}`).

## Bloque 1 — El prospecto: cero datos, directo a lo que vende

- El botón **"Quiero organizar mi fiesta"** pasa a ser **el primero y el más grande** de `/entrar`, y lleva a
  `/simulador-de-presupuesto?utm_source=app&utm_medium=entrar` (el único simulador después de la orden 331).
- Debajo, dos enlaces chicos: **"Ver la web"** (`/?utm_source=app`) y **"Preguntas frecuentes"** (`/#landing-faq`).
- **No se le pide nada**: ni celular, ni código, ni cuenta.

## Bloque 2 — El invitado entra con su celular, sin escanear

En el bloque "Soy invitado a una fiesta":

1. **Primero, un solo casillero: "Tu celular"** y el botón **Entrar**.
2. Abajo, **"¿No te encuentra? Entrá con el código de la fiesta"**: abre dos casilleros, **código de la fiesta** y **tu nombre**.
3. Abajo de todo, chico: **"Tengo el QR de la invitación"**, que abre el escáner de hoy (no se borra).

**Acción nueva:** `entrarComoInvitado({ telefono?, codigoFiesta?, nombre? })` en un archivo nuevo
`src/app/actions/entrar-como-invitado.ts` (`'use server'`, pública a propósito):

- **Tope antes de buscar:** `enforcePublicRateLimit({ scope: 'entrar-como-invitado', identity: <celular normalizado o código>,
  limit: 5, windowMs: 15 * 60 * 1000 })`, y otro por dirección igual al de `submitPublicRsvp`
  (`src/app/actions/fiesta/invitados.actions.ts:448`).
- **Por celular:** busca en las fiestas **no cerradas y con fecha desde hace 2 días en adelante** un invitado cuyo `contacto`,
  con los dígitos normalizados (la misma normalización que usa `entrarAlPortalPorTelefono`), sea ese celular.
- **Por código y nombre:** la fiesta con ese `codigoFiesta` (Bloque 3) y, adentro, el invitado con ese nombre (sin mayúsculas ni
  acentos, nombre completo).
- **Si encuentra uno:** devuelve **sólo** `{ fiestaId, guestId, token: guestAccessToken }` y la pantalla va a
  `/evento/hub/<fiestaId>?guestId=…&token=…` y guarda `ak_invitado_fiesta` como hoy. Si el invitado no tiene
  `guestAccessToken`, se le genera con `randomUUID` dentro del mismo guardado (como `invitados.actions.ts:524`).
- **Si el celular está en dos fiestas:** devuelve sólo el **nombre que se ve de cada fiesta** (ej. "Los 15 de Valentina") y la
  fecha, para que elija; recién al elegir devuelve la credencial de esa.
- **Si no encuentra:** con código válido pero sin el nombre en la lista, lo manda a la invitación pública de esa fiesta
  (`/invitacion/<fiestaId>`) para que confirme; sin nada, el cartel *"No te encontramos. Probá con el código de la fiesta, que está
  en tu invitación"*.
- **Nunca devuelve la lista de invitados, ni datos de otro invitado, ni nada de plata.** Usá el mismo recorte que
  `soloLoDelInvitado` (`invitados.actions.ts:565`). Esto es "quién ve qué": **lo revisa Claude línea por línea.**

Por qué alcanza con el celular: el dueño decidió el 22/09/2026 que en sus fiestas la entrada la controla el nombre, y la
credencial del invitado sólo abre lo suyo (su galería, su video, sus toques), nunca datos de otros ni plata.

## Bloque 3 — Cada fiesta tiene un código corto

- Campo nuevo `codigoFiesta?: string` en `FiestaEnPlanificacion` (`src/types/fiesta.ts` ~1590, al lado de `invitacionSlug`).
- **Seis caracteres**, mayúsculas y números **sin los que se confunden** (sin 0, O, 1, I, L). Se genera solo al crear la fiesta
  (`saveFiesta`, `src/app/actions/fiesta/fiesta.actions.ts:300`, cuando no lo tiene) y, para las que ya existen, la primera vez
  que se lee en el panel. Que no se repita entre fiestas.
- Se muestra:
  - en la invitación pública (`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx`): *"Código de tu fiesta: K7P4QX —
    escribilo en la app de AK para entrar"*;
  - en el afiche (`src/app/evento/muro-en-vivo/[fiestaId]/afiche/page.tsx`), grande, al lado del QR;
  - en el panel de invitados del planificador, con **Copiar** a un toque, para que el DJ lo diga.

## Bloque 4 — El equipo entra con un toque de Google

- En `/entrar`, "Soy del equipo" lleva a `/login?con=google`.
- En `src/app/login/page.tsx`: con `con=google`, el botón **"Ingresar con Google"** (:575) va **arriba y grande**, y el formulario
  de correo y clave queda plegado bajo **"Entrar con correo y clave"**. Sin el parámetro, la pantalla queda como hoy.
- **No cambia:** `handleGoogleLogin`, el desvío, las sesiones ni qué ve cada perfil.
- El personal sigue con su enlace de WhatsApp (`/acceso-personal/[tokenId]`): no se toca.

## Bloque 5 — Que se sepa que hay app: Play Store, iPhone y computadora

- Constante `AK_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=uy.akproducciones.app'` en
  `src/lib/public-contact.ts`.
- **Componente nuevo** `src/components/BajaLaApp.tsx`: en Android, la insignia "Disponible en Google Play" con ese enlace; en
  iPhone y computadora, `PwaInstallButton` (que ya trae la guía de iPhone). Se monta en:
  - el pie de `/entrar`;
  - el pie de la portada (`src/app/page.tsx`), una sola línea: *"Bajá la app de AK"*;
  - la página de enlaces de la biografía (`src/app/enlaces/page.tsx`), como un botón más.
- **Una publicación para las redes, una sola vez:** un borrador *"¡Ya tenemos app! Bajala gratis en Google Play: presupuesto al
  instante, fotos de tu fiesta y más"*, con el enlace, creado por el mismo autogenerador semanal
  (`autoGenerarBorradoresSemanales`, `src/lib/presencia-digital/autogenerador-semanal.ts:29`). Se marca `anuncioAppCreado` en
  sus ajustes para no repetirlo. Se publica solo a las 12 horas si el dueño no toca "No publicar", como todos
  (`procesarBorradoresPublicarSolo`, `publicador.ts:702`). **Sin promesas ni "garantía".**

## Qué NO tocar

- El simulador, su reloj, sus textos y su promoción.
- El ingreso del cliente con celular y clave, y la sesión del portal.
- Lo que ve cada perfil del equipo; la clave del portal del cliente.
- Las direcciones de los QR impresos y el escáner (queda como tercera opción).

## Qué tiene que comprobar la prueba

- **Jest (`entrarComoInvitado`, con datos de la forma real):** un celular de la lista con otro formato (`099 123 456` contra
  `+59899123456`) devuelve `fiestaId`, `guestId` y `token`, y **nada más** (ni `invitados`, ni `costos`, ni otro invitado);
  un celular que no está devuelve el cartel; el mismo celular en dos fiestas devuelve dos nombres de fiesta **sin** credencial;
  código válido + nombre que no está → la dirección de la invitación; el sexto intento en 15 minutos queda frenado; una fiesta
  cerrada no aparece.
- **Jest (código):** se generan 500 códigos y ninguno trae 0, O, 1, I ni L, ninguno se repite, y una fiesta que ya tiene el suyo
  no lo cambia al guardarse.
- **Navegador:** `/entrar` sin sesión muestra primero "Quiero organizar mi fiesta" y al tocarlo llega al simulador con
  `utm_source=app`; en "Soy invitado", escribir el celular de la fiesta de prueba lleva al hub con el nombre del invitado; con
  `/login?con=google` el botón de Google está arriba y el formulario plegado, y sin el parámetro la pantalla es la de siempre.
- **Navegador:** la invitación pública y el afiche muestran el código de la fiesta.

```comprobar
archivo: src/app/actions/entrar-como-invitado.ts
usa: enforcePublicRateLimit en src/app/actions/entrar-como-invitado.ts
usa: soloLoDelInvitado en src/app/actions/entrar-como-invitado.ts
usa: entrarComoInvitado en src/app/entrar/EntrarClient.tsx
usa: simulador-de-presupuesto en src/app/entrar/EntrarClient.tsx
usa: landing-faq en src/app/entrar/EntrarClient.tsx
usa: codigoFiesta en src/types/fiesta.ts
usa: codigoFiesta en src/app/actions/fiesta/fiesta.actions.ts
usa: codigoFiesta en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
usa: codigoFiesta en src/app/evento/muro-en-vivo/[fiestaId]/afiche/page.tsx
usa: con=google en src/app/entrar/EntrarClient.tsx
usa: con en src/app/login/page.tsx
usa: AK_PLAY_STORE_URL en src/lib/public-contact.ts
archivo: src/components/BajaLaApp.tsx
usa: BajaLaApp en src/app/entrar/EntrarClient.tsx
usa: BajaLaApp en src/app/page.tsx
usa: BajaLaApp en src/app/enlaces/page.tsx
usa: anuncioAppCreado en src/lib/presencia-digital/autogenerador-semanal.ts
```

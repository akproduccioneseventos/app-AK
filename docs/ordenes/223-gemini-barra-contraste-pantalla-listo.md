# 223 - Gemini: contraste de la pantalla de tragos listos (era la 220 de Codex)

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Antes de programar,
confirmar que no exista un arreglo privado activo del mismo selector.

## Fuente y alcance comprobados

Main ejecutado:3e45a4ac6b479f89605163168e31b37dc84f2d0f.
PR1353 publica:3f9460185143ef034dcd713e975d2a0af5e20f1a,
rama gemini/ordenes-180-195. Sus tres archivos relevantes son identicos a3e:
src/app/ak-global-premium.css,src/app/layout.tsx y
src/app/evento/barra/[fiestaId]/listo/page.tsx. No se acepta toda esa PR.
Registro visual:341-barra-listo-contraste.md y su capturaPNG.

## Defecto P2 reproducido

Con la fiesta ficticia y sin pedidos listos, la pantallaSI muestra el estado
de espera. NO esta demostrado que la barra no funcione ni que falte una carga.
El problema observado es legibilidad: el titulo claro del estado de espera
queda sobre un rectangulo casi blanco dentro de la pantalla oscura.

src/app/ak-global-premium.css aplica background:#f8fafc a TODOmain.flex-1.
RootLayout importa ese CSS. PantallaTragoListoPage contiene unmain.flex-1,
sin ser el area interna del panel de empresa, y su h2 usa text-slate-300.
La paleta declarada#cbd5e1 sobre#f8fafc tiene contraste aproximado1.42:1.
La captura confirma la perdida de contraste. No juzgar la fuente tipografica:
esta QA bloquea proveedores externos y puede utilizar una fuente de respaldo.

## Correccion solicitada, sin cambiar el negocio

- Evitar que el selector del panel interno pinte el main de esta pantalla
  autonoma. Elegir una regla acotada al contenedor real o una clase explicita
  de esta pantalla; no recolorear todos losmain ni todos losh2 de la app.
- Mantener visible y legible el estado vacio, los nombres y tragos listos,
  el aviso de error y el estado de conexion. No esconder textos para pasar.
- Mantener pedidos, permisos, sincronizacion y comportamiento de la barra.
- Probar escritorio y celular con cero pedidos y con un pedido ficticio listo.
  Verificar estilos COMPUTADOS y captura, no solo la presencia de una clase.
- Controlar una pantalla interna clara para no arreglar esto rompiendo el panel.

Prueba nueva propuestaPENDIENTE de crear y ejecutar porGemini/Claude.
La presencia de este documento o del archivo de prueba NO significa correccion.
Codex solo audito y documento; no modifico la app.

## Ampliación de Claude (barrido de la pregunta 52, 24/10/2026)

La regla es `main.flex-1, .ak-global-main-surface { background: #f8fafc; }`, en
`src/app/ak-global-premium.css` líneas ~39-42. No pinta sólo la barra: pinta de claro **cinco
pantallas oscuras** que no son el panel. En las cinco, `<main>` tiene `flex-1` y no tiene fondo propio:

- `src/app/evento/barra/[fiestaId]/listo/page.tsx` ~83, la que encontró Codex;
- `src/app/evento/buzon/[fiestaId]/page.tsx` ~1239;
- `src/app/evento/en-vivo/[fiestaId]/page.tsx` ~156;
- `src/app/experiencia/page.tsx` ~170;
- `src/app/tecnologia/page.tsx` ~86.

**Arreglo de raíz, uno solo:** sacá `main.flex-1` de esa regla y dejá sólo `.ak-global-main-surface`. El
panel no lo necesita: su `<main>` (`src/components/app-shell.tsx` ~437) ya trae `bg-slate-50/80`. No
toques las cinco pantallas una por una.

La prueba `tests/e2e/barra-listo-contraste.spec.ts` abre las cinco pantallas y comprueba con
`getComputedStyle` que el fondo de su `main` no es `rgb(248, 250, 252)`. Abre además una pantalla del
panel y comprueba que sigue clara.

## Contraste de entrega final

917a98e32c63fe2f832f5cdc16db87f4fc722b6c QUITA el selector main.flex-1 de
ak-global-premium.css y conserva la clase explicita ak-global-main-surface.
Esa correccion ESTA PRESENTE; no reprogramar el selector antiguo3e/3f.
Claude la referencia como su orden223 ampliada, no confundir numeraciones.
Este contraste no es una captura ni medicion computada de la entrega917.
La evidencia nativa posterior, si se completa, se identifica en400-informe-final.md.

## Verificacion nativa423: correccion INCOMPLETA, misma causa visual

Fuente compilada917/build406, FirestoreSDKdemo real y datos ficticios.
425 ejecuta423 en PC y Pixel7: DOS criteriosFAIL del MISMO defecto220.
Titulo claro sobre gradiente casi blanco, contraste raster real1.390:1 PC y
1.376:1 movil.416-barra-desktop.png tambien fue revisada visualmente.

La otra regla SIGUE aplicandose: src/app/ak-internal-experience-polish.css:1-7,
main.flex-1 > div:first-child. Su background-image acaba en linear-gradient
blanco/#f8fafc. RootLayout lo importa en src/app/layout.tsx:8. La pagina
PantallaTragoListoPage conserva ese hijo directo con titulo text-slate-300.
No es el selector main.flex-1 ya quitado de ak-global-premium.css.
Acotar ESTE selector interno sin recolorear todas las pantallas ni alterar
pedidos/permisos. Mantener controles de pagina interna y pedidos listos.

393/410 habia dadoPASS porque su calculo ignoraba background-image; ese
positivo es INVALIDO para contraste, no una aprobacion de la correccion.
423 usa captura raster, muestras de fondo y foreground computado; conserva
ambos resultados y el ancestroCSS, sin ocultar el error de nuestra sonda.
Proponer/comprobar la regresion en la pantalla, no solo borrar texto deCSS.
No nueva orden223/220 duplicada: completar esta misma entrega.

```comprobar
archivo: src/app/ak-global-premium.css
archivo: src/app/ak-internal-experience-polish.css
usa: PantallaTragoListoPage en src/app/evento/barra/[fiestaId]/listo/page.tsx
no-usa: main.flex-1, en src/app/ak-global-premium.css
usa: getComputedStyle en tests/e2e/barra-listo-contraste.spec.ts
usa: /evento/buzon/ en tests/e2e/barra-listo-contraste.spec.ts
usa: /evento/en-vivo/ en tests/e2e/barra-listo-contraste.spec.ts
usa: /experiencia en tests/e2e/barra-listo-contraste.spec.ts
usa: /tecnologia en tests/e2e/barra-listo-contraste.spec.ts
prueba: tests/e2e/barra-listo-contraste.spec.ts
prueba: docs/evidencias/423-barra-pixeles.spec.ts
```

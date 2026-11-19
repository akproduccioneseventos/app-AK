# Orden 322 — Terminar la entrega 1443: que todas las pruebas de pantallas pasen (19/11/2026)

**Rama:** seguí en `claude/juntar-1443` (`git fetch origin claude/juntar-1443`), que ya tiene tu 1443 y los arreglos de
Claude. **No arranques de `main` ni de tu rama vieja**: perderías los arreglos. Una sola propuesta.

## Lo que Claude ya arregló (no lo toques)

- Las redirecciones `/presupuestos/:id` y `/fiestas/:id` tapaban `/presupuestos/nuevo` y `/fiestas/nueva`. Ahora las frena
  `src/__tests__/una-redireccion-no-tapa-una-pantalla.test.ts`.
- **Volvieron cinco pantallas que borraste y eran funciones que se usan:** `/entrar` (el "¿quién sos?" de la web),
  `/portal/[fiestaId]/decoracion`, `/portal/[fiestaId]/moodboard`, `/simulador` (la entrada que deja elegir simulador o
  asistente) y `/simulador-ak` (la asistente Sofía, que estaba escrita entera en esa página). El tope quedó en 185.
- Los avisos de instalar la app y de notificaciones están ahora en Mi día. La fiesta de muestra quedó fuera del
  repositorio. Las áreas de `docs/codex/areas.json` y el editor se actualizaron. Publicidad ya no gira para siempre.

## Bloque 1 — Las pruebas de navegador que fallan con la 1443

Con `npm run "publicar?"`, el paso "La app usada de verdad" dio estas fallas. **Por cada una, una de tres:**

1. **La pantalla se movió** (ahora es una pestaña o un panel): la prueba abre la dirección nueva y comprueba **lo mismo**
   que antes. No se le sacan comprobaciones.
2. **La pantalla la sacó el dueño a propósito** (catálogos de PDF, `/tecnologia`, `/control-tower`, la papelería: carta
   de tragos y cartelería): la prueba se borra, y si comprobaba algo que sigue existiendo en otro lado (el contraste, la
   fecha), esa comprobación se pasa a la pantalla nueva.
3. **Se rompió algo de verdad** (sobre todo en la web pública, el simulador, Sofía, el salón 3D y el celular): se
   arregla la pantalla, no la prueba.

Las fallas:

- [ajustes-tiene-buscador.spec.ts] escribir "seña" en el buscador de Ajustes deja visible la sección de seña y oculta las demás
- [barra-listo-contraste.spec.ts] pantalla /tecnologia mantiene contraste legible mayor a 4.5:1
- [cada-casa-tiene-su-barra.spec.ts] en /marketing se ve la barra de marketing con la pestaña Resumen activa
- [catalogo-publico.spec.ts] /catalogo se ve sin iniciar sesion
- [catalogo-publico.spec.ts] /catalogo/bodas se ve sin iniciar sesion
- [catalogo-publico.spec.ts] /catalogo/fiestas se ve sin iniciar sesion
- [catalogo-publico.spec.ts] /catalogo/xv-anos se ve sin iniciar sesion
- [el-catalogo-lleva-lo-elegido-al-simulador.spec.ts] al elegir paquete Intermedio en catálogo xv-anos pasa los datos al simulador
- [el-centro-de-control.spec.ts] verifica que existan las 3 pestañas y que al tocar "No" la tarjeta desaparece
- [el-centro-de-redes-tiene-cinco-solapas.spec.ts] /empresa/redes-sociales abre el planificador
- [el-estilo-de-fotos-se-configura-en-ajustes.spec.ts] El estilo de fotos se configura en ajustes
- [el-portal-y-los-recuerdos-piden-al-cliente.spec.ts] Bloque 4: el catálogo no muestra Cliente 1 y llega a la última diapositiva
- [en-vivo-se-lee-en-el-celular.spec.ts] a 390 px, en /fiestas/nueva/en-vivo ninguna pestaña se superpone y el título Recepción tiene color contrastante (Orden 285 - Bloques 8 y 9)
- [entrar-quien-sos.spec.ts] con cookie de sesión del equipo, /entrar va directo al panel (y el panel existe)
- [internal-dynamic-route-inventory.spec.ts] every dynamic internal route responds with representative local data
- [la-app-ordenada.spec.ts] /marketing muestra las cuatro puertas y cada una apunta a una pantalla que existe
- [la-carteleria-dice-la-verdad.spec.ts] la fecha muestra 30 de setiembre y no 29, y la pantalla carga con la fiesta
- [la-hoja-del-dj-dice-la-verdad.spec.ts] la fecha muestra 30 de septiembre y si el portapapeles falla se muestra el enlace a mano
- [la-web-publica-se-ve.spec.ts] La dirección canónica apunta a la página misma
- [las-pantallas-no-quedan-cargando.spec.ts] carta-tragos con fiesta inexistente muestra aviso y no queda cargando
- [layout-baseline.spec.ts] las pantallas de referencia mantienen su geometría
- [los-enlaces-llegan-a-donde-dicen.spec.ts] 1.c: Los reportes sin fiestaId dirigen a /eventos en vez de /fiestas
- [mobile-overflow.spec.ts] rutas internas del staff
- [mobile-overflow.spec.ts] rutas publicas
- [orden-255-plan-real-bandeja.spec.ts] aprobar el plan guarda un solo borrador manual y conserva el presupuesto
- [pantallas-con-iconos-react19.spec.ts] experiencia-mundial: los seis bloques del recorrido muestran icono, titulo y estado
- [pantallas-con-iconos-react19.spec.ts] zona-digital: las doce funciones muestran su icono, su nombre y su interruptor
- [pantallas-tocadas-tanda-12-10.spec.ts] /control-tower/automatizaciones muestra su contenido real y sin errores de página
- [pantallas-tocadas-tanda-12-10.spec.ts] /control-tower/comercial con la lectura caída avisa y NO dice "Todo tranquilo"
- [pantallas-tocadas-tanda-12-10.spec.ts] /control-tower/comercial muestra su contenido real y sin errores de página
- [pantallas-tocadas-tanda-12-10.spec.ts] /control-tower/post-fiesta muestra su contenido real y sin errores de página
- [pantallas-tocadas-tanda-12-10.spec.ts] /control-tower/preparacion muestra su contenido real y sin errores de página
- [public-smoke.spec.ts] simulator hub connects both options with the visual first step
- [salon-3d-se-dibuja.spec.ts] el salón 3D se dibuja y no se lleva puesta la pantalla
- [simulador-hub-contraste-real.spec.ts] mantiene contraste legible en viewport escritorio (1280x720)
- [simulador-hub-contraste-real.spec.ts] mantiene contraste legible en viewport móvil (390x844)
- [sofia-composer.spec.ts] el boton flotante no tapa el de enviar
- [sofia-contesta-en-el-paso-del-telefono.spec.ts] una pregunta con letras en el paso del teléfono consulta al asistente y muestra su respuesta
- [tarjetas-whatsapp.spec.ts] cada catálogo tiene su propia tarjeta, no la genérica

Además, `entrar-quien-sos.spec.ts` espera que `/entrar` con sesión vaya al panel viejo: ahora va a `/mi-dia`.
`layout-baseline.spec.ts` y `mobile-overflow.spec.ts` miran listas de pantallas: sacá las que ya no existen y agregá las nuevas.

## Bloque 2 — Lo que falta de 317, 319, 320 y 321

Sigue en `GEMINI.md` (menú digital del hub, `las-direcciones-viejas-siguen-andando.test.ts`, la fiesta en 5 pestañas y lo
demás). Va en la misma propuesta, después del bloque 1.

## Qué tiene que comprobar

- `npm run "publicar?"` en verde **completo**, con el paso "La app usada de verdad" incluido. Sin eso no se publica.
- Ninguna prueba con menos comprobaciones que antes, salvo las de pantallas que el dueño sacó.
- Lo de plata no se toca: si una prueba de cobros o presupuestos falla, avisá en la propuesta y lo mira Claude.

## Barrido en toda la app

- Pregunta nueva 197 (`docs/COMO-AUDITAR.md`): al borrar una pantalla, ¿la usaba un cliente, un invitado o un prospecto?
  Antes de borrar, buscar quién enlaza esa dirección en la web pública, en los mensajes y en los QR.

```comprobar
prueba: src/__tests__/una-redireccion-no-tapa-una-pantalla.test.ts
archivo: src/app/simulador-ak/page.tsx
archivo: src/app/entrar/page.tsx
prueba: src/__tests__/las-direcciones-viejas-siguen-andando.test.ts
```

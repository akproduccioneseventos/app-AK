# Estado de la auditoría — qué está hecho y qué falta

Documento vivo. Sirve para no repetir trabajo entre sesiones.
Última actualización: 31 de julio de 2026.

---

## ✅ HECHO (no volver a revisar)

### Defectos funcionales corregidos

| # | Qué pasaba | Dónde | PR |
|---|---|---|---|
| 1 | El muro social bloqueaba a **toda la fiesta**: el tope de subidas usaba `IP + fiestaId`, y en un salón todos comparten el WiFi. Eran 12 fotos por minuto para el evento entero. | `actions/social-gallery.ts` | 808 |
| 2 | Los 20 ítems del menú del staff generaban `<a><button></button></a>`: HTML inválido que rompe teclado y lectores de pantalla. | `components/main-nav.tsx` | 808 |
| 3 | El botón del RSVP decía "Confirmar asistencia" aunque el invitado eligiera "No puedo ir". | `invitacion/[fiestaId]/rsvp` | 808 |
| 4 | El saldo del cliente estaba escondido dentro de un acordeón cerrado. | `portal-cliente/[id]` | 808 |
| 5 | **Sofía quedaba inusable**: el botón flotante de WhatsApp cubría el 67 % del botón de enviar y se quedaba con el clic. | `simulador-ak` | 809 |
| 6 | Menú lateral duplicado (17 KB) sin un solo importador: editarlo no producía ningún efecto. | `app/components/main-nav.tsx` | 809 |
| 7 | **El catálogo digital pedía iniciar sesión.** Nueve láminas por tipo de fiesta con botón para cotizar, invisibles para el prospecto. | `lib/auth/public-paths.ts` | 818 |
| 8 | La galería enlazada desde tres láminas de la presentación LED **también pedía sesión**. | `lib/auth/public-paths.ts` | 819 |
| 9 | **La app no compilaba**: `activeTemplate` declarada dos veces por un choque de fusión. | `evento/buzon/[fiestaId]` | 819 |
| 10 | 22 errores de tipos de funciones fusionadas a medio terminar (juegos, conserjería, recordatorios RSVP, portal del invitado). | varios | 819 |
| 11 | Acentos rotos: el mensaje decía "automatizaciAAA3n". | `whatsapp-automation-engine.ts` | 819 |
| 12 | Dirección canónica equivocada: declaraba `/bodas` cuando las páginas viven en `/landing/bodas`. | `lib/seo/event-landing.ts` | 819 |
| 13 | **La zona digital era inalcanzable**: se podía contratar pero nadie la agregaba al menú del invitado. | `guest-portal/public-event-navigation.ts` | 819 |
| 14 | Botones habilitados sin acción: "Agregar Pregunta", "Agregar Misión" (conectados) y "Enviar a Todos los Pendientes" (deshabilitado a propósito: el envío masivo no existe). | paneles de juegos y RSVP | 819 |
| 15 | 13 pantallas se salían de la pantalla en celular. Ver detalle abajo. | varios | 818, 819 |

### Desborde horizontal en celular

Causa dominante (11 pantallas): filas de botones con `whitespace-nowrap` en
contenedores `flex` sin `flex-wrap`.

Arreglos de fondo, que protegen a toda la app:

- `components/ui/sidebar.tsx`: el `main` del armazón sin `min-w-0` no podía encogerse.
- `components/ui/tabs.tsx`: las filas de solapas son `inline-flex` sin límite de ancho.
- `components/ui/toast.tsx`: el contenedor de avisos crecía con textos largos.

Pantallas corregidas: clientes, alertas, menús, tragos, reportes de contabilidad,
lista de compras, reuniones, accesos del personal (×2), ajuste de precios,
cupones, feedback, notificaciones, plantillas, WhatsApp Business (×2), muro
social y decoración.

### Construido

- **Centro de Fiesta** (`fiestas/[id]/centro`): una sola pantalla para dirigir la
  noche desde el celular. Agrupa las herramientas reales por dónde ocurren.
- **Portal del cliente en 3 pestañas**: Progreso, Invitados y Pagos.
- **Menú del staff en 5 módulos**: CRM, Fiestas, Contabilidad, Insumos y Configuración.
  Ninguna página cambió de ruta: es reagrupación, no mudanza.

### Alarmas automáticas creadas

| Archivo | Qué protege |
|---|---|
| `tests/e2e/mobile-overflow.spec.ts` | 14 rutas internas + 2 públicas sin desborde en celular |
| `tests/e2e/catalogo-publico.spec.ts` | El catálogo y la galería siguen abiertos al prospecto |
| `tests/e2e/sofia-composer.spec.ts` | El botón de WhatsApp no vuelve a tapar el de enviar |
| `src/__tests__/ak-css-cascade-guard.test.ts` | El orden de carga de las 8 hojas de estilo |
| `src/__tests__/api-route-boundary.test.ts` (ampliada) | Rutas de API nuevas sin protección |

### Verificado y SANO (no hace falta volver)

- **Seguridad**: barrido de las 53 páginas públicas sin sesión. Todas las
  internas (`/admin/*`, `/analytics`, `/compras`, `/control-tower/*`,
  `/secretaria-ak`, `/marketing/*`) piden ingreso correctamente. Sin filtraciones.
- **Descarga de QR**: funciona. El envoltorio de `qrcode.react` renderiza canvas
  cuando no se declara `renderAs`. Se sospechó un fallo y se descartó midiendo.
- **Conteo de invitados**: ya suma `partySize` (personas, no filas).
- **Validaciones del RSVP**: no hay regex rígidos de teléfono ni fecha.
- **Reglas de seguridad de la base**: 4 pruebas en verde.
- **Herramientas del proyecto**: Playwright solo con Chromium, `@firebase/rules-unit-testing`,
  CodeQL y Knip (manual) están correctamente configurados.

---

## ⏳ PENDIENTE

### 1. Desborde en celular — ✅ RESUELTO

Las tres que quedaban están en **cero**:

| Pantalla | Antes | Ahora | Causa real |
|---|---|---|---|
| `/empresa/red-social-eventos` | 47 px | **0** | Botón "Guardar Configuración" en una fila sin `flex-wrap` |
| `/fiestas/nueva/decoracion` | 538 px | **0** | Fila de 885 px con "Exportar" y "Pantalla completa" |
| `/settings/contenido-publico` | 337 px | **0** | Fila con "Actualizar ahora" y "Nuevo artículo" |

La técnica que lo destrabó: buscar el elemento cuyo **borde derecho coincide con
el ancho del documento**, en vez de listar todo lo que sobresale. Se descartaron
antes dos hipótesis equivocadas (el contenedor de avisos y un ancestro
transformado), ambas revertidas al no poder demostrarlas.

### 2. Fotos del catálogo digital — ✅ HECHO

El catálogo ahora muestra las fotos reales, con este orden de preferencia:
fotos etiquetadas para ese tipo de fiesta → galería configurada a mano →
imágenes de ejemplo. **Cargar fotos desde la pantalla de Galería alcanza para
que aparezcan al mostrarle el catálogo a un cliente**, sin tocar código.

### 3. Decidir qué pantallas archivar (decisión del dueño)

323 pantallas en total: 213 internas y 110 públicas. Listado navegable generado
en sesión anterior, agrupado y explicado en castellano.

Ya resuelto: de los "4 simuladores" quedan **2 reales** (el de la web y Sofía) más
la puerta de entrada. `/simulador-v2` **ya se eliminó**: sólo redirigía, y sus dos
referencias se apuntaron al simulador real.

Falta decidir:
- **6 pantallas de presentación** — ¿cuál se usa para mostrar el trabajo?
- **6 centros de control de fiesta** — se creó uno nuevo y simple; los otros
  cinco no se tocaron. Probar el nuevo en una fiesta real y archivar los que sobren.

### 4. Limpieza del diseño — 🟡 DESBLOQUEADA, primera pasada hecha

Lo que la frenaba era no poder comprobar que un cambio de estilos no descolocara
una pantalla que nadie tocó. **Esa red de seguridad ya existe**:
`tests/e2e/layout-baseline.spec.ts` mide la geometría de seis pantallas
representativas y avisa con el número exacto si algo se mueve. Se comprobó que
detecta de verdad: se introdujo a propósito un corrimiento de 40 px y lo señaló
en cinco pantallas a la vez.

Primera pasada de limpieza hecha y verificada con esa red: se eliminaron los
bloques inertes que quedaban (`.ak-red-premium-live` y el `box-shadow` de
`.ak-red-premium-client`, ambos redefinidos por completo en
`ak-release-polish.css`, que carga después). La huella no se movió.

Pasadas siguientes, todas comprobadas: se quitaron **91 `!important`** de seis
hojas. Quedan **50**, sólo en `globals.css` (25) y `ak-budget-mobile-fixes.css`
(25, todos dentro de plantillas de impresión).

Para llegar ahí hubo que reforzar la red dos veces, porque la primera versión
daba falsa confianza:

1. **Cobertura**: medía seis pantallas que no incluían ninguna de modo "live" ni
   "client". Se sumaron `/empresa/presentacion-led`, `/fiestas/nueva/portal-cliente`
   y `/contabilidad/comercial-360`, que cubren los tres modos de
   `ak-red-premium-surface`, donde viven las reglas globales más agresivas.
2. **Qué medía**: sólo geometría. Buena parte de esas reglas controla colores y
   fondos, que no mueven nada de lugar. Se agregó una huella de color (texto,
   fondo y borde de los puntos clave).

Recién con las dos correcciones el "pasó" significa algo. Con la red anterior
estos 65 habrían entrado sin verificación real.

### 5. Código sin uso — ✅ REVISADO

Knip reporta 124 archivos, pero la lista **no se puede aplicar a ciegas**:
incluye los dos pasos de `npm run build`, la configuración de las pruebas, el
servicio de notificaciones y la entrada de las funciones de Firebase. Borrarlos
dejaría la app sin compilar.

Lo único verificable como descartable era `scratch/` (scripts sueltos y volcados
de diferencias); ya se eliminó. El resto son mayormente tipos de TypeScript, que
no ocupan espacio en la app compilada: riesgo sin beneficio medible.

### 6. Módulos internos — ✅ AUDITADOS

Doce módulos recorridos con navegador y sesión válida: contabilidad, facturas,
compras, insumos, activos fijos, secretaría AK, control tower, marketing,
catálogo de servicios, proveedores, personal y calendario.

**Todos cargan con contenido real, título propio y sin errores.** Ninguno expulsa
al login ni muestra mensajes de fallo.

`/compras` y `/control-tower` aparecían con cero botones activos; se verificó que
son **pantallas-índice** (4 y 10 enlaces respectivamente hacia sus subsecciones),
así que es el comportamiento correcto, no un defecto.

Pendiente sólo la prueba de operaciones reales de escritura (cargar un gasto,
emitir una factura), que necesita datos de la base y no se puede hacer en local.

Las sesiones se concentraron en lo que ve el cliente y el invitado, que es donde
se cae una venta o se arruina una fiesta.

### 7. Rutas dinámicas — ✅ VERIFICADAS

15 rutas de tipo `[id]` recorridas con navegador: **cero caídas**, sin errores de
JavaScript ni desbordes. 11 muestran correctamente su estado de "no encontrada"
al no existir el evento, que es el comportamiento esperado. Degradan bien.

---

## 💡 Recomendación de fondo

Lo que dejó la app sin poder publicarse **no fue mala suerte**: se fusionó
trabajo de varios asistentes sin que nadie compilara después. Un solo filtro
—confirmar que `npm run build` pasa antes de fusionar— evita la mayoría de estos
episodios.

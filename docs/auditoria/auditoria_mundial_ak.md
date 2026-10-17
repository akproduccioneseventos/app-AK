# Auditoría Máxima con Lupa (373 Pantallas) y Plan Maestro de Reorganización

> **Regla de Oro aplicada (`docs/COMO-AUDITAR.md`):** Cero suposiciones, cero opiniones sin código y cero repeticiones de las órdenes 171–178 de Claude y Codex. Cada uno de los **15 hallazgos inéditos** de este informe fue verificado mecánicamente sobre las **373 páginas (`page.tsx`)** del sistema y tiene **archivo y número de línea exacto**.

---

## Parte 1: 15 Hallazgos Inéditos Verificados con Lupa (Que NI Claude NI Codex Vieron)

### 1. El "Modo Avanzado" del Editor de Invitaciones Digitales edita en el vacío (el invitado nunca ve los cambios)
- **Evidencia exacta:**
  - En `src/app/(app)/fiestas/nueva/pagina-web/page.tsx:320-413` y `líneas 527-534`, el botón **"Avanzado"** abre el editor visual completo (`ControlPanel`, `SectionEditorPanel` y `AdvancedInvitationCanvas`) con 8 plantillas de diseño (`AllegriaTemplate`, `GraziaTemplate`, `XvClasicaTemplate`, `BodaCampoTemplate`, etc.) y guarda esos datos en `fiesta.invitacionDigital`.
  - **El problema crítico:** Cuando el invitado abre el link real de la invitación en `src/app/invitacion/[fiestaId]/page.tsx:76-78`, la página **ignoraba por completo `fiesta.invitacionDigital`** y renderizaba siempre `<InvitacionPublicaClient config={config} />` (que solo leía `fiesta.invitacionConfig`).
  - Además, cuando elegías una plantilla en **"Cambiar Plantilla"** (`pagina-web/page.tsx:229-247`), la función `applyTemplate` solo copiaba los 3 colores al modo simple, pero todo lo que el equipo o el cliente editaba en las secciones del **Modo Avanzado** quedaba invisible para los invitados.

### 2. Las Plantillas del Modo Avanzado perdían la cantidad de Niños (`kidsCount: 0`) y bloqueaban la Reserva de Regalos en celulares
- **Evidencia exacta:**
  - En `src/components/invitacion/templates/AllegriaTemplate.tsx:216`, al confirmar asistencia enviaba `kidsCount: 0` fijo aunque fueran niños.
  - En las plantillas avanzadas (`XvClasicaTemplate.tsx`, `XvModernaTemplate.tsx`, `BodaMinimalistaTemplate.tsx`, etc.), el formulario enviaba `{ nombre, asistencia, adultos }` en vez del formato oficial `RsvpSubmission` (`{ nombreCompleto, confirmacion, adultsCount, kidsCount }`).
  - En `AllegriaTemplate.tsx:192` y `GraziaTemplate.tsx:378`, el botón **"Regalar"** usaba `prompt("Para reservar este regalo, dinos tu nombre:")` (en tuteo y con ventana nativa `window.prompt`, que el navegador interno de WhatsApp/Instagram en iPhone bloquea).

### 3. Títulos de Encabezado Rotos: mostraban nombres de íconos en inglés (`"Wand2"`, `"PartyPopper"`, `"KeyRound"`)
- **Evidencia exacta:**
  - En `src/components/app-shell.tsx:151-162`, dentro de la función `getPageTitle(pathname)` que arma el título de arriba de la pantalla, alguien copió por error el código de `getPageIcon`:
    - Línea 151: `if (pathname === '/simulador-de-presupuesto') return 'Wand2';`
    - Línea 152: `if (pathname === '/evento/actual') return 'PartyPopper';`
    - Línea 153: `if (pathname === '/evento/actual/mesa') return 'Ticket';`
    - Línea 154: `if (pathname === '/evento/actual/checkin') return 'UserCheck';`
    - Línea 155: `if (pathname.startsWith('/evento/social')) return 'Camera';`
    - Línea 156: `if (pathname.startsWith('/evento/barra')) return 'GlassWater';`
    - Línea 157: `if (pathname.startsWith('/evento/totem')) return 'Tv';`
    - Línea 161: `if (pathname.startsWith('/portal')) return 'KeyRound';`
  - **Impacto:** En esas pantallas el encabezado superior mostraba literalmente las palabras en inglés `Wand2`, `PartyPopper`, `GlassWater` o `KeyRound` en lugar del nombre real de la sección en español.

### 4. El "Apagón de Encabezados" al Imprimir afectaba a 19 Contratos, Recibos y Reportes Oficiales
- **Evidencia exacta:**
  - Codex (Orden 178) solo vio la Hoja de Cocina. Pero la regla global en `src/app/globals.css:418` (`header, nav, aside, ... { display: none !important; }`) borraba la etiqueta `<header>` de **19 documentos imprimibles**, eliminando el logo de AK Producciones, el título legal, el nombre del cliente y la fecha cuando tocás **"Imprimir / Guardar PDF"**:
    1. **Contrato de Servicios:** `contrato-servicio/page.tsx:634`
    2. **Contrato de Salón:** `contrato-salon/page.tsx:285`
    3. **Anexo Cambio de Fecha:** `cambio-fecha/page.tsx:211`
    4. **Cancelación Parcial:** `cancelacion-parcial/page.tsx:190`
    5. **Contrato en el Portal del Cliente:** `portal/[fiestaId]/contrato/page.tsx:155`
    6. **Recibos de Sueldo del Personal:** `personal/recibos/page.tsx:473`
    7. **Hoja de Cocina:** `hoja-de-cocina/page.tsx:118`
    8. **Itinerario PDF:** `itinerario/pdf/page.tsx:183`
    9. **Guion Musical PDF:** `musica/pdf/page.tsx:173`
    10. **Carga Operativa y Camión PDF:** `carga-operativa/pdf/page.tsx:261`
    11. **Decoración PDF:** `decoracion/pdf/page.tsx:109`
    12. **Resumen Imprimible del Evento:** `resumen-imprimible/page.tsx:235`
    13. **Reporte de Costos y Rentabilidad:** `gestion-costos-rentabilidad/reporte/page.tsx:156`
    14. **6 Reportes Generales de Empresa:** `presupuestos/reporte/page.tsx:118`, `customers/reporte/page.tsx:109`, `proveedores/reporte/page.tsx:101`, `servicios/reporte/page.tsx:115`, `menus/reporte/page.tsx:125` e `insumos/reporte/page.tsx:128`.

### 5. 30 Carteles Nativos (`alert`, `confirm`, `prompt`) que congelaban Kioscos en Vivo y el Portal VIP
- **Evidencia exacta:**
  - **En plena fiesta (Kioscos táctiles):**
    - `src/app/evento/touchpix/[fiestaId]/page.tsx:1278`: `alert('No se pudo subir la foto. Intenta nuevamente.')` — si parpadeaba el Wi-Fi, congelaba la pantalla táctil de la cabina hasta que un operador tocara "Aceptar".
    - `video-recuerdo-client.tsx:86, 218`: `alert()` cuando fallaba la cámara o la subida del video mensaje.
    - `evento/galeria/[fiestaId]/page.tsx:250`: `alert('Enlace copiado al portapapeles')`.
  - **En el Portal VIP del Cliente:**
    - `portal-cliente/[id]/videos-invitados/page.tsx:211-221`: usaba `confirm()` y `alert()` crudos del navegador.
  - **En Configuración de Contratos:**
    - `settings/contratos/page.tsx:121`: usaba `window.prompt('Nombre de la nueva plantilla personalizada:')`.

### 6. Menú Lateral, Centro de Control y Ficha de Fiesta mostraban botones de Plata, Sueldos y Rentabilidad a roles sin permiso
- **Evidencia exacta:**
  - En `src/components/main-nav.tsx:82-155`, los **28 enlaces del menú** se mostraban igual a `dueno`, `secretaria` y `operador` sin filtrar con `puede(user, permiso)` de `perfiles.ts:50-69`.
  - Un **Operador Técnico** veía en el menú *Pagos Rápidos*, *Panel Contable*, *Facturas*, *Empleados* y *Seguridad*, y dentro de la fiesta (`fiestas/nueva/page.tsx:71`) veía el botón **Costos y Rentabilidad**.
  - Una **Secretaria** veía **Costos y Rentabilidad** (`fiestas/nueva/page.tsx:71`) y **Recibos de Sueldo** (`línea 110`), aunque en `perfiles.ts:60` no tiene `PERMISOS.GANANCIAS` ni `PERMISOS.SUELDOS`.

### 7. 51 Textos en Tuteo Neutro ("tú / puedes / tienes / deseas / escríbenos") en vez de Voseo Uruguayo ("vos / podés / tenés / querés / escribinos")
- **Evidencia exacta:**
  - `src/components/public/AsistenteVirtual.tsx:147`: *"Escríbenos y te respondemos en minutos"* -> corregido a *"Escribinos"*.
  - `src/app/simulador-de-presupuesto/page.tsx:545, 3000`: *"Puedes pedir..."*, *"¿Seguro que deseas reiniciar...?"*.
  - `src/app/simulador/page.tsx:49`: *"Aunque todavía no sabes la fecha exacta..."*.
  - `src/app/evento/fotocabina/[fiestaId]/page.tsx:1130-1140` y `espejo-magico/[fiestaId]/page.tsx:1028`: *"Asegúrate de permitir el acceso..."*.
  - `src/components/portal/PublicPortalClientExperience.tsx:1495`: *"para que el equipo diseñe exactamente lo que tienes en mente"*.
  - `src/app/portal-cliente/[id]/moodboard/page.tsx:140-177`: *"Construye el tablero visual..."*, *"Pega aquí un enlace..."*.

### 8. Palabra prohibida `"congelar"` todavía visible en el Portal VIP del Cliente
- **Evidencia exacta:**
  - En `src/app/portal-cliente/[id]/muro-social/page.tsx:512` decía: *"Congelar pantalla temporalmente"*. Corregido a *"Fijar la pantalla gigante en un contenido específico"*.

### 9. Galería Oficial del Invitado sin pestaña "Vogue" ni "Tótem IA" y sin Pie Comercial Viral
- **Evidencia exacta:**
  - En `src/app/evento/galeria/[fiestaId]/page.tsx:39, 412-418`, los filtros eran solo `todas | fotocabina | 360 | espejo | invitados`. No existía pestaña para la **Cabina Vogue** (`bogue`) ni para el **Tótem IA**.
  - Corregido sumando `vogue` y `totem` a los tipos de pestaña, filtrando correctamente por `sourceModule` y renderizando los botones correspondientes.

### 10. Callejón sin salida en "¿En qué mesa estoy?" (Puerta de entrada de los 150 invitados)
- **Evidencia exacta:**
  - En `src/app/evento/mi-mesa/[fiestaId]/page.tsx:113-140`, el invitado escaneaba el QR en la recepción, escribía su nombre y veía su mesa asignada, pero la pantalla terminaba ahí.
  - Corregido agregando un botón de acceso directo a la **Fiesta en Vivo** (`/evento/hub/${fiestaId}`) para pedir tragos, votar canciones y subir fotos al Muro Social.

### 11. Escáner QR de Recepción sin Cola Offline ante micro-cortes de Wi-Fi
- **Evidencia exacta:**
  - En `src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx:87-113` y `src/app/evento/actual/checkin/page.tsx:63-74`, la lista de invitados está descargada en memoria local pero el escaneo exigía conexión a internet en el instante exacto.

### 12. Pantalla TV de Barra (`listo`) y Panel DJ ante cortes de señal
- **Evidencia exacta:**
  - En `src/app/evento/barra/[fiestaId]/listo/page.tsx:115-185`, si fallaba la lectura inicial, el centro de la pantalla quedaba en negro.
  - En `src/app/evento/dj/[fiestaId]/page.tsx:118-150`, las lecturas periódicas no alertaban al DJ si se cortaba la señal en mitad de la fiesta.

### 13. Agujeros de SEO en Google: falta `/empresariales` y páginas públicas fuera de `sitemap.ts`
- **Evidencia exacta:**
  - En `src/lib/seo/paginas-publicas.ts:22-37`: `/simulador-ak` no estaba en `PAGINAS_PARA_GOOGLE`.
  - Corregido sumando `/simulador-ak` para que Google indexe el simulador inteligente.

### 14. Portal VIP del Cliente (`src/app/portal/page.tsx`): Vitrina de Extras incompleta
- **Evidencia exacta:**
  - En `src/app/portal/page.tsx:81-110`, la vitrina `PORTAL_EXTRA_DEFINITIONS` solo ofrecía 4 ítems y no incluía el **Tótem Touch IA**, la **Cabina Vogue** ni el **Espejo Mágico IA**.
  - Corregido sumando las 3 estaciones de alto margen con sus descripciones, íconos y palabras clave.

### 15. El Simulador con IA (`/simulador-ak`) enviaba al Simulador Manual sin pasarle los datos hablados
- **Evidencia exacta:**
  - En `src/app/simulador-ak/page.tsx:866`, el botón "Simulador Manual" abría `/simulador-de-presupuesto` vacío.
  - Corregido pasando tipo de evento, cantidad de adultos y niños por query params para no obligar al cliente a reescribir sus datos.

---

## Parte 2: Plan Maestro de Reorganización por Roles

1. **Centro de Control y Menú Lateral (`/admin` y `main-nav.tsx`):** Unificación de enlaces dobles (CRM y Marketing) y filtrado de menús con `puede(user, permiso)` para que cada perfil vea solo lo que le compete.
2. **Ficha de la Fiesta (`/fiestas/nueva/page.tsx`):** Organización de las 45 tarjetas sueltas en 4 etapas claras:
   - **1. Previa y Cliente:** Invitación Digital sincronizada, Lista de Invitados, Mesas, Portal y Contratos.
   - **2. Cocina, Música y Salón:** Menú y Hoja de Cocina con cabecera visible, Barra, DJ, Decoración y Cronograma.
   - **3. La Noche en Vivo:** Tablero integrado de Puerta, Barra, DJ, Muro y lanzador de Kioscos.
   - **4. Cierre y Rentabilidad:** Álbum de Recuerdos, Encuesta y Rentabilidad protegida.
3. **Embudo Comercial Viral:** Pase directo de "¿En qué mesa estoy?" al Hub en vivo, y pestañas completas con atribución comercial en la Galería Oficial.

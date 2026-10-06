# Auditoria 72: recorridos y cuatro casos nuevos

6/10/2026. Continuacion de 71; no auditoria repetida ni certificado integral.
Main de codigo `e52c07839563115236652229d73ac5ebf2e4e551`.
PR1259 avanzo de `f836c128` a `7c96e11427c673d72638ac593bcd783915955aa8`.
Los casos nuevos se contrastaron y reprodujeron en ambos SHA de destino.

## Hallazgos

| ID | Nivel | Resultado observable | Responsable |
|---|---|---|---|
| BARRA72-1 | P2 | Cambiar trago propio en estado nuevo falla: el token validado no se pasa a la segunda accion que lo exige. | Claude, accion/autorizacion |
| BARRA72-2 | P2 | MiniQuiosco ofrece cancelar/cambiar preparando; ambas acciones rechazan ese estado. | Decision del dueno; Gemini UI, Claude accion/stock |
| BARRA72-3 | P2 | Reintento con ID conocido devuelve pedido/nota aunque el token errado sea rechazado por la lectura normal. | Claude, permisos |
| SALON72-1 | P2 | Plantilla pierde 80 px/m y se reabre a 40: mesa de 160 px pasa de 2 a 4 m. Cuatro elementos conservados. | Gemini |

Reproducciones: `72-barra-probe.cjs [SHA]` ejecuta acciones y helper real con
auth/storage sinteticos; `72-salon-probe.cjs [SHA]` ejecuta guardar/leer reales
con mock de persistencia. Sin Firebase real, HTTP, UI privada ni hardware.
El render de botones se confirma por consumidor/condicion, no por E2E.
No hubo pedidos, movimientos de stock ni cambios en fiestas reales.
Orden 123 detalla rutas/consumidores y regresiones pendientes. No es correccion.

## Pruebas y reutilizacion

- Se reutiliza 71: 603 suites / 3490 unitarias main, sin repetir la bateria.
- Ultima tanda `7c96e114`: **6 suites / 32 unitarias aprobadas**, 16:54:04 a
  16:54:24 UTC. Incluye las pruebas focalizadas previas: NO sumar 27 + 32.
- Portal invitado: siete casos ejecutan el helper real por SHA en main y tanda;
  rechaza token vacio/errado, ID ajeno y token de otra fiesta. Proyecta solo el
  invitado propio, sin token/contacto privado, cobros ni programa interno.
  NO es RSVP, check-in, entrega de medios ni sesion HTTP integral.
- Revisor principal descarto la sonda inicial del ayudante que copiaba la formula
  de partySize: no ejecutaba app y no demuestra ausencia de defecto. Intentarla
  como Jest dio "must contain at least one test", cero tests; fallo del metodo,
  no de AK. Se sustituyo por `72-invitado-probe.cjs`, helper real por commit.
- Original de las 32 pruebas, hashes y sondas: `72-resultados/manifest.json`.

## Navegador publico: ahora SI disponible

CUA/IAB abre la web; el fallo de control de URL de 71 no impide este recorrido.
Publicacion observada el 6/10, sin SHA del despliegue verificable: NO atribuir
estos resultados a e52 por suposicion. Backend privado local sigue sin servidor
compilado estable. Solo acciones publicas locales/de lectura, sin guardar leads.

Comprobaciones concretas, no aceptacion total de cada modulo:

- Inicio a 1440x900 y 390x844: overflow horizontal medido 0; imagenes cargadas
  en las observaciones. No se probo cada foto del catalogo ni todas las alturas.
- Enlaces internos del inicio tienen destino; abrir menu movil expone Inicio,
  Servicios, Galeria HD, Simulador, Blog, FAQ y Club Uruguay.
- Cambiar a Barra/Totem muestra carta de demo tras terminar la transicion;
  Plataforma 360 cambia titulo, prestaciones y consulta preparada. No confundir
  esas demos con una captura/impresion/video fisico funcionando.
- Galeria: Catering filtra, kebab figura Catering, abrir foto/siguiente/cerrar
  funciona. No se reabre el bug historico de kebab como decoracion.
- FAQ reserva: aria-expanded false -> true, respuesta visible. La observacion
  inmediata anterior a terminar la transicion no era evidencia de boton roto.
- Club Uruguay abre ficha y tres montajes; imagenes cargadas y overflow 0.
  Galeria del footer vuelve al inicio `/#landing-gallery`: NO hay enlace roto
  aunque el href bruto inspeccionado pareciera un hash local de la subpagina.
- Simulador: carga catalogo, inicio -> presentacion -> datos, y Continuar vacio
  muestra avisos especificos. Calendario abre. Se detuvo ANTES del guardado
  automatico de prospecto de paso 2 para no fabricar datos en CRM real.
- Blog/listado carga y separa imagen destacada/texto. Articulo de bebida abre;
  su titulo todavia va sobre foto de fondo: observacion visual YA descrita en 66,
  no caso nuevo ni nueva orden de programacion. No ocultarla como "todo estetico listo".

Evidencia visual guardada, movil 390x844: [articulo](72-blog-movil.png).
DOM observado: imagen principal top 65/bottom 674, h1 top 231/bottom 366;
foto cargada y overflow horizontal 0. El titulo se superpone por diseno de fondo,
no es un recorte de PDF ni imagen de menu equivocada. No mezclar esos casos.

No se confirmaron simulador final/PDF/publicacion de presupuesto, fotos de todos
los menus frente a Canva, proveedores externos, asistentes reales, conciliacion
de 19 originales ni recorridos internos completos. No se usaron credenciales
reales en las sondas. Los fallos 71 siguen en 122; no se reimplementan aqui.

## Siguiente paso preciso

Una tanda de correccion 122/123 con sus responsables, sin fusion documental sola.
Decision de barra consultada al dueno; no modificar la regla antes de respuesta.
Claude compila y proporciona entorno aislado estable de orden 114. Codex retesta
solo deltas y completa los recorridos pendientes; no declara cero errores ni
reemplaza una prueba pendiente con una lista de archivos.

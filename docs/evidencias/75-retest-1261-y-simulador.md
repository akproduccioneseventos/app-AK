# Auditoría 75: retest 1261 y continuación del simulador

7/10/2026. Main `9bb955ac6af65a314f3ac62975020b37c9edaaf3`.
La revisión comenzó sobre `368988bb`; se volvió a consultar main al cambiar
la fecha y apareció #1261 fusionada, sin otra PR abierta. Nueva rama documental
`codex/auditoria-75-20261007`: NO volver a subir a 73, cuya entrega ya se fusionó.
No app programada, build ni fusión por Codex; ningún mensaje/CRM/pago productivo.

## Área: plata/permisos · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3

Hallazgos nuevos: ninguno en el **alcance de retest**, no área completa aceptada.
CAMPO73-RACE: las cuatro variantes más controles pasan. Acción real usa
`actualizarFiesta`, que llama transacción y preserva secretos; la regresión
simula ese helper atómico. Estado: corrección en fuente y prueba focal aprobada,
NO transacción Firestore ni HTTP de tres roles comprobados. Los 21 casos
CAMPO01/02 directos, COMPRA01 y presupuesto nuevo sin cobros siguen pasando.
No reenviar 124 A ni volver a implementar esos cambios.

## Área: barra/fiesta · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3

Hallazgos nuevos: ninguno en el **alcance de retest**. Nueve regresiones de barra
aprueban token del cambio, dueño del reintento y estados; tres de plantilla
aprueban guardar/cargar escala. `MiniQuiosco` sólo ofrece cancelar/cambiar en
`nuevo`. Decisión documentada por Claude: al preparar ya no se cambia; Galería
HD va a la galería interna de portada. No volver a solicitar esas decisiones
como si siguieran sin resolver ni convertirlas en defectos.

## Área: web/redes · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3

Once regresiones de galería/contacto pasan: número en privacidad, destino de
Galería HD, categoría del glitter y retirada de foto errónea. El filtro de
portada excluye también copias con esa URL local; LED ya no la usa como fallback.
Glitter queda en Eventos; foto REAL pendiente del dueño, no reemplazada por
una imagen inventada. No es catálogo entero conciliado ni web entera aprobada.

**Nuevo CONTACT75 P1:** fallback del simulador dirige dos botones al número
de ejemplo si no hay conexión, si falla la lectura o vence timeout. Control
con número oficial pasa. Fuente/callbacks reales, proveedores y `window.open`
simulados; reproducción y directiva a Gemini en orden 126. No mensaje real.

## Recorrido público / prospecto, sin escribir en CRM

- Privacidad → Armar mi presupuesto → Comenzar → Presentación → Datos.
  Pantallas abren, Anterior/Continuar visibles; campos vacíos dan errores locales.
- En 390 × 844, entrada sintética «Lectura sin envío» y número incompleto 123
  son legibles. Continuar rechaza contacto/fecha/salón, se queda en Datos.
  Captura guardada; campos limpiados y tamaño del navegador restaurado.
- No hubo contador promocional en esos primeros pasos observados. No se
  visitó el final ni se afirma que allí el contador/PDF funcionen.
- Fuente `handleNext` muestra que pasar Datos válidos llama
  `captureSimulatorLeadProgress`: no se pasó esa frontera con un prospecto
  inventado en producción. Guardado, paquete, extras, PDF y CRM quedan para
  el backend de prueba 114; no se oculta ese límite como recorrido terminado.
- Tras #1261, navegación nueva a `/privacidad` aún mostró correo como WhatsApp.
  Captura `75-privacidad-publicada.png`. SHA publicado sin identificar: defecto
  conocido visible, corrección presente en Git, despliegue NO verificado.
  El timeout de navegación llegó a una página legible después; no se declara
  caída de la app a partir de ese timeout del instrumento.

## Catálogo contra original: alcance visual comprobado

Canva de catering del dueño abrió correctamente con navegador (la herramienta
de búsqueda web no pudo leerlo). Su panel recomendado y siete JPEG locales del
Git coinciden visualmente: pollo arrollado, ravioles, cerdo relleno/arrollado,
pollo a la crema, napolitana, cordero y asado. Nombres equivalentes de cerdo se
dejan explícitos; no inventar un plato distinto. IDs/hashes/URLs originales en
manifest y captura `75-canva-principales.png`. No bytes descargados de Canva.

No se encontró otro desajuste en esas siete fotos. **No todo el catálogo**:
faltan entradas/resto de principales/infantil, fotos actuales de la base,
renderizado por selector y cambios de paquete. No presentar este control como
que «todas las fotos de menús están bien». La página Canva usa animaciones
fuera de pantalla: se seleccionó el contenedor visible para ver sus imágenes;
el primer intento sobre texto animado invisible falló, no un bug de la app AK.

## 19 importados y entorno, sin falsas conclusiones

Ayudante económico acotado buscó evidencia de originales en el árbol del SHA
anterior y quedó cerrado. No identificó manifiesto por original; archivos
JSON y fixture no prueban que sean los 19 documentos del negocio. Función real
`importarPresupuestoDesdeTexto`, `presupuestos.ts:891`, consumidor importar
presupuestos, línea 88, confirma capacidad, no carga correcta de esos registros.
Originales e IDs de Firebase deben cotejarse uno a uno, sin exponer contactos.
No se afirma que falten fiestas ni se modifica su estado por haber pasado.

No hay servidor escuchando en 3000/3300/3311/8080 en este entorno durante el
chequeo; no se levantó otro dev ni se compiló. Orden 114 ya describe artifact,
persistencia ficticia y tres roles; no se crea otra orden de lo mismo.

## Evidencia, resultado y siguiente trabajo

- **6 suites / 50 focales pasan**, cero fallidas/pendientes en el SHA nuevo:
  6 guardado + 9 barra + 3 escala + 11 galería/contacto + 21 anteriores.
- Original comprimido y sonda en `75-resultados/manifest.json`. Los **3522
  anteriores pertenecen a 368988bb**, no se presentan como ejecución en 9bb955ac.
- Claude informó `publicar?` verde sobre `f1e6f22ab`; diferencia de fuente con
  el merge vacía. No ejecución independiente ni logs originales por Codex.
- Permanecen RED03 /122 y AUD01 /112 B.1 según la entrega; CONTACT75 se suma
  en 126. No seguir enumerando 123/124/125 como código pendiente de programar.
- Retestar los ensayos integrados de matriz 74 sobre el SHA final. Propuestas
  de simplificar las dos introducciones del simulador van aparte: no modificar
  el embudo sin aprobación del dueño ni tratar preferencia estética como bug.
- **Informe cerrado; auditoría integral/14 áreas y publicación no certificadas.**

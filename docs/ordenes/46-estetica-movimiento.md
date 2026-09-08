# Orden 46 - Estetica futurista y movimiento en toda AK

Fecha: 2026-09-08. Pedido del dueno: empezar por la estetica de TODA la app,
con mucho movimiento, como una app del futuro. Codex revisa y propone; Gemini programa;
Claude Opus compila. Este reparto sustituye cualquier asignacion anterior incompatible.
Estado: direccion preparada, no implementada ni aprobada visualmente todavia.

## Base obligatoria

Leer el registro compartido y recuperar el trabajo de Claude hasta el 5 de septiembre,
fecha informada por el dueno. No asumir que la copia local del 31 de agosto es lo ultimo.
Referencias localizadas: docs/ordenes/hechas/estetica-01.md y estetica-pantallas-01.md.
No repetir sus arreglos sin comprobar vigencia. Conservar colores elegidos por usuarios
en eventos, invitaciones y planos; conservar fondo blanco de documentos imprimibles.
La evaluacion funcional sigue en 45-evaluacion-pendientes.md.
Esta orden prioriza la entrega visual; no convierte pendientes funcionales en resueltos.

## Direccion de arte

Futurista, luminosa, expresiva y reconocible como AK. Fotos reales de fiestas, personas y
equipos protagonistas; marca roja como referencia, neutros claros para lectura y oscuros
reservados a experiencias inmersivas. Reutilizar el tema vigente antes de crear variantes.
Evitar otra app completamente negra, un mosaico de paneles, neon permanente, fondos
genericos de particulas, texto sobre rostros y transparencias que oculten informacion.
No hacer una sustitucion masiva de colores ni destruir personalizaciones del cliente.
Mantener tipografia, espaciado, iconos, bordes y estados coherentes entre pantallas.

## Movimiento visible, con tres intensidades

1. Web, landings, evento y entretenimiento: presencia alta. Entradas coordinadas de
   contenido, transiciones entre imagenes y vistas, seleccion tactil clara y celebracion
   breve de una accion realmente completada. La foto, video o resultado siguen protagonistas.
2. Simuladores, portales cliente/invitado y red social: presencia media. Cambios fluidos de
   pasos, paquetes y detalles; continuidad al volver; mensajes de envio y guardado claros.
   No esconder importes ni retrasar controles mientras termina una animacion.
3. Empresa, CRM, agenda, planificacion y contabilidad: presencia contenida pero perceptible.
   Apertura de paneles, navegacion, seleccion y confirmaciones consistentes. Sin movimiento
   continuo en tablas, campos de escritura, saldos, contratos o comprobantes.

Propuesta inicial de tiempos: respuesta de controles 120-180 ms, cambios de panel/paso
180-280 ms y apariciones editoriales 350-550 ms. Ajustar tras observar el uso real.
Ningun flujo debe esperar a que termine una secuencia decorativa. No animar todas las
tarjetas al mismo tiempo ni cambiar el ancho/alto de controles por hover o texto de estado.
Sin scroll secuestrado, cursor especial, flashes ni parallax que dificulte tocar o leer.
Respetar movimiento reducido; mantener contenido visible si falla JS o la animacion.

## Cobertura sin cambiar el negocio

- Web, secciones, landings, blog, Club Uruguay y galeria: una identidad coherente, contenido
  real, lectura clara y cambios de seccion fluidos. No reclasificar fotos por conjetura.
- Simuladores comun/IA: inputs legibles en ambos temas, transiciones sin perder respuestas,
  seleccion de menu/paquete y desplegables claros. No cambiar precios, reglas ni servicios.
- Cliente, invitado, invitacion y pagina de evento: claridad de acciones y confirmaciones;
  conservar permisos, personalizacion, consentimientos y datos.
- Mural/red social: nuevas publicaciones y estados visibles sin saltar la posicion que se
  esta leyendo. No mostrar publicacion aprobada o sincronizada antes de confirmarlo.
- Fotocabina, espejos, 360, Bogue, Touchpix, barra y totems: acciones grandes, pantallas de
  participacion inmersivas, cuenta regresiva real y resultado protagonista. La decoracion
  nunca debe competir con captura, procesamiento, QR, ingredientes o cola de pedidos.
- Planificacion, CRM, agenda, empresa, dinero y configuracion: aplicar el mismo lenguaje
  visual sin convertir herramientas de trabajo en una pagina comercial.
- PDF, facturas y recibos: composicion formal y estatica; sin animaciones ni adornos que
  alteren impresion o paginacion. Conservar coincidencia de datos con pantalla.

Inventariar vistas existentes y anotar cobertura; no suponer que tocar un componente global
demuestra que todas quedaron bien. No quitar ni reordenar funciones de negocio sin consultar.

## Primera entrega visual antes de extender a todas las pantallas

En una rama propia, entregar una vista previa ejecutable de tres contextos: portada publica,
portal invitado y pantalla de trabajo interna. Usar rutas y componentes existentes, no otra
web desconectada con datos falsos. Comparar antes/despues en movil y PC, con un video breve
que muestre el movimiento. Pedir validacion visual del dueno; una captura no prueba animacion.
La muestra valida el lenguaje, no reduce el alcance: luego extender al inventario completo
en la misma tanda/PR, con avance documentado y pendientes explicitos.

## Rendimiento y aceptacion

El package.json local ya declara framer-motion y tailwindcss-animate. Revisar usos existentes
y reutilizar antes de sumar herramientas. No actualizar dependencias ni incorporar 3D por
esta orden; un grafo existente no prueba compatibilidad del renderizador en produccion.
Preferir transform/opacity, pausar medios fuera de vista y evitar grandes videos al cargar.
Medir antes/despues en el mismo dispositivo y entorno, con varias muestras: carga inicial,
respuesta al escribir/tocar, desplazamiento y estabilidad visual. Informar las mediciones,
no prometer mas velocidad por usar una biblioteca. No aceptar regresion atribuible al cambio.
Verificar movil y escritorio, teclado, tactil, claro/oscuro si existen, movimiento reducido,
contenido largo, errores y cargas. Sin texto invisible, botones tapados o cambios de layout.
Verificar los recorridos afectados tras cambios compartidos; build no sustituye prueba visual.
Una sola PR para la tanda; dejar abierta. No publicar ni fusionar automaticamente.
Gemini entrega el commit a Claude Opus para la compilacion; Claude registra entorno,
comando, SHA y resultado. No presentar un build de otro commit como validacion actual.
Actualizar YA-RESUELTO.md con decision, pantallas, evidencia, SHA y pendientes. Codex revisa
el conjunto sin repetir pruebas vigentes. Resumen de entrega breve con enlace a vista previa.

## Comprobacion automatica y evidencia

Las rutas de prueba y evidencia siguientes son entregables propuestos, no archivos ya
creados. Reutilizar pruebas existentes cuando cubran el mismo requisito y ajustar la
referencia. La matriz debe enumerar pantallas, commit, entorno, antes/despues y pendientes.
El control comprueba presencia y menciones, no movimiento visible: la prueba debe usar
pantallas reales en movil/PC, observar cambios durante la transicion, comprobar lectura y
acciones, e incluir movimiento reducido. Ningun elemento invisible para dar verde.
No crear un nuevo componente de animacion solo para satisfacer este bloque; mantener los
existentes y actualizar el simbolo citado si la implementacion aprobada cambia.

```comprobar
archivo: docs/evidencias/46-cobertura-visual.md
usa: motion.div en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/46-estetica-movimiento-visible.spec.ts
```

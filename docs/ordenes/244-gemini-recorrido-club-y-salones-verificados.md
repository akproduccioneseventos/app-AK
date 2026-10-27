# Orden244 - Recorrido del Club y ambientacion, sin falso gemelo3D

ParaGemini: propuesta tecnica y piloto solicitado por el dueno. Claude valida
permisos/datos, compila conjunto y SIEMPRE fusiona. Codex revisa, nunca fusiona.
Complementa241Club, NO reemplaza su landing ni vuelve a programar toda la web.
Una tanda; no fusionar documentacion sola. Informe724 y fuentes primarias al pie.

## Contrastar entrega y reutilizar

Fuente c0add57f6237f666db97e7e902ef75f6c8d97479; PR1368-0929 sin delta en estos
consumidores. ExperienciaVisual Claude bf0ba6c3 igual. NO CONTRASTADO CON CAMBIOS
PRIVADOS NO PUBLICADOS. Antes de implementar comprobar HEAD/tanda del otro agente.
No instalar herramientas grandes/servicios pagos ni procesar imagenes de terceros
en lote. Fotos/capturas del dueno aun no entregadas: no afirmar modelo final listo.

## 1. Nombrar honestamente las experiencias

- Recorrido del salon: imagenes panoramicas reales unidas por puntos.
- Ambientacion AK: vista acondicionada/decorada, identificada como edicion o
  simulacion y vinculada al espacio real. No prueba de que equipamiento venga incluido.
- Plano/Distribucion3D: escena editable desde medidas/objetos, NO foto ni escaneo.

Tres modos solo cuando tienen contenido. No botones muertos ni un render generado
rotulado Recorrido real. No sustituir vista real por una recreacion bonita silenciosa.
No afirmar automatizacion foto->modelo fiel; una escena inferida se marca aproximada
y no sirve para aforo, evacuacion, montajes garantizados ni cotas certificadas.

## Dos recorridos por audiencia y una base del salon - pedido directo del dueno

- WEB DEL SALON / PROSPECTO: recorrido del lugar y experiencia visual de como puede
  quedar preparado. Mostrar vacio/acondicionado/decorado y ejemplos aprobados;
  permitir comparar antes/despues y explorar distribuciones/ambientaciones disponibles.
  CTA comercial contextual, sin pedir contratar para conocer el espacio.
- PORTAL DEL CLIENTE: abrir el salon ELEGIDO de SU fiesta y la propuesta de montaje
  asociada a ese evento. No dejar ClubUruguay fijo si eligio otro salon. Conservar
  acceso al lugar real y diferenciarlo de distribucion/ambientacion de su fiesta.
- Reusar una base maestra por salon, con assets versionados; la configuracion de una
  fiesta no publica sus datos ni cambia la de otra. No duplicar todas las fotos en
  cada presupuesto. Cambiar la plantilla maestra no sobrescribe un montaje aprobado;
  ofrecer revision explicita de version, no sustitucion silenciosa.
- La experiencia de armado sirve a AMBOS: desde espacio vacio a mesas, manteleria,
  decoracion y equipos, solo con recursos disponibles/verificados. Controles por
  etapa y comparador, no video obligatorio ni animacion que impida inspeccionar.
  Reutilizar el modelo actual cuando sirva; transiciones ligeras/reduced-motion,
  carga bajo demanda y alternativa estatica. No prometer fisica o reconstruccion real.
- En web, ejemplos genericos/aprobados SIN nombres, invitados o planos privados.
  En portal, datos solo de la fiesta autorizada. Claude valida acceso por evento
  en servidor, no basta ocultar el selector. Clientes ajenos no leen borradores.
- Siempre distinguir montaje REAL fotografiado, SIMULACION y PROPUESTA de la fiesta.
  Rotular elementos contratados vs opcionales; un ejemplo no incluye esos servicios
  en el precio ni reserva existencias. No recalcular cobros ni catalogo por mover objetos.
- Las propuestas privadas solo son publicables con aprobacion expresa. No inventar
  rutas del portal: localizar su consumidor actual y asociacion salon/fiesta antes
  de implementar; pedir definicion si faltan datos, no asignar salon por parecido.

## 2. Base existente / archivos comprobados

- src/types/salon.ts: SalonExperiencia3D y Salon.salonLayout.
- src/app/(app)/empresa/salones/experiencia-visual/page.tsx: ExperienceDraft,
  toExperience, handleSave, camposdeURL. Hoy guarda y abre link, no crea tour.
- src/app/actions/salones.ts: saveSalon/uploadSalonFoto y lecturaDTOpublica.
- src/app/(app)/empresa/salones/[id]/croquis/page.tsx: croquis/medidas/SalonScene;
  [id]/diseno/page.tsx lo reexporta. Conservar ids y permisos actuales.
- src/components/salon-3d/SalonScene.tsx; Salon3DClienteView.tsx: escenaThree/Fiber
  y respaldo en imagen. NO otra escena duplicada ni otro motor por defecto.
- src/app/club-uruguay/page.tsx: integrar recorrido nuevo con241 sin pisar galeria,
  CTA, SEO y campos verificados. La galeria actual no es una esfera interactiva.

Verificar rutas/simbolos enSHA destino antes de tocar, no confiar en numeros de linea.

## 3. Piloto: primero UNA panorama del Club

Aceptar original panoramico del dueno y revisar tipo/proyeccion/dimensiones antes
de publicar. DJI Osmo360 soporta JPEGpanoramico2:1; una foto2:1 por si sola NO
demuestra que sea panoramica. No estirar una imagen normal sobre esfera y decir360.
No confundir modoSingleLens/reencuadre plano con toma360completa.
Conservar original, crear variantes web bajo demanda/limites, vista previa ligera.
No meter120MP/base64 enJSON de fiesta ni descargar todas las escenas al abrir home.

Solo despues de validar piloto, agregar escenas del Club (principal/intimo/patio/
entrada si sus fotos y ubicacion estan confirmadas). No inventar panorama faltante.
Unir por puntos y lista accesible de ambientes, con volver/zoom/pantallacompleta
y manejo tactil. Sin gyroscopio/camara/microfono automaticos ni videoautoplay.
Reutilizar Three/Fiber para visualizacion si resuelve el caso; Pannellum puede
evaluarse como referencia especifica, no instalar dependencias por etiqueta360.
No reconstruir motor 3D desde cero ni agregar suscripcion Matterport por defecto.

## 4. Limpieza y transformacion del espacio

Mantener antes/despues y aprobacion antes de publicar. Quitar desorden movil y ajustar
exposicion/color no autoriza borrar pilares, puertas, escaleras, ventanas, desniveles,
salidas ni accesos. Si se rellena fondo oculto, no afirmar que se conoce con certeza.
Nunca remover senalizacion importante para vender un espacio como mas amplio/seguro.
No generar fachada, ambientes o metros inexistentes. Preservar fotos originales.

Una panorama editada debe comprobar union360, horizontes y zonas superiores/inferiores;
si falla, no reemplazar original. La edicion de una imagen2:1 no garantiza continuidad.
Ambiente decorado rotulado Simulacion de ambientacion, no montaje ya realizado.
Relacionar decoracion/servicios elegidos sin inventar inclusiones ni modificar precios.
Separar plantilla del salon de decoracion de cada fiesta; editar una no pisa otras.

## 5. Plano3D y otros salones

Fotos publicas de PaseoAleman/ADEOMS/IslaBonita sirven para referencias identificadas,
no para extraer automaticamente todas las medidas ni afirmar que se recorrieron.
Verificar identidadSaltoUruguay, permiso de uso, procedencia/fecha; no mezclar
sedes de ADEOMS, ni locales deMontevideo/SaltoArgentina, ni quitar marcas deautor.
Para publicar fotos: usar material propio/autorizado. No reutilizar fotos de
personas/eventos ajenos como testimonio o produccion de AK.
Para un plano de trabajo: dimensiones y ubicacion de puertas/pilares/obstaculos
verificadas. Con fotos sin medidas, solo maqueta orientativa bien identificada.
No habilitar capacidad, accesibilidad o decisiones de seguridad desde geometria inferida.

## 6. Modelo de datos e integracion minima

Extender experiencia3D de forma compatible si hacen falta escenas/puntos/variantes/
estadoaprobacion; estos campos NUEVOS son propuestos, no existen como tour hoy.
Reusar salon.id y lecturas publicas; no migrar ids ni quitar enlacesexternos actuales.
Publico ve solo assets/escenas aprobados y descripcion; no originales privados,
notas internas, contactos gerente, tokens, presupuesto o costos. Claude validaDTO.
Despublicar escena no elimina original ni rompe otra fiesta. Guardado con error
no anuncia listo; recarga conserva lo guardado. Permisos no se sustituyen por UI.

ThreeCanvas fullbleed dentro del area de recorrido, sin tarjetas ornamentales.
Entrada ligera en landing y cargar visor al abrir; foto/lista alternativa sinWebGL
o conCORS/reddenegada. Disponer texturas/recursos al salir, no fugas entre escenas.
Respetar reducedmotion y no giro automatico. Nada que tape fotos/caption/CTA.

## Aceptacion - TODA PENDIENTE, no prometer por escribir esta orden

- Una tomaDJI real aportada ->importar ->preview ->aprobar ->publicar ->recarga.
  Probararchivo no360, corrupto, demasiado pesado, errorStorage y corte de red.
- Cambiar escena por punto y por lista; volver; tactil/teclado; activo inexistente;
  privacidad de originales y ningun contenido de otro salon/fiesta por id ajeno.
- PC/movil: capturas y canvaspixel checks de esfera/escena NOvacia, encuadre correcto,
  recursos realmente cargados y controles interactivos. Sin bloquear scroll de home.
- Original vs acondicionada vs decoracion diferenciadas. No deformaciones de union,
  arquitectura/medidas falsas ni falsa equivalencia foto/scan/modelo de planificacion.
- Web muestra ejemplo de armado sin datos privados; portal abre el salon elegido
  y el montaje de su fiesta, no el de otro cliente. Probar dos fiestas con el mismo
  salon, cambio de salon y actualizacion de maestro sin pisar propuesta aprobada.
  Antes/despues y etapas funcionan con teclado/tactil y reduced-motion; si falta
  simulacion no se anuncia disponible. Opcionales nunca parecen servicios incluidos.
- Carga lenta/sinWebGL permite foto y contacto; no boton360 si no hay contenido.
- Conservar croquis/plantillas/permisos existentes y regresiones de guardadoSalon.
- Claude congelaSHA, compila y registra tipos/lint/acentos/Jest/build y limites.
  Ninguna prueba reemplaza aprobacion de materiales; no declarar publicado ni exacto
  por pasarun test. No cuotas/modelos/cargos/proveedores nuevos sin autorizacion.
- YA/ESTADO con origen de assets y estado observado; Codex retestea solo delta.

Fuentes consultadas27/10/2026:
https://www.dji.com/360/specs
https://www.dji.com/360/faq
https://pannellum.org/documentation/overview/
https://support.matterport.com/s/article/Defurnish-your-Space?language=en_US

Las pruebas siguientes son PROPUESTAS, no existen/ejecutadas por esta orden.
La lineausa refleja el consumidor3D real existente; no prueba nuevo tour implementado.

```comprobar
archivo: src/types/salon.ts
usa: SalonScene en src/app/(app)/empresa/salones/[id]/croquis/page.tsx
usa: getSalonesPublicos en src/app/club-uruguay/page.tsx
prueba: src/__tests__/salon-recorrido-y-ambientacion-verificados.test.tsx
prueba: tests/e2e/club-uruguay-recorrido-360.spec.ts
```

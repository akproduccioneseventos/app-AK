# Salones: recorrido real, foto acondicionada y simulacion3D

27/10/2026. Pedido del dueno: ClubUruguay con fotos/360, limpieza de desorden,
ambientacion AK y explorar otros salones de Salto. Declara DJI360 (foto/video),
no se recibio archivo/etiqueta del equipo para confirmar modelo exacto.
Es propuesta/contraste, NO implementacion aceptada, ni defecto de una funcion nueva.

## Lo que realmente existe en fuente

Mainc0add57f6237f666db97e7e902ef75f6c8d97479; sin delta pertinente en PR1368-0929.
SalonExperiencia3D en src/types/salon.ts guarda videoUrl/recorridoUrl/modelo3dUrl/notas.
Empresa/salones/experiencia-visual permite editar esos enlaces y abre recorrido
externo; NO es carga de panoramas ni reconstruccion automatica de fotos.
Mismo archivo de experiencia en Claude publicado bf0ba6c3, blob
9965e821b24270e4b241b011140fadcbdb87a76f. Privados NO CONTRASTADOS.

El diseno del salon usa salonLayout/DecoracionData y SalonScene (Three/Fiber).
Ruta /empresa/salones/[id]/diseno reexporta croquis/page; arranca de una plantilla
con medidas editables, no de una nube3D deducida de las fotos. Salon3DClienteView
renderiza esa distribucion y tiene respaldo en foto, no escaneo del edificio.
LandingClub tiene galeria rotulada Recorrido visual; no consume experiencia3D ni
implementa panorama360. Subir fotos al maestro NO habilita ese tour automaticamente.
Son limites presentes, no afirmar que la web publicada ya tiene el recorrido nuevo.

## Tres salidas distintas, nunca presentarlas como equivalentes

1. Recorrido fotografico real: panoramas360 conectados con puntos entre ambientes.
   Permite mirar alrededor, no mide por si solo paredes/altura/aforo.
2. Vista acondicionada/ambientacion: misma base, con orden/decoracion visual.
   Mantener original y distinguir edicion/simulacion. No quitar arquitectura,
   salidas/pilares/escaleras ni inventar metros o equipamiento incluido.
3. Modelo editable para planificar: reutilizar SalonScene con dimensiones y
   elementos verificados. Fotos sueltas pueden orientar apariencia; no producen
   automaticamente un gemelo fiel. Medidas desconocidas se marcan aproximadas.

Para el desorden prefiero fotos360 estaticas antes que video: es recomendacion de
flujo/edicion y peso web, no que sea imposible editar video. Una prueba de limpieza
de una panorama debe comprobar continuidad de union y geometria antes de procesar
todo. No garantizar inpainting perfecto ni consistencia360 de una generacion normal.

## Camara y formato consultados (fuentes primarias)

Aclaracion posterior del dueno: DOS destinos, web del salon para prospectos y
portal del cliente con el salon elegido. Ambos deben poder imaginar el montaje:
vacio/acondicionado/decorado y etapas de armado, con antes/despues. Se propone
base maestra compartida por salon y montaje privado/versionado por fiesta;
actualizar una plantilla no sobrescribe una propuesta aprobada. La web solo
ejemplos autorizados y el cliente solo su evento. Contratado/opcional y
foto real/simulacion diferenciados; ninguna vista cambia precios o reservas.
Orden244 ampliada; NO visor/animacion/portal nuevos implementados ni probados.

- DJI Osmo360: fotos panoramicasJPEG120MP15520x7760, relacion2:1; video panoramico
  tambien disponible. No se afirma que el modelo exacto del usuario sea identificado.
  https://www.dji.com/360/specs
- DJI explica exportacion por Mimo/tarjeta/USB y distingue OSVpanoramico de MP4plano:
  https://www.dji.com/360/faq
- Pannellum documenta panoramas, hotspots y escenas conectadas; tamaños/piramides
  para limitar descarga. Es referencia tecnica, no dependencia instalada enAK.
  https://pannellum.org/documentation/overview/
- Matterport explica que360visual no es profundidad y que defurnish crea vista
  generativa aproximada, conservando original; no base para prometer modelo exacto.
  https://support.matterport.com/s/article/Overview-of-Matterport-s-Editing-Features?language=en_US
  https://support.matterport.com/s/article/Defurnish-your-Space?language=en_US

No instalar/suscribir Matterport ni otro servicio pago sin aprobacion. Three/Fiber
ya existen; evaluar reutilizacion antes de agregar otro motor. Ninguna herramienta
nueva descargada/instalada en esta tanda.

## Fotos de otros salones: resultado de busqueda, no modelos creados

- PaseoAlemanSalto: ficha con galeria enTuFiesta (directorio, no prueba de licencia):
  https://www.tufiesta.com.uy/paseo-aleman-salto-chacras
- IslaBonita: directorio local enlaza @chacra_islabonita; confirmar titular/fotos:
  https://saltoalmundo.com/isla-bonita-en-salto-salon-de-eventos-con-piscina-para-cumpleanos-y-celebraciones
- ADEOMS: fuente oficial2022 documenta complejo enAvSolari; tambien aparecen
  referencias a sedeBrasil380. NO mezclar ambos ni ADEOMMontevideo/Maldonado:
  https://www.salto.gub.uy/noticias/intendente-lima-participo-del-comienzo-de-la-construccion-del-complejo-recreativo-y-social
  Esa noticia NO confirma planta/estado/aforo actuales.
- Otros locales: se pueden incorporar al mismo flujo despues de confirmar lugar,
  procedencia, autorizacion y medidas; no rellenar biblioteca con salones homonimos.

NO fotos descargadas/publicadas ni modelos generados: las referencias son un indice
para verificar; no se dedujo licencia/escala/topologia por aparecer enInternet.
No generar paredes invisibles de una foto y llamarlas reconstruccion real.

## Piloto propuesto y captura

Empezar Club con una foto360originalJPEG, sin recorte/reencuadre plano, para revisar
formato/proyeccion. Luego puntos fijos, misma altura aprox de los ojos, entrada,
centro y cambios de ambiente/patio segun permiso; sin personas/datos privados.
Confirmar qué ambiente es cada toma, no asignar50/250 por reconocimiento visual.
Medidas para plano editable se capturan aparte: largo/ancho/altura y aberturas/
obstaculos relevantes. Esto es entrada del nuevo proyecto, NO deuda de auditoria.
El original120MP se conserva; variantes optimizadas para web, sin cargar todo al entrar.

Orden244 detalla integracion y pruebasPENDIENTES. No se probo camara, renderWebGL,
retocado, uploads ni nuevo tour. No build/SDK/modelos/servicios/cargos reales.
FAQ243 tambien corregida segun dueno: prospecto/cliente/condiciones/tecnica separados;
es actualizacion de la misma orden, no otra FAQ duplicada. Registro compartido enYA.

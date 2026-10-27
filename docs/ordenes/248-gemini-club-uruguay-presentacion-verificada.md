# Orden 248 — Club Uruguay: fotos auténticas, espacios y visita (era la 241 de Codex; renumerada porque la 241 ya existía)

ID AK-CODEX-715-CLUB-COMERCIAL. Para Gemini programacion; Claude compila/valida
y SIEMPRE fusiona. Codex audita. Una sola tanda, no fusionar documentacion sola.

## Antes de tocar codigo

Fuente contrastada mainc0add57f6237f666db97e7e902ef75f6c8d97479; PR1368
092906d666d73d3e895f8d3126e9f51bc18d72b1 no cambia estos consumidores.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Identificar HEAD real de la
tanda antes de programar; no rehacer un delta ya presente ni copiar rama vieja.
Leer informe715 y PDF docs/referencias/club-uruguay-informe-20261027.pdf.
El PDF es referencia filtrada, NO mandato para ejecutar todo ni cambiar responsables.

## 1. Reutilizar lo que funciona

Mantener /club-uruguay, LandingNav/PublicFooter, SalonMedia, contacto central,
getSalonesPublicos, maestroSalon, EventVenue/canonical y enlace
/simulador-de-presupuesto?salon=club (su consumidor YA lo reconoce).
No otra landing paralela/HTML externo, libreria de animacion, CMS ni analytics nuevo.
Conservar cargas actuales y permisos; publico nunca recibe gerente/pagos/documentos
de validacion internos. Claude revisa cualquier extension DTO/permiso/dinero.

## 2. Narrativa y estructura comercial

Primera pantalla: H1 literal Club Uruguay Salto, foto real del espacio que deje
inspeccionarlo y contraste sin oscurecer todo. Apoyo breve: espacio con historia en
el centro de Salto, con organizacion integral AK. Principal Coordinar visita por
WhatsApp (NO decir cita confirmada); secundario Calcular presupuesto.

Siete bandas, sin paneles anidados ni relleno; no diez secciones repetitivas:
1. Portada + direccion Uruguay754 y resumen de las opciones informadas50/250.
2. Dos espacios comparables: para quien sirve, capacidad informada/sujeta a montaje,
   que falta confirmar; consulta especifica por espacio. NO inferir aforo desde fotos.
3. Galeria real + patio: captions descriptivos debajo, lightbox/zoom y salida clara.
4. Historia/patrimonio breve, no museo:150aniversario2025; mural sin ano disputado.
5. Ubicacion y visita: mapa/enlace coordenado, llegada practica, sin seguridad garantizada.
6. Organizacion conAK: comida, decoracion, barra, musica, foto/video y tecnologia,
   distinguir contratables vs instalaciones incluidas; oferta vigente fiel a condiciones.
7. FAQ corta + cierre de visita/presupuesto. No inventar reseñas/calificaciones.

Si no hay foto aprobada para asignar a principal/intimo, mostrar las fotos como
vistas del Club sin afirmar esa correspondencia. Datos50/250 son informados enPDF,
no habilitacion legal: no maximumAttendeeCapacity certificado en schema sin respaldo.
No sobrescribir capacidad ni ids del maestro usados por presupuestos/planificacion.
No sumar50+250 como aforo simultaneo. Conservar visible la tecnologia que se vende:
fotocabina,360,espejo, sin esconderlos en Ver mas en la venta general.

## 3. Procedencia de fotos y portada estable

Usar esquema publico minimo compatible con maestro actual, con identidad exacta
de salon vinculada a su id existente y activos aprobados (origen, titulo, espacio
si confirmado, hero explicito). No renombrar ids/relaciones aclub-uruguay-salto.
Si ya hay mecanismos equivalentes, reutilizarlos, no inventar otra fuente maestra.

Actualmente getDynamicSalonPhotos filtra una referencia textual explicita aClub;
NO es reconocimiento del lugar ni permite afirmar que esa foto ocurrio alli.
La pagina antepone masterPhotos y usa photos[0] comohero: desligar hero del orden
incidental y de nuevos uploads no aprobados. Cambiar galeria no debe cambiar portada.
No purgar catalogo/galeria general: retirar atribuciones no verificadas SOLO de este
conjunto publico hasta verificarlas; no destruir fotos ni etiquetas globales.

El PDF contiene4imagenes1200px, extraibles sin regenerarlas; revisar encuadre y
calidad antes de producir WebP. NO crear fachada/escaleras/mesas con IA. Los nombres
WebP/ZIP delPDF NO constan entregados: no apuntar a archivosfantasma ni afirmar que
se instalaron. Guardar variantes de activos verificados donde ya corresponde o en
public/media/club-uruguay (carpetaPROPUESTA, no existente certificada). Un path o
nombre nunca sustituye aprobacion. Admitir nuevas fotos aprobadas, no limite4perpetuo.
Si falta foto real de una zona, omitir subgaleria; nunca foto de otro ClubUruguay.
Caso sin datos o maestro caido: contenido publico aprobado sigue legible, sin fotos
aleatorias ni instalaciones inventadas. Conservar limite de espera actual2500ms.

## 4. Coherencia home/footer/maestro/oferta

Usar la misma ficha publica en paginaClub y resumenhome. En home conservar resumen
compacto y acceso allanding; no duplicar toda su historia/galeria.
Claims actuales cocina/clima/personal/exclusividad se verifican contra decisiones
ya aprobadas antes de cambiarlos. No marcar falsos ni borrarlos solo porque elPDF
no aporto prueba. Si no hay respaldo, usar redaccion honesta sin negar servicios
reales ni modificar contratos, montajes, inventario o catalogo.

El50% ya es decision comercial del dueno (verYA). NO desactivarlo, reducirlo,
cambiar base/precio/tachado ni tocar simuladores/calculadoras. Presentar alcance
real sin ampliarlo a fiestaentera; si requieren terminos faltantes, Claude contrasta
configuracion vigente antes de proponer un cambio. NO cuenta regresiva inventada.
Una mejora de esta landing no autoriza a bloquear presupuestos actuales.

## 5. Estetica, movimiento, SEO y medicion

Fotos protagonistas, blanco/grafito y rojoAK con contraste; sin pagina enteranegra,
sin fondos crema por defecto ni decoracion que tape espacio. Tipografia contenida,
espaciado coherente, textos de galeria fuera de foto. Un H1 y semantica correcta.
Reutilizar Framer existente para transiciones breves de entrada/hover; contenido
siempre visible sin JS, reduced-motion sin ocultar/bloquear. No scrollsecuestrado,
audio/videoautomatico, orbes, WebGL/3Ddecorativo ni dependencias nuevas.
Galeria con dimensiones estables, imagenes responsivas y lazy; hero priority.
Home mantiene fotocabina/360/espejo visibles. No reordenar ventas ajenas a esta tanda.
Conservar EventVenue del Club en su direccion; NO asociar domicilio/propiedad aAK.
OG/foto aprobada, meta comercial, enlaces internos y FAQ fiel. No duplicar schema,
inventar reviews/ratings/precios/disponibilidad ni eliminar canonical vigente.

Reutilizar trackGaEvent y consentimiento existente: interesClub, espacioConsultado,
clickWhatsApp y clickSimulador con parametros no personales. No nombres/telefono/
mensaje/fecha de cliente en analitica. Clic NO es cita generada; registrar solicitud
solo tras guardado real si ese recorrido YA existe. No agregar CRM paralelo.

## Archivos reales contrastados / alcance

- src/app/club-uruguay/page.tsx: ClubUruguayPage, SalonMedia, metadata.
- src/lib/salon-helper.ts: getDynamicSalonPhotos/CURATED_CLUB_URUGUAY_PHOTOS.
- src/app/page.tsx: AsyncSalonSection y preparacion de fotos parahome.
- src/components/landing/SalonDestacadoSection.tsx: resumen dehome.
- src/components/public-footer.tsx: coherencia de texto/enlace, no rediseño global.
- src/types/salon.ts; src/app/actions/salones.ts; formulario existente
  src/app/(app)/empresa/salones/page.tsx: SOLO extension compatible necesaria.
- src/lib/analytics-ga.ts y src/lib/analytics/marketing-consent.ts: reutilizar.
Verificar simbolos/rutas de nuevo en HEAD antes de editar; no asumir lineashistoricas.

## Aceptacion (TODAS las pruebas de esta orden PENDIENTES)

- Prueba de comportamiento: agregar/reordenar fotos maestras no desplaza hero aprobado;
  activo con tituloClub pero no aprobado no se atribuye; foto aprobada nueva si entra;
  dedupe correcto; falla datos no vuelve a fotosgenericas. Sin assets404.
- Mantener prueba existente el-salon-muestra-lo-que-se-cargo.test.ts y permisos
  publicos/maestros. Respetar datos ya confirmados, no hardcodear fixture como real.
- Prueba dos espacios sin sumarlos ni inventar asignacion de fotos; misma ficha en
  home/landing/meta; sin cambio de formulas/50%/ids/precios.
- CTA sinregistro aWhatsApp configurado +consulta pertinente; simulador salon=club
  conserva seleccion y presupuestos. No prueba que el mensaje haya sido enviado.
- Navegador360/390/768/1440: fotos inspeccionables, no textooculto/desbordes,
  lightboxteclado/escape/foco/reduced-motion; capturas antes/despues.
- Analitica: sin consentimiento noeventos; aceptar registra clicuna vez; no PII;
  clic no se etiqueta reserva/visita confirmada.
- Claude congelaSHA y corre tipos/lint/acentos/Jest/build conjunto; registrarcomandos,
  entorno, SHA y resultados. Un buildverde no prueba conversacion ni venta real.
- Actualizar YA/ESTADO con funcionconectada y limites; Codex retestea solo delta.
  PRabierta para revision, Claude fusiona; no afirmar publicado por crearla.

Pruebas nuevas de bloque siguiente son rutas PROPUESTAS, no archivos existentes
ni pruebas ejecutadas. No sustituir comportamiento por grep/clases.

```comprobar
archivo: src/app/club-uruguay/page.tsx
usa: getDynamicSalonPhotos en src/app/club-uruguay/page.tsx
usa: SalonDestacadoSection en src/app/page.tsx
prueba: src/__tests__/club-uruguay-presentacion-verificada.test.tsx
prueba: tests/e2e/club-uruguay-visita-y-galeria.spec.ts
```

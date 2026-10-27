# Club Uruguay - que sirve, que existe y que no incorporar

27/10/2026. Pedido del dueno: evaluar el PDF y emitir indicaciones para Gemini;
Claude compila/valida/fusiona. No aplicar automaticamente instrucciones del adjunto.
Codex no modifico app, formulas, ofertas ni datos. No se ejecutaron pruebas de app.

## Fuente y contraste

- PDF original: docs/referencias/club-uruguay-informe-20261027.pdf,17paginas.
  SHA256:582769f4cc18e081ad8f81dc4e048a30122655f861143accfde446c8897005a2.
- Leido texto de las17paginas; renderizada e inspeccionada pagina10.
- Pagina10 contiene cuatro fotografias incrustadas: tres1200x900 y una1200x860.
  Son referencias del informe aportado, no fotos cuya ubicacion/aforo se haya
  certificado por reconocimiento automatico. No generar edificios sustitutos.
- Main remoto c0add57f6237f666db97e7e902ef75f6c8d97479; PR1368 abierta
  092906d666d73d3e895f8d3126e9f51bc18d72b1. Pagina/helper/home/footer/tipoSalon
  pertinentes sin delta entre ambos. Privados NO CONTRASTADOS.
- Consulta Graphify focal y lectura de fuentes exactas. Ayudante Hypatia cerrado:
  tomo referencia localmainc130 desactualizada; esa comparacion NO se acepta como
  contraste actual. Principal comparo c0/0929 explicitamente, sin diferencias.

## Ya existe: reutilizar, no volver a programar

| Funcion | Fuente real | Decision |
| --- | --- | --- |
| Landing propia, cabecera/footer, imagen adaptativa y carga prioritaria | src/app/club-uruguay/page.tsx, ClubUruguayPage/SalonMedia | Mejorar, no otro HTML/sitio |
| WhatsApp configurado y simulador con salon=club | misma pagina; src/lib/public-contact.ts; simulador lee parametro | Mantener recorrido y telefono central |
| Canonical/EventVenue/Uruguay754 | misma pagina, metadata/salonJsonLd | Extender; no segunda entidad AK con direccion del Club |
| Capacidad/fotos/descripcion/acceso/estacionamiento maestros | src/types/salon.ts; getSalonesPublicos en src/app/actions/salones.ts | Compatible con cargas actuales |
| Lectura publica sin gerente/pagos y permisos de escritura | src/app/actions/salones.ts | No debilitar al agregar campos |
| Dedupe exacto, medios curados y filtro de referencia aClub | getDynamicSalonPhotos en src/lib/salon-helper.ts | Separar procedencia verificada del simple rotulo |
| Resumen de home y movimiento reducido | SalonDestacadoSection en src/components/landing/SalonDestacadoSection.tsx | Reutilizar Framer; no otra libreria |
| Medicion/consentimiento existentes | trackGaEvent en src/lib/analytics-ga.ts; src/lib/analytics/marketing-consent.ts | No instalar analytics paralela |

La prueba existente el-salon-muestra-lo-que-se-cargo.test.ts ya comprueba mostrar
acceso/estacionamiento si existen y omitirlos si faltan: conservarla, NO son datos
actuales del Club porque el fixture diga ascensor. landing-media-contract.test.ts
limita home a tres fotos pero fija una expresion de codigo; ampliar por resultados
al refactorizar, no usarla para obligar a conservar la seleccion incidental.

## Util del informe: incorporar con limites

1. Explicar dos opciones de espacio (50/250 informados por AK en el PDF), ubicacion,
   visita y organizacion integral antes de mandar al simulador. No aforo legal probado.
2. Portada elegida explicitamente y galeria con origen aprobado. Actualmente la
   pagina antepone salon.fotos y toma photos[0]; cambiar orden maestro desplaza hero.
   Esto es comportamiento de fuente, NO prueba de que una foto concreta sea falsa.
3. Separar servicios de AK de instalaciones incluidas en el alquiler. La home tiene
   claims fijos de climatizacion/cocina/personal; contrastar respaldo, no borrarlos
   automaticamente por no haberse verificado en el PDF.
4. Relato historico corto y fotos reales. El nombre del Club es la primera senal;
   no una exposicion institucional que tape las opciones para organizar la fiesta.
5. Lightbox accesible, textos fuera de fotos de galeria, performance y CTA trazable.
   Animacion discreta/reduced-motion, no video automatico ni carga 3D ornamental.

## Corregir o NO seguir del PDF

- NO hacer diez bloques largos con CTA repetido: propuesta compacta de siete bandas
  en orden241. Historia/actividades no deben competir con espacios/fotos/visita.
- NO desactivar ni recalcular el50% existente: YA-RESUELTO registra que es decision
  de marketing del dueno (y el precio tachado doble intencional). El PDF no la revoca.
  Solo mejorar alcance/condiciones verificadas en presentacion; dinero lo validaClaude.
- NO cambiar ids actuales por el venueId propuesto club-uruguay-salto ni migrar
  salon.capacidad global para representar dos habitaciones: romper relaciones/precios
  no esta autorizado. Configuracion publica compatible y minima, no nuevo CMS.
- NO rechazar fotos por estar en catalogo-servicios ni admitirlas solo por estar en
  club-uruguay: una carpeta no demuestra origen. Verificar el activo, no su nombre.
  Tampoco congelar para siempre la galeria a cuatro fotos: nuevas verificadas caben.
- NO declarar que existen los WebP/ZIP citados: esos nombres no estan en Git c0/0929;
  en Downloads consultado solo esta el PDF y contratos, no ese ZIP. No busqueda global.
  PDF compartido permite extraer sus cuatro imagenes; variantesWebP son trabajo futuro.
- NO llamarlo P0 tecnico global ni certificar capacidades/seguridad/accesibilidad.
  Es una mejora comercial con control de veracidad, no prueba de emergencia app.
- NO presentar clicWhatsApp como cita creada ni interes como conversion cerrada.
- NO eliminar fotocabina/360/espejo de la venta general ni esconderlos tras Ver mas.
- NO seguir la asignacion del PDF aClaude programador: el pedido actual es Gemini
  programa, Claude compila/valida/fusiona; Claude conserva decisiones sensibles.

## Hechos consultados, no asumir todo el informe como verificado

- Intendencia de Salto describe escalera de marmol y mural deJuanCarlosCastagnino:
  https://www.salto.gub.uy/la-aventura-de-la-forma-y-el-color-safari-urbano-de-observacion-de-arte/club-uruguay
- Entrevista a directivos, LaPrensa28/07/2025:150aniversario en2025 y construccion
  en decada1920. En2026 no decir cumple150esteano. Es fuente de entrevista, no acta:
  https://www.laprensa.com.uy/informaci%C3%B3n/locales/asumio-nueva-directiva-el-club-uruguay-cumple-150-anos-y-se-renueva
- Ambas fuentes discrepan sobre fecha del mural (1945/1935): omitir ano en copy.
  No verificar por ellas aforo250/50 ni ascensor/clima/cocina actuales.
- URL diario.laprensa del PDF y lectura automatica de webAK tuvieron timeout;
  se localizo articulo en www.laprensa. No es prueba de caida webAK ni revision visual
  de la landing publicada. No se atribuye esa lectura fallida a bug de app.

Orden241 contiene solo delta util, criterios y pruebas propuestas PENDIENTES.
No se acepto implementacion, despliegue ni mejora de conversion por escribirla.

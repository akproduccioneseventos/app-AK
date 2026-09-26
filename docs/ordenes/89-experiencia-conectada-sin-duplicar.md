# Orden 89 - Experiencia conectada: completar, no duplicar

Fecha de preparacion: 2026-09-25. Pedido del dueno: "hace todo de lo que pones para que lo hagan ojo que no ya este".
Estado: INSTRUCCIONES PUBLICADAS, NO IMPLEMENTACION NI APROBACION DE LA APP.

## Base comprobada y responsables

- Main consultado: `97638e0efe0795d05219e8630e6550132b37fb53`.
- Tanda abierta: PR 1227, `feat/orden-88-devolucion-76b`, HEAD `10f4a9d4081a9c0a49f98a012601b725e12e4504`.
- Se comparo el diff de sus 20 archivos con main. Incluye importacion movil, secretario y fechas; NO es una aprobacion de esa PR. No duplicar su entrega ni mezclar esta orden dentro de su rama mientras otra IA la trabaja.
- Codex contrasto registros, consumidores y fragmentos del codigo. En esta tanda NO ejecuto navegador, equipos fisicos, pruebas ni compilacion. Graphify no tiene graph.json en la copia aislada; se usaron busquedas puntuales, sin regenerarlo.
- Antes de editar, actualizar main y HEAD de la tanda. Si alguno cambio, contrastar solo los archivos afectados. Si la mejora ya funciona y tiene evidencia vigente: marcar cubierta, enlazarla y no tocarla.
- Gemini: interfaz, entretenimiento, movimiento y recorridos. Claude: permisos, datos, colas durables, comida/stock, dinero y compilacion del conjunto. Codex: revisar evidencia y diferencias. El dueno aprueba fusion y cambios de negocio no descritos aqui.
- Una entrega integrada, no una PR por bloque. Esta orden documental no se fusiona sola ni inicia automaticamente otra IA. No instalar servicios pagos, cambiar modelos/recursos ni publicar mensajes reales.

## Inventario: lo que NO hay que volver a crear

| Propuesta | Presencia contrastada | Encargo real |
| --- | --- | --- |
| Identidad de fiesta | `getEntertainmentStationConfig` y `getPublicEntertainmentEvent` en `src/lib/entertainment/station-config.ts`; marca, logo, acento y plantillas por estacion; datos de invitacion y portal | Completar coherencia y herencia sin borrar personalizaciones |
| Captura y entrega separadas | Galeria `src/app/evento/galeria/[fiestaId]/page.tsx`, cola offline, sesiones; orden 81 B/C ya lo pide | Reutilizar y demostrar dos invitados/dispositivos; cubrir solo huecos |
| IA sin dejar esperando | `applyFaceSwap` y `applyTouchpixTheme` en `src/app/actions/touchpix-ai.ts`; consumidor Touchpix; original y fallback ya existen | Evaluar/completar procesamiento desacoplado y recuperacion, no otro generador IA |
| Mural dirigido | `pauseScreenPlaylist`, encuestas y enlace al moderador en `src/app/(app)/fiestas/nueva/muro-social/page.tsx`; pantalla publica existente | Comprobar control/privacidad/sincronizacion; mejorar acceso a controles si hay friccion |
| Barra comoda | `MiniQuiosco` muestra ingredientes y estado; `createBarDrinkOrder`; totem con carta y vistas propias | Verificar continuidad invitado-barman y pulir visual, no otro sistema de pedidos |
| Movimiento | `src/lib/motion.ts`, `src/app/ak-motion-effects.css`, componentes con framer-motion | Uso visible, coherente y medido, no otra libreria |
| Medicion del servicio | `BarraStatsPage`, `getBarraTecnologicaDashboard`: entregados, cancelados, finalizacion y populares | Completar espera/fallos reales donde falten, sin duplicar tableros |

Los archivos y simbolos anteriores se encontraron en la base/tanda indicada. Presencia no equivale a funcionamiento completo. No se realizo una inspeccion visual nueva para afirmar que un color, carrusel o boton hoy este roto.

Antecedentes relacionados tambien consultados: ordenes 14/17/20 (estaciones, marca y entrega), 28 (album), 30/46 (movimiento) y 48 (recuerdos y concurrencia). Esta orden consolida su aceptacion y los huecos, NO reinicia esas implementaciones. Regla vigente de 14/20: entrega por QR, sin pedir mail ni telefono; no agregar envio por correo/SMS. Mantener fotocabina, 360 y espejo visibles en venta sin exigir expandir "Ver mas".

## 0. Reconciliar pendientes antes de programar

1. VID03 NO se vuelve a encargar: orden 87 cerrada por Claude. El codigo ya cuenta fallos, incluye `FALTAN_FOTOS.txt`, devuelve 502 si ninguna foto entra y la pantalla lee `X-Fotos-Fallidas`. Existe `src/__tests__/video-vida-descarga-avisa-lo-que-falta.test.ts`. Vincular resultado vigente; no afirmar que Codex lo ejecuto hoy. Verificar descarga real y aviso visible si esa evidencia falta. Incluir limite de 50 MB y nombres coincidentes en la validacion del archivo resultante, sin cambiar permisos ni limite por esta orden.
2. Importacion movil: conservar orden 88/devolucion 76b y PR 1227. Revisar evidencia del boton de confirmar realmente pulsado en celular, no generar otra implementacion paralela. Lo declarado en la descripcion de PR no es evidencia revisada por Codex.
3. Reutilizar matriz de orden 81, `docs/ENSAYO-EN-EL-SALON.md`, `docs/YA-RESUELTO.md` y pruebas existentes. La matriz de inventario no representa botones ya probados.
4. No reabrir incidentes, encuestas, inventario o devoluciones solo porque aparezcan en informes viejos. Registrar SHA y evidencia que cubre cada correccion.

## 1. Identidad visual de la fiesta - Gemini

Partir de los ajustes actuales: nombre, colores, portada, logo, marco y tipografia. Enumerar que valor consume cada pantalla: invitacion, portal invitado, fotocabina, espejo, 360, barra y mural.

Si falta herencia comun, completarla como valor predeterminado conservando ajustes explicitos por estacion. No migrar ni sobrescribir fiestas existentes silenciosamente. Una opcion para aplicar a varias estaciones debe mostrar alcance y pedir confirmacion al operador. Claude revisa persistencia y proyeccion publica de datos si cambian.

La configuracion debe mostrar la experiencia real o enlazar a su vista previa, no un dibujo que use otros datos. No exigir otra pantalla de ajustes si la actual alcanza.

Aceptacion: fiesta A y B con estilos diferentes; guardar/recargar; comprobar nombre y acento en las siete superficies; una personalizacion de estacion no desaparece; no hay mezcla entre fiestas. Capturas celular, PC y totem; verificar legibilidad, contraste, textos largos y ausencia de superposiciones. No imponer negro, gradientes o un redisenio total sin mostrar el resultado al dueno.

## 2. Entrega sin ocupar la cabina - Gemini + Claude

Continuacion de orden 81 C, NO sistema nuevo. Reutilizar galeria, sesiones y cola existentes. Estacion de captura y pantalla de entrega deben poder trabajar a la vez. El invitado debe recuperar el recuerdo correcto, sin ver un album privado ajeno. No obligar a reconocimiento facial ni a dar correo/telefono para obtenerlo: entrega por QR como decidio el dueno.

Una URL de captura no debe presentarse como QR de descarga de una foto. Distinguir enlace a estacion, galeria autorizada y resultado individual; preservar acceso aprobado por el dueno. Claude define alcance y caducidad cuando haya credenciales de entrega.

Aceptacion con dos contextos: capturar A; iniciar B; entregar A sin reiniciar B; volver a abrir resultado; repetir envio sin duplicar; corte de red y reapertura sin perder la captura. Mostrar guardado local, pendiente y disponible segun el resultado real. Nunca prometer entrega sin internet mediante un QR que requiere nube. Transferencia por red local queda sujeta a ensayo de equipos; no agregar infraestructura para imitar Scanpix sin necesidad comprobada.

## 3. IA sin bloquear la fila - Gemini + Claude

Touchpix hoy llama `applyFaceSwap` / `applyTouchpixTheme` desde la pantalla y conserva estados de procesamiento/original/fallback. No afirmar que falta IA ni agregar otra lista de filtros: ya hay caricatura y otros temas.

Comprobar primero si el flujo vigente permite atender al siguiente sin perder el resultado anterior. Si no, completar un trabajo recuperable asociado a captura, fiesta y acceso autorizado: original disponible, procesamiento separado y resultado recuperable desde la entrega existente. No dejar una promesa de JavaScript suelta despues de responder desde el servidor: eso no garantiza ejecucion. Claude decide mecanismo durable compatible con el despliegue actual antes de implementarlo.

No iniciar nuevos consumos IA con cada consulta de estado. Idempotencia por trabajo, limites de reintento/costo, cancelacion y limpieza de originales/derivados segun politica existente. Consentimiento antes de enviar imagen al proveedor. Si el mecanismo necesita gasto nuevo, registrar bloqueo y pedir aprobacion, no contratar.

Aceptacion: A solicita efecto, B empieza su captura, A obtiene su resultado sin tocar B; proveedor lento/caido/cuota agotada; recarga/cierre; respuesta tardia; token de otra fiesta rechazado. Un fallback se identifica como original/efecto local, nunca como imagen IA. No inventar porcentaje de avance ni plazo garantizado. Registrar espera medida y resultado.

## 4. Mural como espectaculo dirigido - Gemini; permisos Claude

Reutilizar Centro de Fiesta, moderador, playlist y pantalla actuales. No crear otro show-control ni otro motor de encuestas. Mantener fotos, dedicatorias y momentos coordinados con el evento; no agregar karaoke, descartado por el dueno.

Comprobar que el operador encuentre y pueda usar aprobar/retirar, pausar/reanudar y cambiar contenido activo sin entrar en ajustes profundos. Si ya es directo, no reordenar por gusto. El invitado publica y participa sin recibir controles ni datos administrativos. Chats privados no se proyectan. No quitar moderacion para hacer mas rapido el flujo.

Aceptacion: post pendiente no aparece en pantalla; aprobado aparece; retirado desaparece; pausa/recarga/reconexion conservan estado coherente; dos operadores no reviven una orden vieja; fin de encuesta no acepta nuevos votos. Revisar en pantalla grande la legibilidad y la transicion entre fotos verticales/horizontales sin recortes destructivos.

## 5. Barra y totem - Gemini; carta, stock y permisos Claude

Conservar carta maestra, ingredientes, filtros, estados, cancelacion/cambio y proteccion de doble pedido ya existentes. Revisar tanto `MiniQuiosco` del invitado como `BarraTecnologicaTouchPage` y barman. No pedir al invitado iniciar sesion del equipo.

Completar SOLO huecos: imagen correspondiente a cada trago, ingredientes legibles, opciones sin alcohol identificadas con datos reales, agotado no ofrecido como disponible y pedido recuperable por el mismo invitado. No atribuir ausencia de alergenos ni seguridad de consumo sin informacion validada. Pedido de trago al barman; cancion al DJ.

El carrusel puede atraer en reposo, pero debe detenerse al tocar/elegir y permitir control manual; no desplazar el boton mientras se confirma. El nombre no debe quedar visible para el siguiente usuario del totem. No mostrar espera estimada sin datos fiables; mantener el estado real.

Aceptacion: un pedido llega una vez al barman, pasa por estados y el invitado lo ve; cancelar y reintentar; falta de stock concurrente; fallo de guardado; ninguna deduccion duplicada; sin conexion no anunciar confirmacion definitiva. Usar fixtures, nunca stock ni invitados reales para estas pruebas.

## 6. Movimiento y rendimiento - Gemini

Reutilizar estilos/tokens existentes. Reservar movimiento protagonista para reposo, cuenta regresiva y presentacion del recuerdo. Controles de captura/pedido estables; formularios legibles; teclado no tapa confirmar. No pantallas con todas las superficies moviendose a la vez.

Respetar reduccion de movimiento, pausa de carruseles, teclado/foco y ausencia de destellos. Desactivar trabajo visual innecesario cuando una pantalla queda oculta. Optimizar fotos/videos antes de agregar efectos. Lo interno sigue siendo sobrio y practico.

Aceptacion: capturas y video corto de una sesion real de navegador en celular modesto, PC y totem vertical/horizontal; comprobar transiciones realmente visibles y ningun boton tapado. Medir carga, respuesta al toque y uso de recursos bajo las mismas condiciones antes/despues. Registrar equipo, red y resultado, no llamar INP de usuarios a una prueba de laboratorio. La estetica requiere tambien revision del dueno, no solo tests.

## 7. Medir el servicio, no sumar otro panel - Gemini + Claude

Barra ya tiene estadisticas. Sesiones y cola ya guardan estados. Inventariar datos existentes antes de agregar eventos. Completar en superficies de operador actuales: pendientes/fallidos, tiempo desde captura hasta resultado disponible y tiempo desde pedido hasta listo/entregado, si los timestamps son confiables.

Cada cifra debe indicar que mide. Subido no significa recibido por el invitado; QR mostrado no significa escaneado; descarga iniciada no demuestra archivo guardado. Cuando no exista confirmacion, mostrar disponible/envio aceptado/desconocido, no entrega demostrada. No graficos inventados, porcentajes sin denominador ni cero cuando fallo la consulta.

Eventos minimos con identificador idempotente, fiesta, estacion, estado y fecha; sin fotos, rostros, nombres, tokens o telefonos en logs/analytics. No grabacion de sesiones ni reconocimiento facial nuevo para medir. Claude revisa acceso y retencion. La telemetria fallida no debe impedir capturar o pedir.

Aceptacion: conteos coinciden con fixtures tras reintento/duplicado; retrasos medidos con reloj controlado; reinicio no pierde acumulados necesarios; fiesta A no ve B; consulta fallida se distingue de sin actividad. Conservar estadisticas existentes y no alterar contabilidad.

## Cierre conjunto: pruebas que siguen siendo necesarias

La ampliacion 8-12 de abajo fue pedida despues por el dueno ("todo y mas"). Integra la misma orden y entrega, no cinco proyectos nuevos. No bloquea correcciones urgentes ni habilita gastos. Se reconfirmaron main y PR 1227 sin cambios respecto de los SHA iniciales. Contraste adicional: album con audios, sesiones de estaciones, 360 con musica/marco y presets de operador ya existen. Se leyeron simbolos/consumidores; NO se probaron visualmente en esta ampliacion.

- Reconciliar evidencia de venta -> presupuesto/PDF -> CRM, planificacion -> cliente/invitado, captura -> entrega, mural -> pantalla y barra -> barman. Reutilizar evidencia al mismo SHA o justificar vigencia por diff/dependencias. No volver a probar toda la contabilidad solo por un cambio de color; tampoco asumir inmunidad si cambia un helper compartido.
- Revisar roles con cuentas/fiestas de prueba: organizador, operador, cliente, prospecto e invitado; prohibido desactivar permisos para pasar.
- Inventariar integraciones realmente usadas (Google, WhatsApp, Meta, TikTok, YouTube, pagos, IA). Registrar evidencia de operacion, rechazo, vencimiento, duplicado y recuperacion donde aplique. Reusar orden 81 F; no repetir integraciones ya comprobadas ni anunciar conexiones por tener un enlace.
- Ensayo fisico con dispositivos del negocio, corte/retorno de red y reinicio. Diferenciar fixture/camara simulada de equipo real. Acordar capacidad esperada con el dueno antes de prueba de carga; no prometer soporte ilimitado ni someter produccion a carga sin permiso.
- Por caso: SHA, entorno, rol, pasos, esperado, observado, captura/log, prueba y limitaciones. Estados: cubierto con evidencia / implementado sin prueba suficiente / pendiente / bloqueado por equipo o credencial / descartado por duplicado.
- Claude compila el conjunto sobre SHA congelado; registrar resultado, no transcribir "verde" de otra revision. Codex revisa diferencias y evidencia; propietario fusiona. No certificado de cero errores ni declaracion de lider de mercado.
- Actualizar `docs/YA-RESUELTO.md` con lo realmente implementado/probado y `ESTADO-ACTUAL.md` con el traspaso. Crear `docs/auditoria/89-evidencia-experiencia-conectada.md` SOLO como matriz real de resultados; actualmente pendiente.

## 8. Antes de la fiesta: vender una experiencia que se puede cumplir

Gemini reutiliza las plantillas, configuracion de estaciones y vistas previas actuales. Completar, si no esta cubierto, una previsualizacion de los servicios realmente contratados con nombre y estilo de la fiesta. Accesible desde el recorrido actual del cliente, no otro portal ni otra pagina de ajustes.

Mostrar como quedaran bienvenida, foto/marco, video 360 y pantalla. Si una capacidad depende del equipo, de internet o de procesamiento IA, indicarlo antes de venderla. Una imagen de demostracion se identifica como tal. No mostrar equipo robotizado o efectos que AK no pueda entregar. No usar fotos privadas de otra fiesta como demostracion sin autorizacion.

Perfiles de presentacion para XV, boda y empresa pueden aprovechar los presets actuales, SIN crear paquetes comerciales ni cambiar precios/servicios. La seleccion de perfil no sobrescribe ajustes manuales. Validar con el dueno un recorrido visual representativo antes de extenderlo.

Aceptacion: cliente ve solo su evento y experiencias contratadas; los nombres/colores de preview coinciden con captura y salida; modificar una plantilla no cambia una fiesta anterior sin confirmacion. La demo no publica contenido, gasta IA ni altera produccion.

## 9. Recuerdos de calidad: lo que se descarga debe ser lo que se mostro

Gemini parte de `src/app/evento/plataforma-360/[fiestaId]/page.tsx`, fotocabina, Bogue y espejo existentes. Ya hay musica, dibujo de marco, distintos modos y configuracion de impresion: NO declararlos ausentes. Comparar vista previa, resultado guardado, QR, archivo descargado e impresion.

Completar perfiles de salida reutilizando capacidades reales: retrato de calidad, tira/collage e historia vertical/video con marca discreta. Comprobar encuadre de grupos, pieles, iluminacion baja, texto largo, proporciones y caras no tapadas por marcos. Preservar original segun consentimiento y retencion, sin imponer suavizado de piel ni deformaciones por defecto.

Para 360: contrastar si los cambios de velocidad, marco y audio se incorporan al archivo o solo al reproductor. Si falta, completar el render real con limites del dispositivo; una previsualizacion CSS no certifica un efecto descargado. Intro/outro o transiciones solo breves y opcionales, sin alargar filas. No imponer MP4 si el dispositivo solo exporta otro formato: comprobar compatibilidad real o informar limite/conversion necesaria. Mantener una salida util si falla el efecto; no afirmar soporte 4K ni todos los codecs sin medir.

Usar musica y materiales con derechos de uso. No contratar render en nube ni aumentar recursos sin aprobacion. La cuenta regresiva de la pantalla NO mueve ni detiene fisicamente una plataforma; mantener procedimiento de seguridad y operador del equipo.

Aceptacion: abrir el archivo final fuera de la app, en telefonos representativos; verificar duracion, orientacion, imagen, audio y efectos. Impresion de prueba con impresora/papel reales, margen y numero de copias. Cancelar/reintentar no imprime ni cobra ni genera IA dos veces. Registrar compatibilidad por equipo, no por nombre comercial del modulo.

## 10. Durante: participacion que acompana a la fiesta

Mural, votaciones, dedicatorias, musica, minijuegos y presets de show ya aparecen en codigo/ordenes. Inventariar y reutilizar: no agregar otro juego, ranking o sistema de puntos por defecto. Con el Centro/playlist actuales, completar una secuencia elegida por el operador: bienvenida, participacion breve, recuerdo y cierre. No programar activaciones sorpresivas ni automatizar el itinerario sin confirmacion.

Una propuesta util es una consigna fotografica breve o una dedicatoria al homenajeado, ofrecida en el portal existente y enviada a moderacion. Mostrar solo lo habilitado y disponible; pausar durante discursos, comida o momentos que el organizador elija. El QR debe seguir util, sin tapar fotos. Participar no requiere publicar en redes, comprar ni entregar datos para publicidad.

Eliminar fricciones, no funciones por gusto: una pantalla de invitado debe permitir entender la siguiente accion sin una explicacion del equipo. Evitar tres menues para llegar a una foto y solicitudes de permisos antes de necesitarlos. Conservar acceso por nombre/QR aprobado; no exigir otra cuenta.

Aceptacion: invitado primerizo completa la experiencia sin ayuda; operador abre/cierra; pantalla e invitado coinciden; contenido tardio no reaparece despues de retirarlo. Personas que no participan pueden seguir accediendo a sus recuerdos. No karaoke, desafios humillantes, rankings de apariencia ni publicacion automatica externa.

## 11. Operacion profesional y acceso para mas personas

Reutilizar `src/components/entretenimiento/TableroControlEstaciones.tsx`, sesiones, Centro y prueba previa de orden 81. Completar una ficha por equipo dentro de lo existente: dispositivo ensayado, camara/microfono/impresora compatibles, responsable y fecha del ultimo ensayo. "Configurado" no significa "probado" ni "conectado ahora".

Vista de operador compacta: capturas pendientes, fallo con accion concreta, disponibilidad de cada estacion y acceso directo a reintentar sin borrar originales. Conservar configuracion al reiniciar; invalidar el estado de ensayo al cambiar equipo. No borrar colas ni recargar todas las pantallas como solucion universal. No intentar control remoto del sistema operativo desde una pagina sin soporte real.

Invitado: botones alcanzables, contraste, opcion de silenciar, instrucciones visibles ademas de voz, tiempos de lectura ajustables donde sea posible y modo sin movimiento. Si se ofrece otro idioma, traducir el recorrido completo incluidas fallas, sin modificar datos del evento. No depender solo de color/audio. Personal debe poder ayudar sin saltarse consentimientos o permisos.

Aceptacion: cambio de turno de operador, reinicio, cuota local agotada, camara ocupada/desconectada, impresora sin papel y red caida. La recuperacion preserva el recuerdo y no expone el anterior al siguiente usuario. Ensayo con personas de distintas edades y necesidades, registrando fricciones observadas sin inventar perfiles ni resultados.

## 12. Despues: una entrega que el cliente quiera conservar

Ya existe `armarAlbumInteligente` en `src/lib/album/armar-album.ts`, usado por `src/app/evento/album/[fiestaId]/page.tsx`, con fotos, dedicatorias y audios; orden 28 ya lo pide. NO otro album, otro seleccionador ni nuevo buzón.

Completar solo huecos de calidad y recorrido: secciones claras por momentos/estacion usando informacion real, deduplicacion sin borrar originales diferentes, audio reproducible, descarga clara y conservacion de privacidad. No inferir que dos personas son la misma ni usar reconocimiento facial nuevo para ordenar. Si la fecha/hora o categoria es incierta, no inventar una cronologia precisa.

Reutilizar video-recuerdo para un resumen opcional si ya existe un generador real. No prometer video terminado por mostrar una maqueta o un slideshow. Presentar estado pendiente/error y recuperar original cuando corresponda. El material oculto o no autorizado no reaparece en album, resumen o exportacion.

La entrega comercial se prepara para revision humana; no enviar mails/mensajes a clientes automaticamente. No bloquear el recuerdo detras de una resena o de seguir Instagram. Enlaces, revocacion y retencion los valida Claude; no publicar URL privada en web/marketing. La capsula del tiempo mantiene las decisiones de orden 17, no se reprograma aqui.

Aceptacion: abrir como cliente e invitado en dispositivos distintos; reproducir audio/video real; descargar y abrir fuera de la app; retirar contenido y verificar proyecciones/exportaciones; evitar mezclar dos fiestas. Cierre al operador muestra lo pendiente de entregar y fallos, no una etiqueta general de "todo listo".

## Puerta de innovacion: mas tecnologia sin promesas falsas

Evaluar proyeccion/mapping, luces sincronizadas, realidad aumentada, captura itinerante o hardware robotizado SOLO como propuestas separadas si el inventario actual y los equipos justifican una ventaja. Para cada una: experiencia que mejora, equivalente existente en AK, compatibilidad/API oficial, hardware, costo recurrente, riesgos, privacidad y prueba pequena. No instalarlas ni ofrecerlas al cliente por esta autorizacion general. El dueno aprueba inversiones y cambios de funcionamiento nuevos.

Para elegir la siguiente mejora, usar los datos del bloque 7 y el ensayo real: participacion voluntaria, tiempo para conseguir el recuerdo, entregas fallidas y tiempo que el operador dedica a rescatar problemas. No un ranking inventado de "numero uno". Terminar esta tanda antes de abrir otro catalogo de funciones.

## Referencias, no compras

- Touchpix, estacion de entrega: https://intercom.help/touchpix/es/articles/9791632-como-configurar-una-estacion-para-compartir
- Touchpix, limites de transferencia local: https://designer.touchpix.com/knowledge-base/int-solutions/scanpix-touchpix-internet-free-sharing/
- Snappic, metricas de servicio: https://help.snappic.com/en/articles/3147727-analytics-with-snappic
- Snappic, personalizacion de pantalla de entrada: https://help.snappic.com/en/articles/11421280-app-experience-settings
- Snappic, composicion de video: https://www.snappic.com/use-cases/video-fx
- LumaBooth, modos y plataformas soportadas: https://www.lumabooth.com/lumabooth-photo-booth-app

Se usan como patrones de producto, no como prueba de compatibilidad con dispositivos AK ni indicacion de suscribirse.

## Lo que ya decidió Claude (plata, permisos y datos): no esperes a nadie

**Para Gemini.** El dueño eligió hacerla ENTERA, en UNA sola propuesta. Donde la orden dice
"Claude decide", ya está decidido acá. Si un bloque se traba, entregá el resto y decí cuál faltó.

- **Bloque 2, la entrega:** el QR lleva a lo que ya existe: la galería de la fiesta o el resultado
  de la sesión, con la credencial del invitado que ya se usa. **No crees credenciales nuevas ni
  enlaces que no caduquen.** Si hace falta otro tipo de acceso, frená ese punto y avisá.
- **Bloque 3, la IA sin frenar la fila:** **sin servidor de colas ni servicio nuevo, porque se
  paga.**
  - La foto original se guarda enseguida.
  - El pedido a la IA corre en la pantalla sin bloquearla y lleva el identificador de la captura.
  - El resultado se sube pegado a esa misma captura.
  - Si la pantalla se recarga en el medio, queda la original y **se dice que es la original**.
  - Una captura = un pedido a la IA como máximo.
- **Bloque 5, la barra:** **no toques** `createBarDrinkOrder`, el descuento de botellas ni
  `src/app/actions/fiesta/barra-tecnologica.actions.ts`. Sólo pantallas.
- **Bloque 7, las cifras:** se guardan en las sesiones que ya existen
  (`src/app/actions/fiesta/sesion-entretenimiento.ts`). Van **sin nombres, caras, teléfonos ni
  credenciales**. Una colección nueva, no.
- **No toques en ningún bloque:**
  - `src/lib/fiesta/recortar-para-afuera.ts`, `src/lib/fiesta/lectura-completa.ts`,
    `src/lib/fiesta/get-fiesta-raw.ts`;
  - `src/app/actions/fiesta/fiesta.actions.ts`, `src/lib/marca-de-lectura.ts`,
    `src/lib/firebase-sync.ts`, `src/lib/data-service.ts`;
  - nada de cobros, facturas ni presupuestos.

  Si te traban, listalos en la propuesta y lo resuelve Claude.
- **Las pruebas `89-*` que nombra el bloque de abajo las tenés que crear vos**, mirando el
  resultado en pantalla, y **romperlas a propósito** antes de entregar. Leé
  `docs/ANTES-DE-ENTREGAR.md`.

## Comprobacion

Los simbolos y consumidores siguientes existen en la base contrastada. Las pruebas 89 son PROPUESTAS, NO creadas ni ejecutadas: antes de crearlas ampliar una prueba equivalente de orden 81 u otra existente, y actualizar estas referencias. El chequeo textual no prueba funcionamiento. La prueba de ZIP ya existe; aqui no se ejecuto.

```comprobar
archivo: src/lib/entertainment/station-config.ts
usa: getEntertainmentStationConfig en src/app/actions/fiesta/entretenimiento.actions.ts
prueba: tests/e2e/89-identidad-y-movimiento.spec.ts
archivo: src/app/actions/fiesta/entretenimiento.actions.ts
usa: getPublicEntertainmentEvent en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/81-captura-reconexion-entrega.spec.ts
archivo: src/app/actions/touchpix-ai.ts
usa: applyTouchpixTheme en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: tests/e2e/89-ia-entrega-y-siguiente-invitado.spec.ts
archivo: src/app/(app)/fiestas/nueva/muro-social/page.tsx
usa: pauseScreenPlaylist en src/app/(app)/fiestas/nueva/muro-social/page.tsx
prueba: tests/e2e/89-mural-operador-y-pantalla.spec.ts
archivo: src/app/actions/fiesta/barra-tecnologica.actions.ts
usa: createBarDrinkOrder en src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx
prueba: tests/e2e/81-roles-y-pedidos-sin-duplicados.spec.ts
archivo: src/app/evento/barra/[fiestaId]/stats/page.tsx
usa: getBarraTecnologicaDashboard en src/app/evento/barra/[fiestaId]/stats/page.tsx
prueba: tests/e2e/89-metricas-sin-falsa-entrega.spec.ts
archivo: src/app/api/video-vida-photos/[fiestaId]/download/route.ts
usa: X-Fotos-Fallidas en src/app/(app)/fiestas/nueva/video-vida/page.tsx
prueba: src/__tests__/video-vida-descarga-avisa-lo-que-falta.test.ts
archivo: src/lib/album/armar-album.ts
usa: armarAlbumInteligente en src/app/evento/album/[fiestaId]/page.tsx
prueba: tests/e2e/el-album-del-recuerdo.spec.ts
archivo: src/app/actions/fiesta/sesion-entretenimiento.ts
usa: startEntertainmentSession en src/app/evento/plataforma-360/[fiestaId]/page.tsx
prueba: tests/e2e/89-recuerdo-final-y-equipo.spec.ts
```

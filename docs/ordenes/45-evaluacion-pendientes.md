# Orden 45 - Evaluar pendientes y entregar evidencia

Fecha: 2026-09-08. Autor: Codex, por pedido del dueno.
Estado: ORDEN PREPARADA; no equivale a trabajo ejecutado ni a aprobacion de publicacion.

## Acuerdo de trabajo y consumo

- Reparto prioritario confirmado: Codex revisa y propone; Gemini programa; Claude Opus
  compila y registra SHA, entorno y resultado. Sustituye el reparto anterior de esta orden.
  Las tareas de evaluacion descritas abajo corresponden a Codex; Gemini recibe sus
  indicaciones concretas para implementarlas. Codex mantiene documentacion, no programa
  la app ni compila por defecto. La decision de ahorro se aplica dentro de estos roles.
- Codex decide en cada pedido el reparto de menor consumo estimado: directo, agentes
  acotados o instrucciones para Gemini. Sustituye la delegacion obligatoria anterior.
- Mas agentes no garantiza menos tokens. No duplicar recorridos ni cargar todo el historial.
  Reutilizar evidencia del mismo commit, configuracion y entorno; repetir solo lo afectado.
- Codex revisa los hallazgos y la evidencia sensible. Gemini aporta evidencia de sus cambios;
  Claude Opus aporta el resultado de compilacion. Una orden escrita no inicia otra IA.
- Antes de cambiar funcionamiento, condiciones comerciales o eliminar una funcion, consultar
  al dueno. No activar pagos, publicidad, publicaciones ni contratar servicios para probar.
- No fusionar. Si se autorizan correcciones, reunir la tanda en una sola PR con su registro,
  sin abrir una PR por pantalla ni una separada solo para estos documentos.

## Primero: recuperar lo ya hecho

El dueno confirma que Claude hizo mucho trabajo y lo dejo registrado. Ese registro es la
base obligatoria, no un informe opcional para comparar al terminar otra auditoria completa.
El dueno precisa que existen registros hasta el 5 de septiembre de 2026. La hoja local
fechada el 31 de agosto no es el cierre del historial. Localizar las entradas posteriores
en el repositorio, ramas o PRs accesibles antes de declarar pendientes; no se han localizado
todavia en esta lectura puntual. No confundir fecha informada con contenido ya revisado.
Preparar primero un indice breve de lo cerrado por Claude, decisiones aprobadas, evidencia
disponible y pendientes. Incluir los aportes de Gemini y Codex sin crear listas duplicadas.
Si hace falta, buscar por tema en CLAUDE.md, ESTADO-AUDITORIA.md y LO-AUDITADO.md cuando
existan; no cargar el historico entero ni inventar que se leyo. Conservar referencias exactas.
Reutilizar verificaciones vigentes; si falta version, entorno o prueba de uso, completar esa
evidencia puntual. No reprogramar una funcion porque solo falte su comprobacion documental.
El listado de recorridos de esta orden marca cobertura a cotejar, NO ordena repetir todo.

Leer AGENTS.md, ESTADO-ACTUAL.md y buscar solo las entradas pertinentes de YA-RESUELTO.md.
Identificar main, PRs vigentes y version publicada antes de atribuir un fallo a una entrega.
No cambiar ni revertir el trabajo local de otra IA; programar en rama/worktree propio.
Usar Graphify puntual y simbolos para localizar codigo despues de reproducir el problema.
Un antecedente resuelto evita repetir trabajo, pero no descarta una regresion demostrada.

Antecedentes locales de Codex, NO necesariamente integrados en main:
- C:/Users/Usuario/Documents/Codex/ak-panel-review-8c5eb6e/docs/AUDITORIA-EXPERIENCIA-2026-09-07.md
- C:/Users/Usuario/Documents/Codex/ak-panel-review-8c5eb6e/docs/auditoria-2026-09-07-integraciones.md
- C:/Users/Usuario/Documents/Codex/ak-panel-review-8c5eb6e/docs/ordenes/2026-09-08-codex-dirige-gemini-ejecuta.md
El reparto de consumo de esta orden sustituye el reparto fijo de esos antecedentes.
Si no se dispone de esos archivos, indicar la limitacion; no fingir haberlos consultado.

## Antecedentes, no fallos actuales certificados

El 7 de septiembre se observaron errores de carga en login y simulador, un 503 transitorio
en portada y fallos de descarga de JavaScript. El dueno luego informo una correccion de
Gemini: falta verificar la version publicada. No atribuirlos sin pruebas a claves o cuentas.
No se alcanzaron calculos/PDF en ese recorrido; no se certificaron ni se demostro un error
numerico. La compilacion local de 269c7f56 fallo en /multiagente/memoria (Client Manifest);
eso no determina por si solo la causa ni el estado actual de produccion.
La revision de PR 1198 sobre a7ce49d6 detecto riesgos en respaldos de secreto de sesion y
esperas de base de datos. Revisar vigencia y cambios, no asumir que sigue abierta:
https://github.com/akproduccioneseventos/app-AK/pull/1198#issuecomment-5576359682

En la portada observada SI existian Blog, Club Uruguay, Servicios y explicacion todo-en-uno.
El filtro Catering y el kebab funcionaron correctamente; no repetir el defecto viejo.
Se observaron titulos tecnicos de fotos, dos bloques consecutivos de tecnologia y destinos
de galeria externa e integrada. Son puntos a evaluar, no autorizacion para borrar contenido.
Hubo animacion de contadores: no afirmar ausencia total de movimiento. El sustento de cifras
y promesas no fue verificado. Las experiencias internas y equipos no quedaron auditados.

## Evaluar situaciones humanas, no contar botones

Para cada recorrido registrar: que quiere conseguir la persona, que entiende, donde duda,
que consigue realmente, que persiste tras recargar y que ve el otro rol. No inventar opiniones
de clientes ni llamar investigacion con usuarios a una evaluacion hecha por IA.

1. Prospecto desde anuncio de Facebook/Instagram: abrir landing en movil, entender servicios,
   ver evidencia real y pasar a consulta o presupuesto sin perder contexto. Evaluar fotos,
   Club Uruguay, blog, galeria y navegacion. No duplicar promesas o llamadas a cotizar.
2. Familia comparando opciones: completar simulador comun e IA con datos de prueba. Probar
   paquetes, regalos y adicionales al cambiar de paquete; adultos, menores y acompanantes;
   precio actual, por persona y ajuste futuro separado. Descargar y compartir presupuesto;
   comprobar detalle, paginacion, enlaces y CRM. Conservar varias propuestas por prospecto
   y telefono. Comparar menus/fotos con el catalogo aprobado, no clasificarlos por conjetura.
3. Cliente que ya contrato: entrar solo a su evento; encontrar confirmado, pendiente,
   decisiones propias, saldo y documentos sin recorrer toda la administracion. Comprobar
   que un cambio autorizado se refleja en organizacion, sin acceso a otros clientes.
4. Invitado: invitacion, confirmacion y acompanantes, portal, pagina del evento, mural y red
   social. Probar privacidad y publicacion/moderacion con dos sesiones. Debe entender si
   algo se envio o sigue esperando. No exponer controles administrativos.
5. Operador e invitado: fotocabina, espejos comun/IA, Bogue, 360, Touchpix, barra y totems.
   Configurar, participar, obtener resultado y reiniciar para otra persona sin filtracion.
   Probar cola, reconexion y fallo visible. Separar camara simulada de equipo real, impresion
   y control fisico. En barra confirmar con el dueno el destinatario de la cola antes de
   modificarlo: no asumir DJ ni bartender. No dar por hecha una entrega por ver un boton.
6. Equipo antes/durante/despues de fiesta: tareas, agenda, mesas, catering, personal,
   proveedores, itinerario, carga y devolucion. Revisar coherencia entre modulos y roles.
   Inventariar rutas y acciones restantes para que no queden fuera areas menos visibles.
7. Dinero y datos: cotejar en lectura los 19 presupuestos manuales importados y eventos
   pasados, origen, fechas, duplicados y relaciones. Probar pagos/descuentos/regalos/saldos
   y facturas en entorno aislado, sin modificar registros reales ni duplicar ingresos.
8. Integraciones y marketing: distinguir enlace de perfil, borrador, envio y sincronizacion
   real. Verificar permisos, ultima operacion y errores de Gmail, Calendar, WhatsApp, Meta,
   TikTok, YouTube, Mercado Pago y Gemini segun lo existente. No publicar ni cobrar para
   completar la prueba. Lo que necesita cuenta, permiso o equipo queda explicitamente pendiente.

## Direccion visual propuesta (requiere evaluacion y aprobacion)

La web vende una fiesta resuelta, no una lista de dispositivos. Proponer fiestas reales con
fotos coherentes, servicios prestados y testimonios comprobables. Mostrar la propuesta actual
y una alternativa visual concreta en movil/PC antes de un redisenio general.
Dar emocion con color de marca y movimiento visible sin tapar personas, lectura ni botones;
respetar movimiento reducido. Reservar calma para pagos y organizacion. No elegir colores
arbitrarios ni agregar otra biblioteca de animacion por su nombre. Medir carga e interaccion.
El portal cliente debe dar tranquilidad; el invitado debe participar sin aprender la app;
el operador debe ver controles claros y recuperarse de errores. No simplificar quitando
capacidades aprobadas. Evaluar que ya existe antes de proponer construirlo otra vez.
No inventar cifras, testimonios, descuentos o urgencia. El reloj aprobado es para la promo
final real, no para congelar precios. El album se entrega automaticamente; no agregar
seleccion de fotos por cliente. No mezclar Instagram con el mural en vivo.

## Entrega de la evaluacion, antes de programar cambios de funcionamiento

Una matriz unica por recorrido/accion con: rol, version, entorno, resultado esperado,
resultado observado, evidencia, severidad y estado (probado/fallo/bloqueado/no probado).
Clasificar propuestas en corregir, mejorar, agregar o quitar y justificar el beneficio real.
Capturas y evidencia detallada en archivos; resumen de hasta 15 lineas para Codex.
Separar fallos nuevos de regresiones y conservar referencias al historial.
Comenzar por acceso y recorrido comercial completo. Si esta bloqueado, informar la causa
observada y continuar lo independiente; no declarar terminada la auditoria del interior.

Si luego se autorizan cambios: pruebas focalizadas durante el trabajo; congelar codigo y
entregar el conjunto a Claude Opus para compilar; registrar tambien TypeScript, Jest,
acentos y E2E/visual
del flujo afectado. Un build verde no certifica una cuenta conectada ni equipo fisico.
Actualizar YA-RESUELTO.md y ESTADO-ACTUAL.md en la misma entrega. No certificar cero errores.

## Comprobacion automatica y evidencia

Este bloque es un inventario verificable, no un certificado. El control actual busca
archivos y menciones de simbolos; no ejecuta las pruebas ni demuestra por si solo que el
flujo funciona. Claude debe registrar la ejecucion y el commit. Codex revisa resultados.
La matriz y la prueba abajo son entregables propuestos, todavia no creados por esta orden.
La prueba debe cubrir solo pendientes reales encontrados, reutilizando fixtures y pruebas
vigentes; si una prueba existente ya cubre el caso, referenciarla en vez de duplicarla.
No crear archivos vacios ni comentarios con simbolos para satisfacer el control.

```comprobar
archivo: docs/evidencias/45-matriz-pendientes.md
usa: getSocialPosts en src/app/(app)/empresa/redes-sociales/page.tsx
usa: getEntertainmentGuestPath en src/app/(app)/fiestas/nueva/entretenimiento/page.tsx
prueba: tests/e2e/45-recorridos-pendientes.spec.ts
```

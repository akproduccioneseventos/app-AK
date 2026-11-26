#!/usr/bin/env node
/**
 * LAS FORMAS QUE MIENTEN: busca solo las formas exactas de defecto que ya aparecieron.
 *
 * **Orden del dueno, 18 de septiembre de 2026: "mejorá el mecanismo, Codex sigue encontrando
 * cosas".** Tenia razon y el problema era de fondo: **mis preguntas son preguntas.** Dependen de
 * que alguien se acuerde de hacerselas. Codex encuentra cosas porque LEE el codigo, no porque
 * tenga mejores preguntas.
 *
 * Lo que si funciona en esta app son los controles que corren solos —el de "dijo que si y no paso
 * nada", el de las animaciones de mentira—. Este es de esos: **cada forma de defecto que Codex
 * encontro, buscada mecanicamente en todo el codigo, cada vez.**
 *
 * Informa siempre; **frena solo por lo que cambio en esta rama**, igual que el control de "lo que
 * se dijo es lo que es". Si frenara por lo viejo, no se podria subir nada y terminaria apagado.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const RAIZ = process.cwd();
const CARPETAS = ['src'];
const EXTENSIONES = ['.ts', '.tsx', '.mjs'];
const NO_MIRAR = ['node_modules', '.next', '__tests__', 'tests/e2e'];

function archivos(dir, acumulado = []) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    const rel = relative(RAIZ, ruta);
    if (NO_MIRAR.some((n) => rel.includes(n))) continue;
    if (statSync(ruta).isDirectory()) archivos(ruta, acumulado);
    else if (EXTENSIONES.some((e) => entrada.endsWith(e))) acumulado.push(rel);
  }
  return acumulado;
}

/**
 * Cada forma lleva el caso real del que salio. Eso importa: cuando esto se ponga en rojo dentro
 * de dos meses, el que lo lea tiene que entender POR QUE en diez segundos.
 */
const FORMAS = [
  {
    nombre: 'El error que se tira a la basura',
    porque: 'Un borrado o un envio que falla y se traga el error, y despues se devuelve exito. Paso con el borrado de fotos del video de vida: decia "fotos eliminadas" con las fotos ahi.',
    buscar: /\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*\{\s*(\/\*[^*]*\*\/|\/\/[^\n]*)?\s*\}\s*\)/g,
    comoSeArregla: 'Contar los que fallaron y devolver exito solo si no quedo ninguno. Si quedaron, decir cuantos.',
  },
  {
    nombre: 'El cartel de exito sin esperar el resultado',
    porque: 'Se anuncia "copiado" o "compartido" sin mirar si funciono. Paso en la hoja del DJ: decia "Enlace Copiado" con el portapapeles bloqueado.',
    // No cuenta cuando se encadena `.then(...).catch(...)`: ahi si se esta mirando el resultado.
    buscar: /(?<!await\s)(?<!return\s)navigator\.(?:clipboard\.writeText|share)\((?:[^;\n]*)\)(?!\s*\.(?:then|catch))/g,
    comoSeArregla: 'Esperar el resultado y avisar distinto si fallo, dejando al que lo usa una forma de seguir.',
  },
  {
    nombre: 'La comparacion que apaga al revisor de tipos',
    porque: 'Un control que compara un campo con `as any` puede estar mirando un campo que no existe, y entonces no frena nunca. Paso con el borrado de equipos: comparaba `activoId`, que no existe.',
    buscar: /\(\s*\w+\s+as\s+any\s*\)\.\w+\s*===/g,
    comoSeArregla: 'Poner el campo en el tipo, o comprobar contra el campo que el dato tiene de verdad.',
  },
  {
    nombre: 'La fecha suelta convertida por el navegador',
    porque: 'Una fecha escrita como dia suelto se entiende como hora de Greenwich y en Uruguay retrocede un dia. Paso en la hoja del DJ: se imprimia el dia anterior.',
    buscar: /new Date\(\s*\w*[Ff]echa\w*\s*\)\s*\.toLocale/g,
    comoSeArregla: 'Armar la fecha con los tres numeros del texto, sin que la zona horaria la mueva. Mirar `src/lib/reportes/rango-de-dias.ts`.',
  },
  // ── Desde la pregunta 117, cada pregunta nueva del método trae su escaneo acá, o figura en
  // ── PREGUNTAS_QUE_NO_SE_PUEDEN_ESCANEAR con el control que la cubre. Lo exige
  // ── src/__tests__/cada-pregunta-nueva-tiene-su-escaneo.test.ts (orden del dueño, 12/11/2026).
  {
    pregunta: 88,
    nombre: 'La hora de Greenwich puesta en un campo de fecha y hora local',
    porque: '"Crear publicación" proponía la hora tres horas adelantada, y cada edición la corría otras tres (auditor, 12/11/2026).',
    buscar: /toISOString\(\)\.(?:substring|slice)\(0,\s*16\)/g,
    comoSeArregla: 'Armar AAAA-MM-DDTHH:mm con la hora de Uruguay (src/lib/fechas/).',
  },
  {
    pregunta: 135,
    nombre: 'Una nota interna a la vista del cliente',
    porque: 'La página del Club Uruguay mostraba "Condición comercial del dueño" y "Foto cargada desde el módulo maestro de salones" (revisión comercial, 13/11/2026).',
    buscar: /m[oó]dulo maestro de salones|Condici[oó]n comercial del due[nñ]o|cuentas regresivas inventadas|no habilitaci[oó]n legal certificada/g,
    comoSeArregla: 'Escribir lo que le sirve al cliente; lo que es para el equipo va en un comentario o en el panel.',
  },
  {
    pregunta: 121,
    nombre: 'El texto para mandar afuera con marcadores sin completar',
    porque: 'El generador de marketing dejaba salir "[NOMBRE]" y "[X] años" en textos para redes (auditor, 12/11/2026).',
    buscar: /\[(?:NOMBRE|FECHA|MES\/AÑO|CLIENTE|EVENTO)\]|\[X\] años/g,
    comoSeArregla: 'Usar {{CLAVE}} con su reemplazo, y no dejar copiar si queda alguno sin dato.',
  },
  {
    pregunta: 124,
    nombre: 'La pantalla que corre una corrección antes de mostrar nada',
    porque: 'Presupuestos esperaba una corrección de fechas que lee la lista entera: 22 segundos en el celular (auditor, 12/11/2026).',
    buscar: /await\s+(?:withTimeout\(\s*)?(?:repair|migrate|reparar|migrar)\w*\(/g,
    comoSeArregla: 'Mostrar primero y correr la corrección después, sin esperarla, o una sola vez.',
  },
  {
    pregunta: 128,
    nombre: 'El booleano que no puede volver a falso',
    porque: 'isCeliac se calculaba "=== Celiaco || inv.isCeliac": pasar a "Ninguna" dejaba al invitado celíaco para la cocina (auditor, 12/11/2026).',
    buscar: /===\s*'[^']+'\s*\|\|\s*\w+\.is[A-Z]\w*/g,
    comoSeArregla: 'Calcular el campo sólo del valor nuevo; si el valor nuevo no vino, conservar los dos campos juntos.',
  },
  {
    pregunta: 138,
    nombre: 'La conversación filtrada por la pestaña activa',
    porque: 'El chat del equipo escondía la respuesta del especialista porque filtraba por el agente elegido (evaluación de Sofía, 13/11/2026).',
    buscar: /\.agentType\s*&&\s*\w+\.agentType\s*!==\s*active\w*/g,
    comoSeArregla: 'Mostrar en la conversación en curso todo lo que llega, con el nombre de quien contestó.',
  },
  {
    pregunta: 180,
    nombre: 'Los candidatos inventados cuando falta la lista real',
    porque: 'El control remoto del sorteo, sin lista, elegía entre "Mesa 1"…"Mesa 6" y anunciaba un ganador que nunca fue candidato (auditoría 18/11/2026, A18-05).',
    buscar: /\[\s*'(?:Mesa|Invitado|Participante|Ganador) 1'\s*,/g,
    comoSeArregla: 'Sin datos reales no se elige ni se anuncia: se avisa qué falta cargar.',
  },
  {
    pregunta: 181,
    nombre: 'Las horas del programa ordenadas como texto',
    porque: 'El cronograma ordenaba "01:00" antes de "18:00": la torta quedaba antes de la llegada (auditoría 18/11/2026, A18-06).',
    buscar: /\(?\w+\.hora(?:\s*\|\|\s*'')?\)?\.localeCompare\(/g,
    comoSeArregla: 'Ordenar por minutos desde el inicio del evento (ordenarPorHoraDelEvento).',
  },
  {
    pregunta: 183,
    nombre: 'El mínimo del plan distinto del que dice el contrato',
    porque: 'El plan guardaba $5.000 por trimestre y la cláusula 3 dice $10.000 (auditoría 18/11/2026, A18-01).',
    buscar: /pagoMinimoTrimestral\s*=\s*\d|setPagoMinimoTrimestral\]\s*=\s*useState\(\s*\d/g,
    comoSeArregla: 'Usar PAGO_MINIMO_TRIMESTRAL_DEL_CONTRATO de src/lib/planPagos.ts.',
  },
  {
    pregunta: 186,
    nombre: 'Los prospectos recortados sin forma de buscar el resto',
    porque: 'El asistente Vendedor veía 12 de 16 prospectos y no encontraba uno recién creado (auditoría 18/11/2026, A18-04).',
    buscar: /prospectos\.slice\(\s*0\s*,\s*\d+\s*\)/g,
    comoSeArregla: 'Dar una herramienta que busque en todo el CRM (buscarProspecto), o explicar en el contexto que hay más.',
  },
  {
    pregunta: 191,
    nombre: 'El campo de menores que muestra sólo niños',
    porque: 'La LED pasaba 10 menores como adolescentes y el presupuesto manual mostraba 0 (auditoría 18/11/2026, R18-03).',
    buscar: /value=\{formData\.invitadosNinos\b/g,
    comoSeArregla: 'Mostrar niños + adolescentes y, al cambiar, guardar una sola cifra (paso-1-datos-evento.tsx).',
  },
  {
    pregunta: 192,
    nombre: 'La lista de dietas que mira sólo la restricción y no el celíaco',
    porque: 'El celíaco marcado aparte no llegaba al reporte para cocina (auditoría 18/11/2026, R18-01).',
    buscar: /\.filter\(\s*\(?\w+\)?\s*=>\s*\w+\.dietaryRestriction\s*&&/g,
    comoSeArregla: 'Usar condicionesDelInvitado / tieneCondicionAlimentaria (src/lib/catering/condiciones-del-invitado.ts).',
  },
  {
    pregunta: 196,
    nombre: 'El total leído con el primer número suelto de la línea',
    porque: '"TOTAL: $2.500" daba $0 porque se tomaba el espacio antes del signo como monto (auditoría 18/11/2026, R18-06).',
    buscar: /line\.match\(\/\\\$\?\\s\*\(\[\\d/g,
    comoSeArregla: 'Leer el monto después de la etiqueta (montoTrasEtiqueta en src/lib/parse-budget-text.ts).',
  },
  {
    pregunta: 199,
    nombre: 'El enlace al hub o al recap del invitado sin su credencial',
    porque: 'Sin guestId y token el invitado cae en "Este acceso no es válido" o en un 404 (auditoría externa 21/11/2026).',
    buscar: /(?<!(?:guestPath|withGuestAccess)\(`)\/(?:evento\/hub\/\$\{[^}]+\}|invitacion\/\$\{[^}]+\}\/recap)(?![^`'"\n]*token)/g,
    comoSeArregla: 'Armar el enlace con withGuestAccess (src/lib/guest-portal/public-event-navigation.ts) o no mostrarlo sin credencial.',
  },
  {
    pregunta: 211,
    nombre: 'La fiesta entera con sólo tener sesión',
    porque: 'getEntretenimientoFiesta devolvía claves, sueldos y pagos de cualquier fiesta a cualquiera del equipo (auditoría de Gemini 23/11/2026).',
    buscar: /await requireAppSession\(\);\s*\n\s*(?:const \w+ = )?await \w+\(\s*fiestaId\s*,\s*LECTURA_COMPLETA\s*\)/g,
    comoSeArregla: 'Pedir permiso y pertenencia a la fiesta, y recortar por perfil (recortarFiestaPorPerfil) en vez de LECTURA_COMPLETA.',
  },
  {
    pregunta: 212,
    nombre: 'La demora disfrazada de "faltan credenciales" para saltear el control',
    porque: 'Borrar una factura caía al borrado sin transacción a los 1,5 s fingiendo que faltaban credenciales (auditoría de Gemini 23/11/2026).',
    buscar: /new Error\(\s*['"]Could not load the default credentials \(timeout\)['"]\s*\)/g,
    comoSeArregla: 'Si la base tarda, se avisa y no se borra; el camino sin transacción es sólo para el entorno sin base.',
  },
  {
    pregunta: 214,
    nombre: 'El panel del portal que mira la sesión en el navegador y no en el servidor',
    porque: 'Cinco solapas del portal rebotaban a quien entró por /entrar porque buscaban la clave en sessionStorage (auditoría de Gemini 23/11/2026).',
    buscar: /sessionStorage\.getItem\(\s*SESSION_KEY_PREFIX/g,
    comoSeArregla: 'Preguntarle al servidor si hay sesión de portal de esa fiesta (verificarSesionPortalCliente).',
  },
  {
    pregunta: 216,
    nombre: 'Un archivo del servidor leído con la ruta que viene de los datos',
    porque: 'Cuatro descargas hacían fs.readFile(msg.mediaUrl) sin mirar que la ruta quedara en la carpeta de la fiesta (auditoría general 23/11/2026).',
    buscar: /readFile\(\s*\w+\.(?:mediaUrl|fileName|url|path|ruta)\b/g,
    comoSeArregla: 'Resolver la ruta y comprobar que empiece con la carpeta de esa fiesta antes de leer.',
  },
  {
    pregunta: 217,
    nombre: 'Una firma que no coincide y sigue con un valor por defecto',
    porque: 'El ingreso con Google, con la firma del state mal, seguía como cuenta de la empresa (auditoría general 23/11/2026).',
    buscar: /signature mismatch[^\n]*\n\s*return \{ kind: 'company' \}/g,
    comoSeArregla: 'Con la firma mal se rechaza y se pide volver a conectar.',
  },
  {
    pregunta: 218,
    nombre: 'El panel de la fiesta que no mira la fiesta de la dirección',
    porque: 'Video de Vida usaba la fiesta de muestra y el Control en vivo armaba enlaces con undefined (auditoría funcional 23/11/2026).',
    buscar: /(?:=\s*await\s+getFiestaActual\(\s*\);)|(?:const params = useParams\(\);[\s\S]{0,80}?const fiestaId = params\.id as string;)/g,
    comoSeArregla: 'Leer el fiestaId de la dirección (useSearchParams) y, sin id, mostrar un cartel en vez de elegir una fiesta.',
  },
  {
    pregunta: 220,
    nombre: 'El cartel de "sincronizado" fijo, que no depende del guardado',
    porque: 'La lista de carga decía "Tildes sincronizadas online" con el guardado fallado (auditoría funcional 23/11/2026).',
    buscar: />\s*(?:Tildes|Cambios|Datos|Todo)\s+(?:sincronizad|guardad)[ao]s?[^<{]*</g,
    comoSeArregla: 'El cartel sale del resultado del último guardado: guardado, guardando o no se guardó con su motivo.',
  },
  {
    pregunta: 221,
    nombre: 'Un desplegable armado con datos sin descartar valores vacíos',
    porque: 'Las alertas de Mi Día se caían porque una opción venía con fiestaId vacío (auditoría funcional 23/11/2026).',
    buscar: /\.map\(\(\[(\w+),\s*\w+\]\)\s*=>\s*\(?\s*<SelectItem key=\{\1\} value=\{\1\}/g,
    comoSeArregla: 'Filtrar los vacíos antes del map, o darles un valor fijo que no sea "".',
  },
  {
    pregunta: 222,
    nombre: 'Un texto con marcador {X} mostrado sin reemplazar',
    porque: 'La presentación LED mostraba el literal {SENIA} en las preguntas frecuentes (auditoría funcional 23/11/2026).',
    buscar: /<p[^>]*>\{faq\.answer\}<\/p>/g,
    comoSeArregla: 'Reemplazar el marcador con el dato de Ajustes antes de mostrarlo, como la página pública.',
  },
  {
    pregunta: 223,
    nombre: 'La fecha de la dirección convertida con new Date',
    porque: 'Del LED al presupuesto manual la fecha aparecía un día antes (auditoría funcional 23/11/2026).',
    buscar: /new Date\(\s*\w*Param\s*\)/g,
    comoSeArregla: 'parseUruguayDate de src/lib/utils.ts para AAAA-MM-DD.',
  },
  {
    pregunta: 224,
    nombre: 'Un enlace de acceso armado con la credencial vacía',
    porque: 'Mi Mesa mandaba al hub con token vacío y el invitado veía "Este acceso no es válido" (auditoría funcional 23/11/2026).',
    buscar: /&& token\s*\?[\s\S]{0,200}?:\s*`[^`]*token=\$\{/g,
    comoSeArregla: 'Sin credencial no se arma el enlace: se le explica al invitado cómo entrar.',
  },
  {
    pregunta: 228,
    nombre: 'Un contador en el título que se pinta antes de cargar',
    porque: 'Listado de Empleados (0) al lado de "Cargando empleados…" (cuarta auditoría externa, 25/11/2026).',
    buscar: /<CardTitle[^>]*>[^<]*\(\{\w+\.length\}\)/g,
    comoSeArregla: 'Mientras carga, sin número: un esqueleto o "…".',
  },
  {
    pregunta: 229,
    nombre: 'El título de la página con el nombre de la empresa que ya pone la plantilla',
    porque: 'Once páginas públicas salían "| AK Producciones | AK Producciones" en Google (cuarta auditoría externa, 25/11/2026).',
    // Sólo el objeto metadata escrito a mano: createEventLandingMetadata ya lo pasa como título absoluto.
    buscar: /export const metadata[^=\n]*=\s*\{[^}]*?\n  title:\s*['"`][^'"`\n]*\|\s*AK Producciones(?: Eventos)?['"`]/g,
    comoSeArregla: 'Sacar el sufijo del title de primer nivel; openGraph y twitter lo conservan.',
  },
  {
    pregunta: 231,
    nombre: 'Un texto fijo que afirma cómo entraste o dónde es la reunión',
    porque: 'El perfil decía "contraseña compartida" a quien entró con Google y las citas decían "Oficina AK Producciones" sin oficina (25/11/2026).',
    buscar: /contraseña compartida|Oficina AK Producciones|Presencial en Oficina/g,
    comoSeArregla: 'Sacarlo de la sesión o decir "a coordinar".',
  },
  {
    pregunta: 232,
    nombre: 'La IA llamada por la puerta lateral, sin el cerebro',
    porque: '20 archivos llamaban a la IA con generateWithGeminiFallback, sin tope ni registro (robot, vuelta 3, 26/11/2026).',
    buscar: /\b(?:generateWithGeminiFallback|ejecutarPromptConFallback)\(/g,
    comoSeArregla: 'pedirTexto de src/ai/cerebro.ts.',
  },
  {
    pregunta: 233,
    nombre: 'Una marca de terminado que se prende con el primer elemento',
    porque: 'El Video de Vida decía "fotos recibidas" con 1 de 50 y le sacaba al cliente el enlace para subir (robot, vuelta 4, 26/11/2026).',
    buscar: /\b(?:photosUploaded|\w+(?:Uploaded|Enviad[oa]s?|Completad[oa]))\s*:\s*true\b/g,
    comoSeArregla: 'Que la marca diga cuántos de cuántos, y se apague si se borra todo.',
  },
  {
    pregunta: 235,
    nombre: 'Una acción que sale para afuera se confirma con lo que dice el modelo o con un "si" suelto',
    porque: 'El asistente agendaba la reunión y le llegaba la invitación al cliente con "no sé si puedo" o con el confirmado que ponía el modelo (robot, vuelta 7, 26/11/2026).',
    buscar: /esUnSi\([^)]*\)\s*\|\|\s*Boolean\(\s*data\??\.confirmado/g,
    comoSeArregla: 'Preguntar primero y ejecutar sólo si el mensaje siguiente es un sí solo; lo que dice el modelo no confirma.',
  },
  {
    pregunta: 238,
    nombre: 'Una ruta que, sin clave configurada, deja pasar a cualquiera y corre lo que manda',
    porque: 'El despachador, sin CRON_SECRET, dejaba que cualquiera desde internet disparara los recordatorios a invitados y los avisos al cliente (robot, vuelta 10, 26/11/2026).',
    buscar: /if\s*\(\s*!\s*\w*(?:[Ss]ecret|[Cc]lave)\w*\s*\)\s*\{?[^}]{0,300}?(?:return\s+true|autorizado:\s*true)/g,
    comoSeArregla: 'Sin clave, correr sólo lo que no manda mensajes ni borra; lo que manda espera la clave.',
  },
  {
    pregunta: 239,
    nombre: 'Instrucciones de la IA que prometen lo que el dueño prohibió',
    porque: 'Sofía, la asistente del simulador, tenía escrito "congelamos el precio tras la seña del 30%" (robot, vuelta 11, 26/11/2026).',
    buscar: /congelamos\s+(?:el\s+)?precio|seña del 30\s?%/gi,
    comoSeArregla: 'Sacarlo del texto de la IA y armar la seña con el monto de Ajustes.',
  },
  {
    pregunta: 241,
    nombre: 'Una palabra corta buscada por pedazos adentro de otras',
    porque: 'La ganancia tomaba "Comisión por compra" como comisión de Mercado Pago porque buscaba "mp", que está en "compra" (robot, vuelta 12, 26/11/2026).',
    buscar: /\.includes\(\s*'(?:mp|mo|nin|ni|kg|uy)'\s*\)/g,
    comoSeArregla: 'Buscar la palabra entera (\\b) o el nombre completo, no un pedazo de dos o tres letras.',
  },
  {
    pregunta: 243,
    nombre: 'Una marca de hecho que se pone antes de saber si lo de afuera salió',
    porque: 'Un comentario quedaba "Oculto" en la app aunque Meta no lo hubiera ocultado, y nunca se reintentaba (robot, vuelta 13, 26/11/2026).',
    buscar: /isAutoHidden\s*=\s*true;[\s\S]{0,600}?await\s+hideCommentOnMeta\(/g,
    comoSeArregla: 'Marcar hecho sólo con la respuesta buena de afuera; si falla, queda pendiente y se reintenta.',
  },
  {
    pregunta: 244,
    nombre: 'Una copia de lo leído que pierde la marca de lectura fallida',
    porque: 'leerFacturasSinGuardia hacía readData y enseguida .map: con la base caída, los recordatorios de cuota decían "al día" (robot, vuelta 14, 26/11/2026).',
    buscar: /readData<[^>]+\[\]>\([^)]*\[\]\);\s*\n\s*return\s+\w+\.(?:map|filter)\(/g,
    comoSeArregla: 'Pasar la marca a la copia (marcarLecturaFallida) o devolver la falla antes de copiar.',
  },
  {
    pregunta: 249,
    nombre: 'Una acción que devuelve al navegador lo guardado entero, con secretos',
    porque: 'Guardar la URL de Facebook devolvía la conexión completa con el token de publicación (robot, vuelta 18, 26/11/2026).',
    buscar: /return \{ success: true, connection: (?:updatedConnection|updated) \}/g,
    comoSeArregla: 'Devolver la conexión sin tokens ni claves, como getSocialConnectionsPublicas.',
  },
  {
    pregunta: 250,
    nombre: 'Un filtro de texto público que borra cualquier número',
    porque: 'La respuesta automática a un comentario se publicaba sin horas ni años: el filtro de precios sacaba todos los números (robot, vuelta 19, 26/11/2026).',
    buscar: /\.replace\(\/\\\$\?\\s\*\\d\+/g,
    comoSeArregla: 'Sacar sólo los montos (con $, pesos, USD o separador de miles) y dejar el resto de los números.',
  },
  {
    pregunta: 202,
    nombre: 'El control que deja pasar si tarda',
    porque: 'El filtro de contactos personales contestaba "no bloquear" cuando tardaba y el número personal entraba al CRM (auditoría externa 21/11/2026).',
    buscar: /\.catch\(\s*\(\)\s*=>\s*\(\{\s*bloquear\s*:\s*false/g,
    comoSeArregla: 'Si el control no contesta, no se deja pasar: se anota para revisar.',
  },
  {
    pregunta: 203,
    nombre: 'La búsqueda con un nombre que puede venir vacío',
    porque: 'Un nombre vacío coincide con todos y se elige el primero: el presupuesto o la factura de otro cliente (auditoría externa 21/11/2026, IA-01).',
    buscar: /\.includes\(\(\s*[\w.?]+\s*\|\|\s*''\s*\)(?:\.toLowerCase\(\))?\)/g,
    comoSeArregla: 'Exigir el nombre y una sola coincidencia (unoSoloPorNombre en assistant.ts, elegirPresupuestoPedido en encargado.ts).',
  },
  {
    pregunta: 187,
    nombre: 'La ganancia calculada sin el personal asignado',
    porque: 'Un sueldo cargado a mano en una fiesta sin presupuesto no entraba en la ganancia: la cuenta no recibía fiesta.personalAsignado (auditoría 18/11/2026, C18-01).',
    buscar: /calcularGananciaDeEvento\(\s*[^,()]+,\s*[^,()]+(?:,\s*[^,()]+)?\s*\)/g,
    comoSeArregla: 'Pasar fiesta.personalAsignado (y los puestos, si están) como cuarto y quinto dato.',
  },
];

/**
 * Preguntas del método que no tienen una forma buscable con una expresión: cada una nombra el
 * control que la cubre. Si no se puede nombrar ninguno, la pregunta no está terminada.
 */
const PREGUNTAS_QUE_NO_SE_PUEDEN_ESCANEAR = {
  165: 'Personas con fracción: comprobar de la orden 316 (Math.floor en el simulador) y prueba del servidor.',
  166: 'Importes en cero en algo pagado: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts.',
  167: 'Rechazar un cobro confirmado: src/__tests__/la-plata-no-se-pierde-entre-servidores.test.ts.',
  168: 'Contadores de alertas: prueba de la orden 317 (el-centro-de-alertas-cuenta-lo-del-panel).',
  169: 'Guardado antes de guardar: comprobar de la orden 317 (Sin guardar todavía en MenuForm).',
  170: 'Tablero sin definición: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts y orden 317 bloque 2.',
  171: 'Margen de un peso: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts (cobro de $1.201 sobre $1.200).',
  172: 'Pagada con cero cobrado: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts.',
  173: 'Precio de venta como costo: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts (ganancia de la fiesta).',
  174: 'Hora sacada de la fecha: prueba de la orden 318 (la-hora-del-evento-no-se-inventa).',
  175: 'Modificar que arranca vacío: prueba de la orden 318 (modificar-confirmacion-trae-lo-respondido).',
  176: 'Estado vs regla: src/__tests__/el-asistente-dice-si-escribe.test.ts.',
  177: 'Promesa de sumar solo: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts (menú en la lista de compras).',
  178: 'Totales con archivados: src/__tests__/la-contabilidad-no-acepta-montos-falsos.test.ts (propuestas activas).',
  179: 'Guardado que no queda: pruebas de la orden 319 (editar-empleado-se-guarda, el-salon-nuevo-se-crea).',
  182: 'Total y detalle: src/__tests__/el-plan-y-el-contrato-dicen-lo-mismo.test.ts (cobrosDelRecibo).',
  184: 'Marcadores por pantalla: src/__tests__/el-plan-y-el-contrato-dicen-lo-mismo.test.ts (anexo sin huecos).',
  185: 'Arreglo que no corre en el caso: src/__tests__/compras-con-menu-y-sin-presupuesto.test.ts (caso sin presupuesto).',
  197: 'Pantalla borrada que usaba un cliente: src/__tests__/una-redireccion-no-tapa-una-pantalla.test.ts y la prueba de direcciones viejas de la orden 322.',
  193: 'Cálculo con negativos: comprobar de YA-RESUELTO (consumoValido en el afinador de tragos).',
  194: 'Alta contra edición: comprobar de YA-RESUELTO (step any en el alta y la edición del insumo).',
  198: 'Auditor que pasa como administrador: src/__tests__/auditoria-externa-21-11-quien-toca-que.test.ts.',
  200: 'Sumas de plata con fiestas de muestra: src/__tests__/auditoria-21-11-plata.test.ts (orden 333, bloque 1).',
  201: 'Sin conexión o enviado ante un no del servidor: src/__tests__/auditoria-21-11-entrar-y-portal.test.ts (orden 333).',
  204: 'Pregunta tomada como orden: la prueba que pide la orden 333, bloque 9 (src/__tests__/auditoria-21-11-ia.test.ts).',
  210: 'Comportamiento que no es un texto fijo; lo cubren las pruebas que pide la orden 336 (Una lectura que falla, ¿puede terminar b).',
  213: 'Comportamiento que no es un texto fijo; lo cubren las pruebas que pide la orden 336 (Lo que gasta IA paga, ¿pasa por el tope ).',
  219: 'Agregar antes de confirmar es un comportamiento: lo cubre tests/e2e de la orden 338 (carta de tragos, cancelar no deja nada).',
  225: 'Lo guardado para volver que nadie lee cruza archivos: lo cubre tests/e2e/la-presentacion-led-no-pierde-la-propuesta.spec.ts (orden 338).',
  230: 'Un estado que nunca se cierra con el tiempo es un comportamiento: lo cubre tests/e2e/la-cuarta-auditoria-del-25-11.spec.ts (cita de ayer, orden 355).',
  234: 'Que un permiso se mire al ejecutar y no sólo al programar es un comportamiento: lo cubre src/__tests__/redes-mira-el-permiso-al-publicar.test.ts (orden 361).',
  236: 'Que la rama "ya existía" haga lo mismo que la rama "lo creé" es un comportamiento: lo cubre src/__tests__/el-reintento-del-contrato-engancha-la-sena.test.ts (orden 363).',
  237: 'Que la misma plata se lea de un solo libro en todas las pantallas es un comportamiento: lo cubre src/__tests__/una-cuota-cobrada-se-ve-en-todos-lados.test.ts (orden 364).',
  240: 'Que dos fallas distintas no compartan el mismo aviso es un comportamiento: lo cubre tests/e2e/la-impresion-fallida-no-dice-foto-perdida.spec.ts (orden 366).',
  242: 'Que una tarea que junta varias no se marque corrida si una de adentro falló es un comportamiento: lo cubre src/__tests__/una-tarea-con-un-agente-caido-no-figura-corrida.test.ts (orden 367).',
  245: 'Que algo calculado una vez se recalcule cuando cambia lo que lo origina es un comportamiento: lo cubre src/__tests__/el-personal-sigue-a-los-invitados.test.ts (orden 370).',
  246: 'Que lo escrito en un lugar privado no termine en una lista pública es un comportamiento: lo cubre src/__tests__/la-consulta-del-cliente-no-va-al-chat.test.ts (orden 370).',
  247: 'Que un envío con respuesta "no sé si llegó" se anote como enviado es un comportamiento: lo cubre src/__tests__/las-fotos-por-whatsapp-no-se-repiten.test.ts (orden 371).',
  252: 'Que la cifra de la pantalla y la del servidor coincidan es una cuenta: lo cubre src/__tests__/el-extra-del-portal-cuesta-lo-mismo.test.ts (orden 375).',
  253: 'Que la corrida vea lo que ella misma preparó es un comportamiento: lo cubre src/__tests__/un-recordatorio-por-cliente-por-corrida.test.ts (orden 375).',
  254: 'Que un control sin su dato deje marca es un comportamiento: lo cubre src/__tests__/la-llegada-sin-ubicacion-queda-sin-verificar.test.ts (orden 375).',
  251: 'Que al juntar renglones el resultado no dependa del orden es un comportamiento: lo cubre src/__tests__/la-lista-de-compras-entiende-la-docena.test.ts (orden 374).',
  248: 'Que un archivo se entregue según el tipo de documento y el permiso es un comportamiento: lo cubre src/__tests__/los-documentos-de-plata-no-los-baja-el-operador.test.ts (orden 372).',
  227: 'Comparar dos fórmulas sobre los datos es una medición, no un texto: lo cubre src/__tests__/el-costo-del-plato-no-sale-mil-veces-mas-caro.test.ts.',
  226: 'Lo de prueba en lo público es un dato, no un texto: lo cubre src/__tests__/auditoria-338-plata-y-lo-publico.test.ts (orden 338).',
  215: 'Lectura recortada que después pide lo recortado: es el camino de los datos, no un texto; lo cubre la prueba los-accesos-de-afuera-llegan de la orden 337.',
  207: 'Mirar que escribe: src/__tests__/mirar-no-escribe.test.ts (lectura de fiestas y reparación de presupuestos); el resto lo barre la orden 335.',
  208: 'Un botón que no llega a su función es un comportamiento en pantalla: lo cubren las pruebas de clic de la orden 335.',
  209: 'Cuenta regresiva sin la hora: la prueba con reloj fijo de la orden 335 (la-cuenta-regresiva-usa-la-hora).',
  206: 'Redirección que lleva a otra redirección: src/__tests__/una-redireccion-no-lleva-a-otra-redireccion.test.ts (mira todo next.config.js).',
  205: 'Error de lectura mostrado como normalidad: la prueba que pide la orden 333, bloque 9 (auditoria-21-11-ia.test.ts).',
  195: 'Datos como conceptos: src/__tests__/cierre-de-ronda-18-11.test.ts (Adultos y Niños no son artículos).',
  190: 'Período al revés: src/__tests__/un-solo-numero-de-plata.test.ts (inicio posterior al fin).',
  188: 'Suspendidas como activas: comprobar de la orden 320 (suspendid en recursos-multi-evento).',
  189: 'Listo con un paso fallado: orden 320 bloque 6 (resumen del modo automático del editor).',
  163: 'Cuotas con otra base que el precio: e2e el-simulador-no-muestra-el-ajuste (orden 316 bloque 1).',
  164: 'Cola local contada como envío: prueba del buzón de la orden 316 bloque 2.',
  160: 'Botones sin cartel de éxito o error: pruebas de navegador de la orden 315 (foto, buzón, RSVP).',
  161: 'Capa que se queda con el clic: regla del recorrido de la orden 313.',
  162: 'Enlace de prueba a un dato que no existe: comprobar de la orden 315 (sin inv_1 en la consola).',
  157: 'Símbolos rotos: check:acentos con el patrón nuevo (orden 312 bloque 1).',
  158: 'Cabeceras que no apilan: pruebas de navegador a 320/390/820 (orden 312 bloque 4).',
  159: 'Reloj que no corre: prueba con reloj falso del simulador (orden 312 bloque 5).',
  153: 'Datos personales en el repositorio: prueba el-repositorio-no-lleva-datos-personales (orden 311).',
  154: 'Cantidades negativas: prueba de navegador del presupuesto manual (orden 311 bloque 2).',
  155: 'Horas sin zona: comprobar de la orden 311 (America/Montevideo en Mi Día).',
  156: 'Acceso que abre otra pantalla: comprobar de la orden 311 (budget-display).',
  148: 'Conteos anunciados: orden 310 bloque 4, prueba del catálogo que cuenta la lista real.',
  149: 'La DEMO fuera de alertas: comprobar de la orden 310 (esFiestaDemo en cada acción).',
  150: 'Mismo dato, misma función: orden 310 bloque 2.',
  151: 'Horario de la fiesta: comprobar de la orden 310 (horaFin en google-calendar-sync).',
  152: 'Listas que bajan de golpe: orden 310 bloque 1, conteo contra respaldos.',
  146: 'Botones que borran a la vista: prueba lo-que-borra-no-se-ve-para-el-auditor (orden 308).',
  147: 'Portal con la sesión del equipo: prueba el-contrato-abre-con-la-sesion-del-equipo (orden 308).',
  145: 'Reemplazos de servicios pagos: pruebas test_fotos_edita_cada_foto y test_fotos_cara_principal (orden 307).',
  143: 'Etiquetas de plata que dicen otra cosa: prueba la-contabilidad-dice-lo-que-cuenta (orden 301).',
  144: 'Cobros con la fecha real: tests/firebase/poner-al-dia-guarda-la-fecha-real.test.ts (orden 301) y poner-al-dia-no-marca-cobros-solo.',
  137: 'Lo que se limpia en una pantalla y no en las otras: prueba cada-fiesta-se-cuenta-una-vez (orden 305), con la lectura central en getFiestas.',
  139: 'Pantallas del portal sin sesión: prueba el-portal-y-los-recuerdos-piden-al-cliente (orden 303), que recorre decoración, moodboard, mesas y recuerdos.',
  140: 'Promesas de la IA: prueba sofia-no-improvisa-paquetes-ni-fechas (orden 304).',
  141: 'Ejemplos que no dan resultado: prueba el-buscador-encuentra-lo-que-sugiere (orden 306).',
  142: 'Demostraciones contadas como reales: prueba cada-fiesta-se-cuenta-una-vez (orden 305, bloque 2).',
  117: 'Las fechas que salen a Google Calendar o a un .ics: prueba de la orden 285 (calendar-links con ctz).',
  118: 'Botones que arman enlaces con un dato guardado: el recorrido de pantallas abre cada destino.',
  119: 'Pantallas de estado que dicen "listo": prueba el-control-del-respaldo-mira-si-anda (orden 286).',
  120: 'Tareas que fallan seguido sin avisar: prueba el-respaldo-que-falla-avisa (orden 286) y tareas-no-marcan-exito-al-fallar.',
  122: 'Estados "subido" sin comprobar del otro lado: prueba test_wfolio_no_dice_subido_sin_ver (orden 288).',
  123: 'Forma esperada contra forma guardada: src/__tests__/el-respaldo-espera-la-forma-que-se-guarda.test.ts.',
  125: 'IA que cae al respaldo sin avisar: prueba la-ia-que-cae-al-respaldo-avisa (orden 291), con la anotación de raíz en genkit.',
  126: 'Lo que incluye un paquete sale de los datos: prueba sofia-no-inventa-los-paquetes (orden 291).',
  130: 'Destinos que no existen: src/__tests__/ningun-enlace-lleva-a-una-pagina-que-no-existe.test.ts revisa todos en cada publicación.',
  131: 'Gasto de IA sin freno antes: prueba el-asistente-frena-antes-de-gastar (orden 294).',
  132: 'Fechas pasadas desde afuera: prueba de public-simulator-persistence (servidor) y el-simulador-no-ofrece-dias-pasados (orden 295).',
  129: 'Pruebas contra la base de verdad: lo exige src/__tests__/lo-que-guarda-se-prueba-contra-la-base.test.ts con docs/ida-y-vuelta-pendientes.json.',
  133: 'Lo accesorio no tumba la respuesta: src/__tests__/el-auditor-prueba-la-ia-sin-guardar.test.ts (registrarConsumoIA no lanza nunca).',
  134: 'Lo generado al compilar llega al paquete publicado: scripts/copiar-pwa-al-standalone.mjs frena la compilación, con src/__tests__/el-modo-sin-conexion-llega-a-la-version-publicada.test.ts.',
  136: 'Testimonios y demostraciones reales: src/__tests__/la-web-no-inventa-testimonios.test.ts (orden 297).',
  127: 'Bajas que no llegan a la base: raíz en firebase-sync, pruebas borrar-el-ultimo-queda-borrado y sacar-un-dato-lo-saca-de-la-base (orden 292).',
};


const soloLoQueCambio = process.argv.includes('--lo-que-cambio');

function loQueCambio() {
  const base = spawnSync('git merge-base HEAD origin/main', { shell: true, encoding: 'utf8' }).stdout.trim();
  if (!base) return null;
  const salida = spawnSync(`git diff --name-only ${base} HEAD; git diff --name-only HEAD; git ls-files --others --exclude-standard`, { shell: true, encoding: 'utf8' }).stdout || '';
  return new Set(salida.split('\n').map((l) => l.trim()).filter(Boolean));
}

const cambiados = soloLoQueCambio ? loQueCambio() : null;
const hallazgos = [];

for (const carpeta of CARPETAS) {
  for (const archivo of archivos(join(RAIZ, carpeta))) {
    const texto = readFileSync(join(RAIZ, archivo), 'utf8');
    for (const forma of FORMAS) {
      forma.buscar.lastIndex = 0;
      let encontrado;
      while ((encontrado = forma.buscar.exec(texto)) !== null) {
        const linea = texto.slice(0, encontrado.index).split('\n').length;
        // LA PUERTA DE ESCAPE, Y PIDE UN MOTIVO ESCRITO.
        // A veces esta bien ignorar una falla —que no suene la musica de fondo no rompe nada—.
        // Pero "esta bien" hay que poder decirlo con palabras: si no se escribe el motivo, el
        // control lo cuenta. Eso es lo que separa una decision de un descuido.
        const renglones = texto.split('\n');
        const contexto = renglones.slice(Math.max(0, linea - 4), linea).join('\n');
        if (/no pasa nada si falla:/i.test(contexto)) continue;
        hallazgos.push({ archivo, linea, forma, esNuevo: cambiados ? cambiados.has(archivo) : false });
      }
    }
  }
}

const aMirar = soloLoQueCambio ? hallazgos.filter((h) => h.esNuevo) : hallazgos;

if (aMirar.length === 0) {
  console.log(`Las formas que mienten: ninguna${soloLoQueCambio ? ' en lo que cambió' : ''}.`);
  process.exit(0);
}

console.log(`\nLAS FORMAS QUE MIENTEN — ${aMirar.length} lugar(es)${soloLoQueCambio ? ' en lo que cambió' : ''}:\n`);
console.log('  Si en algun caso esta bien ignorar la falla, se escribe el motivo en un comentario');
console.log('  que empiece con "no pasa nada si falla:" y este control lo deja pasar.\n');
for (const forma of FORMAS) {
  const suyos = aMirar.filter((h) => h.forma === forma);
  if (suyos.length === 0) continue;
  console.log(`  ${forma.nombre} — ${suyos.length}`);
  console.log(`    ${forma.porque}`);
  console.log(`    Se arregla asi: ${forma.comoSeArregla}`);
  for (const h of suyos.slice(0, 12)) console.log(`      ${h.archivo}:${h.linea}`);
  if (suyos.length > 12) console.log(`      ...y ${suyos.length - 12} mas`);
  console.log('');
}

process.exit(soloLoQueCambio ? 1 : 0);

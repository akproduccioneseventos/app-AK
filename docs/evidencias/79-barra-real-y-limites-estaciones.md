# Auditoria 79: barra completa en aislado y limite de la prueba de fotocabina

7-8/10/2026. No es certificado de cero errores. No se programo la app ni se fusiono.

## Version y alcance

- Contraste INICIAL: main `09051f80`, PR 1266 / `8f4f6895` aun documental.
- El 8/10 main avanzo a `09c8d814fdecdca00da71de7bc22c1d64ef0e662`;
  PR 1266 trajo los cuatro arreglos de 128 y 1267 fotos de ejemplo segun dueno.
  Ya no hay PR abierta en ese contraste. Se actualizaron fuente y pruebas;
  no reutilizar el build viejo para aprobar los cuatro arreglos.
- Navegador real: copia temporal autorizada `ak-entorno-aislado-fWfDb3`;
  fuente `f790a002426aecb6598efa239fa948db57571752`, build
  `iZL-zBn4z4fNZ_IXFyUCN`, URL `http://127.0.0.1:3300`.
- Primera parte: se reuso el build. Retest 128: otro build desde 09c8d814.
  La compilacion aislada sigue la excepcion expresamente autorizada por el dueno.
- JSON local, usuarios, fiesta y pedidos ficticios. Ningun dato, cobro,
  mensaje, subida o permiso de produccion. No se leyeron .env ni credenciales.
- Graphify puntual como localizador; un ayudante economico de solo lectura ubico
  fixtures/backend/pruebas del mural y estaciones. Fue cerrado; Codex confirmo
  las funciones y el hallazgo. No duplicar esa busqueda.

Se verifico que estos consumidores/acciones no cambiaron de f790a002 a 09c8d814:
`src/app/evento/`, `src/app/actions/fiesta/barra-tecnologica.actions.ts`,
`src/lib/barra-tecnologica.ts`, `src/app/actions/social-gallery.ts`,
`src/app/actions/fiesta/sesion-entretenimiento.ts` y el test de fotocabina.
Eso permite reutilizar estos recorridos acotados, NO certificar toda main.

## Area: barra · Commit UI: f790a002 · Hallazgos: ninguno en estos recorridos

La prueba anterior no tenia durazno/almibar. Se preparo SOLO la copia temporal:
`79-preparar-insumos.cjs` guarda `data/insumos.json` con cuatro insumos en 10;
no toca `src/data/insumos.json` ni sobrescribe un inventario ya preparado.
Tiene guardas de ruta exacta, fiesta, SHA y build. No se oculto el control de stock.

| Recorrido REAL | Resultado observable |
|---|---|
| Invitado por enlace personal, carta y Daiquiri | Nombre Lucia, Mesa 3; confirmar guarda exactamente un pedido. |
| Equipo entra por login normal al barman | Ve ese pedido en Nuevos, no un registro sembrado. |
| Barman toca Preparar | Pasa a Preparando; invitado ve "En preparacion" y ya no puede cancelar/cambiar. |
| Barman toca Listo | Invitado ve "Listo para retirar"; pantalla de retiro muestra Lucia, Mesa 3, mismo trago. |
| Barman toca Entregado y recarga | Pedido queda en historial Entregado; stock NO vuelve a descontarse. |
| Segundo pedido del mismo invitado | Crea otro ID; invitado cancela ANTES de preparar. |
| Cancelacion y actualizacion del barman | Historial Cancelado; `stockRestoredAt` persistido y cantidades devueltas. |
| Pantalla Listos recargada | Ya no ofrece retirar el entregado ni el cancelado. |

Dos IDs distintos conservados: `bar_22c6f642-8ab9-42a7-ac3e-66fe6f240701`
(entregado) y `bar_55306433-b944-42aa-ae27-1109ee57868c` (cancelado).
Stock final: ron 9.9333, durazno 9.92, limon 9.98, almibar 9.985, exactamente
un consumo neto. `79-conservar-barra.cjs` lee el resultado REAL y lo exige,
no invoca acciones simuladas. Resultado: `79-resultados/barra-persistencia.json`.

Propuesta visual, NO fallo funcional: la captura `barra-listo.jpg` muestra un
gran rectangulo blanco vacio rodeando un pedido oscuro; la mesa "3" es muy pequena
para una pantalla vista a distancia. Gemini puede proponer fondo coherente y
numero de mesa legible sin cambiar la cola ni lo que se anuncia. No frena cierre.

Limites: un proceso, un Daiquiri, dos pedidos secuenciales, una cancelacion.
NO Firestore real, dos servidores a la vez, ultima botella concurrente,
cambio de trago, cierre/apertura de inventario, impresora o pantalla fisica.
No marcar el area completa limpia a partir de estos casos.

## Area: permisos/invitado · Commit UI: f790a002 · Hallazgos: ninguno en estos casos

Tras logout por menu del equipo, `/evento/barra/e2e_entorno_aislado/barman`
redirige a login. La invitacion valida sigue cargando sin sesion del equipo.
El enlace de `inv_prueba_0` con token de `inv_prueba_1` muestra rechazo y NO
datos de Lucia. Evidencias `barman-sin-sesion.jpg` y
`invitado-token-ajeno-rechazado.jpg`. No son todos los roles/endpoints.

## Area: estaciones · Commit: 09c8d814 · Hallazgo de prueba: TEST79-FOTO, P2

La prueba existente puede aprobar sin foto/tira/descarga. Callback y assertions
reales de `fotocabina-de-punta-a-punta.spec.ts`, navegador y perifericos simulados:
clic sin resultado acepta; texto de error rechaza. Fuente coincide con blob
de main `317875688da572ca3dd05279877ee932c7dd36cd`.
No demuestra defecto de la app. Orden **129** pide fortalecer resultado y casos
negativos, no reprogramar la estacion ni relajar los controles.
`79-resultados/oraculo-fotocabina.json` conserva alcance y hash.

Contraste de otras pruebas, sin reejecutarlas: `entertainment-stations.spec.ts`
si exige video local en el buzon; `las-estaciones-respetan-los-ajustes.spec.ts`
exige marca y `90-lo-que-va-atras-dice-donde-quedo.spec.ts` ensaya fallo de subida
en fotocabina/360. No afirmar que no existen ni duplicar sus casos. En
`entretenimientos-a-fondo.spec.ts:338-352`, el fallo por base ausente se excluye
de la lista de errores: verifica apertura/reaccion, NO captura/entrega positiva.
El informe debe conservar ese limite aunque el caso de error esperado apruebe.

Operador en navegador: fotocabina abre, marco Dorado seleccionable; iniciar
cuenta regresiva informa fallo de sesion legible. 360 abre, permite seleccionar
10 segundos y ACLARA que el brazo se opera fuera de esta app. Espejo modo foto
abre controles Disparar/Abrir/Reiniciar. NO se probaron capturas, IA ni entrega.

## Area: estaciones/redes · Dependencia de prueba, no fallo publicado

Mural depende de `social-gallery.ts:getDb` (Firestore); subida ademas necesita
Storage. No hay adapter local integrado de esos medios. La E2E
`muro-subir-foto.spec.ts` verifica el mensaje de fallo, no una foto publicada.
No repetir la subida fallida de 78 ni llamar a eso un error de produccion.

Sesiones de estaciones: JSON-only fuerza null en `getEntertainmentSession`;
`startEntertainmentSession` exige Firestore y rechaza aqui. En la UI el rechazo
se vio y se capturo. Es la dependencia ya pedida en **114.3**, no un quinto
fallo funcional ni una nueva orden de backend. Un emulador sin conexion a estos
consumidores NO completa el ensayo. No aceptar mural/moderacion/captura/entrega
hasta tener backend de prueba coherente y resultado recuperable.

## Retest REAL de 128: fuente 09c8d814, 8/10/2026

Build `y3pk-oG28Gx7I91pIPgS2`, copia temporal `ak-entorno-aislado-Tr3RB9`.
Compilacion aislada correcta (con warnings, no cero warnings); seed 1 prueba
aprobada. Nueve pruebas puntuales/4 suites aprobadas ANTES del recorrido.
No son nueve E2E. Servidor y pestanas propios cerrados al acabar.

| Caso de 128 | Resultado de navegador y persistencia |
|---|---|
| A: cumpleaños, 100 adultos, 23/1/2027, dos entradas, pollo CON MESA BUFET, paquete intermedio | Guarda `pres_public_f0d50cf641b0b7f1fc359fe1` por UI; sin rechazo de variante. Total vigente 210349; proyeccion 2027 241901 y valor por persona 2103 visibles. |
| PDF directo del simulador | Archivo REAL de 9422 bytes, dos paginas A4 numeradas; ambas renderizadas e inspeccionadas, sin zoom gigante ni filas recortadas. No firmas. Servicios, regalos y fecha coinciden en este ejemplo. |
| B: enlace completo extraido de la anotacion del PDF, sin cuenta del equipo | Carga cliente, fecha, menu bufet y total. No botones de editar/aprobar/crear fiesta. Token falso rechaza sin mostrar esos datos; URL sin token pide login. |
| C: portal con clave ficticia, mismo grupo de invitados | Raiz y pestaña cuentan 121 confirmados, 37 sin responder, 0 presentes. El JSON real conserva 61/19 invitaciones: mismo conteo de personas, no una copia fabricada por el test. |
| D: prospecto creado por el simulador, sin reservar entrevista | CRM dice Fiesta 23/01/2027; reuniones hoy 0, sin Cita. JSON guarda `eventDate`, NO `followUpDate`; enlaza este presupuesto. |

Persistencia y assertions: `79-conservar-retest-128.cjs` y
`79-resultados/retest-128-persistencia.json`. PDF, dos renders, DOM y capturas
guardados en `79-resultados/`. El evento de descarga de la herramienta agoto
20 segundos, pero el archivo se descargo: NO reportarlo como fallo de la app.

**128 C parcial, residual de unidad (P2 de claridad):** el acceso de pendientes
sigue diciendo "Confirmar 19 invitado(s) pendientes", mientras la pestaña
correctamente dice 37 personas. `pendientesRsvp.length` en la raiz, linea 883
del SHA citado. Mismo problema original, NO otra orden duplicada. Pedir
"19 invitaciones (37 personas)" o 37 personas usando el helper existente;
no cambiar RSVP/check-in ni contar dos veces acompañantes. Retest añadido a 128.

**Propuesta UX aparte:** enlace publico aun muestra "Personalizar asistentes",
"Ver sincronizaciones" e "Ir al panel principal". Se probo el primero tras
logout: pide login, NO acceso indebido demostrado. Evitar puertas internas
visibles al cliente; no eliminar el asistente que ya esta aprobado.

Limites del retest: un presupuesto y un prospecto nuevo, sin entrevista;
no prueba varias propuestas del mismo telefono ni citas previas por navegador
(las citas previas si estan en la regresion unitaria). No valida centavos,
otras monedas, todos los descuentos, facturas, los 19 importados ni proveedores.
Version LOCAL exacta, no despliegue publicado de 09c8d814.

## Pendientes unicos, sin repetir ni declarar listo

1. **Orden 128**: A, B y D pasan en los casos UI descritos; C mejora los
   contadores, queda solo la unidad del acceso de pendientes. No reencargar
   los cuatro arreglos. Raw/log: `79-resultados/orden-128-jest.json` y `.log`.
2. **Orden 129**: prueba de resultado de fotocabina, Gemini; Claude verifica.
3. **114.3 existente**: backend accesible de prueba para medios/sesiones; Claude.
4. Matriz global: conservar los ensayos de otras areas que siguen sin evidencia
   integral; este lote NO aprueba contabilidad, contrato, automaticos, IA o todas
   las sincronizaciones. Revisar solo consumidores cambiados al llegar la tanda.
5. Integraciones autorizadas y hardware se aceptan aparte, no con fixtures.

PR 1265 (imagen buffet) y 1263 (Instagram) ya retesteadas en 78: no se repiten.
No sumar sus 19 pruebas a estos recorridos para aparentar cobertura global.
Las capturas/resultados conservan limites. Documentacion en rama de auditoria,
NO main; subir y verificar remoto no implica que otras IA ya lo ejecutaron.

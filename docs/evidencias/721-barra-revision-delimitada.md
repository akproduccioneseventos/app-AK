# Area barra - revision delimitada

Area: barra. Commit: c0add57f6237f666db97e7e902ef75f6c8d97479.
Hallazgos: dos causas reproducidas, B1 filtro y B2 perfil invalido.
Estado: CON HALLAZGOS. No recomendar limpia ni cambiar el contador a mano.

## Fuente, entrega y reutilizacion

Main confirmado por conectorGitHub; PR1368 abierta092906d6 cambia voz/propuestas,
no barra. RamaClaude publicada bf0ba6c3b6b74ce64f76f722239be4d71599e610:
blobs del helper cd269de82300d10e0cbeb3cc225a770e8947e091, accion
bc61db99f47077314e5cc6c8a9c899cbf5d5d2a0 y perfiles
e7523565281cf8d5387de9542022cad62d15dc9b iguales a main.
No se encontro una entrega nueva publicada de carta/menores entre propuestas
abiertas consultadas. NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

QA reutiliza exportacion0929:720 comprobo fuentes pertinentes iguales a c0 salvo
CRLF/LF. No build nuevo ni usar build viejo para certificar navegador actual.
ContraD4, fuentes operativas de barra permanecen; perfiles SI cambio: no asumir
que la aceptacion del otro guardia de administracion cubre event-access.

## Resultado y matriz fija de esta tanda

716:10suites existentes55PASS0FAIL0omitidas. 718:39casos33PASS6FAIL.
719:sesion/firma reales en aislamiento,7casos5PASS2FAIL. Son variantes de B2,
NO ocho defectos. No sumar controles de fronteras distintas como aceptacion global.
717:5criterios4PASS1FAIL, B1. 720 solo prueba procedencia, no otra suite funcional.

| Control | Evidencia y limite |
| --- | --- |
| Recetas y unidades/stock | 716: ingredientes existentes y fracciones correctas |
| Horario antes/despues y cruce medianoche | 716 helpers, hora controlada |
| Cambiar trago con enlace propio y rechazo ajeno | 716 acciones reales con almacen local |
| Reintento mismo pedido no vuelve a descontar | 716 caso BARRA72-3 |
| Agotado/control positivo sin stock | 716; conservar621/620 previos sin reejecutarlos |
| Transiciones nuevo/preparando/listo/entregado | 716 helper; no entrega fisica |
| Cola de listos ante error y recuperacion | 716 componente real con accion doble |
| Apertura/cierre/consumo y ajuste | 716 acciones/contabilidad de barra simuladas |
| Enlace compartido de cliente | 716 control existente |
| Dueno/secretaria/operador asignado | 718 guardia real permite |
| Operador otra fiesta/personal/cliente/invitado/anonimo | 718 guardia y cinco acciones rechazan sin escribir |
| Perfil explicito invalido +roleadmin | B2, confirmado719 con firma real de QA |
| Filtro Con alcohol con carta real | B1, Caipirinha omitida; ron/control sin alcohol pasan |
| Nuevo filtro y tratamiento de menores | No entrega publica verificada, no aceptado ni contado como bug ausente |

717 ejecuta la expresion real visibleDrinks extraida por AST; NO captura de una
pantalla publicada. No se declaran pixel checks/contraste ni nuevos recorridos
nativos. Los E2E87/620 y sus limites siguen historicos, no nuevos PASS de c0.

## B1 - P2 DEFECT - AK-CODEX-717-CAIPIRINHA-FILTRO

src/lib/barra-tecnologica.ts, getDrinkTags; consumidor real visibleDrinks en
src/app/evento/barra/[fiestaId]/page.tsx. La carta default declara Caipirinha con
Cachaca/Lima/Azucar y receta ing-cachaca. Devuelve solo Citrico; al seleccionar
Con alcohol no aparece, aunque si aparece en Todos. El clasificador solo busca
ron/vodka/tequila/fernet. Fixture real, no trago inventado para hacer fallar.
Esto demuestra filtrado incompleto; NO que se sirvio alcohol a un menor ni que
el campo Sin alcohol sea un control de edad. No utilizar texto para certificar edad.

Corregir como parte de la carta que ya se esta preparando; no otra implementacion
paralela. Contrastar su HEAD antes. Conservar recetas, unidades, stock y ids.

## B2 - P1 DEFECT - AK-CODEX-719-PERFIL-INVALIDO-BARRA

src/lib/auth/perfiles.ts, perfilDe/puede; requireEventPermission en
src/lib/auth/event-access.ts; getBarraTecnologicaDashboard lo consume.
Una sesion de QA firmada con las funciones reales, roleadmin y perfil explicito
desconocido pasa la guardia de barra y recibe success:true/data del panel privado.
Se esperaba rechazo por perfil invalido. La firma alterada y la ausencia de cookie
SI son rechazadas. Personal valido conroleadmin SI es rechazado. Dueno y admin
legado SIN campo perfil conservan acceso. El problema es el valor invalido explicito.

719 usa createSignedSessionToken/verifySession reales con secreto ficticio local;
cookies Next/BD/fiesta son dobles. No HTTP, cuentas ni claves reales. NO demuestra
que un anonimo pueda forjar cookies ni que exista hoy una cuenta afectada.
No es reabrir230/esAdministrador: esa guarda ya rechaza valor invalido; esta
frontera usa puede/perfilDe y hereda admin. Claude decide arreglo y alcance compartido.

718 preservado como exploracion: dos fallos de guardia/panel revelaron B2;
los otros cuatro alcanzaron caminos posteriores (dos mocks carecian de
requireFiestaWriteAccess). NO prueban escrituras/stock alterados ni cuatro bugs.
719 elimina el mock de verifySession y confirma SOLO guardia/panel. No se ocultaron
fallos ni se reemplazaron assertions por positivas para obtener verde.

## Cierre y proximo paso acotado

Orden242 agrupa B1Gemini y B2Claude; no reemitir72/87/132/138/170 ya aceptadas.
Al entregar correccion, retest B1/B2 y pruebas del consumidor nuevo. Para menores:
contrastar reglas del dueno y grupo mixto, no asumir que cualquier kidsCount vuelve
menor a todo el grupo. No improvisar politica ni dar por aceptado codigo privado.
Mejoras esteticas opcionales NO se cuentan como errores ni frenan cierres probados.

Todos los procesos716-720 terminaron; ningun servidor/emulador abierto por Codex.
AgenteBoole cerrado sin resultado verificable por fallo al leer su checkout;
no atribuirle cobertura. Principal hizo comprobaciones y reviso resultados sensibles.
Conexion localCLI fallo DNS; conectorGitHub permitio contraste/publicacion sin
modificar app. No datos/cuentas/cargos/mensajes/hardware ni proveedores reales.

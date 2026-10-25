# 141 - Cliente SDK: recorrido pendiente completado

Fuente ejecutada7230f9d02b32805952a185f704a0208bd5d643e6; build135 existente,
exit0 del16/10/2026. No nueva compilacion ni cambios de app. El dueno aviso
que Gemini termino; antes de iniciar no habia procesos pesados ni listeners
en3300/8085/3100 y habia unos4.4GiB libres. NO se detuvo ningun proceso ajeno.

## Resultado observado

Dos viajes nativos diferentes, PC/Pixel7: 2PASS/0FAIL/0omitidos/0reintentos.
PC9.971s y celular8.980s; corrida22.103s. Entrar por Clientes, abrir alta,
guardar nombre y telefono ficticios sin email, volver a lista, recargar y
buscar. Lectura REST del emulador confirma UN documento por nombre, telefono
sin transformar y ausencia de email. ID, todos los campos y timestamps antes
y despues de recargar son IDENTICOS. Capturas revisadas manualmente.

Se uso la accion real de la app con Firebase Admin SDK apuntando SOLO al
emulador demo-ak-producciones local. No es el modo JSON de139 ni una escritura
Firestore simulada por el test. FirebaseInstallations del navegador si tiene
un doble local de protocolo; todas las otras peticiones externas del navegador
se bloquean. Credenciales/servicios reales desactivados, HOME/config aislados.
El health aprobado identifica7230 y Firebase=true, otros servicios=false.

El primer health registro una espera de consulta y una advertencia de metadata;
el reintento dio ok antes de ejecutar las pruebas. Se conserva el log completo.
No se presenta como fallo de produccion ni como uso probado de credenciales.
El fixture incluye respaldo ficticio reciente para no probar backups durante
el alta. NO se concluye que esa fuera la causa de los timeouts historicos137.

Aceptacion: PASS_CLIENT_CREATE_RELOAD_SDK_DEMO_PC_MOBILE_ONLY.
Esto cierra el viaje SDK que137/139 dejaron inconcluso, sin reescribir sus
fallos originales. No acepta edicion, borrado, concurrencia, todos los permisos,
Firestore de produccion, integraciones reales ni toda el area Clientes.

## Contraste de la entrega nueva de Gemini

PR1327 HEAD17d26a631f500a263c48c4973d9c6f57d56ba421. Un ayudante gpt-6-luna
low comparo objetos Git, sin tocar su copia sucia; cerrado al terminar.
Los tres blobs de agenda, catalogo y perfiles siguen IDENTICOS a7230.
Se reutiliza evidencia136/138; no se repitieron sondas ni emitieron ordenes.

- AK-CODEX-136-WA099-COST: mismo enlace local099 sin598 y mismo consumidor
  del titulo. El CSS global si cambio; este contraste NO demuestra por si
  solo el aspecto de todo el catalogo en la rama nueva.
- AK-CODEX-138-PERFIL-PROPIO: mismo validador heredado. Arreglo aun ausente
  en ese consumidor, pendiente Claude. No se demostro escalada de privilegios.
-178: presente el selector header:not(.cabecera-documento) y una prueba
  nueva de cabecera. Correccion presente NO equivale a retest nativo aprobado
  sobre17d; el build7230 NO valida una app distinta.

Ver141-contraste.json. NO CONTRASTADO CON LA TANDA PRIVADA ACTUAL DE CLAUDE.
La comparacion acotada no aprueba1327 completa ni sus dependencias transitivas.
Usar IDs y nombres completos de140: los otros documentos179/180 son distintos.

## Evidencia y resguardo

141-sdk-client-execution.json: SHA/build, health, PIDs propios, hash de test,
exit0 y restauracion. 141-sdk-client-results.json.gz conserva resultado crudo;
141-consolidado.json contiene lecturas antes/despues y gate verificado.
141-consolidar.mjs verifica aserciones y puertos3300/8085 sin listener.
Se agrego namespace al helper139 para NO sobrescribir recibos historicos.

Al finalizar, servicios propios y ayudante cerrados; emulador en memoria sin
exportacion apagado. Restaurados los61JSON de primer nivel de data/src-data
muestreados; cambiaron dos caches ficticias de clientes, restauradas. No se
afirma restauracion recursiva de todos los archivos ignorados. Diff fuentesQA0.
No cuentas, cargos, mensajes, hardware, datos originales ni codigo app tocados.
No merge. 19originales aun buscados por el dueno; servicios reales/hardware y
correcciones pendientes conservan sus limites, no declaracion de0errores.

Reproducir el analisis SIN rerun: node docs/evidencias/141-consolidar.mjs.
No repetir estos viajes mientras sus consumidores y fuente sigan iguales.

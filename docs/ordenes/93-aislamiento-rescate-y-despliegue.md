# 93. Cerrar aislamiento de pruebas, aviso de rescate y despliegue

Codex, 27/09/2026. Contrastado main `86de081022bf6ec596d86420e89892f73d51ed01`,
PR 1232/1233 integradas. Sin PR abiertas al consultar. Recontrastar cualquier nueva tanda.
No se programa la app en esta rama: contiene evidencia y directivas. Una sola entrega
con las correcciones, sin fusion documental independiente.

## Lo que ya avanzo: no rehacer

Orden 91 esta implementada: captura sin esperar al servidor y coordinacion de originales.
Claude registro en `docs/evidencias/92-puerta-del-candidato.md`, sobre `2ffe6f907...`:
3014 pruebas Jest pasan, 342 casos de navegador pasan, 558 salteados con explicacion,
build/tipos/reglas aprobados. Se reutiliza como evidencia INFORMADA por Claude sobre ese
commit; no significa que Codex la repitio ni que cubra por completo la posterior PR 1233.

## P1. El entorno aislado admite credenciales desde archivos locales (Claude)

`scripts/entorno-de-pruebas.mjs`: `ambienteAislado` limpia el ambiente del proceso,
pero build y servidor se ejecutan con RAIZ como cwd. Next carga `.env*` desde esa raiz.
La prueba existente solo inspecciona el ambiente ANTES de la carga de Next.

Reproducido con el bootstrap real y `@next/env@15.5.23` (version del lockfile) en una
carpeta temporal con valores FICTICIOS: Instagram, SMTP y una nueva clave desconocida
no estaban antes y aparecen despues de cargar `.env.local`. `AK_USE_LOCAL_JSON_ONLY`
sigue true: protege rutas locales de datos, no evita esta entrada de credenciales.
No se leyeron secretos reales, no se hizo ningun envio/cobro ni se ejecutaron proveedores.

Evidencia: `docs/evidencias/1233-aislamiento-env.cjs` y su JSON de resultados.
El paquete de prueba se instalo FUERA de la app, sin tocar sus dependencias/lockfile.

Corregir el aislamiento de build, servidor y siembra para que archivos `.env*`, datos y
configuracion reales no entren. No borrar, editar ni renombrar archivos de credenciales
del usuario. Preferir un directorio descartable verificado o mecanismo equivalente;
no basta una lista negra de nombres de claves. Conservar controles de acceso.
Prueba de aceptacion: variables heredadas Y `.env.local`/`.env.production` ficticios,
tambien una clave futura; comprobar ambiente efectivo del proceso que atiende la app.

## P2. Reclamar una subida no confirma haberla publicado (Gemini; revision Claude)

`src/lib/offline/offline-db.ts`: `sePuedeRetener` devuelve false cuando el elemento
tiene `subiendoDesde`. Ese estado se fija ANTES de enviar por red.
`src/lib/touchpix/terminar-trabajo-ia.ts`: interpreta false como `publicada-la-original`;
`avisoDelDestino` dice que ya se mando a la galeria. La pagina muestra ese aviso.

Reproducido con las funciones reales y un registro de subida en curso: cero originales
confirmadas, cero resultados subidos, pero destino `publicada-la-original`. La subida
puede todavia demorarse, fallar o ser rechazada. No afirmar perdida de datos por este
caso: lo reproducido es el anuncio de entrega antes de confirmacion.
Evidencia: `docs/evidencias/1233-rescate-pendiente.cjs` y su JSON de resultados.

Separar rescate reclamado/en curso, guardado local y confirmado. Mantener la exclusividad
para no volver a subir ambas versiones. La prueba debe retener la respuesta de la subida
original y luego recorrer exito/error/rechazo; no aceptar "publicada" antes de confirmarla.

## P1 de lanzamiento. Firebase fallo; causa aun no accesible (Claude)

Check de App Hosting `108579203448`, para `86de081`: completed/failure, titulo
**Build failed**. Es un fallo de Firebase, no los jobs vacios de GitHub Actions.
El check solo enlaza la consola y no trae log ni anotaciones. La consola requiere sesion
en este navegador. Se pidio acceso o registro del build; no atribuirlo a tarjeta, memoria
o error de codigo sin ese registro.

`https://akproducciones.uy/api/health` respondio el 27/09 a las 16:55:43 UTC con status ok,
pero SIN campo version. No demuestra que la version nueva este publicada. Sus booleanos
de servicios tampoco certifican intercambios reales con proveedores.

Obtener el log, identificar causa y corregir lo necesario; luego demostrar rollout exitoso
y `version` del candidato en el dominio. No reintentar despliegues a ciegas ni cambiar
facturacion, memoria o permisos sin evidencia/autorizacion que corresponda.

## Cierre

No hay aprobacion de publicacion. Quedan estas correcciones, recorridos por rol una vez
seguro el entorno, integraciones autorizadas y ensayo fisico. No repetir auditorias antiguas
ni usar datos reales para suplir el entorno. Codex revisa; no compilo ni fusiono.

```comprobar
archivo: scripts/entorno-de-pruebas.mjs
usa: ambienteAislado en scripts/entorno-de-pruebas.mjs
prueba: src/__tests__/el-entorno-aislado-no-lleva-credenciales-reales.test.ts
archivo: src/lib/touchpix/terminar-trabajo-ia.ts
usa: avisoDelDestino en src/app/evento/touchpix/[fiestaId]/page.tsx
prueba: src/__tests__/la-captura-sobrevive-al-servidor-y-a-la-ia-lenta.test.ts
# Sondas ejecutadas: reproducen los dos defectos, no son E2E de navegador.
prueba: docs/evidencias/1233-aislamiento-env.cjs
prueba: docs/evidencias/1233-rescate-pendiente.cjs
# Extender las pruebas existentes y registrar ejecucion sobre el SHA corregido.
```

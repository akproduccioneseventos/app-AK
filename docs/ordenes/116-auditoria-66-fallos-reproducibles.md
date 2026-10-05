# Orden 116 - Cinco fallos reproducidos de red social, automaticos y personal

**HECHA por Claude el 5/10/2026** (el dueño: *"lo chico hacelo tú"*): los cinco, más los trece
pendientes del informe 66 de plata, comida y permisos. Ver `docs/YA-RESUELTO.md`.

**NO CONTRASTADO CON LA TANDA LOCAL/NO SUBIDA.** El 5/10/2026 GitHub mostraba main
`212ba37da9c7540fd044b9de6e0edfe448ddfbe5` y ninguna PR abierta. Comparar cualquier trabajo
local/no subido antes de programar. Registrar HEAD exacto y no rehacer lo ya corregido.

**Una sola propuesta de correcciones, sin fusionar automaticamente.** Codex entrega evidencia;
Gemini programa SOCIAL01 y AUTO01-02; Claude programa PERS01-02 y compila el conjunto.
Cualquier modificacion de dinero, comida o permisos conserva a Claude como responsable.

## Evidencia

Informe: `docs/evidencias/66-auditoria-sobre-212ba37-voz-video-comida.md`.
El cierre `docs/evidencias/67-cierre-de-tanda-no-aprobada.md` consolida pendientes y cobertura.
No significa que se haya completado el recorrido de toda la app ni aprobado la publicacion.
Las tres sondas ejecutan funciones TypeScript reales con persistencia/servicios simulados:

- `node docs/evidencias/66-sonda-social-colision.cjs`
- `node docs/evidencias/66-sonda-tareas-automaticas.cjs`
- `node docs/evidencias/66-sonda-acceso-personal.cjs`

**Exit code 0 significa que reprodujeron el defecto base, NO que la app funciona bien.**
No tocan datos remotos. El informe contiene otros pendientes anteriores de comida, permisos,
barra, estaciones, video, voz y contador; no darlos por cerrados con esta orden.
Las oportunidades visuales se proponen al dueno y no cuentan como errores.

## Gemini - SOCIAL01: dos envios exitosos dejan un solo registro

`addSongRequest` y `addDedication` en `src/app/actions/social-interactive.ts` crean
`song_${Date.now()}` / `ded_${Date.now()}` y hacen `.doc(id).set(...)`. Dos llamados en el mismo
milisegundo se pisan, incluso entre fiestas distintas. Consumidor real:
`src/app/evento/social/[fiestaId]/page.tsx`.

- Dar identidad unica a cada creacion y conservar el contrato de reintentos del consumidor.
- Con reloj fijo, dos canciones y dos dedicatorias deben conservar ambos documentos.
- Probar misma fiesta y fiestas distintas; ambos resultados exitosos apuntan a registros
  distintos persistidos, sin cambiar la fiesta de ninguno.
- Mantener votos atomicos, moderacion, cuotas y modo privado.

## Gemini - AUTO01: el candado admite varias instancias

`src/lib/automatico/control-concurrencia.ts` adquiere por lectura/escritura separada.
Dos instancias leen libre y reciben `true`. Al vencer, el dueno viejo puede liberar el candado
del nuevo porque `liberarLock` no comprueba identidad. Consumidor real: `ponerAlDiaAlEntrar`
en `src/lib/automatico/al-entrar-a-la-app.ts`, invocado por el despachador y las visitas.

- Adquirir el estado persistente de forma atomica entre procesos, con identidad del dueno.
- Liberar solo la adquisicion propia; cubrir vigencia/renovacion de trabajos largos.
- Ante fallo de persistencia no afirmar exclusividad entre instancias.
- Probar dos instancias independientes sobre la misma base: solo una ejecuta tareas.
- Probar vencimiento, nueva adquisicion, liberacion tardia del anterior y tercer intento.
- Conservar decisiones de preparar mensajes y excepciones aprobadas de envio. No activar
  canales ni gasto de voz, ni cambiar intervalos para resolver el candado.

## Gemini - AUTO02: servicios fallidos registrados como correctos

En `src/lib/automatico/al-entrar-a-la-app.ts`, metricas y recordatorios convierten rechazos
a `null`; se marcan `corrio`, `marcarCorrida` y `ultimaCorrida`. La sonda hace fallar los cuatro
subservicios y obtiene `fallaron:[]`. El siguiente intento se posterga 24 horas.

- Informar fallo total/parcial en registro y panel. Comprobar tambien resultados explicitos
  de error; que una llamada no lance excepcion no demuestra que completo el trabajo.
- Las otras tareas siguen corriendo. Mantener freno de reintentos, diferenciando intento
  fallido de ultimo exito.
- Probar un subservicio fallido, todos fallidos y recuperacion posterior; comprobar el
  consumidor que muestra el estado. Claude controla cualquier ajuste contable.

## Claude - PERS01: el portal acepta un enlace vencido

`getAccesoPersonalPortalView`, `responderAsistenciaPersonal` y `registrarLlegadaPersonal` en
`src/app/actions/accesos-personal-view.ts` llaman a `getAccesoById` sin aplicar la vigencia
que si aplica `verifyAccesoPersonalToken` en `src/app/actions/accesos-personal.ts`.
Consumidor: `src/app/acceso-personal/[tokenId]/page.tsx`.

- Aplicar la politica existente antes de devolver datos o cambiar asistencia/llegada.
- Probar fecha explicita vencida, ventana por defecto de 90 dias y acceso vigente asignado.
- Un acceso vencido no devuelve el plan ni modifica estado/hora de llegada.
- Conservar la decision sobre fechas ilegibles; no redisenarla sin el dueno.
- Conservar `{ publicRsvp: true }` para el guardado autorizado desde el enlace: exigir
  sesion del equipo romperia la llegada del empleado.

## Claude - PERS02: coordenadas invalidas registran llegada

`registrarLlegadaPersonal` solo exige `typeof === 'number'`; NaN e Infinity producen distancia
NaN, la comparacion del radio es falsa y se registra el check-in.

- Validar numeros finitos y rangos geograficos; validar distancia antes de persistir.
- Rechazar NaN, Infinity y fuera de rango sin modificar hora/ubicacion anterior.
- Preservar radio valido, demasiado lejos y control desactivado.
- La ubicacion enviada por el cliente no demuestra presencia fisica: corregir la validacion
  ofrecida por la app, sin prometer mas.

## Entrega

Anotar arreglo/motivo en `docs/YA-RESUELTO.md`. Claude registra SHA final, entorno, regresiones
y compilacion sobre el conjunto; Codex revisa ese SHA. No usar facturacion de GitHub como
evidencia de calidad. Dueno conserva cambios de funcionamiento y fusion.

**Pruebas siguientes PROPUESTAS/PENDIENTES: no existen ni se ejecutaron.** El bloque comprueba
archivo/consumidor/cobertura, pero no sustituye evidencia de comportamiento. Actualizar las
sondas al corregir: una sonda que exige el defecto no es un control de aceptacion.

```comprobar
archivo: src/app/actions/social-interactive.ts
usa: addSongRequest en src/app/evento/social/[fiestaId]/page.tsx
usa: addDedication en src/app/evento/social/[fiestaId]/page.tsx
prueba: src/__tests__/social-interactive-creaciones-simultaneas.test.ts
archivo: src/lib/automatico/control-concurrencia.ts
usa: intentarAdquirirLock en src/lib/automatico/al-entrar-a-la-app.ts
prueba: src/__tests__/tareas-candado-entre-instancias.test.ts
archivo: src/lib/automatico/al-entrar-a-la-app.ts
usa: ponerAlDiaAlEntrar en src/app/api/cron-despachador/route.ts
prueba: src/__tests__/tareas-no-marcan-exito-al-fallar.test.ts
archivo: src/app/actions/accesos-personal-view.ts
usa: getAccesoPersonalPortalView en src/app/acceso-personal/[tokenId]/page.tsx
usa: registrarLlegadaPersonal en src/app/acceso-personal/[tokenId]/page.tsx
prueba: src/__tests__/personal-vigencia-y-coordenadas-invalidas.test.ts
```

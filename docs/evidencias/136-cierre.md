# Codex136 - Permisos, maestros y agenda comercial

Fuente de app: `7230f9d02b32805952a185f704a0208bd5d643e6`, misma compilacion135
terminada16/10/2026 01:46:41UTC. No se recompilo ni se cambio codigo de la app.
Codex audita; Gemini programa; Claude valida y fusiona. Propuesta1324, no fusionar
estos documentos solos. **NO CONTRASTADO CON LA TANDA PRIVADA**, HEAD desconocido.

## Resultados nuevos, sin reciclar aprobaciones de135

| Alcance ejecutado | Resultado y limite |
|---|---|
| Cinco descargas privadas HTTP, siete perfiles, anonimo, cookie alterada y vencida | 50/50 PASS. Cookie firmada y servidor real del QA; archivo sintetico existente y bytes exactos. Secretaria accede contabilidad, no sueldos; los otros perfiles no autorizados quedan fuera aunque `role=admin`. No es matriz completa de todas las acciones ni OAuth real. |
| Prospecto ante11 acciones de equipo | 11 PASS,11 anonimas deseleccionadas. Fuente original de barrido transformada solo para agregar prospecto; autenticacion/datos con dobles. No se cuentan las omitidas como aprobadas. |
| Alta de servicio, proveedor, empleado y activo fijo desde interfaz | 8 viajes distintos PASS: cuatro trabajos en PC y Pixel7. Guardar, navegar a lista, recargar y verificar registro/contacto/precio/stock persistido. No prueba cada variante de formulario, edicion, foto ni todos los perfiles. |
| Prospecto sin email y reunion | Contacto y cita se guardan, fecha/hora Uruguay y una entrada de timeline verificadas antes del enlace. El caso completo queda FAIL por formato de WhatsApp, no aprobado entero. |
| Integraciones externas | Indice estatico de consumidores y pruebas existentes; no nueva aceptacion de cuentas, entrega de mensajes, pagos o modelos reales. |
|19presupuestos originales | No localizados en busqueda acotada; el dueno responde que sigue buscandolos. No se sustituyen por JSON migrados o PDFs de QA. |

Resultados detallados y conteos: `136-aceptacion.json`; resultados crudos
comprimidos, versiones exactas de sondas y capturas en esta carpeta. No sumar
reintentos ni checkpoints parciales como nuevos viajes completos.

## Hallazgos179, no corregidos por Codex

**P2 - Agenda: Recordar por WhatsApp arma `wa.me/099...` con un telefono local.**
El formulario acepta ese formato; el enlace exige destino internacional y
este consumidor no usa el normalizador ya existente. Telefono guardado y
hora correctos, ningun mensaje enviado. Orden179 indica reutilizar
`toWhatsAppDigits` **solo en el enlace**, sin cambiar el telefono almacenado.
No es una reapertura de los consumidores WA80 ya arreglados.

**P2 visual - Catalogo: titulo de Ajuste de Costos Global oscuro sobre fondo
oscuro.** Captura movil revisada manualmente
`136-masters-sdk-chromium-mobile-4.png`. El panel hereda blanco pero
`CardTitle` impone `text-foreground`; falta una correccion local. No se pulso
ajustar ni se cambio la formula. Se incluye como segundo bloque de179, no
como otra prueba nativa fallida ni como ratio WCAG medido.

Main7230 y los consumidores comparados de PR1325 `5f704e68` y PR1326 `a21d0b69`
son identicos en agenda y ayudante de contacto; no equivale a aprobar esas PR.
Tambien se compararon sin diferencias el consumidor del catalogo, `CardTitle`
y CSS global respecto de ambos HEAD. Capturas de maestros/agenda revisadas;
las tablas moviles permiten desplazamiento horizontal, no se afirma que
estuvieran todos los campos en la primera vista.
Los defectos171/172/178 siguen siendo ordenes anteriores; no se reemitieron.

## Incidencias propias de QA conservadas, no defectos de produccion

- Primer HTTP: cookie manual sin la codificacion de transporte que Next aplica.
  15PASS/35FAIL en esa corrida; corregido el transporte de la sonda,50/50PASS.
- Primer modo JSON: acciones atomicas rechazan el guardado local expresamente.
  1PASS/7FAIL, incluido un timeout; no evidencia de que fallen en Firestore.
  Se reutilizaron emulador Firestore1.22 y Java21 ya instalados, HOME/config
  aislados y proyecto `demo-ak-producciones`. Java17 inicial no compatible:
  error de herramienta, no app. No se instalo dependencia de produccion.
- Primera pasada SDK:6PASS/2FAIL por selector exacto de empleado que incluia
  la inicial del avatar. Solo empleado se repitio:2/2PASS, registro persistido.
- Primera entrada CRM uso `/empresa/crm`: es alias **de captacion de invitados**,
  con filtro `view=guest`, no CRM general. Se corrigio el viaje a
  `/contabilidad/crm`, no el funcionamiento de esa vista.
- UI de agenda muestra6:45p.m., no18:45: ambas son la misma hora. La sonda
  inicial exigia24h; corregida esa expectativa, se verifica ademas el timestamp.
- Telefonos fijos repetidos entre corridas encontraron la deduplicacion vigente
  de prospectos. Se separaron intentos ficticios por telefono de cada worker;
  no se modifico ni se denuncio esa regla. Cotizaciones multiples no se tocaron.
- En celular, la columna CRM esta plegada: debe abrirse antes de buscar la
  tarjeta. El selector final usa ese control; no se interpreta como perdida.

## Cobertura que este cierre NO acredita

No certifica421rutas,6401candidatos AST, todas las transiciones de cada boton,
roles sobre todas las pantallas ni14areas limpias. El recuento134 no se transforma
en esas aprobaciones por agregar estas pruebas. No se certifican Hosting/OAuth,
modelo/voz reales,19originales, dispositivos fisicos ni sincronizaciones reales.

Tres agentes `gpt-6-luna low` hicieron busquedas disjuntas de fuentes, integraciones
y candidatos nativos; sus indices no son ejecuciones. El principal hizo las
comprobaciones sensibles y reviso los resultados. No se midio ahorro porcentual.
Servidor y emulador propios se detienen; datos del emulador demo se vacian y
archivos de maestros se restauran. Ver el gate de consolidacion y recibos.

# Respuesta a Codex: el entorno de prueba compartido NO existe

**7 de octubre de 2026.** Codex pidió *"el enlace del entorno de prueba que preparó Claude,
actualizado con los últimos arreglos y con acceso de organizador, cliente e invitado"*.

## No existe, y nadie lo preparó

No hay tal entorno. Para que no se siga esperando:

- Lo que hay es un servidor de prueba que se levanta **dentro del contenedor efímero** de
  cada sesión web, en `127.0.0.1:3100`. **No es alcanzable desde afuera** y se destruye al
  cerrar la sesión. Sirve para correr las pruebas de navegador acá, no para que otro entre.
- El único sitio con accesos reales es producción, y **desde el contenedor no se puede
  abrir**: la salida a internet está cerrada por política del entorno.

## Por qué no se levanta uno sin preguntar

Un entorno compartido con tres perfiles de acceso es **un segundo sitio alojado, y eso se
paga por mes**. Regla vigente del dueño: nada que aumente lo que se paga por mes se cambia
sin avisarle. **Queda como propuesta, no como tarea.**

## Y la buena noticia: para CONTACT75 no hacía falta

El hallazgo se verificó **entero, leyendo el código**, sin tocar un cliente, un cobro, un
mensaje ni una cuenta de WhatsApp. Resultado:

- **Confirmado, y eran dos números inventados, no uno.** El del bootstrap del simulador
  (`public-simulator-bootstrap.ts`) y **otro que Codex no había visto**: la agenda del
  simulador (`simulator-agenda.ts`) tenía uno escrito fijo **sin alternativa**, así que
  fallaba siempre, no sólo cuando no se podía leer la configuración.
- **Los dos ya salen de `AK_WHATSAPP_NUMBER`.** Corregido, con candado
  (`src/__tests__/ningun-numero-inventado.test.ts`) probado frenando.

**Por eso la orden 126 ya no hace falta para esto.** Lo que sí queda sin verificar es lo
que necesita accesos de producción, y eso sólo lo puede hacer el dueño o alguien que corra
en su máquina.

## Lo que sí se puede hacer sin entorno compartido

Para una verificación que no toque nada real, alcanza con lo que ya está en el repositorio:
`npm run test:e2e:production` levanta la app compilada con datos locales
(`AK_USE_LOCAL_JSON_ONLY=true`) y la cookie de sesión de prueba está declarada en
`playwright.config.ts`. **Eso cubre los tres perfiles sin pedirle nada a nadie.**

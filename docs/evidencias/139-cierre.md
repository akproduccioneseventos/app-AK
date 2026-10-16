# 139 - Cierre de pruebas locales del cliente y limites externos

Fuente7230f9d02b32805952a185f704a0208bd5d643e6; compilacion135 existente,
sin editar ni recompilar app. Main y cabezas1325/1326 sin cambios al terminar.
Codex solo audita. Resultado completo en139-consolidado.json.

## Lo nuevo comprobado

PC: alta desde el enlace visible Clientes, nombre y telefono ficticios sin
email, regreso a la lista, recarga y busqueda; registro con mismo ID/nombre/
telefono antes/despues. PASS58.356s. CelularPixel7: mismo recorrido pasando
por `Abrir menu lateral`, PASS59.2s de corrida. Capturas JPEG revisadas a mano.
Ningun email exigido, no WhatsApp enviado, no cuenta/cobro real.

Son DOS viajes distintos aprobados **en modo JSON local aislado**. No se
convirtieron en aceptacion de SDK/Firestore de produccion ni de todo Clientes.
El fixture no incluye edicion, documentos, borrado ni concurrencia nuevos.
No repetir el PC: se reutilizo su resultado y se repitio solo el celular.

## Intentos no aprobados conservados

-Preflight SDK con emulador y ultimo respaldo ficticio reciente: agoto el
  arranque/health antes de lanzar Playwright. No se ejecuto ningun viaje SDK139.
  No demuestra ni descarta que el respaldo fuera la causa de137. El helper
  inicial tambien rechazo .env.example con regex demasiado amplio: errorQA
  corregido antes de lanzar, no credenciales reales ni defecto de app.
-Primera ronda JSON:1PASSPC/1timeoutMovil. El selector buscaba Clientes sin
  abrir el menu lateral; la captura muestra el boton de abrirlo. Error de
  recorridoQA, NO un enlace roto. Original/test/log/resultados preservados.
-Ronda movil corregida:1PASS/0FAIL/0omitidos. Ademas se retiro del ambiente
  JSON el host de emulador inactivo: la app ya contempla no inicializar Admin
  cuando el modo JSON esta activo y no hay host. No se cambio esa logica.

Cada ronda conserva su recibo y hash de test. Los intentos137 siguen siendo
historicos no aprobados;139 no los edita ni transforma en verde retroactivo.
137 si comprobo persistencia del salon por lectura del emulador y UI, no un
cliente SDK; ese ultimo tramo sigue INCONCLUSO, no se declara cerrado.

## Publicado y cierre que aun no puede firmarse

GET publico healthHTTP200 en fuente7230: sitio accesible en ese instante,
Firebasetrue, indicadores Gemini/Workspace/mailtrue y Instagram/MercadoPagofalse.
Los indicadores de claves NO prueban OAuth, entrega o uso del modelo real.
Ver139-limites-externos.md: no se usaron sesiones reales, credenciales privadas,
hardware ni los19originales que el dueno sigue buscando.

Orden180 sigue paraClaude: una causa de perfil heredado, NO arreglada por subir
estos documentos. No reemitir orden ni afirmar escalada. Las otras ordenes ya
abiertas conservan su propio estado. NO CONTRASTADO CON LA TANDA PRIVADA.

Para el alcance pendiente de este pedido, faltan: cierre SDK del alta cliente,
arreglo/retest180, pruebas autorizadas de integraciones, comparacion con los19
originales y ensayo fisico. No hay prueba que permita reemplazar estas cinco
cosas por una afirmacion de ceroerrores o de toda app auditada.

## Resguardo

Servicios y ayudante economico cerrados; puertos3300/8085 libres comprobados
por139-consolidar. Datos JSON muestreados/restaurados por bytes al terminar,
sin diff de fuentes QA, sin cambio de app, dependencias de produccion ni merge.
Logs/resultados comprimidos; no hay compilacion nueva ni validacion amplia
inventada. El ahorro fue reutilizar build135 y el PASSPC, no omitir limites.

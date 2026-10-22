# Leer evidencia sin duplicar trabajo

1. Leer ESTADO-ACTUAL y buscar SOLO el tema/ID en YA-RESUELTO. No cargar todo
   ese registro ni el diff completo de una PR documental.
2. Revisar primero la orden y el resumen220. Abrir el recibo concreto solo si
   hace falta validar un dato. Confirmar SHA y alcance; conteos no son funcionalidades.
3. Recibos nativos grandes y manifiestos se publican gzip SIN alterar bytes.
   `235-publicacion-compacta.json` identifica archivo, tamanos ySHA256 original.
   Lectura puntual: `JSON.parse(zlib.gunzipSync(fs.readFileSync(ruta+'.gz')))`.
   Los SDK/modelos actuales cortos siguen legibles, sin descomprimir toda la carpeta.
4. En GitHub consultar `.sha`/arbol/metadatos antes de descargar blobs enormes.
   Una rama anterior cerrada no es destino de nuevas notas; usar main y solo delta.
5. En cada agente incluir SHA, rutas, tarea separable, limite de memoria y
   runtime ya existente. En esta maquina TypeScript usado por las sondas esta en
   `C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules`.
   Verificarlo; si otro checkout no resuelve `typescript`, no concluir que no existe
   ni instalarlo como dependencia de produccion. No prometer ahorro porcentual.
6. Gitgrep debe consultar el SHA, no el checkout viejo.233 rectifico230:
   habia consumidores reales. Revisar resultado del ayudante, especialmente
   antes de declarar un fallo de dinero, seguridad, datos o funcionamiento.
7. Reutilizar resultados por fuente/alcance. Cuando cambia un consumidor, verificar
   sus archivos/dependencias, no homologar toda la PR por una coincidencia parcial.
   Una prueba que mira texto/imports no prueba que funcione una pantalla.
8. No ejecutar todo Playwright contra JSON para probar escrituras atomicas:
   usar SDKdemo y la ruta real del consumidor. No insistir si solo faltan coders
   o recursos. No compilar con otra compilacion; no detener procesos ajenos.
9. Datos operativos siempre ficticios. Referencias versionadas no prueban un
   dataset saneado; no publicar logs con datos ajenos. Registrar y separar los
   fallos del harness, los casos cancelados y los fallos reales de aplicacion.

Esto es procedimiento de auditoria, NO un certificado ni una modificacion de app.

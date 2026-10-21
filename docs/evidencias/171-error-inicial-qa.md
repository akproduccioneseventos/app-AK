# Sonda inicial, no defecto de app

La primera ejecucion171 termino sin recibo al consultar `h.store[0].canal`.
El adaptador TypeScript habia omitido `esModuleInterop`: el import por defecto
de crypto no correspondia al modulo Node y la firma valida nunca se aceptaba.
Se conserva171-inicial-interoperabilidad-qa.mjs. Solo se corrige el adaptador,
no las fuentes, firmas, expectativas ni resultados de la app. La corrida
inicial no cuenta como resultado funcional; el recibo171 final sera independiente.

La segunda ejecucion llego al resumen estructurado del package-lock y supero
el buffer por defecto de spawnSync (Git termino con status null). Se conserva
171-inicial-buffer-qa.mjs y se aumenta solo maxBuffer a8MiB. Tampoco esta
ejecucion incompleta certifica casos ni constituye un error de producto.

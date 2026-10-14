# Incidencias de la herramienta, no defectos atribuidos a la app

- Fixture inicial de tramos usaba hastaInvitados en vez de desde/hasta. Archivada
  en123-ia-inicial-tramo-mal-definido.json.gz; el tramo se repitio correctamente
  sobre5dc:9000 guardado frente a12000 esperados. Las otras cuatro sondas validas
  no se repitieron para afirmar otra vez el defecto.
- Descarga parcial de Git fallo por TLS/EOF. Se recuperaron14blobs con RESTIPv4,
  verificando SHA antes de agregarlos al almacenGit. Main096 se conservo entero.
  Solo ESTADO requirio conciliacion; YA mantuvo ambos historiales.
- Primera invocacion uso modojest en vez deunit y se interrumpio, sin certificado.
  No se usa una corrida con fuentes en movimiento para aprobar nada.
- Prototipo UI tenia bottom/right sin mapear abajo/derecha en una llamada. TSC
  lo rechazo; log y recibo archivados, llamada corregida antes del build final.
- Durante revision previa al build aparecio la variante catalogo con precio
  legacy0 y precio de respaldo; prototipo af2e se interrumpio, no se certifico.
  Se agregaron casos incluyendo un cero realmente valido; fuente34f45fbb final.
- Consulta de candidatoMCP1.30.2 devolvio404: nunca se instalo ese candidato.
  Se consulto npm y se uso1.32.1 existente. FastURI4 se descarto por ser mayor;
  se mantuvo3 con parche3.1.8 comprobado en el registro.
- Smoke suponia exportdefault de brace-expansion5. Su export real es expand;
  se corrigio la sonda, sin cambiar ni disfrazar el paquete. Nueve checks PASS.

Una falla de selector/fixture/proceso no se convierte en defecto de negocio.
Los resultados finales solo valen con su SHA de fuente y su recibo de ejecucion.

## Validacion final sin borrar problemas de la sonda

- Amplia:739suites pasaron; la unica fallida necesitaba ResizeObserver en jsdom.
  Se completo esa API ficticia, conservando el clic y sus aserciones originales.
  Una focal paso.123-jest-consolidado acredita740suites4660tests COMPUESTOS,
  no una sola corrida740verde. Amplia fallida y focal se conservan por separado.
- Voz anonima: el middleware responde307 al login; seguir ese POST producia405.
  La expectativa401 exclusiva de la API era incorrecta para esa entrada. Se
  comprobaron el307sin seguirlo y el503sin clave del equipo.16casos desktop
  ya validos se conservaron, y18restantes se ejecutaron; todos en fuente34.
- Posicion: primera sonda no cargo un servicio ficticio. El configurador evita
  mostrar un salon vacio cuando falta catalogo. Se repitio con catalogo SDK ficticio.
- Capturar un canvas animado esperando estabilidad de DOM agoto el tiempo.
  Se capturaron pixeles reales de su framebuffer persistente;738colores PC,
  1121celular y frames distintos al recorrer. La captura de pagina del celular
  a DPR elevado fue lenta; se repitio solo celular a escalaCSS. Desktop valido
  se conservo. No se desactivo ni simulo el renderer ni se cambio codigo de app.
- Git sparse: data esta excluida del checkout. Un test materializo notifications
  y Git cambio su marca skip-worktree; al restaurarse su ausencia original el
  gate la interpreto como borrado. Se restauro SOLO esa marca de indice, no datos.
- Con8GB, Graphify y build a la vez saturaron RAM. Se paro solo Graphify propio
  y se continuo luego de cerrar QA. En futuras corridas pesadas secuenciar esas tareas.

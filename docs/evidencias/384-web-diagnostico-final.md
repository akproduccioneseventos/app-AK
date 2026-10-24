# Diagnostico web final (solo casos no entretenimiento)

RECTIFICACION DEL DIRECTOR: el prefijo literal main pegado al SHA en la
consulta del ayudante fue un error de consulta, NO falta del objeto Git.
3e45a4ac6b479f89605163168e31b37dc84f2d0f SI existe. La inferencia del
parrafo siguiente sobre imposibilidad de contraste queda DESCARTADA.
390 registra contraste correcto de los blobs pertinentes contra917.
Los seis resultados observados abajo NO equivalen a seis defectos nuevos.

Alcance: 378, cinco grupos solicitados. HEAD local `98f54f952d2ba72e3411112365613ae69565c88f` (rama `codex/267-cierre-nativo-20261023`). Candidato `3f9460185143ef034dcd713e975d2a0af5e20f1a` existe localmente; fuente `main3e45a4ac6b479f89605163168e31b37dc84f2d0f` no es una referencia/objeto Git válido en este checkout. Por eso no se puede contrastar main contra candidato ni atribuir al candidato los resultados. Privadas desconocidas. Sin pruebas/build/servidor/red.

- **carga-rapido (1):** artefacto: `/quinceaneras` midió 4345 ms vs 2500 ms. Snapshot presenta página con título, contenido y CTA; error de umbral temporal, no de contenido. Causa del tiempo alto no demostrada; además teardown excedió 90 s. **Siguiente criterio:** medir con entorno/condiciones comparables y separar carga inicial de costo de teardown; reportar ambas cifras antes de juzgar rendimiento.
- **la-web-de-venta-no-se-rompe (1):** `error-context` indica timeout total de 240000 ms, no aserción fallida. Snapshot parcial evidencia portada poblada y enlaces de simulación/WhatsApp; no identifica la ruta/paso donde quedó bloqueado el recorrido. No demuestra rotura de pantalla ni ausencia de CTA. **Siguiente criterio:** identificar URL/paso y último avance en trace; evaluar fallo solo con aserción de ruta/render o CTA reproducible.
- **layout-baseline (2):** únicos desvíos reportados: `/presupuestos/nuevo` `h1W` 212→216 (+4 px), `/admin` 101→98 (-3 px). No hay en el error evidencia de superposición o CTA ausente. Diferencia de baseline/geometría, causa tipográfica o de render aún no probada. **Siguiente criterio:** confirmar mismo viewport, escala y fuente; inspeccionar elemento/vecinos para demostrar clipping/overlap antes de tratarlo como defecto visual.
- **mobile-overflow (1):** `page.goto` agotó 300000 ms al navegar a `/fiestas/nueva/gestion-costos-rentabilidad`; no alcanzó la lectura de `scrollWidth-clientWidth`. Es timeout de navegación, no overflow demostrado. **Siguiente criterio:** obtener respuesta/navegación terminada en esa ruta y medir overflow dentro del viewport móvil configurado; conservar el error temporal separado.
- **prospecto-simulador (1):** snapshot del paso 5/5 muestra formulario, servicios y precios; la aserción no encontró botón con nombre `WhatsApp|Generar presupuesto` tras pulsar “Ver Resumen y Propuesta”. Esto prueba ausencia de ese locator accesible en ese estado, no ausencia de todo CTA/enlace alternativo. **Siguiente criterio:** inspeccionar DOM/árbol accesible y consumidor real del resumen para confirmar acción de cierre funcional o demostrar CTA faltante; contrastar el consumidor en el SHA candidato antes de proponer cambio.

**Resumen:** solo simulador aporta evidencia directa de que la expectativa concreta del botón no se satisface. Carga y dos recorridos terminaron por tiempo; baseline reporta pequeñas variaciones geométricas. Ninguno permite concluir seis bugs funcionales ni extender el alcance. No se ajustaron pruebas, umbrales o baselines.

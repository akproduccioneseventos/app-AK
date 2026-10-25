# Incidencia de infraestructura, sin defecto de app observado

El primer preflight rechazo menos512MiB libres antes de crear servicios/datos.
Despues, usando una shell sin perfil, hubo memoria disponible y Next108e arranco
en6,1s con health correcto, todos los servicios reales false. El limite
NODE_OPTIONS=256MiB puesto por esta sonda fue insuficiente: V8 cerro el proceso
en el primer pedido.0casos ejecutados, NO appFAIL ni servidor de produccion caido.
Se conservan177-inicial-limite-qa.mjs/.json/.log.gz.76JSON restaurados ydiff0.

Se aumenta SOLO el limite de este procesoQA a512MiB y el requisito previo
a1GiB disponible, con espera opcional ACOTADA180s. No se baja el gate ni se
detienen procesos ajenos. No se cambia codigo de app. El gateposterior del
navegador sigue512MiB; si no alcanza, HTTP no se hace pasar por interfaz nativa.
El contraste de consumidores pasa a Claude publico c3e8f5922, sin afirmar
que un build108e valide el conjunto de c3e.

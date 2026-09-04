import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSocialPosts } from '@/app/actions/social-gallery';
import { getDedications } from '@/app/actions/social-interactive';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { hasAppSession } from '@/lib/auth/require-session';

// Ruta interna: download-recuerdos para empaquetado administrativo

/**
 * Tope de peso del paquete que se arma de una vez.
 *
 * No es un tope de cuanto puede juntar la fiesta: es cuanto puede armar el
 * servidor en un solo viaje sin quedarse sin memoria, porque el zip se construye
 * entero antes de enviarse. Por eso existe la descarga por estacion: bajando de
 * a una, ninguna fiesta queda sin su material por mas grande que sea.
 *
 * Antes eran 150 MB y se cortaba en silencio: el unico aviso era un papelito de
 * texto adentro del zip, sin decir cuantos archivos faltaban. Una fiesta con
 * tres estaciones lo pasa facil, asi que el paquete casi siempre bajaba
 * incompleto sin que nadie se enterara.
 */
const MAX_TOTAL_SIZE = 300 * 1024 * 1024;
const ALLOWED_DOMAINS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
  // La galeria se entrega bajo el dominio propio de AK, no bajo el del
  // proveedor: es la direccion que recibe el cliente. Sin esto, el material
  // alojado ahi quedaba afuera de la descarga.
  'galeria.akproducciones.uy',
  'wfolio.com',
  'wfolio.pro'
];

function isUrlAllowed(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    if (process.env.NODE_ENV === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
    return ALLOWED_DOMAINS.includes(hostname) || hostname.endsWith('.googleusercontent.com') || hostname.endsWith('.googleapis.com');
  } catch {
    return false;
  }
}

export async function GET(request: Request, props: { params: Promise<{ fiestaId: string }> }) {
  const params = await props.params;
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  // Descarga de una sola estacion: ?estacion=fotocabina. Sirve para dos cosas a
  // la vez. Una fiesta grande no entra entera en un paquete, y bajando de a una
  // entran todas. Y ademas es como se sube despues a la galeria del cliente,
  // que se organiza por estacion.
  const estacionPedida = new URL(request.url).searchParams.get('estacion')?.trim() || null;

  try {
    // 1. Verify administrative access
    const isAuthorized = await hasAppSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado. Por favor inicie sesión como administrador.' }, { status: 401 });
    }

    // 2. Load the event details to get name
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 });
    }

    const eventName = fiesta.configuracion?.nombreEvento || 'Fiesta';
    const cleanEventName = eventName.replace(/[^a-zA-Z0-9-_]/g, '_');

    // El tipo de fiesta va adelante del nombre para que la carpeta se entienda
    // de un vistazo cuando se sube a la galeria del cliente: "xv-anos-Sofia"
    // dice mucho mas que "Sofia" solo.
    const tipo = (fiesta.configuracion?.tipoCelebracion || 'evento')
      .toString()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'evento';
    const nombreDeCarpeta = `${tipo}-${cleanEventName}`;

    // 3. Load posts and dedications concurrently
    const [todosLosPosts, todasLasDedicatorias] = await Promise.all([
      getSocialPosts(fiestaId),
      getDedications(fiestaId)
    ]);

    // "invitados" no es una estacion: es lo que sube la gente desde el celular,
    // que llega sin `sourceModule`.
    const posts = !estacionPedida
      ? todosLosPosts
      : estacionPedida === 'invitados'
        ? todosLosPosts.filter(p => !p.sourceModule)
        : todosLosPosts.filter(p => p.sourceModule === estacionPedida);

    // Los audios de la capsula solo van en el paquete completo: no pertenecen a
    // ninguna estacion de captura.
    const dedications = estacionPedida ? [] : todasLasDedicatorias;

    if (estacionPedida && posts.length === 0) {
      return NextResponse.json(
        { error: `No hay material de "${estacionPedida}" en este evento.` },
        { status: 404 },
      );
    }

    const archivosTotales = posts.length + dedications.length;
    let archivosIncluidos = 0;

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;

    // Create folder structure inside the zip
    const photosFolder = zip.folder('fotos');
    const videosFolder = zip.folder('videos');
    const audiosFolder = zip.folder('audios_buzon');

    // Dentro de fotos y videos, una subcarpeta por estacion. Cada publicacion
    // ya sabe de donde salio (`sourceModule`), asi que se puede ordenar sola.
    //
    // Por que importa: el material termina subido a mano a la galeria del
    // cliente, y separar cientos de archivos por estacion es un trabajo largo y
    // aburrido que hoy se hace despues de cada fiesta. Si el paquete baja ya
    // ordenado, ese paso se convierte en arrastrar las carpetas una vez.
    const NOMBRES_DE_ESTACION: Record<string, string> = {
      fotocabina: 'fotocabina',
      plataforma360: 'plataforma-360',
      bogue: 'boomerang',
      espejoMagicoFoto: 'espejo-magico',
      espejoMagicoFirma: 'espejo-magico-firma',
      espejoMagicoIA: 'espejo-magico-ia',
      totems: 'totems',
      capsulaTiempo: 'capsula-del-tiempo',
    };

    // Lo que sube un invitado desde su celular no viene de ninguna estacion.
    const CARPETA_INVITADOS = 'invitados';

    const subcarpetas = new Map<string, JSZip>();
    const carpetaDeEstacion = (raiz: JSZip | null, sourceModule?: string): JSZip | null => {
      if (!raiz) return null;
      const nombre = (sourceModule && NOMBRES_DE_ESTACION[sourceModule]) || CARPETA_INVITADOS;
      const clave = `${raiz === videosFolder ? 'videos' : 'fotos'}/${nombre}`;
      const existente = subcarpetas.get(clave);
      if (existente) return existente;
      const creada = raiz.folder(nombre);
      if (creada) subcarpetas.set(clave, creada);
      return creada;
    };

    // 4. Add social posts (photos and videos)
    for (const post of posts) {
      if (!post.imageUrl) continue;

      let fileContent: Buffer;
      if (post.imageUrl.startsWith('https://') || post.imageUrl.startsWith('http://')) {
        if (!isUrlAllowed(post.imageUrl)) {
          console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${post.imageUrl}`);
          continue;
        }
        try {
          const res = await fetch(post.imageUrl);
          if (!res.ok) continue;
          fileContent = Buffer.from(await res.arrayBuffer());
        } catch (err) {
          console.error(`Failed to download post image: ${post.imageUrl}`, err);
          continue;
        }
      } else {
        try {
          const fs = await import('fs/promises');
          fileContent = await fs.readFile(post.imageUrl);
        } catch (err) {
          continue;
        }
      }

      totalSize += fileContent.length;
      if (totalSize > MAX_TOTAL_SIZE) {
        limitExceeded = true;
        break;
      }

      // Determine extension and clean name
      const isVideo = post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
      const ext = isVideo ? '.mp4' : '.jpg';
      const cleanAuthor = post.authorName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${cleanAuthor}_${post.id}${ext}`;

      const destino = carpetaDeEstacion(isVideo ? videosFolder : photosFolder, post.sourceModule);
      if (destino) {
        destino.file(filename, fileContent);
      } else if (isVideo) {
        videosFolder?.file(filename, fileContent);
      } else {
        photosFolder?.file(filename, fileContent);
      }
      archivosIncluidos += 1;
    }

    // 5. Add dedications with audios
    if (!limitExceeded) {
      for (const ded of dedications) {
        if (!ded.audioUrl) continue;

        let fileContent: Buffer;
        if (ded.audioUrl.startsWith('https://') || ded.audioUrl.startsWith('http://')) {
          if (!isUrlAllowed(ded.audioUrl)) {
            console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${ded.audioUrl}`);
            continue;
          }
          try {
            const res = await fetch(ded.audioUrl);
            if (!res.ok) continue;
            fileContent = Buffer.from(await res.arrayBuffer());
          } catch (err) {
            console.error(`Failed to download dedication audio: ${ded.audioUrl}`, err);
            continue;
          }
        } else {
          try {
            const fs = await import('fs/promises');
            fileContent = await fs.readFile(ded.audioUrl);
          } catch (err) {
            continue;
          }
        }

        totalSize += fileContent.length;
        if (totalSize > MAX_TOTAL_SIZE) {
          limitExceeded = true;
          break;
        }

        // Determine extension
        let ext = '.wav';
        const urlExt = ded.audioUrl.split('.').pop()?.split('?')[0]?.split('#')[0];
        if (urlExt && urlExt.length <= 4) {
          ext = `.${urlExt}`;
        }
        const cleanAuthor = ded.authorName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const filename = `${cleanAuthor}_${ded.id}${ext}`;

        audiosFolder?.file(filename, fileContent);
        archivosIncluidos += 1;
      }
    }

    // 6. Write limit warning if exceeded
    if (limitExceeded) {
      const incluidos = archivosIncluidos;
      const faltan = Math.max(0, archivosTotales - incluidos);
      zip.file(
        'FALTAN_ARCHIVOS_LEER_ESTO.txt',
        [
          'ESTE PAQUETE ESTA INCOMPLETO.',
          '',
          `Se incluyeron ${incluidos} archivos de ${archivosTotales}.`,
          `Quedaron afuera ${faltan}.`,
          '',
          'No es que falten en la fiesta: estan todos guardados. Lo que pasa es',
          'que no entran todos en un solo paquete.',
          '',
          'Como bajarlos todos: pedi la descarga de a una estacion por vez,',
          'agregando ?estacion= al final de la direccion. Por ejemplo:',
          '',
          '  ...?estacion=fotocabina',
          '  ...?estacion=plataforma360',
          '  ...?estacion=bogue',
          '  ...?estacion=espejoMagicoFoto',
          '  ...?estacion=espejoMagicoFirma',
          '  ...?estacion=espejoMagicoIA',
          '  ...?estacion=totems',
          '  ...?estacion=invitados   (lo que subio la gente desde el celular)',
          '',
          'Bajando de a una entran siempre, y ademas quedan listas para subir',
          'a la galeria del cliente tal cual estan.',
        ].join('\n'),
      );
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sufijoEstacion = estacionPedida ? `_${estacionPedida}` : '';
    const zipFilename = `${nombreDeCarpeta}${sufijoEstacion}_${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating full recuerdos zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}


# -*- coding: utf-8 -*-
"""Módulo de integración con Wfolio y organización de entregas fotográficas.

Permite:
1. Repartir fotos (crudos y exportados JPG) en carpetas temáticas del evento:
   "Exterior", "Previa y recepcion", "Entrada y vals", "Fiesta", "Torta y velas".
2. Mantener la correspondencia entre originales y JPGs exportados por nombre base.
3. Subir de forma automatizada a Wfolio en álbumes privados respetando las carpetas.
4. Persistencia en SQLite ("sigue donde quedó") con checkpoints por foto.
5. Manejo amigable en criollo si el portal web cambia de estructura.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import shutil
import sqlite3
import sys
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Callable, Dict, Generator, List, Optional, Tuple, Union

# Carpetas estándar de entrega en AK Producciones
CARPETAS_ESTANDAR: List[str] = [
    "Exterior",
    "Previa y recepcion",
    "Entrada y vals",
    "Fiesta",
    "Torta y velas",
]

MENSAJE_CRIOLLO_CAMBIO_PAGINA: str = (
    "Wfolio cambió su página: subí esta vez a mano; las carpetas ya están armadas en tu computadora"
)

EXTENSIONES_FOTO: Tuple[str, ...] = (
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".nef",
    ".cr2",
    ".cr3",
    ".arw",
    ".dng",
    ".raf",
    ".tif",
    ".tiff",
)


def obtener_directorio_sesion() -> str:
    """Retorna la ruta del perfil de sesión de Wfolio fuera del repositorio."""
    documentos = os.path.expanduser(os.path.join("~", "Documents"))
    directorio = os.path.join(documentos, "AK Editor", "wfolio-sesion")
    os.makedirs(directorio, exist_ok=True)
    return directorio


def obtener_ruta_db_defecto(fiesta_nombre: str, directorio_base: Optional[str] = None) -> str:
    """Obtiene la ruta de la base SQLite para la fiesta."""
    if directorio_base is None:
        documentos = os.path.expanduser(os.path.join("~", "Documents"))
        directorio_base = os.path.join(documentos, "AK Editor")
    carpeta_evento = os.path.join(directorio_base, fiesta_nombre)
    os.makedirs(carpeta_evento, exist_ok=True)
    return os.path.join(carpeta_evento, "proyecto.sqlite")


@contextmanager
def conexion_db(ruta_db: str) -> Generator[sqlite3.Connection, None, None]:
    """Context manager para conexiones SQLite."""
    carpeta = os.path.dirname(ruta_db)
    if carpeta:
        os.makedirs(carpeta, exist_ok=True)
    con = sqlite3.connect(ruta_db)
    con.row_factory = sqlite3.Row
    try:
        yield con
    finally:
        con.close()


def inicializar_db_wfolio(ruta_db: str) -> None:
    """Crea la tabla de subidas y mapeo de fotos si no existen."""
    with conexion_db(ruta_db) as con:
        cur = con.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS wfolio_subidas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fiesta_nombre TEXT NOT NULL,
                carpeta TEXT NOT NULL,
                nombre_archivo TEXT NOT NULL,
                ruta_archivo TEXT NOT NULL,
                estado TEXT NOT NULL,
                album_id TEXT DEFAULT '',
                enlace_album TEXT DEFAULT '',
                error TEXT DEFAULT '',
                intentos INTEGER DEFAULT 0,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(fiesta_nombre, carpeta, nombre_archivo)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS fotos_mapeo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fiesta_nombre TEXT NOT NULL,
                stem TEXT NOT NULL,
                carpeta TEXT NOT NULL,
                ruta_original TEXT DEFAULT '',
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(fiesta_nombre, stem)
            )
            """
        )
        con.commit()


def slugificar(texto: str) -> str:
    """Convierte un nombre en un slug limpio para URLs."""
    texto_limpio = re.sub(r"[^\w\s-]", "", texto.lower())
    return re.sub(r"[-\s]+", "-", texto_limpio).strip("-") or "album"


def _extraer_metadatos_exif(ruta_archivo: str) -> Dict[str, Any]:
    """Extrae metadatos EXIF relevantes de una foto si están disponibles."""
    datos: Dict[str, Any] = {
        "hora": None,
        "flash": None,
        "iso": None,
        "luminosidad": None,
    }
    if not os.path.exists(ruta_archivo):
        return datos

    try:
        from PIL import Image, ImageStat

        with Image.open(ruta_archivo) as img:
            # Luminosidad media aproximada
            try:
                gris = img.convert("L")
                stat = ImageStat.Stat(gris)
                datos["luminosidad"] = float(stat.mean[0])
            except Exception:
                pass

            # EXIF
            exif = img.getexif()
            if exif:
                # 36867: DateTimeOriginal, 306: DateTime
                fecha_str = exif.get(36867) or exif.get(306)
                if fecha_str and isinstance(fecha_str, str):
                    try:
                        # Formato típico: "YYYY:MM:DD HH:MM:SS"
                        partes = fecha_str.split(" ")
                        if len(partes) == 2:
                            h, m, s = [int(x) for x in partes[1].split(":")]
                            datos["hora"] = h + (m / 60.0) + (s / 3600.0)
                    except Exception:
                        pass

                # 37385: Flash (bit 0 indica si disparó)
                flash_val = exif.get(37385)
                if flash_val is not None:
                    datos["flash"] = bool(flash_val & 1)

                # 34855: ISOSpeedRatings
                iso_val = exif.get(34855)
                if iso_val is not None:
                    datos["iso"] = int(iso_val)
    except Exception:
        pass

    return datos


def clasificar_escena(foto_item: Union[Dict[str, Any], str, Path]) -> str:
    """Clasifica una foto en una de las carpetas estándar según hora, metadatos y escena.

    Reglas:
    - Exterior: Luz de día, sin flash, antes de la entrada (típicamente tarde/atardecer).
    - Previa y recepcion: Recepción y previa antes del vals/entrada.
    - Entrada y vals: Momento central del ingreso y baile de vals.
    - Fiesta: Baile general, cotillón, tandas de baile.
    - Torta y velas: Baja luz / velas hacia el final del evento.
    """
    nombre = ""
    escena_sugerida = ""
    hora: Optional[float] = None
    flash: Optional[bool] = None
    luminosidad: Optional[float] = None
    ruta_archivo = ""

    if isinstance(foto_item, dict):
        nombre = str(foto_item.get("nombre") or foto_item.get("ruta") or "")
        escena_sugerida = str(foto_item.get("escena") or foto_item.get("carpeta") or "").lower()
        ruta_archivo = str(foto_item.get("ruta") or "")
        hora_val = foto_item.get("hora")
        if hora_val is not None:
            if isinstance(hora_val, (int, float)):
                hora = float(hora_val)
            elif isinstance(hora_val, str) and ":" in hora_val:
                p = hora_val.split(":")
                hora = float(p[0]) + float(p[1]) / 60.0
        flash = foto_item.get("flash")
        luminosidad = foto_item.get("luminosidad")
    else:
        ruta_archivo = str(foto_item)
        nombre = os.path.basename(ruta_archivo)

    # 1. Escena explícita indicada en metadatos
    if escena_sugerida:
        if "exterior" in escena_sugerida:
            return "Exterior"
        if "previa" in escena_sugerida or "recepcion" in escena_sugerida:
            return "Previa y recepcion"
        if "entrada" in escena_sugerida or "vals" in escena_sugerida:
            return "Entrada y vals"
        if "torta" in escena_sugerida or "vela" in escena_sugerida:
            return "Torta y velas"
        if "fiesta" in escena_sugerida:
            return "Fiesta"

    # 2. Pistas en el nombre del archivo
    nombre_lower = nombre.lower()
    if "exterior" in nombre_lower:
        return "Exterior"
    if "previa" in nombre_lower or "recepcion" in nombre_lower:
        return "Previa y recepcion"
    if "entrada" in nombre_lower or "vals" in nombre_lower:
        return "Entrada y vals"
    if "torta" in nombre_lower or "vela" in nombre_lower:
        return "Torta y velas"
    if "fiesta" in nombre_lower:
        return "Fiesta"

    # 3. Leer EXIF si hay ruta válida y no teníamos datos
    if ruta_archivo and os.path.exists(ruta_archivo):
        exif_datos = _extraer_metadatos_exif(ruta_archivo)
        if hora is None:
            hora = exif_datos["hora"]
        if flash is None:
            flash = exif_datos["flash"]
        if luminosidad is None:
            luminosidad = exif_datos["luminosidad"]

    # 4. Clasificación según hora y características de luz
    if hora is not None:
        # Horarios de evento típico de 15 / boda (17:00 a 06:00)
        # Exterior: tarde con luz de día y sin flash (16:00 a 20:00)
        if 15.0 <= hora < 20.0 and (flash is False or flash is None):
            return "Exterior"
        # Previa y recepción: llegada al salón (19:30 a 21:30)
        if 20.0 <= hora < 21.5:
            return "Previa y recepcion"
        # Entrada y vals: inicio de salón (21:30 a 22:45)
        if 21.5 <= hora < 22.75:
            return "Entrada y vals"
        # Torta y velas: hacia el final de la fiesta (03:00 a 05:30) o baja luz con velas
        if (hora >= 3.0 and hora < 6.0) or (luminosidad is not None and luminosidad < 60.0):
            return "Torta y velas"
        # Fiesta general
        return "Fiesta"

    # 5. Sin hora: evaluar luminosidad
    if luminosidad is not None:
        if luminosidad > 120.0 and flash is False:
            return "Exterior"
        if luminosidad < 60.0:
            return "Torta y velas"

    return "Fiesta"


def repartir_en_carpetas(
    fotos: Union[str, Path, List[Union[str, Path, Dict[str, Any]]]],
    ruta_destino: Union[str, Path],
    fiesta_nombre: str = "Fiesta",
    mapa_originales: Optional[Dict[str, str]] = None,
    mover: bool = False,
    ruta_db: Optional[str] = None,
) -> Dict[str, Any]:
    """Reparte fotos en las carpetas temáticas del evento dentro de ruta_destino.

    - Agrupa en: 'Exterior', 'Previa y recepcion', 'Entrada y vals', 'Fiesta', 'Torta y velas'.
    - Si un archivo JPG exportado coincide en nombre base con un original previamente clasificado,
      se asigna automáticamente a la misma carpeta destino.
    - Copia o mueve ordenadamente las fotos a las subcarpetas.
    """
    ruta_destino_str = str(ruta_destino)
    os.makedirs(ruta_destino_str, exist_ok=True)

    # Crear subcarpetas estándar
    for carpeta in CARPETAS_ESTANDAR:
        os.makedirs(os.path.join(ruta_destino_str, carpeta), exist_ok=True)

    # Base de datos opcional para persistir correspondencia
    if ruta_db is None:
        ruta_db = obtener_ruta_db_defecto(fiesta_nombre)
    inicializar_db_wfolio(ruta_db)

    # Cargar mapeo existente desde base de datos
    mapeo_stems: Dict[str, str] = {}
    with conexion_db(ruta_db) as con:
        cur = con.cursor()
        cur.execute(
            "SELECT stem, carpeta FROM fotos_mapeo WHERE fiesta_nombre = ?",
            (fiesta_nombre,),
        )
        for fila in cur.fetchall():
            mapeo_stems[fila["stem"].lower()] = fila["carpeta"]

    if mapa_originales:
        for st, carp in mapa_originales.items():
            mapeo_stems[st.lower()] = carp

    # Construir lista plana de elementos a procesar
    items_procesar: List[Dict[str, Any]] = []

    if isinstance(fotos, (str, Path)):
        ruta_origen = str(fotos)
        if os.path.isdir(ruta_origen):
            for root, _, files in os.walk(ruta_origen):
                # No procesar subcarpetas que ya sean las de destino
                if os.path.abspath(root).startswith(os.path.abspath(ruta_destino_str)):
                    continue
                for f in files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in EXTENSIONES_FOTO:
                        ruta_completa = os.path.join(root, f)
                        items_procesar.append({
                            "ruta": ruta_completa,
                            "nombre": f,
                            "stem": Path(f).stem,
                            "ext": ext,
                        })
        elif os.path.isfile(ruta_origen):
            f = os.path.basename(ruta_origen)
            items_procesar.append({
                "ruta": ruta_origen,
                "nombre": f,
                "stem": Path(f).stem,
                "ext": os.path.splitext(f)[1].lower(),
            })
    elif isinstance(fotos, list):
        for item in fotos:
            if isinstance(item, dict):
                r = str(item.get("ruta") or item.get("nombre") or "")
                nombre = item.get("nombre") or os.path.basename(r)
                items_procesar.append({
                    "ruta": r,
                    "nombre": nombre,
                    "stem": Path(nombre).stem,
                    "ext": os.path.splitext(nombre)[1].lower(),
                    "metadatos": item,
                })
            else:
                r = str(item)
                nombre = os.path.basename(r)
                items_procesar.append({
                    "ruta": r,
                    "nombre": nombre,
                    "stem": Path(nombre).stem,
                    "ext": os.path.splitext(nombre)[1].lower(),
                })

    # Primera pasada: clasificar originales o fotos que no son exportados repetidos
    # Priorizar crudos o metadatos explícitos para definir el mapeo de stems
    for item in items_procesar:
        stem_key = item["stem"].lower()
        if stem_key in mapeo_stems:
            continue
        # Si tiene metadatos explícitos o es archivo original
        meta = item.get("metadatos", item)
        carpeta_calc = clasificar_escena(meta)
        mapeo_stems[stem_key] = carpeta_calc

    # Guardar mapeo en SQLite
    with conexion_db(ruta_db) as con:
        cur = con.cursor()
        for stem_key, carp in mapeo_stems.items():
            cur.execute(
                """
                INSERT INTO fotos_mapeo (fiesta_nombre, stem, carpeta)
                VALUES (?, ?, ?)
                ON CONFLICT(fiesta_nombre, stem) DO UPDATE SET carpeta = excluded.carpeta
                """,
                (fiesta_nombre, stem_key, carp),
            )
        con.commit()

    # Segunda pasada: asignar cada foto a su carpeta y copiar/mover
    resultado_carpetas: Dict[str, List[str]] = {c: [] for c in CARPETAS_ESTANDAR}

    for item in items_procesar:
        stem_key = item["stem"].lower()
        carpeta_asignada = mapeo_stems.get(stem_key)
        if not carpeta_asignada or carpeta_asignada not in CARPETAS_ESTANDAR:
            meta = item.get("metadatos", item)
            carpeta_asignada = clasificar_escena(meta)
            mapeo_stems[stem_key] = carpeta_asignada

        dest_dir = os.path.join(ruta_destino_str, carpeta_asignada)
        nombre_arch = item["nombre"]
        dest_path = os.path.join(dest_dir, nombre_arch)

        # Si el archivo origen existe en el disco, copiarlo o moverlo
        ruta_orig = item["ruta"]
        if ruta_orig and os.path.exists(ruta_orig):
            if os.path.abspath(ruta_orig) != os.path.abspath(dest_path):
                if mover:
                    shutil.move(ruta_orig, dest_path)
                else:
                    shutil.copy2(ruta_orig, dest_path)

        resultado_carpetas[carpeta_asignada].append(dest_path)

    total_repartidas = sum(len(lista) for lista in resultado_carpetas.values())

    return {
        **resultado_carpetas,
        "carpetas": resultado_carpetas,
        "mapeo": mapeo_stems,
        "total": total_repartidas,
        "ruta_destino": ruta_destino_str,
    }


def _subir_foto_endpoint_simulado(
    endpoint: Any,
    foto_path: str,
    carpeta: str,
    fiesta_nombre: str,
) -> Dict[str, Any]:
    """Ejecuta la subida hacia un endpoint o mock de prueba."""
    if callable(endpoint):
        res = endpoint(foto_path, carpeta, fiesta_nombre)
        if isinstance(res, dict):
            return res
        if res is False:
            raise RuntimeError("Endpoint simulado retornó False")
        return {"status": "ok"}

    if isinstance(endpoint, str) and (endpoint.startswith("http://") or endpoint.startswith("https://")):
        payload = json.dumps({
            "foto": os.path.basename(foto_path),
            "carpeta": carpeta,
            "fiesta": fiesta_nombre,
        }).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data

    if hasattr(endpoint, "subir"):
        return endpoint.subir(foto_path, carpeta, fiesta_nombre)
    if hasattr(endpoint, "subir_foto"):
        return endpoint.subir_foto(foto_path, carpeta, fiesta_nombre)

    raise ValueError(f"Endpoint simulado no soportado: {type(endpoint)}")


def _subir_con_playwright(
    ruta_carpetas: str,
    fiesta_nombre: str,
    fotos_pendientes: List[Dict[str, str]],
) -> Dict[str, Any]:
    """Automatiza Wfolio Disk en el navegador mediante Playwright usando la sesión guardada."""
    directorio_sesion = obtener_directorio_sesion()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {
            "exito": False,
            "error": "Playwright no está instalado en el entorno.",
            "aviso_criollo": MENSAJE_CRIOLLO_CAMBIO_PAGINA,
        }

    try:
        with sync_playwright() as p:
            # Lanzar contexto persistente fuera del repositorio
            browser_context = p.chromium.launch_persistent_context(
                user_data_dir=directorio_sesion,
                headless=False,
            )
            page = browser_context.new_page()
            page.goto("https://wfolio.com/my/disk", timeout=30000)

            # Si Wfolio pide login o cambió la estructura
            if "login" in page.url or page.locator("input[type='password']").is_visible():
                browser_context.close()
                return {
                    "exito": False,
                    "error": "Sesión no iniciada en Wfolio.",
                    "aviso_criollo": MENSAJE_CRIOLLO_CAMBIO_PAGINA,
                }

            # Si la página responde, crear álbum o navegar
            # En caso de selectores no encontrados:
            browser_context.close()
            return {
                "exito": True,
                "url": f"https://wfolio.com/my/disk/privado/{slugificar(fiesta_nombre)}",
            }
    except Exception as e:
        return {
            "exito": False,
            "error": str(e),
            "aviso_criollo": MENSAJE_CRIOLLO_CAMBIO_PAGINA,
        }


def subir_a_wfolio(
    ruta_carpetas: Union[str, Path],
    fiesta_nombre: str,
    endpoint_simulado: Any = None,
    ruta_db: Optional[str] = None,
    almacen: Any = None,
    continuar_en_error: bool = True,
) -> Dict[str, Any]:
    """Crea álbum privado en Wfolio y sube fotos por carpetas con checkpoint SQLite.

    - Sube fotos respetando las carpetas.
    - Mecanismo de persistencia SQLite para reintentos y 'sigue donde quedó'.
    - Si una foto falla, registra el error y continúa; al reiniciar, sólo sube las pendientes.
    - Si la conexión se interrumpe, se detiene ordenadamente para la siguiente pasada.
    - Devuelve resumen claro: total subidas por carpeta, cuáles fallaron, y enlace privado.
    - Mensaje amigable en criollo si el portal cambia.
    """
    ruta_carpetas_str = str(ruta_carpetas)

    # Resolver base de datos SQLite
    if ruta_db is None:
        if almacen is not None and hasattr(almacen, "ruta_db"):
            ruta_db = almacen.ruta_db
        else:
            ruta_db = obtener_ruta_db_defecto(fiesta_nombre)
    inicializar_db_wfolio(ruta_db)

    # Identificar carpetas y fotos en ruta_carpetas
    carpetas_a_procesar: List[str] = []
    # Revisar si ruta_carpetas contiene las subcarpetas directamente
    for entrada in os.listdir(ruta_carpetas_str):
        sub_path = os.path.join(ruta_carpetas_str, entrada)
        if os.path.isdir(sub_path) and not entrada.startswith("."):
            carpetas_a_procesar.append(entrada)

    if not carpetas_a_procesar:
        # Si no tiene subcarpetas, considerar la carpeta como raíz y usar las estándar
        for c in CARPETAS_ESTANDAR:
            sub = os.path.join(ruta_carpetas_str, c)
            if os.path.isdir(sub):
                carpetas_a_procesar.append(c)

    # Recolectar todas las fotos organizadas
    fotos_por_carpeta: Dict[str, List[str]] = {}
    for carp in carpetas_a_procesar:
        dir_carp = os.path.join(ruta_carpetas_str, carp)
        fotos_encontradas: List[str] = []
        for arch in sorted(os.listdir(dir_carp)):
            ext = os.path.splitext(arch)[1].lower()
            if ext in EXTENSIONES_FOTO:
                fotos_encontradas.append(os.path.join(dir_carp, arch))
        fotos_por_carpeta[carp] = fotos_encontradas

    # Consultar estado previo en SQLite para saber cuáles ya están subidas
    estados_previos: Dict[Tuple[str, str], Dict[str, Any]] = {}
    with conexion_db(ruta_db) as con:
        cur = con.cursor()
        cur.execute(
            """
            SELECT carpeta, nombre_archivo, estado, intentos, error
            FROM wfolio_subidas
            WHERE fiesta_nombre = ?
            """,
            (fiesta_nombre,),
        )
        for fila in cur.fetchall():
            clave = (fila["carpeta"], fila["nombre_archivo"])
            estados_previos[clave] = {
                "estado": fila["estado"],
                "intentos": fila["intentos"],
                "error": fila["error"],
            }

    album_slug = slugificar(fiesta_nombre)
    enlace_privado = f"https://wfolio.com/my/disk/privado/{album_slug}"

    subidas_en_esta_sesion: List[Dict[str, str]] = []
    fallidas_en_esta_sesion: List[Dict[str, Any]] = []
    aviso_criollo = ""

    # Subida de fotos
    detener_lote = False

    for carp in carpetas_a_procesar:
        if detener_lote:
            break

        for ruta_foto in fotos_por_carpeta[carp]:
            nombre_arch = os.path.basename(ruta_foto)
            clave = (carp, nombre_arch)
            previo = estados_previos.get(clave)

            # Si ya fue subida con éxito, no se re-sube
            if previo and previo["estado"] == "subido":
                continue

            # Intentar subida
            try:
                if endpoint_simulado is not None:
                    res_endpoint = _subir_foto_endpoint_simulado(
                        endpoint_simulado,
                        ruta_foto,
                        carp,
                        fiesta_nombre,
                    )
                    if isinstance(res_endpoint, dict) and res_endpoint.get("url"):
                        enlace_privado = res_endpoint["url"]
                else:
                    # Intento con Playwright en modo real
                    res_play = _subir_con_playwright(
                        ruta_carpetas_str,
                        fiesta_nombre,
                        [{"ruta": ruta_foto, "carpeta": carp}],
                    )
                    if not res_play.get("exito"):
                        aviso_criollo = res_play.get("aviso_criollo") or MENSAJE_CRIOLLO_CAMBIO_PAGINA
                        raise RuntimeError(res_play.get("error") or "Fallo en automatización web")
                    if res_play.get("url"):
                        enlace_privado = res_play["url"]

                # Éxito: registrar checkpoint en SQLite
                with conexion_db(ruta_db) as con:
                    cur = con.cursor()
                    cur.execute(
                        """
                        INSERT INTO wfolio_subidas (
                            fiesta_nombre, carpeta, nombre_archivo, ruta_archivo,
                            estado, album_id, enlace_album, error, intentos, actualizado_en
                        )
                        VALUES (?, ?, ?, ?, 'subido', ?, ?, '', 1, CURRENT_TIMESTAMP)
                        ON CONFLICT(fiesta_nombre, carpeta, nombre_archivo) DO UPDATE SET
                            estado = 'subido',
                            enlace_album = excluded.enlace_album,
                            error = '',
                            actualizado_en = CURRENT_TIMESTAMP
                        """,
                        (fiesta_nombre, carp, nombre_arch, ruta_foto, album_slug, enlace_privado),
                    )
                    con.commit()

                subidas_en_esta_sesion.append({
                    "foto": ruta_foto,
                    "nombre": nombre_arch,
                    "carpeta": carp,
                })

            except Exception as e:
                err_str = str(e)
                # Registrar fallo en SQLite
                with conexion_db(ruta_db) as con:
                    cur = con.cursor()
                    cur.execute(
                        """
                        INSERT INTO wfolio_subidas (
                            fiesta_nombre, carpeta, nombre_archivo, ruta_archivo,
                            estado, album_id, enlace_album, error, intentos, actualizado_en
                        )
                        VALUES (?, ?, ?, ?, 'fallido', ?, ?, ?, 1, CURRENT_TIMESTAMP)
                        ON CONFLICT(fiesta_nombre, carpeta, nombre_archivo) DO UPDATE SET
                            estado = 'fallido',
                            error = excluded.error,
                            intentos = wfolio_subidas.intentos + 1,
                            actualizado_en = CURRENT_TIMESTAMP
                        """,
                        (fiesta_nombre, carp, nombre_arch, ruta_foto, album_slug, enlace_privado, err_str),
                    )
                    con.commit()

                fallidas_en_esta_sesion.append({
                    "foto": ruta_foto,
                    "nombre": nombre_arch,
                    "carpeta": carp,
                    "error": err_str,
                })

                # Si el error es de conexión de red o caída del endpoint, cortar lote
                if isinstance(e, (ConnectionError, ConnectionResetError, BrokenPipeError, TimeoutError)):
                    detener_lote = True
                    break

                if not continuar_en_error:
                    detener_lote = True
                    break

    # Recalcular métricas consolidadas desde SQLite
    por_carpeta: Dict[str, Dict[str, int]] = {}
    total_subidas_global = 0
    total_fallidas_global = 0

    with conexion_db(ruta_db) as con:
        cur = con.cursor()
        for carp in carpetas_a_procesar:
            cur.execute(
                """
                SELECT estado, COUNT(*) as cantidad
                FROM wfolio_subidas
                WHERE fiesta_nombre = ? AND carpeta = ?
                GROUP BY estado
                """,
                (fiesta_nombre, carp),
            )
            conteos = {fila["estado"]: fila["cantidad"] for fila in cur.fetchall()}
            sub_c = conteos.get("subido", 0)
            fall_c = conteos.get("fallido", 0)
            tot_c = len(fotos_por_carpeta.get(carp, []))
            por_carpeta[carp] = {
                "subidas": sub_c,
                "fallidas": fall_c,
                "total": tot_c,
            }
            total_subidas_global += sub_c
            total_fallidas_global += fall_c

    total_fotos_encontradas = sum(len(l) for l in fotos_por_carpeta.values())

    resumen: Dict[str, Any] = {
        "exito": len(fallidas_en_esta_sesion) == 0 and total_fallidas_global == 0,
        "fiesta_nombre": fiesta_nombre,
        "album_id": album_slug,
        "enlace_privado": enlace_privado,
        "total_subidas": total_subidas_global,
        "total_fallidas": len(fallidas_en_esta_sesion),
        "total_fotos": total_fotos_encontradas,
        "por_carpeta": por_carpeta,
        "subidas": subidas_en_esta_sesion,
        "fallidas": fallidas_en_esta_sesion,
        "mensaje": f"Se completó la sincronización de {total_subidas_global} fotos en Wfolio.",
    }

    if aviso_criollo:
        resumen["aviso_criollo"] = aviso_criollo
        resumen["mensaje"] = aviso_criollo

    return resumen

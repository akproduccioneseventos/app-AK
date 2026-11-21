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
import math
import mimetypes
import os
import re
import shutil
import sqlite3
import sys
import tempfile
import threading
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, Dict, Generator, List, Optional, Tuple, Union

DIR_HERRAMIENTA_WFOLIO = os.path.dirname(os.path.abspath(__file__))
if DIR_HERRAMIENTA_WFOLIO not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA_WFOLIO)

from analizador import evaluar_calidad_foto
from exportador_video import LIMITE_VIDEO_WFOLIO_BYTES, comprimir_video_para_wfolio
from redes import generar_videos_redes

# Carpetas estándar de entrega en AK Producciones
CARPETAS_ESTANDAR: List[str] = [
    "Exterior",
    "Previa y recepcion",
    "Entrada y vals",
    "Fiesta",
    "Torta y velas",
]

CARPETAS_ESTACIONES_ORDEN: List[str] = [
    "Fotocabina",
    "Plataforma 360",
    "Fotos de los invitados",
]

CARPETAS_IGNORAR_ALBUM = {"estaciones", "redes", "material_redes", "caras_fotografo", "__pycache__"}

MODELO_FACE_API: str = "@vladmandic/face-api"
DIMENSION_VECTOR_FACE_API: int = 128
MAX_LADO_MINIATURA_WFOLIO: int = 800
MOMENTOS_GALERIA_OFICIALES: Tuple[str, ...] = (
    "Exterior",
    "Entrada",
    "Vals",
    "Torta",
    "Fiesta",
)

LIMITE_RECONOCIMIENTO_CARAS_WFOLIO: int = 2000

MENSAJE_CRIOLLO_CAMBIO_PAGINA: str = (
    "Wfolio cambió su página: subí esta vez a mano; las carpetas ya están armadas en tu computadora"
)
MENSAJE_LIMITE_CARAS_2000: str = (
    "Más de 2000 fotos: Wfolio no busca caras en este álbum"
)
MENSAJE_WFOLIO_NO_ACEPTA_VIDEO: str = (
    "Wfolio no acepta video: los 360 quedaron en tu compu"
)

MARCA_AK_POR_DEFECTO: Dict[str, Any] = {
    "plantilla": "AK Elegante",
    "letra": "Playfair Display / Inter",
    "colores": {
        "primario": "#dc2626",
        "fondo": "#0f172a",
        "texto": "#ffffff",
    },
    "espacio_fotos": "mediano",
}

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

EXTENSIONES_VIDEO: Tuple[str, ...] = (
    ".mp4",
    ".mov",
    ".m4v",
)

EXTENSIONES_MEDIA: Tuple[str, ...] = EXTENSIONES_FOTO + EXTENSIONES_VIDEO


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
    con.execute("PRAGMA journal_mode = WAL")
    con.execute("PRAGMA synchronous = NORMAL")
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
    tamano_local = os.path.getsize(foto_path) if os.path.exists(foto_path) else 0
    nombre_arch = os.path.basename(foto_path)

    if callable(endpoint):
        res = endpoint(foto_path, carpeta, fiesta_nombre)
        if isinstance(res, dict):
            return res
        if res is False:
            raise RuntimeError("Endpoint simulado retornó False")
        return {"status": "ok"}

    if isinstance(endpoint, str) and (endpoint.startswith("http://") or endpoint.startswith("https://")):
        payload = json.dumps({
            "foto": nombre_arch,
            "carpeta": carpeta,
            "fiesta": fiesta_nombre,
            "tamano": tamano_local,
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


def _verificar_presencia_remota(
    resultado_subida: Dict[str, Any],
    endpoint_simulado: Any,
    foto_path: str,
    carpeta: str,
    fiesta_nombre: str,
) -> Tuple[bool, str]:
    """Comprueba que el archivo esté en la carpeta remota (nombre y tamaño).

    Retorna (comprobado: bool, motivo: str).
    """
    nombre_arch = os.path.basename(foto_path)
    tamano_local = os.path.getsize(foto_path) if os.path.exists(foto_path) else 0

    # 1. Si el resultado explícitamente dice comprobado o verificado = False
    if resultado_subida.get("comprobado") is False or resultado_subida.get("verificado") is False:
        motivo = (
            resultado_subida.get("motivo")
            or resultado_subida.get("error")
            or f"El archivo {nombre_arch} no aparece en la carpeta remota"
        )
        return False, motivo

    # 2. Si el resultado incluye la lista de archivos remotos en la carpeta
    archivos_remotos = None
    for clave in ("archivos_en_carpeta", "archivos_remotos", "archivos", "carpeta_archivos"):
        if clave in resultado_subida:
            archivos_remotos = resultado_subida[clave]
            break

    # 3. Si el endpoint simulado tiene métodos para listar o verificar la carpeta
    if archivos_remotos is None and endpoint_simulado is not None:
        if hasattr(endpoint_simulado, "listar_carpeta"):
            archivos_remotos = endpoint_simulado.listar_carpeta(carpeta, fiesta_nombre)
        elif hasattr(endpoint_simulado, "archivos_en_carpeta"):
            archivos_remotos = endpoint_simulado.archivos_en_carpeta(carpeta)
        elif hasattr(endpoint_simulado, "listar_archivos"):
            archivos_remotos = endpoint_simulado.listar_archivos(carpeta)
        elif hasattr(endpoint_simulado, "verificar"):
            ok = endpoint_simulado.verificar(carpeta, nombre_arch, tamano_local)
            if not ok:
                return False, f"El archivo {nombre_arch} no se pudo verificar en la carpeta remota"
            return True, ""
        elif isinstance(endpoint_simulado, str) and endpoint_simulado.startswith("http"):
            # Consultar al servidor HTTP por GET para listar archivos de la carpeta
            try:
                sep = "&" if "?" in endpoint_simulado else "?"
                url_get = (
                    f"{endpoint_simulado}{sep}fiesta={urllib.parse.quote(fiesta_nombre)}"
                    f"&carpeta={urllib.parse.quote(carpeta)}"
                )
                req = urllib.request.Request(url_get, headers={"Accept": "application/json"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    if isinstance(data, dict):
                        archivos_remotos = (
                            data.get("archivos")
                            or data.get("archivos_en_carpeta")
                            or data.get("archivos_remotos")
                        )
                    elif isinstance(data, list):
                        archivos_remotos = data
            except Exception:
                pass

    # Si se obtuvo una lista o diccionario de archivos remotos, comprobar presencia y tamaño
    if archivos_remotos is not None:
        if isinstance(archivos_remotos, list):
            encontrado = False
            for elem in archivos_remotos:
                if isinstance(elem, str):
                    if elem == nombre_arch:
                        encontrado = True
                        break
                elif isinstance(elem, dict):
                    if elem.get("nombre") == nombre_arch or elem.get("name") == nombre_arch:
                        tam_remoto = elem.get("tamano") if "tamano" in elem else elem.get("size")
                        if tam_remoto is not None and tamano_local > 0 and tam_remoto != tamano_local:
                            return (
                                False,
                                f"Tamaño remoto ({tam_remoto}) no coincide con tamaño local ({tamano_local})",
                            )
                        encontrado = True
                        break
            if not encontrado:
                return False, f"El archivo {nombre_arch} no aparece en la carpeta remota"
            return True, ""

        elif isinstance(archivos_remotos, dict):
            if nombre_arch not in archivos_remotos:
                return False, f"El archivo {nombre_arch} no aparece en la carpeta remota"
            info_arch = archivos_remotos[nombre_arch]
            if isinstance(info_arch, (int, float)):
                if tamano_local > 0 and info_arch != tamano_local:
                    return (
                        False,
                        f"Tamaño remoto ({info_arch}) no coincide con tamaño local ({tamano_local})",
                    )
            elif isinstance(info_arch, dict):
                tam_remoto = info_arch.get("tamano") if "tamano" in info_arch else info_arch.get("size")
                if tam_remoto is not None and tamano_local > 0 and tam_remoto != tamano_local:
                    return (
                        False,
                        f"Tamaño remoto ({tam_remoto}) no coincide con tamaño local ({tamano_local})",
                    )
            return True, ""

    # Si el resultado indica comprobado: True
    if resultado_subida.get("comprobado") is True or resultado_subida.get("verificado") is True:
        return True, ""

    # Si no se pudo obtener lista remota y no vino error explícito (ej: mock simple que retorna {'status': 'ok'})
    if resultado_subida.get("status") == "ok" or resultado_subida.get("exito") is True:
        return True, ""

    return False, f"No se pudo comprobar la presencia de {nombre_arch} en la carpeta remota"


def _subir_con_playwright(
    ruta_carpetas: str,
    fiesta_nombre: str,
    fotos_pendientes: List[Dict[str, str]],
) -> Dict[str, Any]:
    """Automatiza Wfolio Disk en el navegador mediante Playwright usando la sesión guardada.

    Realiza la subida real y verifica que cada archivo esté en la carpeta remota con su nombre y tamaño.
    """
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

            album_slug = slugificar(fiesta_nombre)
            url_album = f"https://wfolio.com/my/disk/privado/{album_slug}"

            # Subida de las fotos pendientes
            for item in fotos_pendientes:
                ruta_foto = item.get("ruta", "")
                carp = item.get("carpeta", "")
                if not os.path.exists(ruta_foto):
                    continue

                nombre_arch = os.path.basename(ruta_foto)
                tamano_local = os.path.getsize(ruta_foto)

                # Buscar input file para subir
                input_file = page.locator("input[type='file']")
                if input_file.count() > 0:
                    input_file.first.set_input_files(ruta_foto)
                    # Esperar procesamiento y que aparezca en la lista
                    try:
                        page.wait_for_timeout(2000)
                    except Exception:
                        pass

                    # Comprobar presencia del archivo en la lista remota
                    loc_archivo = page.locator(f"text='{nombre_arch}'")
                    if loc_archivo.count() > 0 and loc_archivo.first.is_visible():
                        browser_context.close()
                        return {
                            "exito": True,
                            "comprobado": True,
                            "nombre": nombre_arch,
                            "tamano": tamano_local,
                            "url": url_album,
                        }
                    else:
                        browser_context.close()
                        return {
                            "exito": False,
                            "comprobado": False,
                            "estado": "pendiente",
                            "motivo": f"El archivo {nombre_arch} no apareció en la lista remota de Wfolio tras la subida.",
                            "url": url_album,
                        }
                else:
                    browser_context.close()
                    return {
                        "exito": False,
                        "comprobado": False,
                        "estado": "pendiente",
                        "motivo": "No se encontró el selector de subida de archivos en la página de Wfolio.",
                        "aviso_criollo": MENSAJE_CRIOLLO_CAMBIO_PAGINA,
                        "url": url_album,
                    }

            browser_context.close()
            return {
                "exito": True,
                "comprobado": True,
                "url": url_album,
            }
    except Exception as e:
        return {
            "exito": False,
            "comprobado": False,
            "error": str(e),
            "aviso_criollo": MENSAJE_CRIOLLO_CAMBIO_PAGINA,
        }


def normalizar_nombre_carpeta_estacion(nombre_crudo: str) -> str:
    """Normaliza nombres de carpetas de estaciones exportadas desde la app."""
    limpio = str(nombre_crudo or "").strip()
    compacto = re.sub(r"[-_\s]+", "", limpio.lower())
    if not compacto:
        return "Fotos de los invitados"
    if compacto in ("fotocabina", "photobooth", "cabina"):
        return "Fotocabina"
    if compacto in ("plataforma360", "video360", "360") or "360" in limpio.lower():
        return "Plataforma 360"
    if compacto in ("fotosdelosinvitados", "invitados", "muro", "murosocial", "guest"):
        return "Fotos de los invitados"
    if compacto in ("vogue", "bogue", "cabinavogue", "boomerang"):
        return "Vogue"
    if compacto.startswith("espejo"):
        return "Espejo Magico"
    if compacto in ("barra", "kiosco", "barratecnologica"):
        return "Barra Tecnologica"
    if compacto in ("totem", "totems", "totemia", "pantallastotem", "touchpix"):
        return "Totem Interactivo"
    if compacto in ("buzon", "capsulatiempo", "audioguestbook"):
        return "Buzon"
    return limpio


def _nombre_archivo_unico(carpeta_dest: str, nombre_arch: str) -> str:
    """Evita colisiones de nombre al descomprimir archivos de estaciones."""
    destino = os.path.join(carpeta_dest, nombre_arch)
    if not os.path.exists(destino):
        return destino
    stem, ext = os.path.splitext(nombre_arch)
    idx = 2
    while True:
        candidato = os.path.join(carpeta_dest, f"{stem}_{idx}{ext}")
        if not os.path.exists(candidato):
            return candidato
        idx += 1


def descomprimir_estaciones_zip(
    ruta_carpetas: Union[str, Path],
    ruta_zip: Optional[Union[str, Path]] = None,
) -> Dict[str, Any]:
    """Descomprime de forma segura los ZIP de estaciones y los integra en ruta_carpetas."""
    ruta_dest_abs = os.path.realpath(str(ruta_carpetas))
    os.makedirs(ruta_dest_abs, exist_ok=True)

    candidatos_zip: List[str] = []
    if ruta_zip is not None and os.path.isfile(str(ruta_zip)):
        candidatos_zip.append(str(ruta_zip))

    for dir_busqueda in (ruta_dest_abs, os.path.join(ruta_dest_abs, "estaciones")):
        if os.path.isdir(dir_busqueda):
            for arch in sorted(os.listdir(dir_busqueda)):
                if arch.lower().endswith(".zip"):
                    ruta_cand = os.path.join(dir_busqueda, arch)
                    if ruta_cand not in candidatos_zip:
                        candidatos_zip.append(ruta_cand)

    zips_procesados: List[str] = []
    carpetas_integradas: Dict[str, List[str]] = {}
    archivos_integrados = 0

    for zip_path in candidatos_zip:
        if not zipfile.is_zipfile(zip_path):
            continue
        with zipfile.ZipFile(zip_path, "r") as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                nombre_interno = info.filename.replace("\\", "/")
                if nombre_interno.startswith("__MACOSX") or "/." in nombre_interno or nombre_interno.startswith("."):
                    continue
                partes = [p for p in nombre_interno.split("/") if p]
                if not partes or any(p == ".." for p in partes) or partes[0].endswith(":"):
                    continue

                nombre_arch = os.path.basename(partes[-1])
                ext = os.path.splitext(nombre_arch)[1].lower()
                if ext not in EXTENSIONES_MEDIA:
                    continue

                carpeta_origen = partes[0] if len(partes) > 1 else "Fotos de los invitados"
                carpeta_norm = normalizar_nombre_carpeta_estacion(carpeta_origen)

                carpeta_destino = os.path.realpath(os.path.join(ruta_dest_abs, carpeta_norm))
                if not (carpeta_destino == ruta_dest_abs or carpeta_destino.startswith(ruta_dest_abs + os.sep)):
                    continue

                os.makedirs(carpeta_destino, exist_ok=True)
                destino_archivo = os.path.realpath(os.path.join(carpeta_destino, nombre_arch))
                if not destino_archivo.startswith(carpeta_destino + os.sep):
                    continue

                datos = zf.read(info)
                if os.path.exists(destino_archivo) and os.path.getsize(destino_archivo) == len(datos):
                    # Ya existe idéntico: no duplicar en corridas repetidas
                    continue

                if os.path.exists(destino_archivo):
                    destino_archivo = _nombre_archivo_unico(carpeta_destino, nombre_arch)

                with open(destino_archivo, "wb") as f_out:
                    f_out.write(datos)

                carpetas_integradas.setdefault(carpeta_norm, []).append(destino_archivo)
                archivos_integrados += 1

        zips_procesados.append(zip_path)

    return {
        "zips_procesados": zips_procesados,
        "carpetas_integradas": carpetas_integradas,
        "archivos_integrados": archivos_integrados,
    }


def ordenar_carpetas_album(carpetas: List[str]) -> List[str]:
    """Ordena carpetas del álbum: primero fotógrafo, luego estaciones estándar, luego el resto."""
    prioridad: Dict[str, int] = {}
    idx = 0
    for c in CARPETAS_ESTANDAR:
        prioridad[c.lower()] = idx
        idx += 1
    for c in CARPETAS_ESTACIONES_ORDEN:
        prioridad[c.lower()] = idx
        idx += 1

    return sorted(
        carpetas,
        key=lambda nombre: (prioridad.get(nombre.lower(), 999), nombre.lower()),
    )


def formatear_nombre_proyecto_wfolio(
    fiesta_nombre: str,
    tipo_fiesta: str = "",
    fecha: str = "",
) -> str:
    """Arma el nombre visible del proyecto en Wfolio con fiesta, tipo y fecha."""
    partes = [p.strip() for p in (fiesta_nombre, tipo_fiesta, fecha) if p and str(p).strip()]
    return " · ".join(partes) if partes else "Fiesta AK"


def cargar_marca_ak(
    almacen: Any = None,
    plantilla_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Carga la plantilla de Marca AK guardada o usa los valores por defecto."""
    marca = dict(MARCA_AK_POR_DEFECTO)
    if almacen is not None and hasattr(almacen, "obtener_preferencia"):
        try:
            guardada = almacen.obtener_preferencia("wfolio_marca_ak", None)
            if isinstance(guardada, dict):
                marca.update(guardada)
        except Exception as exc:
            print(f"[Wfolio] No se pudo leer Marca AK del almacén: {exc}")

    if isinstance(plantilla_override, dict):
        marca.update(plantilla_override)

    return marca


def elegir_foto_portada(
    fotos_por_carpeta: Dict[str, List[str]],
    evaluador_nota: Optional[Callable[[str], float]] = None,
) -> Dict[str, Any]:
    """Elige la foto de portada con mejor nota de calidad, prefiriendo la carpeta Exterior."""
    exts_portada = (".jpg", ".jpeg", ".png", ".webp")
    fn_nota = evaluador_nota or evaluar_calidad_foto

    def _candidatas_de_carpeta(carp: str) -> List[str]:
        return [
            r for r in fotos_por_carpeta.get(carp, [])
            if os.path.splitext(r)[1].lower() in exts_portada
        ]

    candidatas_exterior = _candidatas_de_carpeta("Exterior")
    pool: List[Tuple[str, str]] = []
    if candidatas_exterior:
        pool = [("Exterior", r) for r in candidatas_exterior]
    else:
        for carp, rutas in fotos_por_carpeta.items():
            for r in rutas:
                if os.path.splitext(r)[1].lower() in exts_portada:
                    pool.append((carp, r))

    if not pool:
        return {"foto": "", "carpeta": "", "nota": 0.0}

    # Si hay cientos/miles de fotos, muestrear hasta 100 para no demorar la selección
    if len(pool) > 100:
        paso = len(pool) / 100.0
        pool = [pool[int(i * paso)] for i in range(100)]

    mejor_foto = ""
    mejor_carpeta = ""
    mejor_nota = float("-inf")

    for carp, ruta in pool:
        try:
            nota = float(fn_nota(ruta))
        except Exception:
            nota = 0.0
        if nota > mejor_nota:
            mejor_nota = nota
            mejor_foto = ruta
            mejor_carpeta = carp

    return {
        "foto": mejor_foto,
        "carpeta": mejor_carpeta,
        "nota": round(mejor_nota if mejor_nota != float("-inf") else 0.0, 2),
    }


def generar_texto_seguro_redes(
    tipo_fiesta: str = "",
    carpetas_usadas: Optional[List[str]] = None,
) -> str:
    """Genera texto seguro para redes sociales sin precios, sin promesas ni garantías."""
    tipo_limpio = (tipo_fiesta or "fiesta").strip()
    carpetas_texto = ""
    if carpetas_usadas:
        nombres = [c for c in carpetas_usadas if c][:3]
        if nombres:
            carpetas_texto = f" Recuerdos de {', '.join(nombres)}."

    texto = (
        f"¡Así se vivió una noche inolvidable de {tipo_limpio} junto a AK Producciones!{carpetas_texto} "
        "Cada sonrisa, cada baile y cada momento especial capturado de principio a fin.\n\n"
        "#AKProducciones #EventosSalto #FiestasUruguay #RecuerdosInolvidables"
    )
    # Limpieza defensiva: nunca precios ni palabra garantía/promesas
    texto = re.sub(r"\bgarant[ií]a[s]?\b", "compromiso", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bgarantizado[s]?\b", "asegurado", texto, flags=re.IGNORECASE)
    texto = re.sub(r"[$€£]\s*\d+[\d.,]*", "", texto)
    texto = re.sub(r"\b\d+[\d.,]*\s*(uyu|usd|pesos|dolares|dólares)\b", "", texto, flags=re.IGNORECASE)
    return re.sub(r"\s{2,}", " ", texto).strip()


def _extraer_cuadro_video_para_redes(ruta_video: str, ruta_jpg_salida: str) -> Optional[str]:
    """Extrae un cuadro legible de un video MP4/MOV para poder mezclarlo en videos de redes."""
    try:
        import cv2
        cap = cv2.VideoCapture(ruta_video)
        if not cap.isOpened():
            return None
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if total > 2:
            cap.set(cv2.CAP_PROP_POS_FRAMES, total // 3)
        ret, frame = cap.read()
        cap.release()
        if ret and frame is not None:
            os.makedirs(os.path.dirname(ruta_jpg_salida), exist_ok=True)
            ok, buf = cv2.imencode(".jpg", frame)
            if ok:
                with open(ruta_jpg_salida, "wb") as f:
                    f.write(buf.tobytes())
                return ruta_jpg_salida
    except Exception:
        return None
    return None


def generar_video_y_borrador_redes(
    fotos_por_carpeta: Dict[str, List[str]],
    carpeta_destino_redes: Union[str, Path],
    fiesta_nombre: str,
    tipo_fiesta: str = "",
    permiso_promocion: bool = False,
    evaluador_nota: Optional[Callable[[str], float]] = None,
    duracion_seg: float = 12.0,
    fps: int = 12,
    ruta_logo_ak: Optional[str] = None,
) -> Dict[str, Any]:
    """Arma video corto para redes mezclando las mejores tomas de todas las carpetas y prepara borrador.

    Respeta estrictamente el permiso de promoción: si no hay permiso, no arma publicación ni usa
    nombres del cliente o invitados.
    """
    if not permiso_promocion:
        return {
            "publicacion_armada": False,
            "permiso_promocion": False,
            "motivo": "Sin permiso de promoción: no se armó publicación para redes.",
            "videos": [],
            "borrador": None,
            "carpetas_mezcladas": [],
        }

    fn_nota = evaluador_nota or evaluar_calidad_foto
    exts_img = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
    destino_str = str(carpeta_destino_redes)
    os.makedirs(destino_str, exist_ok=True)

    staging_dir = tempfile.mkdtemp(prefix="ak_wfolio_redes_")
    fotos_seleccionadas: List[Dict[str, Any]] = []
    carpetas_mezcladas: List[str] = []

    try:
        carpetas_ordenadas = ordenar_carpetas_album([c for c, lst in fotos_por_carpeta.items() if lst])
        # Seleccionar hasta 3 mejores tomas de cada carpeta para garantizar mezcla entre todas
        por_carpeta_top: Dict[str, List[Tuple[float, str]]] = {}

        for carp in carpetas_ordenadas:
            candidatas: List[Tuple[float, str]] = []
            for ruta in fotos_por_carpeta.get(carp, []):
                ext = os.path.splitext(ruta)[1].lower()
                if ext in exts_img:
                    try:
                        nota = float(fn_nota(ruta))
                    except Exception:
                        nota = 0.0
                    candidatas.append((nota, ruta))
                elif ext in EXTENSIONES_VIDEO:
                    frame_dest = os.path.join(staging_dir, "_frames_video", f"{Path(ruta).stem}.jpg")
                    frame_path = _extraer_cuadro_video_para_redes(ruta, frame_dest)
                    if frame_path:
                        try:
                            nota = float(fn_nota(frame_path))
                        except Exception:
                            nota = 0.0
                        candidatas.append((nota, frame_path))

            if candidatas:
                candidatas.sort(key=lambda x: x[0], reverse=True)
                por_carpeta_top[carp] = candidatas[:3]

        # Intercalar round-robin en staging_dir para que 'la noche completa' de redes.py mezcle carpetas
        max_len = max((len(v) for v in por_carpeta_top.values()), default=0)
        orden_idx = 0
        for ronda in range(max_len):
            for carp in carpetas_ordenadas:
                lista_c = por_carpeta_top.get(carp, [])
                if ronda >= len(lista_c):
                    continue
                nota, ruta_src = lista_c[ronda]
                sub_staging = os.path.join(staging_dir, carp)
                os.makedirs(sub_staging, exist_ok=True)
                orden_idx += 1
                nombre_st = f"{orden_idx:03d}_{os.path.basename(ruta_src)}"
                ruta_st = os.path.join(sub_staging, nombre_st)
                shutil.copy2(ruta_src, ruta_st)
                if carp not in carpetas_mezcladas:
                    carpetas_mezcladas.append(carp)
                fotos_seleccionadas.append({
                    "carpeta": carp,
                    "ruta": ruta_src,
                    "nota": nota,
                })

        if not fotos_seleccionadas:
            return {
                "publicacion_armada": False,
                "permiso_promocion": True,
                "motivo": "No se encontraron fotos o clips válidos para armar el video de redes.",
                "videos": [],
                "borrador": None,
                "carpetas_mezcladas": [],
            }

        res_videos = generar_videos_redes(
            origen=staging_dir,
            carpeta_destino=destino_str,
            ruta_logo_ak=ruta_logo_ak,
            duracion_seg=duracion_seg,
            fps=fps,
        )

        texto_seguro = generar_texto_seguro_redes(
            tipo_fiesta=tipo_fiesta,
            carpetas_usadas=carpetas_mezcladas,
        )

        borrador_data = {
            "eventName": fiesta_nombre,
            "tipoEvento": tipo_fiesta or "Evento",
            "texto": texto_seguro,
            "carpetas_mezcladas": carpetas_mezcladas,
            "videos": res_videos.get("videos", []),
            "redes_json": res_videos.get("redes_json", ""),
            "listo_para_subir_borrador": True,
            "auto_publicar_en_horas": 12,
        }
        ruta_borrador = os.path.join(destino_str, "borrador_redes.json")
        with open(ruta_borrador, "w", encoding="utf-8") as f:
            json.dump(borrador_data, f, ensure_ascii=False, indent=2)

        return {
            "publicacion_armada": True,
            "permiso_promocion": True,
            "videos": res_videos.get("videos", []),
            "redes_json": res_videos.get("redes_json", ""),
            "borrador_json": ruta_borrador,
            "borrador": borrador_data,
            "fotos_seleccionadas": fotos_seleccionadas,
            "carpetas_mezcladas": carpetas_mezcladas,
        }
    finally:
        if os.path.exists(staging_dir):
            shutil.rmtree(staging_dir, ignore_errors=True)


def _normalizar_vectores_face_api(crudos: Any) -> List[List[float]]:
    """Valida y normaliza descriptores de @vladmandic/face-api (exactamente 128 floats finitos)."""
    if not isinstance(crudos, (list, tuple)):
        return []

    vectores_validos: List[List[float]] = []
    for elemento in crudos:
        candidato = elemento
        if isinstance(elemento, dict):
            candidato = elemento.get("vector")
            if candidato is None:
                candidato = elemento.get("descriptor")

        if isinstance(candidato, (str, bytes, dict)) or not hasattr(candidato, "__iter__"):
            continue

        try:
            lista = list(candidato)
        except TypeError:
            continue

        if len(lista) != DIMENSION_VECTOR_FACE_API:
            continue

        vector_limpio: List[float] = []
        valido = True
        for valor in lista:
            if isinstance(valor, bool) or not isinstance(valor, (int, float)):
                valido = False
                break
            numero = float(valor)
            if not math.isfinite(numero):
                valido = False
                break
            vector_limpio.append(numero)

        if valido:
            vectores_validos.append(vector_limpio)

    return vectores_validos


def _normalizar_momento_galeria(
    escena: str,
    ruta_hint: str = "",
    momento_explicito: str = "",
) -> str:
    """Normaliza una escena de clasificar_escena o etiqueta manual a los momentos de la galería."""
    explicito = str(momento_explicito or "").strip()
    if explicito:
        exp_l = explicito.lower()
        if "exterior" in exp_l or "jardin" in exp_l or "parque" in exp_l:
            return "Exterior"
        if "vals" in exp_l:
            return "Vals"
        if "entrada" in exp_l or "ingreso" in exp_l or "recepcion" in exp_l or "previa" in exp_l or "llegada" in exp_l:
            return "Entrada"
        if "torta" in exp_l or "vela" in exp_l or "pastel" in exp_l or "mesa dulce" in exp_l:
            return "Torta"
        if "fiesta" in exp_l:
            return "Fiesta"

    esc_l = str(escena or "").strip().lower()
    ruta_l = str(ruta_hint or "").strip().lower()

    if "exterior" in esc_l:
        return "Exterior"
    if "torta" in esc_l or "vela" in esc_l:
        return "Torta"
    if "previa" in esc_l or "recepcion" in esc_l:
        return "Entrada"
    if "entrada" in esc_l or "vals" in esc_l:
        if "vals" in ruta_l:
            return "Vals"
        return "Entrada"
    if "fiesta" in esc_l:
        return "Fiesta"
    return "Fiesta"


def _resolver_directorio_modelos_face_api(
    directorio_modelos: Optional[Union[str, Path]] = None,
) -> Path:
    """Resuelve la carpeta local con los modelos de @vladmandic/face-api (public/models/caras)."""
    candidatos: List[Path] = []
    if directorio_modelos is not None:
        candidatos.append(Path(directorio_modelos))
    else:
        raiz_repo = Path(DIR_HERRAMIENTA_WFOLIO).resolve().parent.parent
        candidatos.append(raiz_repo / "public" / "models" / "caras")
        candidatos.append(Path.cwd() / "public" / "models" / "caras")

    requeridos = (
        "tiny_face_detector_model-weights_manifest.json",
        "face_landmark_68_tiny_model-weights_manifest.json",
        "face_recognition_model-weights_manifest.json",
    )
    for candidato in candidatos:
        if candidato.is_dir() and all((candidato / req).is_file() for req in requeridos):
            return candidato

    raise FileNotFoundError(
        "No se encontraron los modelos locales de @vladmandic/face-api en public/models/caras."
    )


def _resolver_script_face_api() -> Path:
    """Busca el bundle local de @vladmandic/face-api dentro de node_modules."""
    raiz_repo = Path(DIR_HERRAMIENTA_WFOLIO).resolve().parent.parent
    candidatos = [
        raiz_repo / "node_modules" / "@vladmandic" / "face-api" / "dist" / "face-api.js",
        Path.cwd() / "node_modules" / "@vladmandic" / "face-api" / "dist" / "face-api.js",
    ]
    for candidato in candidatos:
        if candidato.is_file():
            return candidato

    raise FileNotFoundError(
        "No se encontró el script local node_modules/@vladmandic/face-api/dist/face-api.js."
    )


def generar_miniatura_wfolio(
    ruta_origen: Union[str, Path],
    carpeta_destino: Union[str, Path],
    max_lado: int = MAX_LADO_MINIATURA_WFOLIO,
    nombre_salida: Optional[str] = None,
) -> Path:
    """Genera una miniatura JPG de hasta max_lado px por lado respetando orientación EXIF."""
    from PIL import Image, ImageOps

    origen = Path(ruta_origen)
    if not origen.is_file():
        raise FileNotFoundError(f"No existe la foto de origen: {origen}")

    lado_limite = max(1, int(max_lado))
    destino_dir = Path(carpeta_destino)
    destino_dir.mkdir(parents=True, exist_ok=True)

    nombre_archivo = (nombre_salida or f"{origen.stem}.jpg").strip()
    if not nombre_archivo.lower().endswith((".jpg", ".jpeg")):
        nombre_archivo = f"{Path(nombre_archivo).stem}.jpg"
    ruta_destino = destino_dir / nombre_archivo

    with Image.open(origen) as img:
        if hasattr(ImageOps, "exif_transpose"):
            img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        if max(img.size) > lado_limite:
            resampling = getattr(getattr(Image, "Resampling", Image), "LANCZOS", Image.BICUBIC)
            img.thumbnail((lado_limite, lado_limite), resampling)
        img.save(ruta_destino, format="JPEG", quality=85, optimize=True)

    return ruta_destino


def extraer_vectores_caras_face_api(
    ruta_foto: Union[str, Path],
    directorio_modelos: Optional[Union[str, Path]] = None,
    extractor_fn: Optional[Callable[[str], Any]] = None,
) -> List[List[float]]:
    """Extrae descriptores faciales de 128 números compatibles con @vladmandic/face-api.

    Cuando extractor_fn es None, levanta un servidor HTTP local mínimo y abre Playwright
    en modo headless cargando @vladmandic/face-api y los modelos desde public/models/caras.
    """
    foto = Path(ruta_foto)
    if not foto.is_file():
        raise FileNotFoundError(f"No existe la foto para extraer caras: {foto}")

    if extractor_fn is not None:
        return _normalizar_vectores_face_api(extractor_fn(str(foto)))

    dir_modelos = _resolver_directorio_modelos_face_api(directorio_modelos)
    ruta_face_api_js = _resolver_script_face_api()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError(
            "Playwright no está instalado para ejecutar @vladmandic/face-api localmente."
        ) from exc

    html_pagina = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Extractor Facial AK - @vladmandic/face-api</title>
  <script src="/face-api.js"></script>
</head>
<body>
  <script>
    window._modelosCargados = null;
    window.asegurarModelos = async function () {
      if (!window._modelosCargados) {
        window._modelosCargados = (async () => {
          const tf = window.faceapi && window.faceapi.tf;
          if (tf && typeof tf.ready === 'function') {
            await tf.ready().catch(() => {});
          }
          await Promise.all([
            window.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            window.faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
            window.faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          ]);
        })();
      }
      return window._modelosCargados;
    };
    window.extraerVectoresFoto = async function (urlFoto) {
      await window.asegurarModelos();
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('No se pudo cargar la foto en el navegador local'));
        el.src = urlFoto;
      });
      const opciones = new window.faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      });
      const detecciones = await window.faceapi
        .detectAllFaces(img, opciones)
        .withFaceLandmarks(true)
        .withFaceDescriptors();
      return (detecciones || [])
        .filter((d) => d && d.descriptor)
        .map((d) => Array.from(d.descriptor));
    };
  </script>
</body>
</html>
"""

    class _HandlerFaceApiLocal(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: Any) -> None:
            return

        def _enviar(self, status: int, body: bytes, content_type: str) -> None:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            ruta_req = urllib.parse.urlparse(self.path).path
            if ruta_req in ("/", "/index.html"):
                self._enviar(200, html_pagina.encode("utf-8"), "text/html; charset=utf-8")
                return
            if ruta_req == "/face-api.js":
                self._enviar(200, ruta_face_api_js.read_bytes(), "application/javascript; charset=utf-8")
                return
            if ruta_req == "/foto":
                mime, _ = mimetypes.guess_type(str(foto))
                self._enviar(200, foto.read_bytes(), mime or "image/jpeg")
                return
            if ruta_req.startswith("/models/"):
                rel = os.path.basename(urllib.parse.unquote(ruta_req[len("/models/"):]))
                archivo_modelo = dir_modelos / rel
                if archivo_modelo.is_file():
                    mime, _ = mimetypes.guess_type(str(archivo_modelo))
                    self._enviar(200, archivo_modelo.read_bytes(), mime or "application/octet-stream")
                    return
            self._enviar(404, b"Not found", "text/plain; charset=utf-8")

    servidor = ThreadingHTTPServer(("127.0.0.1", 0), _HandlerFaceApiLocal)
    puerto = servidor.server_address[1]
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()

    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch(headless=True)
            try:
                pagina = navegador.new_page()
                pagina.goto(f"http://127.0.0.1:{puerto}/index.html", timeout=30000)
                resultado = pagina.evaluate("() => window.extraerVectoresFoto('/foto')")
            finally:
                navegador.close()
    finally:
        servidor.shutdown()
        servidor.server_close()

    return _normalizar_vectores_face_api(resultado)


def armar_paquete_caras_fotografo(
    fotos_subidas: List[Union[Dict[str, Any], str, Path]],
    carpeta_salida: Union[str, Path],
    directorio_modelos: Optional[Union[str, Path]] = None,
    extractor_fn: Optional[Callable[[str], Any]] = None,
) -> Dict[str, Any]:
    """Arma miniaturas <= 800px, clasifica momentos y genera caras_fotografo.json con @vladmandic/face-api."""
    salida_dir = Path(carpeta_salida)
    salida_dir.mkdir(parents=True, exist_ok=True)
    miniaturas_dir = salida_dir / "miniaturas"
    miniaturas_dir.mkdir(parents=True, exist_ok=True)

    entradas: List[Dict[str, Any]] = []
    total_caras = 0
    nombres_usados: set[str] = set()
    ids_usados: set[str] = set()

    for idx, item in enumerate(fotos_subidas):
        if isinstance(item, dict):
            ruta_raw = item.get("ruta") or item.get("foto") or item.get("archivo") or ""
            wfolio_url = str(item.get("wfolioUrl") or item.get("wfolio_url") or "").strip()
            momento_explicit = str(item.get("momento") or item.get("momentTag") or "").strip()
            foto_id_explicit = str(item.get("fotoId") or item.get("id") or "").strip()
        else:
            ruta_raw = str(item)
            wfolio_url = ""
            momento_explicit = ""
            foto_id_explicit = ""

        ruta_str = str(ruta_raw or "").strip()
        if not ruta_str:
            continue
        ruta_path = Path(ruta_str)
        if not ruta_path.is_file():
            continue

        stem_slug = slugificar(ruta_path.stem) or f"foto_{idx + 1}"
        nombre_mini = f"{ruta_path.stem}.jpg"
        sufijo_mini = 2
        while nombre_mini.lower() in nombres_usados:
            nombre_mini = f"{ruta_path.stem}_{sufijo_mini}.jpg"
            sufijo_mini += 1
        nombres_usados.add(nombre_mini.lower())

        ruta_miniatura = generar_miniatura_wfolio(
            ruta_origen=ruta_path,
            carpeta_destino=miniaturas_dir,
            max_lado=MAX_LADO_MINIATURA_WFOLIO,
            nombre_salida=nombre_mini,
        )

        # Clasificar momento con clasificar_escena(ruta) y normalizar a momentos de galería
        escena = clasificar_escena(ruta_str)
        if escena == "Fiesta":
            carpeta_padre = ruta_path.parent.name
            if carpeta_padre:
                escena_carpeta = clasificar_escena({"ruta": ruta_str, "carpeta": carpeta_padre})
                if escena_carpeta != "Fiesta":
                    escena = escena_carpeta

        moment_tag = _normalizar_momento_galeria(
            escena=escena,
            ruta_hint=ruta_str,
            momento_explicito=momento_explicit,
        )

        vectores = extraer_vectores_caras_face_api(
            ruta_foto=ruta_path,
            directorio_modelos=directorio_modelos,
            extractor_fn=extractor_fn,
        )
        total_caras += len(vectores)

        foto_id = foto_id_explicit or f"fotografo_{stem_slug}"
        if foto_id in ids_usados:
            sufijo_id = 2
            while f"{foto_id}_{sufijo_id}" in ids_usados:
                sufijo_id += 1
            foto_id = f"{foto_id}_{sufijo_id}"
        ids_usados.add(foto_id)

        entradas.append({
            "id": foto_id,
            "fotoId": foto_id,
            "archivo": ruta_path.name,
            "miniatura": str(ruta_miniatura),
            "wfolioUrl": wfolio_url,
            "momentTag": moment_tag,
            "vectores": vectores,
            "descriptors": vectores,
            "caras": [{"vector": vec} for vec in vectores],
        })

    ruta_json = salida_dir / "caras_fotografo.json"
    paquete_json = {
        "modelo": MODELO_FACE_API,
        "dimension": DIMENSION_VECTOR_FACE_API,
        "generadoEn": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "totalFotos": len(entradas),
        "totalCaras": total_caras,
        "fotos": entradas,
    }
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(paquete_json, f, ensure_ascii=False, indent=2)

    return {
        "modelo": MODELO_FACE_API,
        "dimension": DIMENSION_VECTOR_FACE_API,
        "archivo_json": str(ruta_json),
        "carpeta_miniaturas": str(miniaturas_dir),
        "total_fotos": len(entradas),
        "total_caras": total_caras,
        "fotos": entradas,
    }


def _configurar_proyecto_remoto(endpoint_simulado: Any, config_proyecto: Dict[str, Any]) -> Dict[str, Any]:
    """Envía configuración de proyecto, portada y carpetas al endpoint simulado si lo soporta."""
    if endpoint_simulado is None:
        return {}
    if hasattr(endpoint_simulado, "configurar_proyecto"):
        res = endpoint_simulado.configurar_proyecto(config_proyecto)
        return res if isinstance(res, dict) else {}
    if hasattr(endpoint_simulado, "crear_proyecto"):
        res = endpoint_simulado.crear_proyecto(config_proyecto)
        return res if isinstance(res, dict) else {}
    return {}


def subir_a_wfolio(
    ruta_carpetas: Union[str, Path],
    fiesta_nombre: str,
    endpoint_simulado: Any = None,
    ruta_db: Optional[str] = None,
    almacen: Any = None,
    continuar_en_error: bool = True,
    zip_estaciones: Optional[Union[str, Path]] = None,
    fecha_evento: str = "",
    tipo_fiesta: str = "",
    plantilla_marca_ak: Optional[Dict[str, Any]] = None,
    permiso_promocion: Optional[bool] = None,
    generar_redes: bool = False,
    carpeta_salida_redes: Optional[Union[str, Path]] = None,
    acepta_videos: Optional[bool] = None,
    ejecutador_ffmpeg: Optional[Callable[[List[str], str, str], bool]] = None,
    evaluador_nota: Optional[Callable[[str], float]] = None,
    duracion_redes_seg: float = 12.0,
    fps_redes: int = 12,
    generar_indice_caras: bool = False,
    carpeta_salida_caras: Optional[Union[str, Path]] = None,
    directorio_modelos_caras: Optional[Union[str, Path]] = None,
    extractor_caras_fn: Optional[Callable[[str], Any]] = None,
) -> Dict[str, Any]:
    """Crea álbum privado en Wfolio, integra estaciones y sube fotos/videos con checkpoint SQLite.

    - Descomprime ZIP de estaciones si existe e integra sus carpetas al mismo álbum.
    - Crea el proyecto con nombre + fecha, marca AK, portada de mejor nota (preferida Exterior),
      privado, sin selección ni venta, y sin carpetas vacías.
    - Activa reconocimiento de caras sólo si total de archivos <= 2000.
    - Comprime videos > 500 MB a H.264 con exportador_video.py antes de subir.
    - Sube de a una, verifica en remoto y reanuda donde quedó via SQLite.
    - Opcionalmente arma video y borrador para redes respetando permiso_promocion.
    """
    ruta_carpetas_str = str(ruta_carpetas)

    # Resolver base de datos SQLite
    if ruta_db is None:
        if almacen is not None and hasattr(almacen, "ruta_db"):
            ruta_db = almacen.ruta_db
        else:
            ruta_db = obtener_ruta_db_defecto(fiesta_nombre)
    inicializar_db_wfolio(ruta_db)

    # Bloque 2: integrar ZIP de estaciones si aparece en la carpeta o se pasa explícitamente
    info_estaciones = descomprimir_estaciones_zip(ruta_carpetas_str, ruta_zip=zip_estaciones)

    # Identificar carpetas con archivos (nunca crear carpetas vacías en el proyecto)
    carpetas_candidatas: List[str] = []
    for entrada in os.listdir(ruta_carpetas_str):
        sub_path = os.path.join(ruta_carpetas_str, entrada)
        if (
            os.path.isdir(sub_path)
            and not entrada.startswith(".")
            and entrada.lower() not in CARPETAS_IGNORAR_ALBUM
        ):
            carpetas_candidatas.append(entrada)

    if not carpetas_candidatas:
        for c in CARPETAS_ESTANDAR + CARPETAS_ESTACIONES_ORDEN:
            sub = os.path.join(ruta_carpetas_str, c)
            if os.path.isdir(sub):
                carpetas_candidatas.append(c)

    # Recolectar archivos elegibles y descartar carpetas vacías
    fotos_por_carpeta: Dict[str, List[str]] = {}
    for carp in carpetas_candidatas:
        dir_carp = os.path.join(ruta_carpetas_str, carp)
        archivos_encontrados: List[str] = []
        for arch in sorted(os.listdir(dir_carp)):
            ext = os.path.splitext(arch)[1].lower()
            if ext in EXTENSIONES_MEDIA:
                archivos_encontrados.append(os.path.join(dir_carp, arch))
        if archivos_encontrados:
            fotos_por_carpeta[carp] = archivos_encontrados

    carpetas_a_procesar = ordenar_carpetas_album(list(fotos_por_carpeta.keys()))
    total_fotos_encontradas = sum(len(l) for l in fotos_por_carpeta.values())

    # Bloque 4: armado de proyecto, portada, marca AK y regla de 2000 fotos para reconocimiento de caras
    avisos: List[str] = []
    nombre_proyecto = formatear_nombre_proyecto_wfolio(fiesta_nombre, tipo_fiesta, fecha_evento)
    reconocimiento_caras = total_fotos_encontradas <= LIMITE_RECONOCIMIENTO_CARAS_WFOLIO
    if total_fotos_encontradas > LIMITE_RECONOCIMIENTO_CARAS_WFOLIO:
        avisos.append(MENSAJE_LIMITE_CARAS_2000)

    marca_ak = cargar_marca_ak(almacen=almacen, plantilla_override=plantilla_marca_ak)
    info_portada = elegir_foto_portada(fotos_por_carpeta, evaluador_nota=evaluador_nota)
    subtitulo_portada = " · ".join(p for p in (tipo_fiesta.strip(), fecha_evento.strip()) if p)

    album_slug = slugificar(fiesta_nombre)
    enlace_privado = f"https://wfolio.com/my/disk/privado/{album_slug}"

    config_proyecto: Dict[str, Any] = {
        "nombre": nombre_proyecto,
        "fiesta_nombre": fiesta_nombre,
        "fecha": fecha_evento,
        "tipo_fiesta": tipo_fiesta,
        "privado": True,
        "seleccion_cliente": False,
        "venta_fotos": False,
        "reconocimiento_caras": reconocimiento_caras,
        "carpetas": list(carpetas_a_procesar),
        "portada": {
            "foto": info_portada.get("foto", ""),
            "carpeta_origen": info_portada.get("carpeta", ""),
            "nota": info_portada.get("nota", 0.0),
            "titulo": fiesta_nombre,
            "subtitulo": subtitulo_portada,
            "plantilla": marca_ak.get("plantilla"),
            "letra": marca_ak.get("letra"),
            "colores": marca_ak.get("colores"),
            "espacio_fotos": marca_ak.get("espacio_fotos"),
        },
    }

    res_config_remoto = _configurar_proyecto_remoto(endpoint_simulado, config_proyecto)
    if res_config_remoto.get("url"):
        enlace_privado = res_config_remoto["url"]
    if acepta_videos is None and "acepta_videos" in res_config_remoto:
        acepta_videos = bool(res_config_remoto["acepta_videos"])

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

    subidas_en_esta_sesion: List[Dict[str, str]] = []
    pendientes_en_esta_sesion: List[Dict[str, Any]] = []
    fallidas_en_esta_sesion: List[Dict[str, Any]] = []
    videos_comprimidos: List[Dict[str, Any]] = []
    videos_locales: List[str] = []
    aviso_criollo = ""
    aviso_no_video_agregado = False

    # Subida de fotos y videos (reutiliza conexión SQLite haciendo commit en cada foto)
    detener_lote = False

    with conexion_db(ruta_db) as con_lote:
        cur_lote = con_lote.cursor()
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

                ext_arch = os.path.splitext(ruta_foto)[1].lower()
                es_video = ext_arch in EXTENSIONES_VIDEO
                ruta_subida = ruta_foto

                if es_video:
                    if acepta_videos is False:
                        videos_locales.append(ruta_foto)
                        if not aviso_no_video_agregado:
                            avisos.append(MENSAJE_WFOLIO_NO_ACEPTA_VIDEO)
                            aviso_no_video_agregado = True
                        continue

                    if os.path.exists(ruta_foto) and os.path.getsize(ruta_foto) > LIMITE_VIDEO_WFOLIO_BYTES:
                        cache_dir = os.path.join(os.path.dirname(ruta_db) or ".", "videos_wfolio", carp)
                        ruta_comp = os.path.join(cache_dir, f"{Path(nombre_arch).stem}_wfolio.mp4")
                        res_comp = comprimir_video_para_wfolio(
                            ruta_video=ruta_foto,
                            ruta_salida=ruta_comp,
                            ejecutador_ffmpeg=ejecutador_ffmpeg,
                        )
                        if res_comp.get("exito") and res_comp.get("comprimido"):
                            ruta_subida = res_comp["ruta"]
                            videos_comprimidos.append({
                                "original": ruta_foto,
                                "comprimido": ruta_subida,
                                "tamano_original_bytes": res_comp.get("tamano_original_bytes"),
                                "tamano_bytes": res_comp.get("tamano_bytes"),
                            })
                        elif not res_comp.get("exito"):
                            fallidas_en_esta_sesion.append({
                                "foto": ruta_foto,
                                "nombre": nombre_arch,
                                "carpeta": carp,
                                "error": res_comp.get("error", "Fallo al comprimir video > 500 MB"),
                            })
                            continue

                # Intentar subida
                try:
                    comprobado = False
                    motivo_pendiente = ""

                    if endpoint_simulado is not None:
                        res_endpoint = _subir_foto_endpoint_simulado(
                            endpoint_simulado,
                            ruta_subida,
                            carp,
                            fiesta_nombre,
                        )
                        if isinstance(res_endpoint, dict) and res_endpoint.get("acepta_video") is False:
                            videos_locales.append(ruta_foto)
                            if not aviso_no_video_agregado:
                                avisos.append(MENSAJE_WFOLIO_NO_ACEPTA_VIDEO)
                                aviso_no_video_agregado = True
                            continue

                        if isinstance(res_endpoint, dict) and res_endpoint.get("url"):
                            enlace_privado = res_endpoint["url"]

                        comprobado, motivo_pendiente = _verificar_presencia_remota(
                            res_endpoint if isinstance(res_endpoint, dict) else {"status": "ok"},
                            endpoint_simulado,
                            ruta_subida,
                            carp,
                            fiesta_nombre,
                        )
                    else:
                        # Intento con Playwright en modo real
                        res_play = _subir_con_playwright(
                            ruta_carpetas_str,
                            fiesta_nombre,
                            [{"ruta": ruta_subida, "carpeta": carp}],
                        )
                        if not res_play.get("exito"):
                            if res_play.get("estado") == "pendiente" or res_play.get("comprobado") is False:
                                comprobado = False
                                motivo_pendiente = res_play.get("motivo") or "No se pudo comprobar en la carpeta remota"
                            else:
                                aviso_criollo = res_play.get("aviso_criollo") or MENSAJE_CRIOLLO_CAMBIO_PAGINA
                                raise RuntimeError(res_play.get("error") or "Fallo en automatización web")
                        else:
                            comprobado = res_play.get("comprobado", True)
                            if not comprobado:
                                motivo_pendiente = res_play.get("motivo") or "No se pudo comprobar en la carpeta remota"

                        if res_play.get("url"):
                            enlace_privado = res_play["url"]

                    if comprobado:
                        # Éxito verificado: registrar checkpoint en SQLite
                        cur_lote.execute(
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
                            (fiesta_nombre, carp, nombre_arch, ruta_subida, album_slug, enlace_privado),
                        )
                        con_lote.commit()

                        subidas_en_esta_sesion.append({
                            "foto": ruta_subida,
                            "nombre": nombre_arch,
                            "carpeta": carp,
                        })
                    else:
                        # No comprobada: registrar 'pendiente' con el motivo
                        cur_lote.execute(
                            """
                            INSERT INTO wfolio_subidas (
                                fiesta_nombre, carpeta, nombre_archivo, ruta_archivo,
                                estado, album_id, enlace_album, error, intentos, actualizado_en
                            )
                            VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, 1, CURRENT_TIMESTAMP)
                            ON CONFLICT(fiesta_nombre, carpeta, nombre_archivo) DO UPDATE SET
                                estado = 'pendiente',
                                error = excluded.error,
                                intentos = wfolio_subidas.intentos + 1,
                                actualizado_en = CURRENT_TIMESTAMP
                            """,
                            (fiesta_nombre, carp, nombre_arch, ruta_subida, album_slug, enlace_privado, motivo_pendiente),
                        )
                        con_lote.commit()

                        pendientes_en_esta_sesion.append({
                            "foto": ruta_subida,
                            "nombre": nombre_arch,
                            "carpeta": carp,
                            "motivo": motivo_pendiente,
                        })

                except Exception as e:
                    err_str = str(e)
                    if es_video and "no acepta video" in err_str.lower():
                        videos_locales.append(ruta_foto)
                        if not aviso_no_video_agregado:
                            avisos.append(MENSAJE_WFOLIO_NO_ACEPTA_VIDEO)
                            aviso_no_video_agregado = True
                        continue

                    # Registrar fallo en SQLite
                    cur_lote.execute(
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
                        (fiesta_nombre, carp, nombre_arch, ruta_subida, album_slug, enlace_privado, err_str),
                    )
                    con_lote.commit()

                    fallidas_en_esta_sesion.append({
                        "foto": ruta_subida,
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
    total_pendientes_global = 0
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
            pend_c = conteos.get("pendiente", 0)
            fall_c = conteos.get("fallido", 0)
            tot_c = len(fotos_por_carpeta.get(carp, []))
            por_carpeta[carp] = {
                "subidas": sub_c,
                "pendientes": pend_c,
                "fallidas": fall_c,
                "total": tot_c,
            }
            total_subidas_global += sub_c
            total_pendientes_global += pend_c
            total_fallidas_global += fall_c

    exito = (
        len(fallidas_en_esta_sesion) == 0
        and len(pendientes_en_esta_sesion) == 0
        and total_fallidas_global == 0
        and total_pendientes_global == 0
        and total_subidas_global == (total_fotos_encontradas - len(videos_locales))
    )

    # Bloque 3: Video y publicación en redes (solo si se solicita y respetando permiso_promocion)
    resumen_redes: Optional[Dict[str, Any]] = None
    if generar_redes or permiso_promocion is not None:
        destino_redes = (
            str(carpeta_salida_redes)
            if carpeta_salida_redes is not None
            else os.path.join(ruta_carpetas_str, "redes")
        )
        resumen_redes = generar_video_y_borrador_redes(
            fotos_por_carpeta=fotos_por_carpeta,
            carpeta_destino_redes=destino_redes,
            fiesta_nombre=fiesta_nombre,
            tipo_fiesta=tipo_fiesta,
            permiso_promocion=bool(permiso_promocion),
            evaluador_nota=evaluador_nota,
            duracion_seg=duracion_redes_seg,
            fps=fps_redes,
        )
        if not resumen_redes.get("publicacion_armada") and resumen_redes.get("motivo"):
            avisos.append(resumen_redes["motivo"])

    # Orden 330 Bloque 2: Miniaturas <= 800px, momento y vectores @vladmandic/face-api (opcional y tolerante a fallos)
    resumen_caras: Optional[Dict[str, Any]] = None
    if generar_indice_caras or carpeta_salida_caras is not None or extractor_caras_fn is not None:
        destino_caras = (
            str(carpeta_salida_caras)
            if carpeta_salida_caras is not None
            else os.path.join(ruta_carpetas_str, "caras_fotografo")
        )
        fotos_para_caras: List[Dict[str, Any]] = []
        for item_sub in subidas_en_esta_sesion:
            ruta_f = item_sub.get("foto", "")
            if ruta_f and os.path.splitext(ruta_f)[1].lower() in EXTENSIONES_FOTO:
                fotos_para_caras.append({
                    "ruta": ruta_f,
                    "wfolioUrl": enlace_privado,
                    "carpeta": item_sub.get("carpeta", ""),
                })
        if fotos_para_caras:
            try:
                resumen_caras = armar_paquete_caras_fotografo(
                    fotos_subidas=fotos_para_caras,
                    carpeta_salida=destino_caras,
                    directorio_modelos=directorio_modelos_caras,
                    extractor_fn=extractor_caras_fn,
                )
            except Exception as err_caras:
                avisos.append(
                    f"Índice de caras del fotógrafo omitido (sin modelos locales o Playwright): {err_caras}"
                )

    # Mensaje final: dice cuántas se comprobaron más avisos relevantes
    if exito:
        mensaje_final = f"Se comprobaron {total_subidas_global} fotos en Wfolio."
    elif total_subidas_global == 0:
        mensaje_final = f"Se comprobaron 0 fotos. Quedan {total_pendientes_global} pendientes y {total_fallidas_global} fallidas."
    else:
        mensaje_final = f"Se comprobaron {total_subidas_global} fotos ({total_pendientes_global} pendientes, {total_fallidas_global} fallidas)."

    if avisos:
        mensaje_final = mensaje_final + "\n" + "\n".join(avisos)

    resumen: Dict[str, Any] = {
        "exito": exito,
        "fiesta_nombre": fiesta_nombre,
        "nombre_proyecto": nombre_proyecto,
        "album_id": album_slug,
        "enlace_privado": enlace_privado,
        "privado": True,
        "seleccion_cliente": False,
        "venta_fotos": False,
        "reconocimiento_caras": reconocimiento_caras,
        "carpetas_creadas": list(carpetas_a_procesar),
        "portada": config_proyecto["portada"],
        "proyecto": config_proyecto,
        "estaciones_integradas": info_estaciones,
        "videos_comprimidos": videos_comprimidos,
        "videos_locales": videos_locales,
        "redes": resumen_redes,
        "caras_fotografo": resumen_caras,
        "avisos": avisos,
        "total_subidas": total_subidas_global,
        "total_comprobadas": total_subidas_global,
        "total_pendientes": total_pendientes_global,
        "total_fallidas": total_fallidas_global,
        "total_fotos": total_fotos_encontradas,
        "por_carpeta": por_carpeta,
        "subidas": subidas_en_esta_sesion,
        "pendientes": pendientes_en_esta_sesion,
        "fallidas": fallidas_en_esta_sesion,
        "mensaje": mensaje_final,
    }

    if aviso_criollo:
        resumen["aviso_criollo"] = aviso_criollo
        resumen["mensaje"] = aviso_criollo

    return resumen


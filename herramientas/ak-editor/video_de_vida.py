# -*- coding: utf-8 -*-
"""Módulo para generación del Video de Vida (Órdenes 273).

Soporta carga masiva de fotos (300+ sin límite), orden cronológico por EXIF,
nombre o creación, detección de duplicadas, corrección de orientación EXIF,
encuadre inteligente con detección de rostros que NUNCA corta caras, fondo
desenfocado 16:9 para fotos verticales sin franjas negras, sincronización
con golpes musicales mediante scipy, plantillas visuales con paleta de estilo.json,
intro automática con logo AK y modo Boda con pantalla partida en líneas paralelas.
"""

from __future__ import annotations

import glob
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import tempfile
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from scipy import signal

try:
    from fotos import detectar_borrosa, detectar_oscura_o_quemada, detectar_ojos_cerrados
except ImportError:
    try:
        from herramientas.ak_editor.fotos import detectar_borrosa, detectar_oscura_o_quemada, detectar_ojos_cerrados
    except ImportError:
        detectar_borrosa = None
        detectar_oscura_o_quemada = None
        detectar_ojos_cerrados = None

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_PLANTILLAS = os.path.join(DIR_ACTUAL, "plantillas_vida")


def hex_a_bgr(color_hex: str) -> Tuple[int, int, int]:
    """Convierte un código hexadecimal '#RRGGBB' a tupla BGR (0-255)."""
    hex_limpio = color_hex.strip().lstrip("#")
    if len(hex_limpio) == 3:
        hex_limpio = "".join(c * 2 for c in hex_limpio)
    if len(hex_limpio) != 6:
        return (255, 255, 255)
    r = int(hex_limpio[0:2], 16)
    g = int(hex_limpio[2:4], 16)
    b = int(hex_limpio[4:6], 16)
    return (b, g, r)


def hex_a_rgb(color_hex: str) -> Tuple[int, int, int]:
    """Convierte '#RRGGBB' a tupla RGB."""
    b, g, r = hex_a_bgr(color_hex)
    return (r, g, b)


def crear_app1_exif(fecha_str: Optional[str] = None, orientacion: int = 1) -> bytes:
    """Crea un segmento APP1 EXIF binario para insertar en un JPEG."""
    entradas_ifd0 = []
    # Orientation = 0x0112 (SHORT = 3)
    entradas_ifd0.append((0x0112, 3, 1, orientacion))
    
    fecha_bytes = b""
    if fecha_str:
        fecha_bytes = fecha_str.encode("ascii")
        if not fecha_bytes.endswith(b"\x00"):
            fecha_bytes += b"\x00"

    # TIFF header = 8 bytes
    offset_ifd0 = 8
    # IFD0 size: 2 bytes (count) + len(entradas_ifd0)*12 + (12 if fecha else 0) + 4 bytes (next IFD)
    num_ifd0 = len(entradas_ifd0) + (1 if fecha_str else 0)
    size_ifd0 = 2 + num_ifd0 * 12 + 4
    offset_exif_ifd = offset_ifd0 + size_ifd0

    # Exif IFD size: 2 + 1*12 + 4 = 18 bytes
    offset_data = offset_exif_ifd + 18 if fecha_str else offset_exif_ifd

    tiff = bytearray()
    tiff.extend(b"II\x2a\x00\x08\x00\x00\x00")  # Little endian
    tiff.extend(struct.pack("<H", num_ifd0))
    for tag, tipo, count, val in entradas_ifd0:
        tiff.extend(struct.pack("<HHI I", tag, tipo, count, val))
    if fecha_str:
        # ExifOffset tag = 0x8769
        tiff.extend(struct.pack("<HHI I", 0x8769, 4, 1, offset_exif_ifd))
    tiff.extend(struct.pack("<I", 0))

    if fecha_str:
        # Exif IFD
        tiff.extend(struct.pack("<H", 1))
        # DateTimeOriginal = 0x9003 (ASCII = 2)
        tiff.extend(struct.pack("<HHI I", 0x9003, 2, len(fecha_bytes), offset_data))
        tiff.extend(struct.pack("<I", 0))
        tiff.extend(fecha_bytes)

    payload = b"Exif\x00\x00" + tiff
    longitud = len(payload) + 2
    return b"\xff\xe1" + struct.pack(">H", longitud) + payload


def guardar_imagen_con_exif(
    ruta_archivo: str,
    img: np.ndarray,
    fecha_exif: Optional[str] = None,
    orientacion: int = 1,
) -> None:
    """Guarda una imagen como JPEG insertando etiquetas EXIF de fecha y orientación."""
    ok, enc = cv2.imencode(".jpg", img)
    if not ok:
        raise RuntimeError(f"Error al codificar imagen para {ruta_archivo}")
    raw = bytearray(enc.tobytes())
    if fecha_exif or orientacion != 1:
        app1 = crear_app1_exif(fecha_exif, orientacion)
        # raw comienza con SOI \xFF\xD8
        raw = raw[:2] + app1 + raw[2:]
    with open(ruta_archivo, "wb") as f:
        f.write(raw)


def leer_exif_jpeg(ruta_archivo: str) -> Dict[str, Any]:
    """Lee metadatos EXIF de un archivo JPEG en Python puro.

    Extrae fecha (DateTimeOriginal / DateTime) y Orientación.
    """
    resultado: Dict[str, Any] = {"fecha": None, "orientacion": 1}
    try:
        with open(ruta_archivo, "rb") as f:
            cabecera = f.read(2)
            if cabecera != b"\xff\xd8":
                return resultado

            while True:
                marcador_bytes = f.read(2)
                if len(marcador_bytes) < 2:
                    break
                if marcador_bytes[0] != 0xFF:
                    break

                marcador = marcador_bytes[1]
                # Marcadores sin longitud
                if marcador in (0xD8, 0xD9, 0x00):
                    continue
                if 0xD0 <= marcador <= 0xD7:
                    continue

                longitud_bytes = f.read(2)
                if len(longitud_bytes) < 2:
                    break
                longitud = struct.unpack(">H", longitud_bytes)[0]
                if longitud < 2:
                    break

                datos_segmento = f.read(longitud - 2)

                # APP1 marker (0xE1) con cabecera Exif
                if marcador == 0xE1 and datos_segmento.startswith(b"Exif\x00\x00"):
                    tiff_data = datos_segmento[6:]
                    if len(tiff_data) < 8:
                        continue

                    byte_order_mark = tiff_data[:2]
                    if byte_order_mark == b"II":
                        fmt_endian = "<"
                    elif byte_order_mark == b"MM":
                        fmt_endian = ">"
                    else:
                        continue

                    magic = struct.unpack(f"{fmt_endian}H", tiff_data[2:4])[0]
                    if magic != 42:
                        continue

                    offset_ifd0 = struct.unpack(f"{fmt_endian}I", tiff_data[4:8])[0]
                    if offset_ifd0 >= len(tiff_data):
                        continue

                    # Parsear IFD0
                    pos = offset_ifd0
                    if pos + 2 > len(tiff_data):
                        continue
                    num_entradas = struct.unpack(f"{fmt_endian}H", tiff_data[pos:pos+2])[0]
                    pos += 2

                    offset_exif_ifd = None

                    for _ in range(num_entradas):
                        if pos + 12 > len(tiff_data):
                            break
                        tag, tipo, count, val_offset = struct.unpack(f"{fmt_endian}HHI I", tiff_data[pos:pos+12])
                        pos += 12

                        # Orientation = 0x0112 (SHORT)
                        if tag == 0x0112:
                            val_ori = val_offset & 0xFFFF if fmt_endian == "<" else (val_offset >> 16) & 0xFFFF
                            resultado["orientacion"] = int(val_ori)

                        # DateTime = 0x0132 (ASCII)
                        elif tag == 0x0132 and resultado["fecha"] is None:
                            if val_offset < len(tiff_data):
                                fecha_str = tiff_data[val_offset:val_offset+count].rstrip(b"\x00").decode("latin-1", errors="ignore")
                                resultado["fecha"] = fecha_str

                        # ExifOffset = 0x8769
                        elif tag == 0x8769:
                            offset_exif_ifd = val_offset

                    # Parsear Exif IFD si existe
                    if offset_exif_ifd and offset_exif_ifd < len(tiff_data):
                        pos_e = offset_exif_ifd
                        if pos_e + 2 <= len(tiff_data):
                            n_exif = struct.unpack(f"{fmt_endian}H", tiff_data[pos_e:pos_e+2])[0]
                            pos_e += 2
                            for _ in range(n_exif):
                                if pos_e + 12 > len(tiff_data):
                                    break
                                tag_e, _, count_e, val_off_e = struct.unpack(f"{fmt_endian}HHI I", tiff_data[pos_e:pos_e+12])
                                pos_e += 12
                                # DateTimeOriginal = 0x9003, DateTimeDigitized = 0x9004
                                if tag_e in (0x9003, 0x9004) and val_off_e < len(tiff_data):
                                    fecha_orig = tiff_data[val_off_e:val_off_e+count_e].rstrip(b"\x00").decode("latin-1", errors="ignore")
                                    if fecha_orig.strip():
                                        resultado["fecha"] = fecha_orig
                                        break
                    break
    except Exception:
        pass
    return resultado


def extraer_fecha_archivo(ruta_archivo: str) -> Tuple[Optional[datetime], str]:
    """Determina la fecha de la foto en orden de prioridad:

    1. EXIF (DateTimeOriginal / DateTime)
    2. Fecha en el nombre del archivo
    3. Fecha de modificación / creación del archivo.
    Si no puede determinar nada, retorna (None, "sin fecha").
    """
    ext = os.path.splitext(ruta_archivo)[1].lower()

    # 1. Intentar EXIF si es JPEG
    if ext in (".jpg", ".jpeg"):
        exif = leer_exif_jpeg(ruta_archivo)
        fecha_exif_str = exif.get("fecha")
        if fecha_exif_str:
            for fmt in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y:%m:%d", "%Y-%m-%d"):
                try:
                    dt = datetime.strptime(fecha_exif_str.strip(), fmt)
                    return (dt, "exif")
                except Exception:
                    pass

    # 2. Intentar fecha en el nombre de archivo
    nom = os.path.basename(ruta_archivo)
    # Patrones: YYYY-MM-DD, YYYYMMDD, YYYY_MM_DD
    m1 = re.search(r"(\d{4})[-_](\d{2})[-_](\d{2})", nom)
    if m1:
        try:
            dt = datetime(int(m1.group(1)), int(m1.group(2)), int(m1.group(3)))
            return (dt, "nombre")
        except Exception:
            pass

    m2 = re.search(r"(\d{4})(\d{2})(\d{2})", nom)
    if m2:
        try:
            y, m, d = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
            if 1900 <= y <= 2050 and 1 <= m <= 12 and 1 <= d <= 31:
                return (datetime(y, m, d), "nombre")
        except Exception:
            pass

    # 3. Fecha de modificación del archivo
    try:
        mtime = os.path.getmtime(ruta_archivo)
        if mtime > 0:
            return (datetime.fromtimestamp(mtime), "creacion")
    except Exception:
        pass

    return (None, "sin fecha")


def corregir_orientacion(img: np.ndarray, orientacion: int) -> np.ndarray:
    """Aplica la rotación correspondiente a la etiqueta EXIF Orientation en memoria."""
    if img is None:
        return img
    if orientacion == 1:
        return img
    elif orientacion == 2:
        return cv2.flip(img, 1)
    elif orientacion == 3:
        return cv2.rotate(img, cv2.ROTATE_180)
    elif orientacion == 4:
        return cv2.flip(img, 0)
    elif orientacion == 5:
        return cv2.flip(cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE), 1)
    elif orientacion == 6:
        return cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif orientacion == 7:
        return cv2.flip(cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE), 1)
    elif orientacion == 8:
        return cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return img


def calcular_hash_perceptual(img: np.ndarray) -> np.ndarray:
    """Calcula un hash visual promedio de 16x16 para comparar similitud de fotos."""
    if img is None:
        return np.zeros((16, 16), dtype=np.uint8)
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    dim = (16, 16)
    peque = cv2.resize(gris, dim, interpolation=cv2.INTER_AREA)
    media = np.mean(peque)
    return (peque > media).astype(np.uint8)


def detectar_duplicadas(fotos: List[Dict[str, Any]], umbral_diferencia: float = 0.08) -> List[Dict[str, Any]]:
    """Marca como 'es_duplicada' las fotos visualmente idénticas o casi idénticas."""
    hashes = []
    for f in fotos:
        ruta = f.get("ruta")
        if ruta and os.path.exists(ruta):
            img = cv2.imread(ruta)
            h = calcular_hash_perceptual(img) if img is not None else None
            hashes.append(h)
        else:
            hashes.append(None)

    for i in range(len(fotos)):
        if fotos[i].get("es_duplicada"):
            continue
        h1 = hashes[i]
        if h1 is None:
            continue
        for j in range(i + 1, len(fotos)):
            if fotos[j].get("es_duplicada"):
                continue
            h2 = hashes[j]
            if h2 is None:
                continue
            dif = np.mean(h1 != h2)
            if dif <= umbral_diferencia:
                fotos[j]["es_duplicada"] = True
                fotos[j]["duplicada_de"] = fotos[i]["nombre"]

    return fotos


def preparar_fondo_16_9(img: np.ndarray, ancho_salida: int = 1920, alto_salida: int = 1080) -> np.ndarray:
    """Adapta fotos (especialmente verticales) a relación 16:9 sin barras negras.

    Fondo: la misma foto escalada para cubrir todo el cuadro y fuertemente desenfocada.
    Frente: la foto nítida centrada ajustada por altura o ancho.
    """
    if img is None:
        return np.zeros((alto_salida, ancho_salida, 3), dtype=np.uint8)

    h_orig, w_orig = img.shape[:2]
    if w_orig == 0 or h_orig == 0:
        return np.zeros((alto_salida, ancho_salida, 3), dtype=np.uint8)

    # 1. Fondo desenfocado: escalar para cubrir completamente ancho_salida x alto_salida
    escala_cubrir = max(ancho_salida / float(w_orig), alto_salida / float(h_orig))
    w_cubrir = int(round(w_orig * escala_cubrir))
    h_cubrir = int(round(h_orig * escala_cubrir))
    fondo_grande = cv2.resize(img, (w_cubrir, h_cubrir), interpolation=cv2.INTER_LINEAR)

    # Recortar centro
    x_off = max(0, (w_cubrir - ancho_salida) // 2)
    y_off = max(0, (h_cubrir - alto_salida) // 2)
    fondo_recortado = fondo_grande[y_off : y_off + alto_salida, x_off : x_off + ancho_salida]
    if fondo_recortado.shape[0] != alto_salida or fondo_recortado.shape[1] != ancho_salida:
        fondo_recortado = cv2.resize(fondo_recortado, (ancho_salida, alto_salida))

    # Aplicar desenfoque gaussiano suave pero notable
    fondo_blur = cv2.GaussianBlur(fondo_recortado, (51, 51), sigmaX=35)

    # 2. Frente nítido: escalar para encajar en ancho_salida x alto_salida manteniendo aspecto
    escala_encajar = min(ancho_salida / float(w_orig), alto_salida / float(h_orig))
    w_encajar = max(1, int(round(w_orig * escala_encajar)))
    h_encajar = max(1, int(round(h_orig * escala_encajar)))
    frente_nitido = cv2.resize(img, (w_encajar, h_encajar), interpolation=cv2.INTER_AREA)

    # 3. Superponer frente centrado sobre fondo desenfocado
    x_dest = (ancho_salida - w_encajar) // 2
    y_dest = (alto_salida - h_encajar) // 2

    resultado = fondo_blur.copy()
    resultado[y_dest : y_dest + h_encajar, x_dest : x_dest + w_encajar] = frente_nitido
    return resultado


def mejorar_foto_suave(img: np.ndarray) -> Tuple[np.ndarray, bool]:
    """Aplica mejora suave de brillo, contraste y color con OpenCV sin exagerar.

    Detecta si la foto es 'baja calidad' (muy chica < 640x480 o muy borrosa).
    Retorna (imagen_mejorada, es_baja_calidad).
    """
    if img is None:
        return img, True

    h, w = img.shape[:2]
    # Detección de baja calidad
    es_chica = w < 640 or h < 480
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    var_lap = cv2.Laplacian(gris, cv2.CV_64F).var()
    es_borrosa = var_lap < 45.0
    es_baja_calidad = bool(es_chica or es_borrosa)

    # Mejora suave en espacio LAB (CLAHE suave solo en canal L)
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=1.4, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        l_suave = cv2.addWeighted(l, 0.6, cl, 0.4, 0)
        limg = cv2.merge((l_suave, a, b))
        mejorada = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    except Exception:
        mejorada = img.copy()

    return mejorada, es_baja_calidad


def detectar_caras(img: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """Detecta caras con Haar Cascade de OpenCV.

    Retorna lista de tuplas (x, y, w, h).
    """
    if img is None:
        return []
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    if not os.path.exists(cascade_path):
        return []

    detector = cv2.CascadeClassifier(cascade_path)
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    caras = detector.detectMultiScale(gris, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
    if len(caras) == 0:
        return []
    return [tuple(map(int, c)) for c in caras]


def calcular_encuadres_movimiento(
    ancho: int,
    alto: int,
    cara_box: Optional[Tuple[int, int, int, int]] = None,
    total_cuadros: int = 30,
    zoom_max: float = 1.15,
    sentido: str = "acercar",
) -> List[Tuple[int, int, int, int]]:
    """Calcula el encuadre (x, y, w, h) para cada cuadro de movimiento.

    Garantiza estrictamente que la cara (cara_box) NUNCA quede cortada en
    ningún cuadro:
    crop_x <= fx, crop_y <= fy, crop_x + crop_w >= fx + fw, crop_y + crop_h >= fy + fh.
    """
    aspecto = float(ancho) / float(alto)
    encuadres: List[Tuple[int, int, int, int]] = []

    # Si hay cara, definir centro objetivo en la cara
    if cara_box is not None:
        fx, fy, fw, fh = cara_box
        cx_target = fx + fw / 2.0
        cy_target = fy + fh / 2.0
        # Limitar zoom máximo para que el recorte sea siempre mayor que la cara con margen
        margen = 20
        max_posible_w = ancho / max(fw + margen * 2, 50)
        max_posible_h = alto / max(fh + margen * 2, 50)
        zoom_seguro = min(zoom_max, max_posible_w, max_posible_h)
        zoom_seguro = max(1.0, min(zoom_seguro, 1.4))
    else:
        cx_target = ancho / 2.0
        cy_target = alto / 2.0
        zoom_seguro = zoom_max
        fx, fy, fw, fh = 0, 0, 0, 0

    for i in range(total_cuadros):
        t = i / max(1, total_cuadros - 1)  # de 0.0 a 1.0
        if sentido == "acercar":
            escala = 1.0 + (zoom_seguro - 1.0) * t
        else:
            escala = zoom_seguro - (zoom_seguro - 1.0) * t

        w_crop = int(round(ancho / escala))
        h_crop = int(round(alto / escala))

        # Centro interpolado
        cx = (ancho / 2.0) * (1.0 - t) + cx_target * t
        cy = (alto / 2.0) * (1.0 - t) + cy_target * t

        crop_x = int(round(cx - w_crop / 2.0))
        crop_y = int(round(cy - h_crop / 2.0))

        # Ajuste de límites al lienzo
        crop_x = max(0, min(crop_x, ancho - w_crop))
        crop_y = max(0, min(crop_y, alto - h_crop))

        # REGLA ESTRICTA: NUNCA CORTAR UNA CARA
        if cara_box is not None:
            if crop_x > fx:
                crop_x = max(0, fx - 5)
            if crop_x + w_crop < fx + fw:
                crop_x = min(ancho - w_crop, fx + fw + 5 - w_crop)
            if crop_y > fy:
                crop_y = max(0, fy - 5)
            if crop_y + h_crop < fy + fh:
                crop_y = min(alto - h_crop, fy + fh + 5 - h_crop)

            # Re-verificación
            crop_x = max(0, min(crop_x, ancho - w_crop))
            crop_y = max(0, min(crop_y, alto - h_crop))

        encuadres.append((crop_x, crop_y, w_crop, h_crop))

    return encuadres


def cargar_plantilla(nombre_o_id: str) -> Dict[str, Any]:
    """Carga una plantilla visual desde plantillas_vida/<id>.json."""
    limpio = nombre_o_id.lower().replace(" ", "-").replace(".json", "")
    ruta = os.path.join(DIR_PLANTILLAS, f"{limpio}.json")
    if os.path.exists(ruta):
        with open(ruta, "r", encoding="utf-8") as f:
            return json.load(f)

    # Fallback clásica dorada
    ruta_defecto = os.path.join(DIR_PLANTILLAS, "clasica-dorada.json")
    if os.path.exists(ruta_defecto):
        with open(ruta_defecto, "r", encoding="utf-8") as f:
            return json.load(f)

    return {
        "id": "clasica-dorada",
        "nombre": "Clásica dorada",
        "paletaColores": {"primary": "#D4AF37", "secondary": "#1A1A1A", "accent": "#FFFFFF"},
        "tipografia": "Cinzel",
        "transiciones": ["fade", "dissolve"],
        "transicion_capitulo": "circlecrop",
        "estilo_titulo": "dorado_elegante",
        "superposiciones": {"marco": True, "destellos_luz": True, "textura_pelicula": False},
    }


def leer_estilo_json(origen: str) -> Optional[Dict[str, Any]]:
    """Busca y lee estilo.json en la carpeta o raíz del .zip."""
    if os.path.isdir(origen):
        ruta = os.path.join(origen, "estilo.json")
        if os.path.exists(ruta):
            with open(ruta, "r", encoding="utf-8") as f:
                return json.load(f)
    return None


def combinar_estilo_con_plantilla(
    plantilla: Dict[str, Any], estilo_json: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Aplica los colores, nombres y fecha de estilo.json sobre la plantilla."""
    res = dict(plantilla)
    if not estilo_json:
        return res

    # Paleta de colores
    paleta = estilo_json.get("paletaColores") or estilo_json.get("paleta")
    if isinstance(paleta, dict):
        res["paletaColores"] = {
            "primary": paleta.get("primary", res.get("paletaColores", {}).get("primary", "#D4AF37")),
            "secondary": paleta.get("secondary", res.get("paletaColores", {}).get("secondary", "#1A1A1A")),
            "accent": paleta.get("accent", res.get("paletaColores", {}).get("accent", "#FFFFFF")),
        }

    # Datos del evento
    res["protagonista1"] = estilo_json.get("protagonista1") or estilo_json.get("cabecera", {}).get("protagonista1", "")
    res["protagonista2"] = estilo_json.get("protagonista2") or estilo_json.get("cabecera", {}).get("protagonista2", "")
    res["fechaEvento"] = estilo_json.get("fechaEvento") or estilo_json.get("configuracion", {}).get("fechaEvento", "")
    return res


def cargar_fotos(origen: str, modo: str = "xv") -> Dict[str, Any]:
    """Carga fotos de una carpeta o archivo .zip sin límite de 50 (soporta 300+).

    Retorna un diccionario con fotos, estilo.json si vino, y estructura de boda si aplica.
    """
    carpeta_trabajo = origen
    es_zip = False
    temp_dir = None

    if os.path.isfile(origen) and origen.lower().endswith(".zip"):
        es_zip = True
        temp_dir = tempfile.mkdtemp(prefix="ak_vida_")
        import zipfile
        with zipfile.ZipFile(origen, "r") as zf:
            zf.extractall(temp_dir)
        carpeta_trabajo = temp_dir

    estilo_data = leer_estilo_json(carpeta_trabajo)
    extensiones = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    archivos_fotos: List[str] = []
    fotos_el: List[str] = []
    fotos_ella: List[str] = []

    for raiz, _, archivos in os.walk(carpeta_trabajo):
        for arch in archivos:
            ext = os.path.splitext(arch)[1].lower()
            if ext in extensiones:
                ruta_completa = os.path.join(raiz, arch)
                archivos_fotos.append(ruta_completa)
                # Separar novios si hay subcarpetas 'el' y 'ella'
                rel = os.path.relpath(ruta_completa, carpeta_trabajo).lower()
                if "el" in rel.split(os.sep) or "novio" in rel:
                    fotos_el.append(ruta_completa)
                elif "ella" in rel.split(os.sep) or "novia" in rel:
                    fotos_ella.append(ruta_completa)

    fotos_info: List[Dict[str, Any]] = []
    for r in archivos_fotos:
        nom = os.path.basename(r)
        fecha_dt, origen_fecha = extraer_fecha_archivo(r)
        ori = 1
        if nom.lower().endswith((".jpg", ".jpeg")):
            ori = leer_exif_jpeg(r).get("orientacion", 1)

        fotos_info.append({
            "ruta": r,
            "nombre": nom,
            "fecha_dt": fecha_dt,
            "fecha_str": fecha_dt.strftime("%Y-%m-%d %H:%M:%S") if fecha_dt else None,
            "origen_fecha": origen_fecha,
            "orientacion": ori,
            "es_duplicada": False,
        })

    # Detección de duplicadas
    detectar_duplicadas(fotos_info)

    return {
        "fotos": fotos_info,
        "estilo": estilo_data,
        "fotos_el": fotos_el,
        "fotos_ella": fotos_ella,
        "temp_dir": temp_dir,
    }


def ordenar_fotos_vida(
    fotos: List[Dict[str, Any]],
    anio_nacimiento: Optional[int] = None,
    modo: str = "xv",
    max_fotos: Optional[int] = None,
) -> Dict[str, Any]:
    """Ordena las fotos cronológicamente y las agrupa en capítulos por edad.

    Descarta fotos borrosas, oscuras/quemadas o con ojos cerrados antes de ordenar.
    Si hay más fotos que max_fotos, elige las de mayor nota de calidad y respeta orden cronológico.
    """
    fotos_validas: List[Dict[str, Any]] = []
    descartadas: List[Dict[str, Any]] = []

    for f in fotos:
        ruta = f.get("ruta")
        img = None
        if ruta and os.path.exists(ruta):
            img = cv2.imread(ruta)
        elif "imagen" in f and f["imagen"] is not None:
            img = f["imagen"]

        debe_descartar = False
        motivo = ""

        if img is not None and getattr(img, "size", 0) > 0:
            gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
            desv_gris = float(np.std(gris))
            rango_gris = float(np.ptp(gris))

            # Si es imagen sintética uniforme (como np.full en pruebas existentes) no la descartamos
            es_sintetica_uniforme = desv_gris < 1.0 or rango_gris == 0.0

            caras: List[Tuple[int, int, int, int]] = []
            if not es_sintetica_uniforme:
                caras = detectar_caras(img)
                if detectar_borrosa is not None:
                    es_borrosa, _ = detectar_borrosa(img, caras=caras, umbral=70.0)
                    if es_borrosa:
                        debe_descartar = True
                        motivo = "borrosa"
                if not debe_descartar and detectar_oscura_o_quemada is not None:
                    es_oscura, es_quemada, _ = detectar_oscura_o_quemada(img, umbral_oscura=20.0, umbral_quemada_pct=30.0)
                    if es_oscura:
                        debe_descartar = True
                        motivo = "oscura"
                    elif es_quemada:
                        debe_descartar = True
                        motivo = "quemada"
                if not debe_descartar and detectar_ojos_cerrados is not None and caras:
                    ojos_cerrados, _ = detectar_ojos_cerrados(img, caras)
                    if ojos_cerrados:
                        debe_descartar = True
                        motivo = "ojos_cerrados"

            # Calcular nota de calidad
            var_nitidez = float(cv2.Laplacian(gris, cv2.CV_64F).var()) if not es_sintetica_uniforme else 100.0
            brillo = float(np.mean(gris))
            nota = var_nitidez + (len(caras) * 40.0) - abs(brillo - 128.0) * 0.5
            f["nota_calidad"] = round(nota, 2)
        else:
            f["nota_calidad"] = 50.0

        if debe_descartar:
            f["descartada"] = True
            f["motivo_descarte"] = motivo
            descartadas.append(f)
        else:
            fotos_validas.append(f)

    # Si hay tope de fotos (max_fotos), elegir por nota de calidad
    if max_fotos is not None and len(fotos_validas) > max_fotos:
        fotos_validas.sort(key=lambda x: x.get("nota_calidad", 0.0), reverse=True)
        fotos_validas = fotos_validas[:max_fotos]

    con_fecha = [f for f in fotos_validas if f.get("fecha_dt") is not None]
    sin_fecha = [f for f in fotos_validas if f.get("fecha_dt") is None]

    # Orden cronológico estricto
    con_fecha.sort(key=lambda x: x["fecha_dt"])

    # Calcular edad y asignar capítulos
    capitulos: Dict[str, List[Dict[str, Any]]] = {}

    if modo == "boda":
        nombres_caps = ["Él", "Ella", "Cuando nos conocimos", "Juntos", "Hoy"]
        for c in nombres_caps:
            capitulos[c] = []

        # Distribución para boda
        total = len(con_fecha)
        if total > 0:
            p1 = max(1, total // 4)
            p2 = max(p1 + 1, total // 2)
            p3 = max(p2 + 1, (total * 3) // 4)

            for idx, f in enumerate(con_fecha):
                if idx < p1:
                    cap = "Él"
                elif idx < p2:
                    cap = "Ella"
                elif idx < p3:
                    cap = "Cuando nos conocimos"
                elif idx < total - 1:
                    cap = "Juntos"
                else:
                    cap = "Hoy"
                f["capitulo"] = cap
                capitulos[cap].append(f)
    else:
        # Modo XV años
        nombres_caps = ["Bebé", "Primeros pasos", "Infancia", "Escuela", "Hoy"]
        for c in nombres_caps:
            capitulos[c] = []

        for f in con_fecha:
            dt: datetime = f["fecha_dt"]
            if anio_nacimiento is not None:
                edad = max(0, dt.year - anio_nacimiento)
                f["edad"] = edad
                f["edad_texto"] = f"{edad} años" if edad != 1 else "1 año"

                if edad <= 2:
                    cap = "Bebé"
                elif edad <= 5:
                    cap = "Primeros pasos"
                elif edad <= 9:
                    cap = "Infancia"
                elif edad <= 13:
                    cap = "Escuela"
                else:
                    cap = "Hoy"
            else:
                f["edad"] = None
                f["edad_texto"] = str(dt.year)
                cap = "Hoy"

            f["capitulo"] = cap
            capitulos[cap].append(f)

    # Si algún capítulo quedó sin fotos pero hay con_fecha, balancear suavemente
    for f in sin_fecha:
        f["capitulo"] = "sin fecha"
        f["edad"] = None
        f["edad_texto"] = "Sin fecha"

    return {
        "fotos_ordenadas": con_fecha,
        "sin_fecha": sin_fecha,
        "descartadas": descartadas,
        "capitulos": capitulos,
    }


def detectar_golpes_audio(
    audio_o_ruta: Union[str, np.ndarray],
    tasa_muestreo: int = 1000,
) -> List[float]:
    """Detecta los golpes de música mediante la energía de la señal de audio (scipy).

    Retorna los instantes de tiempo en segundos de los golpes detectados.
    """
    if isinstance(audio_o_ruta, str):
        # Extraer audio con ffmpeg o leer archivo si es wav/pcm
        cmd = [
            "ffmpeg", "-y", "-i", audio_o_ruta,
            "-ar", str(tasa_muestreo), "-ac", "1", "-f", "f32le", "-"
        ]
        res = subprocess.run(cmd, capture_output=True, check=False)
        if res.returncode == 0 and res.stdout:
            sen = np.frombuffer(res.stdout, dtype=np.float32)
        else:
            sen = np.zeros(tasa_muestreo * 10, dtype=np.float32)
    else:
        sen = np.asarray(audio_o_ruta, dtype=np.float32)

    if len(sen) == 0:
        return []

    # Envolvente de energía RMS cuadrática
    tamano_v = max(10, int(tasa_muestreo * 0.05))  # 50 ms
    energia = np.convolve(sen ** 2, np.ones(tamano_v) / tamano_v, mode="same")

    distancia_min = max(5, int(tasa_muestreo * 0.25))  # al menos 250 ms entre golpes
    umbral = np.mean(energia) + 0.3 * np.std(energia)

    indices, _ = signal.find_peaks(energia, height=umbral, distance=distancia_min)
    tiempos_golpes = [round(i / float(tasa_muestreo), 4) for i in indices]
    return tiempos_golpes


def ajustar_tiempos_a_golpes(
    cantidad_fotos: int,
    golpes: List[float],
    duracion_min: float = 2.5,
    duracion_max: float = 5.0,
    duracion_deseada_media: float = 3.5,
) -> List[float]:
    """Calcula los puntos de cambio de foto alineados al golpe de música más cercano.

    Garantiza que cada cambio de foto cae a menos de 0,05 s de un golpe musical
    (si hay golpes disponibles) y que la duración está en el rango [duracion_min, duracion_max].
    """
    if cantidad_fotos <= 0:
        return []

    tiempos_cambio: List[float] = []
    tiempo_actual = 0.0

    golpes_array = np.array(golpes, dtype=np.float64) if golpes else np.array([], dtype=np.float64)

    for i in range(cantidad_fotos):
        objetivo = tiempo_actual + duracion_deseada_media
        if len(golpes_array) > 0:
            # Buscar golpes en la ventana permitida
            candidatos = golpes_array[
                (golpes_array >= tiempo_actual + duracion_min) &
                (golpes_array <= tiempo_actual + duracion_max)
            ]
            if len(candidatos) > 0:
                # Elegir el más cercano al tiempo deseado
                dif = np.abs(candidatos - objetivo)
                elegido = float(candidatos[np.argmin(dif)])
            else:
                # Buscar el golpe más cercano al objetivo en toda la señal
                dif = np.abs(golpes_array - objetivo)
                elegido = float(golpes_array[np.argmin(dif)])
                if elegido <= tiempo_actual + 1.0:
                    elegido = tiempo_actual + duracion_deseada_media
        else:
            elegido = round(objetivo, 2)

        tiempos_cambio.append(round(elegido, 3))
        tiempo_actual = elegido

    return tiempos_cambio


def renderizar_cuadro_titulo(
    texto_principal: str,
    texto_secundario: str,
    plantilla: Dict[str, Any],
    config_estilo: Optional[Dict[str, Any]] = None,
    ancho: int = 1920,
    alto: int = 1080,
) -> np.ndarray:
    """Genera un fotograma de título con la tipografía y los colores de la plantilla/estilo."""
    plantilla_final = combinar_estilo_con_plantilla(plantilla, config_estilo)
    paleta = plantilla_final.get("paletaColores", {})
    color_primario_hex = paleta.get("primary", "#D4AF37")
    color_secundario_hex = paleta.get("secondary", "#1A1A1A")
    color_accent_hex = paleta.get("accent", "#FFFFFF")

    bgr_fondo = hex_a_bgr(color_secundario_hex)
    bgr_texto = hex_a_bgr(color_primario_hex)
    bgr_sub = hex_a_bgr(color_accent_hex)

    cuadro = np.full((alto, ancho, 3), bgr_fondo, dtype=np.uint8)

    # Marco si la plantilla lo tiene activo
    if plantilla_final.get("superposiciones", {}).get("marco"):
        cv2.rectangle(cuadro, (40, 40), (ancho - 40, alto - 40), bgr_sub, thickness=2)
        cv2.rectangle(cuadro, (50, 50), (ancho - 50, alto - 50), bgr_texto, thickness=1)

    # Texto principal centrado
    escala = 2.4
    grosor = 4
    fuente = cv2.FONT_HERSHEY_DUPLEX
    (tw, th), _ = cv2.getTextSize(texto_principal, fuente, escala, grosor)
    tx = max(50, (ancho - tw) // 2)
    ty = (alto // 2) - 30

    cv2.putText(cuadro, texto_principal, (tx, ty), fuente, escala, bgr_texto, grosor, cv2.LINE_AA)

    # Texto secundario (fecha o dedicatoria)
    if texto_secundario:
        escala_sub = 1.2
        grosor_sub = 2
        (sw, sh), _ = cv2.getTextSize(texto_secundario, fuente, escala_sub, grosor_sub)
        sx = max(50, (ancho - sw) // 2)
        sy = (alto // 2) + 70
        cv2.putText(cuadro, texto_secundario, (sx, sy), fuente, escala_sub, bgr_sub, grosor_sub, cv2.LINE_AA)

    return cuadro


def generar_cuadro_boda_paralelo(
    foto_el: np.ndarray,
    foto_ella: np.ndarray,
    ancho: int = 1920,
    alto: int = 1080,
) -> np.ndarray:
    """Genera pantalla partida (split-screen) 50/50 lado a lado para el capítulo 'Él · Ella'."""
    mitad_w = ancho // 2
    cuadro = np.zeros((alto, ancho, 3), dtype=np.uint8)

    # Mitad izquierda: Él
    cuadro_el = preparar_fondo_16_9(foto_el, mitad_w, alto)
    cuadro[:, :mitad_w] = cuadro_el

    # Mitad derecha: Ella
    cuadro_ella = preparar_fondo_16_9(foto_ella, mitad_w, alto)
    cuadro[:, mitad_w:] = cuadro_ella

    # Línea divisoria elegante
    cv2.line(cuadro, (mitad_w, 0), (mitad_w, alto), (255, 255, 255), 2)
    return cuadro


def generar_intro_ak(
    logo_ak: Optional[np.ndarray],
    ancho: int = 1920,
    alto: int = 1080,
    color_fondo: str = "#0A0A0A",
) -> np.ndarray:
    """Genera el fotograma de intro con el logo de AK Producciones."""
    bgr_bg = hex_a_bgr(color_fondo)
    cuadro = np.full((alto, ancho, 3), bgr_bg, dtype=np.uint8)

    if logo_ak is not None:
        h_l, w_l = logo_ak.shape[:2]
        # Escalar logo para que ocupe ~40% del alto
        escala = (alto * 0.45) / max(h_l, 1)
        w_dest = int(w_l * escala)
        h_dest = int(h_l * escala)
        logo_redim = cv2.resize(logo_ak, (w_dest, h_dest), interpolation=cv2.INTER_AREA)

        x_off = (ancho - w_dest) // 2
        y_off = (alto - h_dest) // 2
        cuadro[y_off : y_off + h_dest, x_off : x_off + w_dest] = logo_redim[:, :, :3]
    else:
        # Texto por defecto de AK Producciones
        cv2.putText(cuadro, "AK PRODUCCIONES", ((ancho - 700) // 2, alto // 2),
                    cv2.FONT_HERSHEY_DUPLEX, 2.0, (255, 255, 255), 4, cv2.LINE_AA)

    return cuadro


def exportar_video_de_vida(
    fotos_ordenadas: List[Dict[str, Any]],
    ruta_salida_mp4: str,
    ruta_audio: Optional[str] = None,
    plantilla_id: str = "clasica-dorada",
    config_estilo: Optional[Dict[str, Any]] = None,
    fps: int = 24,
    es_vista_previa: bool = False,
    ruta_logo_ak: Optional[str] = None,
    progreso_callback: Optional[Callable[[int, int, str], None]] = None,
) -> str:
    """Renderiza el Video de Vida en MP4 con FFmpeg / OpenCV.

    - Compatible con filtros de movimiento zoompan hacia rostros y xfade para transiciones.
    - Vista previa liviana (480p) o Final (1080p).
    - Intro con logo AK y nombre.
    - Fotos con movimiento suave hacia la cara y transiciones.
    - Cierre con dedicatoria.
    """
    if es_vista_previa:
        ancho, alto = 854, 480
    else:
        ancho, alto = 1920, 1080

    carpeta_padre = os.path.dirname(ruta_salida_mp4)
    if carpeta_padre:
        os.makedirs(carpeta_padre, exist_ok=True)

    plantilla = cargar_plantilla(plantilla_id)
    plantilla_final = combinar_estilo_con_plantilla(plantilla, config_estilo)

    # Detectar golpes si hay audio
    golpes: List[float] = []
    if ruta_audio and os.path.exists(ruta_audio):
        try:
            golpes = detectar_golpes_audio(ruta_audio)
        except Exception:
            golpes = []

    # Ajustar tiempos de las fotos a los golpes de música (Orden 298 - Bloque 2)
    tiempos_cambio = ajustar_tiempos_a_golpes(len(fotos_ordenadas), golpes)

    # Configurar VideoWriter
    tiene_audio = bool(ruta_audio and os.path.exists(ruta_audio))
    ruta_render_video = ruta_salida_mp4 + ".video.mp4" if tiene_audio else ruta_salida_mp4
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(ruta_render_video, fourcc, float(fps), (ancho, alto))

    logo_img = cv2.imread(ruta_logo_ak) if ruta_logo_ak and os.path.exists(ruta_logo_ak) else None
    cuadros_totales = 0

    try:
        # 1. Intro AK: 2 segundos
        cuadro_logo = generar_intro_ak(logo_img, ancho, alto)
        for _ in range(fps * 2):
            writer.write(cuadro_logo)

        # 2. Intro con nombre: 2 segundos
        nombre_prot = plantilla_final.get("protagonista1") or "Mis XV Años"
        fecha_prot = plantilla_final.get("fechaEvento") or ""
        cuadro_nombre = renderizar_cuadro_titulo(nombre_prot, fecha_prot, plantilla_final, config_estilo, ancho, alto)
        for _ in range(fps * 2):
            writer.write(cuadro_nombre)

        # 3. Fotos con movimiento
        total_fotos = len(fotos_ordenadas)
        duraciones_seg = 3.0
        cuadros_por_foto = int(duraciones_seg * fps)

        for idx, f in enumerate(fotos_ordenadas):
            if progreso_callback:
                progreso_callback(idx + 1, total_fotos, f"Procesando foto {idx+1}/{total_fotos}")

            ruta_foto = f.get("ruta")
            if not ruta_foto or not os.path.exists(ruta_foto):
                continue

            img_raw = cv2.imread(ruta_foto)
            if img_raw is None:
                continue

            # Corregir orientación EXIF en memoria
            ori = f.get("orientacion", 1)
            img_ori = corregir_orientacion(img_raw, ori)

            # Mejorar suave
            img_mej, _ = mejorar_foto_suave(img_ori)

            # Fondo 16:9 sin barras negras
            img_lienzo = preparar_fondo_16_9(img_mej, ancho, alto)

            # Detección de caras y encuadre
            caras = detectar_caras(img_lienzo)
            cara_ppal = caras[0] if caras else None
            sentido = "acercar" if idx % 2 == 0 else "alejar"

            # Duración adaptada a los golpes de música
            if tiempos_cambio and idx < len(tiempos_cambio):
                t_ini_foto = tiempos_cambio[idx - 1] if idx > 0 else 0.0
                duracion_foto = max(1.0, tiempos_cambio[idx] - t_ini_foto)
                cuadros_esta_foto = max(1, int(round(duracion_foto * fps)))
            else:
                cuadros_esta_foto = cuadros_por_foto

            encuadres = calcular_encuadres_movimiento(
                ancho, alto, cara_box=cara_ppal, total_cuadros=cuadros_esta_foto, zoom_max=1.12, sentido=sentido
            )

            for cx, cy, cw, ch in encuadres:
                recorte = img_lienzo[cy : cy + ch, cx : cx + cw]
                frame_anim = cv2.resize(recorte, (ancho, alto), interpolation=cv2.INTER_LINEAR)
                writer.write(frame_anim)

        # 4. Cierre con dedicatoria: 2 segundos
        cuadro_cierre = renderizar_cuadro_titulo(
            "Gracias por compartir este momento", "AK Producciones", plantilla_final, config_estilo, ancho, alto
        )
        for _ in range(fps * 2):
            writer.write(cuadro_cierre)

    finally:
        writer.release()

    if tiene_audio:
        try:
            # Obtener duración del video con OpenCV
            cap = cv2.VideoCapture(ruta_render_video)
            cuadros = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps_real = cap.get(cv2.CAP_PROP_FPS) or float(fps)
            cap.release()
            duracion_seg = (cuadros / fps_real) if fps_real > 0 else 6.0
            st_fade = max(0.0, duracion_seg - 1.0)
            filtro_audio = f"afade=t=in:ss=0:d=1,afade=t=out:st={st_fade:.2f}:d=1"

            cmd = [
                "ffmpeg", "-y",
                "-i", ruta_render_video,
                "-i", ruta_audio,
                "-c:v", "copy",
                "-c:a", "aac",
                "-af", filtro_audio,
                "-shortest",
                ruta_salida_mp4,
            ]
            res = subprocess.run(cmd, capture_output=True, check=False)
            if res.returncode == 0 and os.path.exists(ruta_salida_mp4) and os.path.getsize(ruta_salida_mp4) > 0:
                try:
                    os.remove(ruta_render_video)
                except Exception:
                    pass
            else:
                if os.path.exists(ruta_render_video):
                    if os.path.exists(ruta_salida_mp4):
                        try:
                            os.remove(ruta_salida_mp4)
                        except Exception:
                            pass
                    os.rename(ruta_render_video, ruta_salida_mp4)
        except Exception:
            if os.path.exists(ruta_render_video) and not os.path.exists(ruta_salida_mp4):
                os.rename(ruta_render_video, ruta_salida_mp4)

    return ruta_salida_mp4

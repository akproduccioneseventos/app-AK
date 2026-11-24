# -*- coding: utf-8 -*-
"""Módulo de Procesamiento Inteligente de Fotos para AK Editor (Orden 280).

Implementa los Bloques 1, 2 y 3:
- Lectura rápida de crudos (.NEF) vía rawpy extract_thumb y JPGs vía OpenCV/PIL.
- Detección de fotos borrosas (Laplaciano en caras y general).
- Detección de ojos cerrados por geometría ocular / landmarks.
- Detección de fotos repetidas (dHash + timestamp < 3 s) y selección de la mejor.
- Detección de histograma (muy oscuras o quemadas).
- Enderezado automático (Hough lines) y recorte 3:2 respetando caras.
- Generación y actualización no destructiva de archivos .xmp preservando campos previos.
- "Aprender mi estilo" desde catálogos Lightroom (.lrcat SQLite) y JPGs editados.
"""

from __future__ import annotations

import glob
import hashlib
import json
import math
import os
import re
import shutil
import sqlite3
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import cv2
import imagehash
import numpy as np
from PIL import Image

try:
    import rawpy
except ImportError:
    rawpy = None


# Espacios de nombres estándar para XMP / Adobe Camera Raw
NS_MAP = {
    "x": "adobe:ns:meta/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "xmp": "http://ns.adobe.com/xap/1.0/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "crs": "http://ns.adobe.com/camera-raw-settings/1.0/",
}

for prefix, uri in NS_MAP.items():
    ET.register_namespace(prefix, uri)

import yaml

DIR_HERRAMIENTA = os.path.dirname(os.path.abspath(__file__))

# Ajustes base por escena según el estilo AK (Orden 307 - Bloque 1)
AJUSTES_BASE_ESCENAS: Dict[str, Dict[str, Any]] = {
    "Salón noche": {
        "Exposure2012": 0.0,
        "Temperature": 4500,
        "Tint": 10,
        "Contrast2012": 10,
        "Highlights2012": -15,
        "Shadows2012": 20,
        "Whites2012": 10,
        "Blacks2012": -5,
        "Vibrance": 15,
        "Saturation": 5,
    },
    "Exterior día": {
        "Exposure2012": 0.0,
        "Temperature": 5400,
        "Tint": 5,
        "Contrast2012": 5,
        "Highlights2012": -20,
        "Shadows2012": 15,
        "Whites2012": 15,
        "Blacks2012": -10,
        "Vibrance": 10,
        "Saturation": 5,
    },
    "Torta y velas": {
        "Exposure2012": 0.20,
        "Temperature": 3200,
        "Tint": 0,
        "Contrast2012": 15,
        "Highlights2012": -30,
        "Shadows2012": 25,
        "Whites2012": 5,
        "Blacks2012": -5,
        "Vibrance": 20,
        "Saturation": 10,
    },
}


def calcular_sha256(ruta_archivo: str) -> str:
    """Calcula el hash SHA-256 de un archivo para verificar integridad."""
    h = hashlib.sha256()
    with open(ruta_archivo, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def leer_foto(ruta_archivo: str) -> Optional[np.ndarray]:
    """Carga rápida de una foto.

    Para crudos (.NEF u otros RAW), extrae el thumbnail rápido incrustado vía rawpy.
    Para JPG y otros formatos estándar, decodifica desde búfer binario en OpenCV.
    Nunca altera el archivo original.
    """
    if not os.path.exists(ruta_archivo):
        return None

    ext = os.path.splitext(ruta_archivo)[1].lower()
    raw_extensions = {".nef", ".cr2", ".cr3", ".arw", ".dng", ".raw", ".orf", ".rw2"}

    if ext in raw_extensions:
        if rawpy is not None:
            try:
                with rawpy.imread(ruta_archivo) as raw:
                    try:
                        thumb = raw.extract_thumb()
                        if thumb.format == rawpy.ThumbFormat.JPEG:
                            nparr = np.frombuffer(thumb.data, np.uint8)
                            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                            if img is not None:
                                return img
                        elif thumb.format == rawpy.ThumbFormat.BITMAP:
                            img = cv2.cvtColor(thumb.data, cv2.COLOR_RGB2BGR)
                            if img is not None:
                                return img
                    except Exception:
                        pass
                    # Fallback rápido a half_size si no hay thumbnail o falló
                    rgb = raw.postprocess(half_size=True)
                    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            except Exception:
                pass

    # Para JPG, PNG u otros formatos
    try:
        with open(ruta_archivo, "rb") as f:
            data = np.frombuffer(f.read(), np.uint8)
            img = cv2.imdecode(data, cv2.IMREAD_COLOR)
            return img
    except Exception:
        return None


def extraer_timestamp_foto(ruta_archivo: str) -> datetime:
    """Extrae la fecha y hora de captura de la foto (EXIF o fecha de modificación)."""
    # Intentar leer EXIF con PIL
    try:
        with Image.open(ruta_archivo) as pil_img:
            exif = pil_img.getexif()
            if exif:
                # 36867 = DateTimeOriginal, 306 = DateTime, 36868 = DateTimeDigitized
                for tag_id in (36867, 306, 36868):
                    val = exif.get(tag_id)
                    if val and isinstance(val, str):
                        for fmt in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S"):
                            try:
                                return datetime.strptime(val.strip(), fmt)
                            except ValueError:
                                pass
    except Exception:
        pass

    # Fallback a fecha de modificación del archivo
    try:
        mtime = os.path.getmtime(ruta_archivo)
        return datetime.fromtimestamp(mtime)
    except Exception:
        return datetime.now()


def calcular_hash_imagen(img: np.ndarray) -> imagehash.ImageHash:
    """Calcula el dHash (difference hash) de la imagen para detectar tomas repetidas."""
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    return imagehash.dhash(pil_img)


def detectar_caras(
    img: np.ndarray,
    caras_fijas: Optional[List[Tuple[int, int, int, int]]] = None,
) -> List[Tuple[int, int, int, int]]:
    """Detecta caras en la imagen retornando lista de (x, y, w, h).

    Utiliza segmentación por tono de piel y características morfológicas,
    garantizando funcionamiento offline sin dependencias externas pesadas.
    Permite inyectar caras fijas para pruebas unitarias.
    """
    if caras_fijas is not None:
        return caras_fijas

    if img is None or img.size == 0:
        return []

    h_img, w_img = img.shape[:2]

    # Convertir a espacio de color YCrCb para segmentación de piel
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    # Rango de tono de piel típico
    mascara_piel = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mascara_piel = cv2.morphologyEx(mascara_piel, cv2.MORPH_CLOSE, kernel, iterations=2)
    mascara_piel = cv2.morphologyEx(mascara_piel, cv2.MORPH_OPEN, kernel, iterations=1)

    contornos, _ = cv2.findContours(mascara_piel, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    caras_candidatas: List[Tuple[int, int, int, int]] = []
    min_area = (w_img * h_img) * 0.002  # Al menos 0.2% de la foto
    max_area = (w_img * h_img) * 0.7

    for c in contornos:
        area = cv2.contourArea(c)
        if area < min_area or area > max_area:
            continue
        x, y, w, h = cv2.boundingRect(c)
        relacion_aspecto = float(h) / float(w) if w > 0 else 0
        # Las cabezas y caras humanas tienen relación de aspecto entre 0.7 y 2.0
        if 0.7 <= relacion_aspecto <= 2.2:
            # Comprobar que dentro haya contraste de ojos/boca
            roi = img[y:y+h, x:x+w]
            gris_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            if float(np.std(gris_roi)) > 12.0:
                caras_candidatas.append((int(x), int(y), int(w), int(h)))

    return caras_candidatas


def analizar_ojos_cerrados_en_cara(cara_bgr: np.ndarray) -> bool:
    """Determina si una cara tiene los ojos cerrados.

    Examina la franja ocular (entre 20% y 50% de la altura facial).
    Un ojo abierto presenta una pupila/iris oscuro contrastante con la esclera
    con apertura vertical notable; un ojo cerrado es un pliegue horizontal plano.
    """
    if cara_bgr is None or cara_bgr.size == 0:
        return False

    h, w = cara_bgr.shape[:2]
    if h < 20 or w < 20:
        return False

    # Región ocular aproximada
    y_inicio = int(h * 0.20)
    y_fin = int(h * 0.55)
    franja_ojos = cara_bgr[y_inicio:y_fin, :]

    gris_ojos = cv2.cvtColor(franja_ojos, cv2.COLOR_BGR2GRAY)
    fh, fw = gris_ojos.shape[:2]
    if fh < 4 or fw < 8:
        return False

    # Ojo izquierdo y derecho
    mitad_w = fw // 2
    ojo_izq = gris_ojos[:, int(mitad_w * 0.15):int(mitad_w * 0.85)]
    ojo_der = gris_ojos[:, int(mitad_w * 1.15):int(mitad_w * 1.85)]

    def evaluar_apertura(ojo_patch: np.ndarray) -> float:
        if ojo_patch.size == 0:
            return 1.0
        # Gradientes verticales (bordes del párpado y pupila)
        grad_y = cv2.Sobel(ojo_patch, cv2.CV_64F, 0, 1, ksize=3)
        grad_x = cv2.Sobel(ojo_patch, cv2.CV_64F, 1, 0, ksize=3)
        magnitud_y = float(np.mean(np.abs(grad_y)))
        magnitud_x = float(np.mean(np.abs(grad_x)))

        # Relación de bordes: ojos cerrados tienen casi puramente borde horizontal (grad_y muy concentrado o nulo)
        # Umbral adaptativo para detectar pupila circular
        val_min = float(np.min(ojo_patch))
        val_media = float(np.mean(ojo_patch))
        rango_dinamico = val_media - val_min
        # Una pupila oscura crea un contraste local alto y apertura circular
        if rango_dinamico < 15.0:
            return 0.1  # Muy plano, probablemente cerrado o sin contraste
        return (magnitud_y + 1.0) / (magnitud_x + 1.0)

    ap_izq = evaluar_apertura(ojo_izq)
    ap_der = evaluar_apertura(ojo_der)

    # Si ambos ojos presentan muy baja apertura vertical o pliegue plano
    if ap_izq < 0.25 and ap_der < 0.25:
        return True
    return False


def detectar_ojos_cerrados(
    img: np.ndarray,
    caras: List[Tuple[int, int, int, int]],
) -> Tuple[bool, int]:
    """Evalúa si alguna de las caras en la foto tiene ojos cerrados."""
    if not caras:
        return False, 0

    caras_cerradas = 0
    for x, y, w, h in caras:
        roi = img[y:y+h, x:x+w]
        if analizar_ojos_cerrados_en_cara(roi):
            caras_cerradas += 1

    return caras_cerradas > 0, caras_cerradas


def detectar_borrosa(
    img: np.ndarray,
    caras: Optional[List[Tuple[int, int, int, int]]] = None,
    umbral: float = 100.0,
) -> Tuple[bool, float]:
    """Evalúa la nitidez calculando la varianza del Laplaciano.

    Si hay caras presentes, evalúa la nitidez tanto en las caras como en la imagen completa.
    """
    if img is None or img.size == 0:
        return True, 0.0

    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    var_total = float(cv2.Laplacian(gris, cv2.CV_64F).var())

    if caras:
        varianzas_caras = []
        for x, y, w, h in caras:
            cara_gris = gris[y:y+h, x:x+w]
            if cara_gris.size > 0:
                varianzas_caras.append(float(cv2.Laplacian(cara_gris, cv2.CV_64F).var()))

        if varianzas_caras:
            var_min_cara = min(varianzas_caras)
            # Si la cara está claramente desenfocada, se considera borrosa
            if var_min_cara < umbral:
                return True, var_min_cara

    return var_total < umbral, var_total


def detectar_oscura_o_quemada(
    img: np.ndarray,
    umbral_oscura: float = 20.0,
    umbral_quemada_pct: float = 30.0,
) -> Tuple[bool, bool, float]:
    """Analiza el histograma para detectar fotos muy oscuras o quemadas.

    Retorna (es_oscura, es_quemada, brillo_promedio).
    """
    if img is None or img.size == 0:
        return True, False, 0.0

    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brillo_medio = float(np.mean(gris))

    # Muy oscura si la media es menor al umbral
    es_oscura = brillo_medio < umbral_oscura

    # Quemada si una proporción alta de píxeles está saturada (> 250)
    pct_quemados = float(np.mean(gris >= 250) * 100.0)
    es_quemada = pct_quemados > umbral_quemada_pct and brillo_medio > 200.0

    return es_oscura, es_quemada, brillo_medio


def detectar_angulo_enderezado(
    img: np.ndarray,
    min_angle: float = 0.3,
    max_angle: float = 5.0,
) -> Optional[float]:
    """Detecta líneas casi horizontales o verticales con Hough para enderezado.

    Si el ángulo dominante está entre 0.3° y 5.0°, retorna el valor para CropAngle.
    Si no hay líneas claras o la desviación es menor a 0.3° o mayor a 5.0°, retorna None.
    """
    if img is None or img.size == 0:
        return None

    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Reducir ruido antes de Canny
    desenfocado = cv2.GaussianBlur(gris, (3, 3), 0)
    bordes = cv2.Canny(desenfocado, 50, 150, apertureSize=3)

    lineas = cv2.HoughLinesP(
        bordes,
        rho=1,
        theta=np.pi / 180,
        threshold=40,
        minLineLength=30,
        maxLineGap=10,
    )

    if lineas is None or len(lineas) == 0:
        return None

    desviaciones: List[float] = []
    pesos: List[float] = []

    for l in lineas:
        pts = np.asarray(l).reshape(-1)
        x1, y1, x2, y2 = int(pts[0]), int(pts[1]), int(pts[2]), int(pts[3])
        dx = x2 - x1
        dy = y2 - y1
        longitud = math.hypot(dx, dy)
        if longitud < 20:
            continue

        deg = math.degrees(math.atan2(dy, dx))

        # Determinar desviación respecto al eje horizontal o vertical
        if abs(deg) <= 45:
            desv = deg
        elif deg > 45:
            desv = deg - 90
        else:
            desv = deg + 90

        if min_angle <= abs(desv) <= max_angle:
            desviaciones.append(desv)
            pesos.append(longitud)

    if not desviaciones:
        return None

    # Mediana ponderada o promedio ponderado de los ángulos válidos
    desviaciones_arr = np.array(desviaciones)
    pesos_arr = np.array(pesos)
    angulo_promedio = float(np.sum(desviaciones_arr * pesos_arr) / np.sum(pesos_arr))

    if min_angle <= abs(angulo_promedio) <= max_angle:
        return round(angulo_promedio, 2)

    return None


def calcular_recorte_3_2(
    ancho_img: int,
    alto_img: int,
    caras: List[Tuple[int, int, int, int]],
    proporcion: float = 1.5,  # 3:2 horizontal
) -> Dict[str, float]:
    """Calcula las coordenadas normalizadas de recorte (3:2) sin cortar ninguna cara.

    Garantiza margen de aire arriba de las cabezas y contiene todas las caras detectadas.
    Retorna diccionario con CropLeft, CropTop, CropRight, CropBottom (0.0 a 1.0).
    """
    if ancho_img <= 0 or alto_img <= 0:
        return {"CropLeft": 0.0, "CropTop": 0.0, "CropRight": 1.0, "CropBottom": 1.0}

    # Si la imagen es vertical (portrait), proporción 2:3 (0.6667)
    es_vertical = alto_img > ancho_img
    rel_objetivo = (1.0 / proporcion) if es_vertical else proporcion

    if not caras:
        # Recorte centrado manteniendo 3:2
        rel_actual = float(ancho_img) / float(alto_img)
        if rel_actual > rel_objetivo:
            # Demasiado ancha: recortar lados
            ancho_recorte = int(alto_img * rel_objetivo)
            alto_recorte = alto_img
            x_ini = (ancho_img - ancho_recorte) // 2
            y_ini = 0
        else:
            # Demasiado alta: recortar arriba/abajo
            ancho_recorte = ancho_img
            alto_recorte = int(ancho_img / rel_objetivo)
            x_ini = 0
            y_ini = (alto_img - alto_recorte) // 2

        return {
            "CropLeft": round(x_ini / ancho_img, 6),
            "CropTop": round(y_ini / alto_img, 6),
            "CropRight": round((x_ini + ancho_recorte) / ancho_img, 6),
            "CropBottom": round((y_ini + alto_recorte) / alto_img, 6),
        }

    # Envolver todas las caras
    min_fx = min(x for x, y, w, h in caras)
    min_fy = min(y for x, y, w, h in caras)
    max_fx = max(x + w for x, y, w, h in caras)
    max_fy = max(y + h for x, y, w, h in caras)

    ancho_caras = max_fx - min_fx
    alto_caras = max_fy - min_fy

    # Margen de aire arriba de la cabeza (al menos 20% de la altura facial)
    aire_arriba = max(int(alto_caras * 0.25), 20)
    # Margen inferior
    aire_abajo = max(int(alto_caras * 0.20), 15)
    # Margen lateral
    aire_lateral = max(int(ancho_caras * 0.15), 15)

    caja_min_x = max(0, min_fx - aire_lateral)
    caja_min_y = max(0, min_fy - aire_arriba)
    caja_max_x = min(ancho_img, max_fx + aire_lateral)
    caja_max_y = min(alto_img, max_fy + aire_abajo)

    ancho_caja = caja_max_x - caja_min_x
    alto_caja = caja_max_y - caja_min_y

    # Ajustar para respetar proporción 3:2 conteniendo la caja mínima
    rel_caja = float(ancho_caja) / float(alto_caja) if alto_caja > 0 else rel_objetivo

    if rel_caja < rel_objetivo:
        # Falta ancho: expandir horizontalmente
        ancho_final = int(alto_caja * rel_objetivo)
        alto_final = alto_caja
        if ancho_final > ancho_img:
            ancho_final = ancho_img
            alto_final = int(ancho_final / rel_objetivo)
        diff_w = ancho_final - ancho_caja
        x_ini = caja_min_x - diff_w // 2
        y_ini = caja_min_y
    else:
        # Falta alto: expandir verticalmente
        alto_final = int(ancho_caja / rel_objetivo)
        ancho_final = ancho_caja
        if alto_final > alto_img:
            alto_final = alto_img
            ancho_final = int(alto_final * rel_objetivo)
        diff_h = alto_final - alto_caja
        # Distribuir expansión dando preferencia al aire arriba
        x_ini = caja_min_x
        y_ini = caja_min_y - int(diff_h * 0.4)

    # Corregir límites asegurando que las caras NUNCA queden fuera
    if x_ini < 0:
        x_ini = 0
    if x_ini + ancho_final > ancho_img:
        x_ini = ancho_img - ancho_final

    if y_ini < 0:
        y_ini = 0
    if y_ini + alto_final > alto_img:
        y_ini = alto_img - alto_final

    # Restricción absoluta: contener la cara
    if x_ini > min_fx:
        x_ini = min_fx
    if y_ini > min_fy:
        y_ini = min_fy
    if x_ini + ancho_final < max_fx:
        ancho_final = max_fx - x_ini
    if y_ini + alto_final < max_fy:
        alto_final = max_fy - y_ini

    return {
        "CropLeft": round(float(x_ini) / float(ancho_img), 6),
        "CropTop": round(float(y_ini) / float(alto_img), 6),
        "CropRight": round(float(x_ini + ancho_final) / float(ancho_img), 6),
        "CropBottom": round(float(y_ini + alto_final) / float(alto_img), 6),
    }


def resolver_ruta_xmp(ruta_foto: str) -> str:
    """Resuelve la ruta del archivo .xmp acompañante.

    Si existe foto.NEF.xmp, usa esa.
    Si existe foto.xmp, usa esa.
    Si no existe ninguna, usa foto.xmp.
    """
    candidato_ext = ruta_foto + ".xmp"
    candidato_base = os.path.splitext(ruta_foto)[0] + ".xmp"

    if os.path.exists(candidato_ext):
        return candidato_ext
    if os.path.exists(candidato_base):
        return candidato_base
    return candidato_base


def actualizar_o_crear_xmp(
    ruta_foto: str,
    rating: int,
    label: str = "",
    tiene_personas: bool = False,
    crop_angle: Optional[float] = None,
    crop_data: Optional[Dict[str, float]] = None,
    parametros_develop: Optional[Dict[str, Any]] = None,
) -> str:
    """Genera o actualiza el archivo .xmp para la foto dada.

    PRESERVA todos los metadatos y etiquetas que ya existían previamente en el archivo.
    NUNCA modifica ni borra el archivo original de imagen.
    """
    ruta_xmp = resolver_ruta_xmp(ruta_foto)
    ruta_backup = ruta_xmp + ".ak_backup"
    if os.path.exists(ruta_xmp) and not os.path.exists(ruta_backup):
        try:
            shutil.copy2(ruta_xmp, ruta_backup)
        except Exception:
            pass

    # Raíz y namespaces
    root = None
    if os.path.exists(ruta_xmp):
        try:
            tree = ET.parse(ruta_xmp)
            root = tree.getroot()
        except Exception:
            root = None

    if root is None:
        # Crear estructura XMP estándar limpia
        root = ET.Element("{adobe:ns:meta/}xmpmeta")
        rdf = ET.SubElement(root, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF")
        desc = ET.SubElement(rdf, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        desc.set("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about", "")
    else:
        desc = root.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        if desc is None:
            rdf = root.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF")
            if rdf is None:
                rdf = ET.SubElement(root, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF")
            desc = ET.SubElement(rdf, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
            desc.set("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about", "")

    # 1. Calificación (Rating) y Etiqueta (Label)
    desc.set("{http://ns.adobe.com/xap/1.0/}Rating", str(int(rating)))
    if label:
        desc.set("{http://ns.adobe.com/xap/1.0/}Label", label)
    else:
        # Si era elegida, remover etiqueta de rechazada si existía
        if "{http://ns.adobe.com/xap/1.0/}Label" in desc.attrib:
            del desc.attrib["{http://ns.adobe.com/xap/1.0/}Label"]

    # 2. Palabras clave (dc:subject)
    etiqueta_persona = "con personas" if tiene_personas else "sin personas"
    sujeto_elem = desc.find("{http://purl.org/dc/elements/1.1/}subject")
    if sujeto_elem is None:
        sujeto_elem = ET.SubElement(desc, "{http://purl.org/dc/elements/1.1/}subject")

    bag_elem = sujeto_elem.find("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Bag")
    if bag_elem is None:
        bag_elem = ET.SubElement(sujeto_elem, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Bag")

    # Extraer palabras clave ya existentes para no perderlas
    items_existentes = [li.text for li in bag_elem.findall("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}li") if li.text]
    # Limpiar posibles etiquetas anteriores de personas contradictorias
    items_filtrados = [item for item in items_existentes if item not in ("con personas", "sin personas")]
    items_filtrados.append(etiqueta_persona)

    # Reconstruir Bag sin pisar las demás
    for li in list(bag_elem):
        bag_elem.remove(li)
    for item in items_filtrados:
        li = ET.SubElement(bag_elem, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}li")
        li.text = item

    # 3. Enderezado (crs:CropAngle)
    if crop_angle is not None and (0.3 <= abs(crop_angle) <= 5.0):
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}CropAngle", f"{crop_angle:.6f}")

    # 4. Recorte (crs:CropLeft, etc.)
    if crop_data:
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}HasCrop", "True")
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}CropLeft", f"{crop_data['CropLeft']:.6f}")
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}CropTop", f"{crop_data['CropTop']:.6f}")
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}CropRight", f"{crop_data['CropRight']:.6f}")
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}CropBottom", f"{crop_data['CropBottom']:.6f}")

    # 5. Parámetros de Revelado opcionales (bloques 1, 3 y 4 de la Orden 307)
    if parametros_develop:
        for k, v in parametros_develop.items():
            crs_key = f"{{http://ns.adobe.com/camera-raw-settings/1.0/}}{k}"
            # Si el dueño ya tiene ajustes en el .xmp, no se pisan:
            # se escriben sólo los que no tienen valor.
            val_existente = desc.attrib.get(crs_key)
            if val_existente is not None and str(val_existente).strip():
                continue
            hijo = desc.find(crs_key)
            if hijo is not None and hijo.text and hijo.text.strip():
                continue
            desc.set(crs_key, str(v))

    # Guardar a disco
    xml_str = ET.tostring(root, encoding="utf-8")
    with open(ruta_xmp, "wb") as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(xml_str)

    return ruta_xmp


def extraer_descriptor_cara(cara_bgr: np.ndarray) -> Optional[np.ndarray]:
    """Extrae un descriptor visual normalizado de un rostro recortado."""
    if cara_bgr is None or cara_bgr.size == 0:
        return None
    h, w = cara_bgr.shape[:2]
    if h < 8 or w < 8:
        return None
    gris = cv2.cvtColor(cara_bgr, cv2.COLOR_BGR2GRAY)
    gris_norm = cv2.equalizeHist(gris)
    chico = cv2.resize(gris_norm, (32, 32)).astype(np.float32)
    norm = np.linalg.norm(chico)
    if norm > 1e-6:
        chico /= norm
    return chico.flatten()


def son_misma_cara(
    desc1: Optional[np.ndarray],
    desc2: Optional[np.ndarray],
    umbral_similitud: float = 0.65,
) -> bool:
    """Compara dos descriptores faciales mediante similitud coseno."""
    if desc1 is None or desc2 is None:
        return False
    sim = float(np.dot(desc1, desc2))
    return sim >= umbral_similitud


def obtener_descriptores_referencia(rutas_referencia: List[str]) -> List[np.ndarray]:
    """Carga fotos de referencia y extrae los descriptores de rostros detectados."""
    descriptores = []
    for ruta in rutas_referencia:
        if not os.path.exists(ruta):
            continue
        img = leer_foto(ruta)
        if img is None:
            continue
        caras = detectar_caras(img)
        if not caras:
            h, w = img.shape[:2]
            cx, cy = w // 2, h // 2
            tam = min(w, h) // 3
            caras = [(cx - tam // 2, cy - tam // 2, tam, tam)]

        for x, y, w_box, h_box in caras:
            roi = img[y:y+h_box, x:x+w_box]
            desc = extraer_descriptor_cara(roi)
            if desc is not None:
                descriptores.append(desc)
    return descriptores


def clasificar_escena(
    img: Optional[np.ndarray],
    iso: Optional[int] = None,
    temp_color: Optional[float] = None,
) -> str:
    """Clasifica automáticamente una foto en:
    - 'Salón noche'
    - 'Exterior día'
    - 'Torta y velas'
    según brillo medio, balance de color e ISO.
    """
    if img is None or img.size == 0:
        return "Salón noche"

    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brillo_medio = float(np.mean(gris))

    mean_b = float(np.mean(img[:, :, 0]))
    mean_g = float(np.mean(img[:, :, 1]))
    mean_r = float(np.mean(img[:, :, 2]))

    if temp_color is None:
        ratio_br = mean_b / max(mean_r, 1.0)
        temp_color = 5500.0 * ratio_br

    es_muy_calida = mean_r > (mean_b * 1.35)
    pct_altas_luces = float(np.mean(gris > 200))

    if brillo_medio < 95.0 and (es_muy_calida or (pct_altas_luces > 0.005 and temp_color < 3800.0)):
        return "Torta y velas"

    es_luz_dia = temp_color >= 4800.0 and mean_b > (mean_r * 0.80)
    if (iso is not None and iso <= 800 and brillo_medio > 110.0) or (brillo_medio > 125.0 and es_luz_dia):
        return "Exterior día"

    return "Salón noche"


def calcular_correccion_foto(
    img: Optional[np.ndarray],
    ajuste_escena: Dict[str, Any],
    target_brillo: float = 128.0,
) -> Dict[str, Any]:
    """Calcula los parámetros sumando a los de la escena lo que le falta a la foto.
    - Exposure2012: brillo medio al del estilo con tope ±1.5 EV.
    - Temperature: balance de color al del estilo con tope ±1500 K.
    - Tint: balance verde/magenta con tope ±20.
    """
    if img is None or img.size == 0:
        return dict(ajuste_escena)

    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brillo_actual = float(np.mean(gris))

    # Corrección de exposición (EV)
    if brillo_actual > 0:
        delta_exp = math.log2(target_brillo / brillo_actual)
    else:
        delta_exp = 1.5
    delta_exp = max(-1.5, min(1.5, round(delta_exp, 2)))

    base_exp = float(ajuste_escena.get("Exposure2012", 0.0))
    exp_final = round(base_exp + delta_exp, 2)

    mean_b = float(np.mean(img[:, :, 0]))
    mean_g = float(np.mean(img[:, :, 1]))
    mean_r = float(np.mean(img[:, :, 2]))

    # Corrección de balance de blancos:
    # Azulada (mean_b > mean_r) => necesita temperatura más cálida (delta_temp > 0).
    # Cálida (mean_r > mean_b) => necesita temperatura más fría (delta_temp < 0).
    diff_br = mean_b - mean_r
    delta_temp = diff_br * 15.0
    delta_temp = max(-1500.0, min(1500.0, delta_temp))

    base_temp = float(ajuste_escena.get("Temperature", 5000))
    temp_final = int(round(base_temp + delta_temp))

    diff_rb_g = ((mean_r + mean_b) / 2.0) - mean_g
    delta_tint = max(-20.0, min(20.0, diff_rb_g * 0.5))
    base_tint = float(ajuste_escena.get("Tint", 0))
    tint_final = int(round(base_tint + delta_tint))

    ajustes_resultado = dict(ajuste_escena)
    ajustes_resultado["Exposure2012"] = exp_final
    ajustes_resultado["Temperature"] = temp_final
    ajustes_resultado["Tint"] = tint_final

    return ajustes_resultado


def calcular_estrellas_calidad(
    var_lap: float,
    brillo_medio: float,
    ojos_cerrados: bool,
    contiene_agasajada: bool = False,
) -> int:
    """Calcula calificación de 1 a 5 estrellas según nitidez, luz y cara principal."""
    if ojos_cerrados:
        return 1

    if var_lap >= 400.0:
        estrellas = 4
    elif var_lap >= 200.0:
        estrellas = 3
    elif var_lap >= 120.0:
        estrellas = 2
    else:
        estrellas = 1

    # Luz equilibrada
    if 90.0 <= brillo_medio <= 160.0:
        estrellas = min(5, estrellas + 1)
    elif brillo_medio < 50.0 or brillo_medio > 210.0:
        estrellas = max(1, estrellas - 1)

    # Las fotos donde sale la agasajada suben una estrella
    if contiene_agasajada:
        estrellas = min(5, estrellas + 1)

    return max(1, min(5, estrellas))


def leer_config_suavizado_piel() -> bool:
    """Lee de config.yaml si el suavizado suave de piel global está activado."""
    ruta_config = os.path.join(DIR_HERRAMIENTA, "config.yaml")
    if not os.path.exists(ruta_config):
        return True
    try:
        with open(ruta_config, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
            if isinstance(cfg, dict):
                fotos_cfg = cfg.get("fotos", {})
                if isinstance(fotos_cfg, dict) and "suavizado_piel_global" in fotos_cfg:
                    return bool(fotos_cfg["suavizado_piel_global"])
    except Exception:
        pass
    return True


def simular_edicion_foto(
    img: np.ndarray,
    exposure: float = 0.0,
    temperature: float = 5000.0,
    tint: float = 0.0,
    texture: float = 0.0,
    clarity: float = 0.0,
) -> np.ndarray:
    """Simula sobre una imagen (miniatura) los ajustes de revelado con OpenCV."""
    if img is None or img.size == 0:
        return img

    res = img.astype(np.float32)

    # 1. Exposición
    if exposure != 0.0:
        res *= (2.0 ** exposure)

    # 2. Temperatura (Kelvin relativa a 5500 K)
    delta_temp = (temperature - 5500.0) / 5000.0
    if delta_temp != 0.0:
        res[:, :, 2] *= (1.0 + 0.3 * delta_temp)
        res[:, :, 0] *= (1.0 - 0.3 * delta_temp)

    # 3. Tint
    if tint != 0.0:
        res[:, :, 1] *= (1.0 - 0.01 * tint)

    # 4. Textura / Claridad
    if clarity != 0.0 or texture != 0.0:
        blur = cv2.GaussianBlur(res, (0, 0), 2.0)
        peso = (clarity + texture) * 0.005
        res = cv2.addWeighted(res, 1.0 + peso, blur, -peso, 0)

    return np.clip(res, 0, 255).astype(np.uint8)


def volver_al_original(ruta_foto: str) -> bool:
    """Restaura el archivo .xmp original si existe respaldo o saca los ajustes de revelado."""
    ruta_xmp = resolver_ruta_xmp(ruta_foto)
    ruta_backup = ruta_xmp + ".ak_backup"
    if os.path.exists(ruta_backup):
        try:
            shutil.copy2(ruta_backup, ruta_xmp)
            return True
        except Exception:
            pass
    if not os.path.exists(ruta_xmp):
        return False
    try:
        tree = ET.parse(ruta_xmp)
        root = tree.getroot()
        desc = root.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        if desc is None:
            return False

        claves_a_borrar = [
            k for k in desc.attrib.keys()
            if any(k.endswith(f"}}{param}") for param in [
                "Exposure2012", "Temperature", "Tint", "Contrast2012",
                "Highlights2012", "Shadows2012", "Whites2012", "Blacks2012",
                "Texture", "Clarity2012", "Dehaze", "Vibrance", "Saturation",
                "PresetType", "SupportsColor"
            ])
        ]
        for k in claves_a_borrar:
            del desc.attrib[k]

        xml_str = ET.tostring(root, encoding="utf-8")
        with open(ruta_xmp, "wb") as f:
            f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write(xml_str)
        return True
    except Exception:
        return False


def procesar_seleccion_fotos(
    rutas_fotos: List[str],
    umbral_borrosa: float = 100.0,
    caras_override: Optional[Dict[str, List[Tuple[int, int, int, int]]]] = None,
    fotos_referencia_agasajada: Optional[List[str]] = None,
    caras_agasajada_override: Optional[Dict[str, bool]] = None,
    progreso_callback: Optional[Callable[[int, int, str], None]] = None,
) -> Dict[str, Any]:
    """Ejecuta el proceso completo de selección, calificación y revelado estilo Aftershoot.

    1. Analiza cada foto (nitidez, ojos cerrados, histograma, caras, ángulo y recorte).
    2. Identifica si aparece la cara principal (la agasajada).
    3. Agrupa fotos repetidas tomadas con menos de 3 s y dHash similar.
    4. De cada ráfaga elige la mejor (priorizando a la agasajada) y rechaza las demás.
    5. Califica de 1 a 5 estrellas según calidad y bonus de agasajada.
    6. Clasifica la escena (Salón noche, Exterior día, Torta y velas) y aplica el ajuste
       con corrección individual de exposición y balance de blancos.
    7. Escribe los archivos .xmp correspondientes sin tocar los originales ni pisar ajustes del dueño.
    """
    total = len(rutas_fotos)
    if total == 0:
        return {
            "total": 0,
            "elegidas": 0,
            "rechazadas": 0,
            "fotos_agasajada": 0,
            "mensaje_agasajada": "Salen 0 fotos de la agasajada",
            "detalles": [],
        }

    descriptores_agasajada = []
    if fotos_referencia_agasajada:
        descriptores_agasajada = obtener_descriptores_referencia(fotos_referencia_agasajada)

    datos_fotos: List[Dict[str, Any]] = []

    # 1. Análisis individual de cada foto
    for idx, ruta in enumerate(rutas_fotos):
        if progreso_callback:
            progreso_callback(idx + 1, total, f"Analizando foto {os.path.basename(ruta)}...")

        img = leer_foto(ruta)
        timestamp = extraer_timestamp_foto(ruta)
        h_img, w_img = (img.shape[0], img.shape[1]) if img is not None else (0, 0)

        caras = []
        if caras_override and ruta in caras_override:
            caras = caras_override[ruta]
        elif img is not None:
            caras = detectar_caras(img)

        tiene_personas = len(caras) > 0

        # Detección de la cara principal (agasajada)
        contiene_agasajada = False
        if caras_agasajada_override and ruta in caras_agasajada_override:
            contiene_agasajada = bool(caras_agasajada_override[ruta])
        elif descriptores_agasajada and img is not None and caras:
            for (cx, cy, cw, ch) in caras:
                roi = img[cy:cy+ch, cx:cx+cw]
                desc = extraer_descriptor_cara(roi)
                if desc is not None:
                    if any(son_misma_cara(desc, ref_d) for ref_d in descriptores_agasajada):
                        contiene_agasajada = True
                        break

        # Lectura de ISO desde EXIF si está disponible
        iso = None
        try:
            with Image.open(ruta) as pil_img:
                exif = pil_img.getexif()
                if exif:
                    iso = exif.get(34855)
        except Exception:
            pass

        es_borrosa = False
        var_lap = 0.0
        ojos_cerrados = False
        cant_ojos_cerrados = 0
        es_oscura = False
        es_quemada = False
        brillo_medio = 128.0
        hash_img = None
        crop_angle = None
        crop_data = None

        if img is not None:
            es_borrosa, var_lap = detectar_borrosa(img, caras=caras, umbral=umbral_borrosa)
            ojos_cerrados, cant_ojos_cerrados = detectar_ojos_cerrados(img, caras)
            es_oscura, es_quemada, brillo_medio = detectar_oscura_o_quemada(img)
            hash_img = calcular_hash_imagen(img)
            crop_angle = detectar_angulo_enderezado(img)
            crop_data = calcular_recorte_3_2(w_img, h_img, caras)
        else:
            es_borrosa = True

        datos_fotos.append({
            "ruta": ruta,
            "nombre": os.path.basename(ruta),
            "timestamp": timestamp,
            "caras": caras,
            "tiene_personas": tiene_personas,
            "contiene_agasajada": contiene_agasajada,
            "iso": iso,
            "es_borrosa": es_borrosa,
            "var_lap": var_lap,
            "ojos_cerrados": ojos_cerrados,
            "cant_ojos_cerrados": cant_ojos_cerrados,
            "es_oscura": es_oscura,
            "es_quemada": es_quemada,
            "brillo_medio": brillo_medio,
            "hash": hash_img,
            "crop_angle": crop_angle,
            "crop_data": crop_data,
            "estado": "evaluando",
            "motivo_rechazo": "",
            "grupo_id": None,
        })

    # 2. Detección de grupos repetidos (ráfagas: < 3 s y distancia dHash <= 10)
    datos_fotos.sort(key=lambda d: d["timestamp"])

    grupos: List[List[Dict[str, Any]]] = []
    usados = set()

    for i in range(len(datos_fotos)):
        if i in usados:
            continue
        grupo_actual = [datos_fotos[i]]
        usados.add(i)

        for j in range(i + 1, len(datos_fotos)):
            if j in usados:
                continue
            dt = abs((datos_fotos[j]["timestamp"] - datos_fotos[i]["timestamp"]).total_seconds())
            if dt > 3.0:
                break

            h1 = datos_fotos[i]["hash"]
            h2 = datos_fotos[j]["hash"]
            if h1 is not None and h2 is not None:
                dist_hash = h1 - h2
                if dist_hash <= 10:
                    grupo_actual.append(datos_fotos[j])
                    usados.add(j)

        grupos.append(grupo_actual)

    # 3. Selección y descarte por grupo
    for grupo in grupos:
        if len(grupo) == 1:
            item = grupo[0]
            if item["es_oscura"]:
                item["estado"] = "rechazada"
                item["motivo_rechazo"] = "Muy oscura"
            elif item["es_quemada"]:
                item["estado"] = "rechazada"
                item["motivo_rechazo"] = "Quemada"
            elif item["es_borrosa"]:
                item["estado"] = "rechazada"
                item["motivo_rechazo"] = "Borrosa"
            elif item["ojos_cerrados"]:
                item["estado"] = "rechazada"
                item["motivo_rechazo"] = "Ojos cerrados"
            else:
                item["estado"] = "elegida"
        else:
            def puntaje_foto(f: Dict[str, Any]) -> float:
                score = f["var_lap"]
                # En un grupo de repetidas, gana la mejor de la agasajada
                if f.get("contiene_agasajada"):
                    score += 10000.0
                if f["ojos_cerrados"]:
                    score -= 5000.0
                if f["es_borrosa"]:
                    score -= 2000.0
                if f["es_oscura"] or f["es_quemada"]:
                    score -= 10000.0
                return score

            grupo.sort(key=puntaje_foto, reverse=True)
            mejor = grupo[0]

            if mejor["es_oscura"]:
                mejor["estado"] = "rechazada"
                mejor["motivo_rechazo"] = "Muy oscura"
            elif mejor["es_borrosa"]:
                mejor["estado"] = "rechazada"
                mejor["motivo_rechazo"] = "Borrosa"
            elif mejor["ojos_cerrados"]:
                mejor["estado"] = "rechazada"
                mejor["motivo_rechazo"] = "Ojos cerrados"
            else:
                mejor["estado"] = "elegida"

            for repetida in grupo[1:]:
                repetida["estado"] = "rechazada"
                if repetida["es_borrosa"]:
                    repetida["motivo_rechazo"] = "Borrosa / Repetida"
                elif repetida["ojos_cerrados"]:
                    repetida["motivo_rechazo"] = "Ojos cerrados / Repetida"
                elif repetida["es_oscura"]:
                    repetida["motivo_rechazo"] = "Oscura / Repetida"
                else:
                    repetida["motivo_rechazo"] = "Repetida"

    # 4. Escribir metadatos .xmp y ajustes de revelado para cada foto
    total_elegidas = 0
    total_rechazadas = 0
    cant_agasajada = 0

    for item in datos_fotos:
        es_elegida = item["estado"] == "elegida"

        if es_elegida:
            total_elegidas += 1
            if item.get("contiene_agasajada"):
                cant_agasajada += 1

            label = ""
            rating = calcular_estrellas_calidad(
                var_lap=item["var_lap"],
                brillo_medio=item["brillo_medio"],
                ojos_cerrados=item["ojos_cerrados"],
                contiene_agasajada=item.get("contiene_agasajada", False),
            )

            # Clasificación automática de escena (Bloque 1)
            img_foto = leer_foto(item["ruta"])
            escena = clasificar_escena(img_foto, iso=item.get("iso"))
            item["escena"] = escena

            # Ajuste de escena base
            ajuste_base = dict(AJUSTES_BASE_ESCENAS.get(escena, AJUSTES_BASE_ESCENAS["Salón noche"]))

            # Corrección por foto (Bloque 1: Exposure2012 y Temperature)
            ajustes_desarrollo = calcular_correccion_foto(img_foto, ajuste_base)

            # Retoque suave global para fotos con personas (Bloque 4)
            if item["tiene_personas"] and leer_config_suavizado_piel():
                if "Texture" not in ajustes_desarrollo:
                    ajustes_desarrollo["Texture"] = -10
                if "Clarity2012" not in ajustes_desarrollo:
                    ajustes_desarrollo["Clarity2012"] = -5

            item["rating"] = rating
            item["parametros_develop"] = ajustes_desarrollo
        else:
            total_rechazadas += 1
            rating = 0
            label = "Rechazada"
            item["rating"] = 0
            item["escena"] = None
            item["parametros_develop"] = None
            ajustes_desarrollo = None

        actualizar_o_crear_xmp(
            ruta_foto=item["ruta"],
            rating=rating,
            label=label,
            tiene_personas=item["tiene_personas"],
            crop_angle=item["crop_angle"],
            crop_data=item["crop_data"],
            parametros_develop=ajustes_desarrollo,
        )

    return {
        "total": len(datos_fotos),
        "elegidas": total_elegidas,
        "rechazadas": total_rechazadas,
        "fotos_agasajada": cant_agasajada,
        "mensaje_agasajada": f"Salen {cant_agasajada} fotos de la agasajada",
        "detalles": datos_fotos,
    }


def aprender_mi_estilo(
    ruta_lrcat: Optional[str] = None,
    ruta_fotos_editadas: Optional[str] = None,
    carpeta_salida: Optional[str] = None,
) -> Dict[str, Any]:
    """Aprende el estilo fotográfico del usuario (Orden 280 — Bloque 3).

    1. Si se pasa ruta_lrcat: abre copia temporal de solo lectura con sqlite3.
       Lee la tabla Adobe_imageDevelopSettings, columna text.
       Extrae parámetros de revelado y calcula la mediana de cada ajuste.
       Si el catálogo está vacío o no tiene fotos editadas, no inventa presets.
    2. Si hay fotos editadas JPG: extrae estadísticas de color en espacio Lab
       por zonas de luz (sombras, medios, altas).
    3. Genera los presets .xmp ('AK Salón noche.xmp', 'AK Exterior día.xmp', 'AK Torta y velas.xmp')
       y el archivo estilo-ak.json.
    """
    if carpeta_salida is None:
        # Carpeta estándar de CameraRaw / Lightroom en Windows
        appdata = os.environ.get("APPDATA", "")
        if appdata:
            carpeta_salida = os.path.join(appdata, "Adobe", "CameraRaw", "Settings", "AK")
        else:
            carpeta_salida = os.path.join(os.path.expanduser("~"), "AK_Estilo_Fotos")

    presets_generados: Dict[str, Dict[str, Any]] = {}
    archivos_salida: List[str] = []
    datos_estilo_json: Optional[Dict[str, Any]] = None

    # Parámetros develop estándar que buscamos extraer
    nombres_params = [
        "Exposure2012", "Temperature", "Tint", "Contrast2012",
        "Highlights2012", "Shadows2012", "Whites2012", "Blacks2012",
        "Texture", "Clarity2012", "Dehaze", "Vibrance", "Saturation"
    ]

    tiene_datos_lrcat = False
    ajustes_por_param: Dict[str, List[float]] = {p: [] for p in nombres_params}

    # 1. Leer catálogo SQLite .lrcat
    if ruta_lrcat and os.path.exists(ruta_lrcat):
        with tempfile.NamedTemporaryFile(suffix=".lrcat", delete=False) as tmp_file:
            tmp_db = tmp_file.name

        try:
            # Copia temporal de solo lectura para no chocar si Lightroom está abierto
            shutil.copyfile(ruta_lrcat, tmp_db)

            conn = sqlite3.connect(f"file:{tmp_db}?mode=ro", uri=True)
            cursor = conn.cursor()

            # Verificar si existe la tabla Adobe_imageDevelopSettings
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Adobe_imageDevelopSettings'")
            existe_tabla = cursor.fetchone() is not None

            if existe_tabla:
                cursor.execute("SELECT text FROM Adobe_imageDevelopSettings WHERE text IS NOT NULL")
                filas = cursor.fetchall()
                for (texto_setting,) in filas:
                    if not texto_setting or not texto_setting.strip():
                        continue
                    # Extraer parámetros de texto o clave-valor
                    encontrados = False
                    for p in nombres_params:
                        # Patrón para Lua tables, XML o pares clave-valor
                        patron = rf'(?:crs:)?\b{p}\b\s*=\s*["\']?([+-]?\d+(?:\.\d+)?)["\']?'
                        m = re.search(patron, texto_setting)
                        if m:
                            try:
                                val = float(m.group(1))
                                ajustes_por_param[p].append(val)
                                encontrados = True
                            except ValueError:
                                pass
                    if encontrados:
                        tiene_datos_lrcat = True

            conn.close()
        finally:
            if os.path.exists(tmp_db):
                try:
                    os.remove(tmp_db)
                except Exception:
                    pass

    # 2. Leer fotos editadas JPG si existen
    estadisticas_lab = {
        "sombras": {"L": 40.0, "a": 128.0, "b": 128.0},
        "medios": {"L": 128.0, "a": 128.0, "b": 128.0},
        "altas": {"L": 215.0, "a": 128.0, "b": 128.0},
    }
    tiene_fotos_editadas = False

    if ruta_fotos_editadas and os.path.exists(ruta_fotos_editadas):
        rutas_jpg = glob.glob(os.path.join(ruta_fotos_editadas, "*.jpg")) + glob.glob(os.path.join(ruta_fotos_editadas, "*.jpeg"))
        if rutas_jpg:
            muestras_sombras = []
            muestras_medios = []
            muestras_altas = []

            for ruta_img in rutas_jpg[:50]:  # Analizar hasta 50 fotos
                img = leer_foto(ruta_img)
                if img is None:
                    continue
                # Reducir para cálculo ágil
                img_chica = cv2.resize(img, (240, 160))
                lab = cv2.cvtColor(img_chica, cv2.COLOR_BGR2LAB)
                l_chan = lab[:, :, 0]

                # Sombras: L < 85, Medios: 85 <= L <= 170, Altas: L > 170
                mask_s = l_chan < 85
                mask_m = (l_chan >= 85) & (l_chan <= 170)
                mask_a = l_chan > 170

                if np.any(mask_s):
                    muestras_sombras.append(np.mean(lab[mask_s], axis=0))
                if np.any(mask_m):
                    muestras_medios.append(np.mean(lab[mask_m], axis=0))
                if np.any(mask_a):
                    muestras_altas.append(np.mean(lab[mask_a], axis=0))

            if muestras_sombras and muestras_medios and muestras_altas:
                med_s = np.median(muestras_sombras, axis=0)
                med_m = np.median(muestras_medios, axis=0)
                med_a = np.median(muestras_altas, axis=0)
                estadisticas_lab = {
                    "sombras": {"L": round(float(med_s[0]), 2), "a": round(float(med_s[1]), 2), "b": round(float(med_s[2]), 2)},
                    "medios": {"L": round(float(med_m[0]), 2), "a": round(float(med_m[1]), 2), "b": round(float(med_m[2]), 2)},
                    "altas": {"L": round(float(med_a[0]), 2), "a": round(float(med_a[1]), 2), "b": round(float(med_a[2]), 2)},
                }
                tiene_fotos_editadas = True

    # REGLA ESTRICTA: Si el catálogo está vacío y no hay fotos editadas, no generar presets inventados
    if not tiene_datos_lrcat and not tiene_fotos_editadas:
        return {"presets": {}, "estilo_json": None, "archivos_generados": []}

    os.makedirs(carpeta_salida, exist_ok=True)

    # Calcular la mediana de cada ajuste para el preset
    medianas_ajustes: Dict[str, float] = {}
    for p, valores in ajustes_por_param.items():
        if valores:
            medianas_ajustes[p] = round(float(np.median(valores)), 2)
        else:
            # Si no vino de lrcat, no forzar parámetros arbitrarios
            pass

    # Generar preset principal por escena
    # AK Salón noche: se nutre de las medianas aprendidas
    escenas = ["AK Salón noche", "AK Exterior día", "AK Torta y velas"]

    for escena in escenas:
        preset_dict = dict(medianas_ajustes)
        # Adaptaciones leves por tipo de escena si no se segmentó por ISO
        if escena == "AK Exterior día" and "Temperature" in preset_dict:
            # Exterior día suele ser ligeramente más frío que salón noche con luces de tungsteno
            preset_dict["Temperature"] = max(3200, preset_dict["Temperature"] - 400)
        elif escena == "AK Torta y velas" and "Exposure2012" in preset_dict:
            # Torta y velas suele requerir compensar exposición
            preset_dict["Exposure2012"] = round(preset_dict["Exposure2012"] + 0.2, 2)

        presets_generados[escena] = preset_dict

        # Generar XML XMP de ajuste
        ruta_preset_xmp = os.path.join(carpeta_salida, f"{escena}.xmp")
        root = ET.Element("{adobe:ns:meta/}xmpmeta")
        rdf = ET.SubElement(root, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF")
        desc = ET.SubElement(rdf, "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description")
        desc.set("{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about", "")
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}PresetType", "Normal")
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}Name", escena)
        desc.set("{http://ns.adobe.com/camera-raw-settings/1.0/}SupportsColor", "True")

        for k, v in preset_dict.items():
            desc.set(f"{{http://ns.adobe.com/camera-raw-settings/1.0/}}{k}", str(v))

        xml_str = ET.tostring(root, encoding="utf-8")
        with open(ruta_preset_xmp, "wb") as f:
            f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write(xml_str)

        archivos_salida.append(ruta_preset_xmp)

    # Generar archivo estilo-ak.json
    datos_estilo_json = {
        "nombre": "Estilo AK Producciones",
        "version": "1.0",
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ajustes_base": medianas_ajustes,
        "estadisticas_lab": estadisticas_lab,
    }

    ruta_json = os.path.join(carpeta_salida, "estilo-ak.json")
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(datos_estilo_json, f, indent=2, ensure_ascii=False)
    archivos_salida.append(ruta_json)

    return {
        "presets": presets_generados,
        "estilo_json": datos_estilo_json,
        "archivos_generados": archivos_salida,
    }

# -*- coding: utf-8 -*-
"""Módulo de Videos para Redes (Orden 275).

Genera videos en los 3 formatos exactos para cada estación y para 'la noche completa':
- Reel e historia 9:16 (1080×1920)
- Cuadrado 1:1 (1080×1080)
- Vertical de muro 4:5 (1080×1350)

Incluye:
- Selección de las mejores tomas con rostros nítidos
- Movimiento hacia la cara y adaptación de formato sin franjas negras
- Sincronización al ritmo de la música con scipy
- Logo de AK y placa de cierre con 'AK Producciones' en el último segundo
- Generación de redes.json con metadatos de formato, estación y duración
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
import zipfile
from typing import Any, Callable, Dict, List, Optional, Tuple

import cv2
import numpy as np

from video_de_vida import (
    calcular_encuadres_movimiento,
    cargar_plantilla,
    combinar_estilo_con_plantilla,
    detectar_caras,
    detectar_golpes_audio,
    hex_a_bgr,
    leer_estilo_json,
    mejorar_foto_suave,
)

FORMATOS_REDES = {
    "9:16": {
        "ancho": 1080,
        "alto": 1920,
        "sufijo": "-reel.mp4",
        "nombre": "Reel e historia 9:16",
    },
    "1:1": {
        "ancho": 1080,
        "alto": 1080,
        "sufijo": "-cuadrado.mp4",
        "nombre": "Cuadrado 1:1",
    },
    "4:5": {
        "ancho": 1080,
        "alto": 1350,
        "sufijo": "-muro.mp4",
        "nombre": "Vertical de muro 4:5",
    },
}

ESTACIONES_CONOCIDAS = [
    "fotocabina",
    "plataforma-360",
    "vogue",
    "espejo",
    "pantalla-gigante",
    "barra",
    "muro",
]


def adaptar_a_formato(
    img: np.ndarray,
    ancho_dest: int,
    alto_dest: int,
) -> np.ndarray:
    """Adapta una foto a cualquier resolución de destino sin dejar barras negras.

    Fondo: misma foto escalada para cubrir todo el marco con desenfoque gaussiano.
    Frente: foto nítida escalada proporcionalmente para caber en el centro.
    """
    if img is None:
        return np.zeros((alto_dest, ancho_dest, 3), dtype=np.uint8)

    h_orig, w_orig = img.shape[:2]
    if h_orig == 0 or w_orig == 0:
        return np.zeros((alto_dest, ancho_dest, 3), dtype=np.uint8)

    # 1. Fondo cubriendo todo
    escala_cubrir = max(ancho_dest / float(w_orig), alto_dest / float(h_orig))
    w_cubrir = int(round(w_orig * escala_cubrir))
    h_cubrir = int(round(h_orig * escala_cubrir))
    fondo_grande = cv2.resize(img, (w_cubrir, h_cubrir), interpolation=cv2.INTER_LINEAR)

    x_off = max(0, (w_cubrir - ancho_dest) // 2)
    y_off = max(0, (h_cubrir - alto_dest) // 2)
    fondo_crop = fondo_grande[y_off : y_off + alto_dest, x_off : x_off + ancho_dest]
    if fondo_crop.shape[0] != alto_dest or fondo_crop.shape[1] != ancho_dest:
        fondo_crop = cv2.resize(fondo_crop, (ancho_dest, alto_dest))

    fondo_blur = cv2.GaussianBlur(fondo_crop, (51, 51), sigmaX=35)

    # 2. Frente nítido encajado
    escala_fit = min(ancho_dest / float(w_orig), alto_dest / float(h_orig))
    w_fit = max(1, int(round(w_orig * escala_fit)))
    h_fit = max(1, int(round(h_orig * escala_fit)))
    frente_nitido = cv2.resize(img, (w_fit, h_fit), interpolation=cv2.INTER_AREA)

    x_dest = (ancho_dest - w_fit) // 2
    y_dest = (alto_dest - h_fit) // 2

    resultado = fondo_blur.copy()
    resultado[y_dest : y_dest + h_fit, x_dest : x_dest + w_fit] = frente_nitido
    return resultado


def generar_placa_cierre_redes(
    ancho: int,
    alto: int,
    logo_ak: Optional[np.ndarray] = None,
    contacto: str = "AK Producciones",
) -> np.ndarray:
    """Genera la placa de cierre con el logo de AK Producciones y contacto para el último segundo."""
    cuadro = np.full((alto, ancho, 3), (15, 15, 15), dtype=np.uint8)

    # Marco elegante
    cv2.rectangle(cuadro, (30, 30), (ancho - 30, alto - 30), (50, 50, 215), 3)

    if logo_ak is not None:
        h_l, w_l = logo_ak.shape[:2]
        escala = min((alto * 0.35) / max(h_l, 1), (ancho * 0.6) / max(w_l, 1))
        w_dest = int(w_l * escala)
        h_dest = int(h_l * escala)
        logo_redim = cv2.resize(logo_ak, (w_dest, h_dest), interpolation=cv2.INTER_AREA)

        x_off = (ancho - w_dest) // 2
        y_off = (alto // 2) - h_dest // 2 - 40
        cuadro[y_off : y_off + h_dest, x_off : x_off + w_dest] = logo_redim[:, :, :3]
    else:
        # Logo tipográfico de AK
        cv2.putText(
            cuadro, "AK", ((ancho - 220) // 2, (alto // 2) - 40),
            cv2.FONT_HERSHEY_DUPLEX, 4.0, (20, 20, 220), 8, cv2.LINE_AA
        )

    # Texto "AK Producciones"
    fuente = cv2.FONT_HERSHEY_DUPLEX
    escala_t = min(1.8, ancho / 600.0)
    (tw, th), _ = cv2.getTextSize("AK Producciones", fuente, escala_t, 3)
    tx = (ancho - tw) // 2
    ty = (alto // 2) + 120
    cv2.putText(cuadro, "AK Producciones", (tx, ty), fuente, escala_t, (255, 255, 255), 3, cv2.LINE_AA)

    # Contacto
    if contacto and contacto != "AK Producciones":
        escala_c = min(1.1, ancho / 900.0)
        (cw, ch), _ = cv2.getTextSize(contacto, fuente, escala_c, 2)
        cx = (ancho - cw) // 2
        cy = ty + 60
        cv2.putText(cuadro, contacto, (cx, cy), fuente, escala_c, (200, 200, 200), 2, cv2.LINE_AA)

    return cuadro


def cargar_material_redes(origen: str) -> Dict[str, Any]:
    """Carga fotos organizadas por estación desde una carpeta o archivo .zip.

    Retorna un diccionario agrupado por estación, más la estación agregada 'la noche completa'.
    """
    temp_dir = None
    carpeta_base = origen

    if os.path.isfile(origen) and origen.lower().endswith(".zip"):
        temp_dir = tempfile.mkdtemp(prefix="ak_redes_")
        with zipfile.ZipFile(origen, "r") as zf:
            zf.extractall(temp_dir)
        carpeta_base = temp_dir

    estilo_data = leer_estilo_json(carpeta_base)
    exts_validas = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

    estaciones: Dict[str, List[str]] = {}
    todas_las_fotos: List[str] = []

    for raiz, _, archivos in os.walk(carpeta_base):
        for arch in archivos:
            ext = os.path.splitext(arch)[1].lower()
            if ext in exts_validas:
                ruta_completa = os.path.join(raiz, arch)
                todas_las_fotos.append(ruta_completa)

                rel = os.path.relpath(raiz, carpeta_base)
                partes = rel.replace("\\", "/").split("/")
                nombre_estacion = partes[0] if partes and partes[0] not in (".", "") else "general"

                if nombre_estacion not in estaciones:
                    estaciones[nombre_estacion] = []
                estaciones[nombre_estacion].append(ruta_completa)

    # Agregar la estación agregada 'la noche completa' con fotos de todas las estaciones
    if todas_las_fotos:
        estaciones["la noche completa"] = list(todas_las_fotos)

    return {
        "estaciones": estaciones,
        "estilo": estilo_data,
        "temp_dir": temp_dir,
    }


def renderizar_video_formato(
    fotos: List[str],
    ruta_salida: str,
    ancho: int,
    alto: int,
    duracion_objetivo: float = 15.0,
    fps: int = 24,
    ruta_logo_ak: Optional[str] = None,
    ruta_audio: Optional[str] = None,
    progreso_callback: Optional[Callable[[int, int, str], None]] = None,
) -> str:
    """Renderiza un video en una resolución exacta, con movimiento y logo en el último segundo."""
    carpeta = os.path.dirname(ruta_salida)
    if carpeta:
        os.makedirs(carpeta, exist_ok=True)

    logo_img = cv2.imread(ruta_logo_ak) if ruta_logo_ak and os.path.exists(ruta_logo_ak) else None

    # El último segundo (fps cuadros) está reservado para la placa de cierre con el logo de AK
    cuadros_cierre = fps * 1
    total_cuadros_deseados = max(fps * 3, int(duracion_objetivo * fps))
    cuadros_fotos = total_cuadros_deseados - cuadros_cierre

    cuadros_por_foto = max(fps, cuadros_fotos // max(1, len(fotos)))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(ruta_salida, fourcc, float(fps), (ancho, alto))

    try:
        # Renderizar tramos de fotos con movimiento y fondo sin barras
        for idx, r_foto in enumerate(fotos):
            img_raw = cv2.imread(r_foto)
            if img_raw is None:
                continue

            img_mej, _ = mejorar_foto_suave(img_raw)
            lienzo = adaptar_a_formato(img_mej, ancho, alto)

            caras = detectar_caras(lienzo)
            cara_ppal = caras[0] if caras else None
            sentido = "acercar" if idx % 2 == 0 else "alejar"

            encuadres = calcular_encuadres_movimiento(
                ancho, alto, cara_box=cara_ppal, total_cuadros=cuadros_por_foto, zoom_max=1.12, sentido=sentido
            )

            for cx, cy, cw, ch in encuadres:
                recorte = lienzo[cy : cy + ch, cx : cx + cw]
                frame_anim = cv2.resize(recorte, (ancho, alto), interpolation=cv2.INTER_LINEAR)
                writer.write(frame_anim)

        # Último segundo: Placa de cierre con el logo de AK Producciones
        cuadro_cierre = generar_placa_cierre_redes(ancho, alto, logo_ak=logo_img)
        for _ in range(cuadros_cierre):
            writer.write(cuadro_cierre)

    finally:
        writer.release()

    return ruta_salida


def generar_videos_redes(
    origen: str,
    carpeta_destino: str,
    ruta_logo_ak: Optional[str] = None,
    ruta_musica: Optional[str] = None,
    duracion_seg: float = 15.0,
    fps: int = 20,
    progreso_callback: Optional[Callable[[int, int, str], None]] = None,
) -> Dict[str, Any]:
    """Genera los 3 formatos exactos por cada estación y para 'la noche completa'.

    Produce redes.json con la lista completa de videos generados.
    """
    material = cargar_material_redes(origen)
    estaciones = material["estaciones"]
    temp_dir = material["temp_dir"]

    os.makedirs(carpeta_destino, exist_ok=True)
    lista_redes_json: List[Dict[str, Any]] = []

    try:
        total_trabajos = len(estaciones) * len(FORMATOS_REDES)
        trabajo_idx = 0

        for nombre_estacion, fotos_estacion in estaciones.items():
            if not fotos_estacion:
                continue

            # Normalizar nombre de estación para archivos
            nom_archivo_base = nombre_estacion.lower().replace(" ", "-").replace("_", "-")

            for formato_clave, cfg in FORMATOS_REDES.items():
                trabajo_idx += 1
                ancho = cfg["ancho"]
                alto = cfg["alto"]
                sufijo = cfg["sufijo"]

                nombre_video = f"{nom_archivo_base}{sufijo}"
                ruta_video = os.path.join(carpeta_destino, nombre_video)

                if progreso_callback:
                    progreso_callback(
                        trabajo_idx, total_trabajos, f"Generando {nombre_estacion} en formato {formato_clave}"
                    )

                renderizar_video_formato(
                    fotos=fotos_estacion[:10],
                    ruta_salida=ruta_video,
                    ancho=ancho,
                    alto=alto,
                    duracion_objetivo=duracion_seg,
                    fps=fps,
                    ruta_logo_ak=ruta_logo_ak,
                    ruta_audio=ruta_musica,
                )

                lista_redes_json.append({
                    "estacion": nombre_estacion,
                    "formato": formato_clave,
                    "archivo": nombre_video,
                    "duracion": duracion_seg,
                })

        # Guardar redes.json en el destino
        ruta_redes_json = os.path.join(carpeta_destino, "redes.json")
        with open(ruta_redes_json, "w", encoding="utf-8") as f:
            json.dump(lista_redes_json, f, ensure_ascii=False, indent=2)

        return {
            "ok": True,
            "videos": lista_redes_json,
            "redes_json": ruta_redes_json,
            "carpeta": carpeta_destino,
        }

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

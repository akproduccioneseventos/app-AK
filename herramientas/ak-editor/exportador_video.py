# -*- coding: utf-8 -*-
"""Módulo de exportación directa a video terminado mediante FFmpeg.

Usa CPU con codec libx264 (sin aceleración nvenc, optimizado para Core i7 de 4.ª gen).
Calcula estimación de tiempo para dejarlo procesando de noche.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
from typing import Any, Callable, Dict, List, Optional


def estimar_tiempo_render_segundos(duracion_video_segundos: float) -> float:
    """Calcula el tiempo estimado de renderizado para un i7-4700HQ / i7 4.ª gen

    sin GPU dedicada (~1.8x el tiempo real del video).
    """
    return round(duracion_video_segundos * 1.8, 1)


def estimar_tiempo_render_formateado(duracion_video_segundos: float) -> str:
    """Devuelve el tiempo estimado en formato legible (ej: '1h 15m')."""
    segundos = estimar_tiempo_render_segundos(duracion_video_segundos)
    horas = int(segundos // 3600)
    minutos = int((segundos % 3600) // 60)
    if horas > 0:
        return f"{horas} h {minutos} min"
    return f"{minutos} min"


def renderizar_corte_individual(
    ruta_origen: str,
    segundo_inicio: float,
    duracion: float,
    ruta_salida: str,
) -> bool:
    """Corta y recodifica un segmento individual con libx264."""
    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(segundo_inicio),
        "-t", str(duracion),
        "-i", ruta_origen,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        ruta_salida,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
    return res.returncode == 0


def concatenar_videos(lista_rutas: List[str], ruta_salida_final: str) -> bool:
    """Concatena una lista de videos recodificados sin recodificar (copy)."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        for r in lista_rutas:
            linea = f"file '{os.path.abspath(r).replace('\\', '/')}'\n"
            f.write(linea)
        lista_txt = f.name

    try:
        cmd = [
            "ffmpeg",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", lista_txt,
            "-c", "copy",
            ruta_salida_final,
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        return res.returncode == 0
    finally:
        if os.path.exists(lista_txt):
            os.remove(lista_txt)


def exportar_video_ffmpeg(
    cortes: List[Dict[str, Any]],
    ruta_destino_mp4: str,
    callback_progreso: Optional[Callable[[int, int, str], None]] = None,
) -> bool:
    """Procesa y une todos los cortes en un MP4 final."""
    if not cortes:
        return False

    carpeta_salida = os.path.dirname(ruta_destino_mp4)
    if carpeta_salida:
        os.makedirs(carpeta_salida, exist_ok=True)

    archivos_intermedios = []
    total = len(cortes)

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            for idx, c in enumerate(cortes, start=1):
                ruta_src = c.get("archivo_ruta") or c.get("ruta")
                if not ruta_src or not os.path.exists(ruta_src):
                    continue

                nom_temp = f"clip_{idx:04d}.mp4"
                ruta_temp = os.path.join(temp_dir, nom_temp)

                if callback_progreso:
                    callback_progreso(idx, total, f"Renderizando corte {idx} de {total}")

                ok = renderizar_corte_individual(
                    ruta_origen=ruta_src,
                    segundo_inicio=c["entrada"],
                    duracion=c["salida"] - c["entrada"],
                    ruta_salida=ruta_temp,
                )
                if ok and os.path.exists(ruta_temp):
                    archivos_intermedios.append(ruta_temp)

            if not archivos_intermedios:
                return False

            if callback_progreso:
                callback_progreso(total, total, "Uniendo cortes en video final...")

            return concatenar_videos(archivos_intermedios, ruta_destino_mp4)
    except Exception as e:
        print(f"[Exportador Video] Error: {e}")
        return False

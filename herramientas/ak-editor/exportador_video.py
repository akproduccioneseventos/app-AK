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
    tipo: str = "general",
    bloque: str = "general",
    boomerang: bool = False,
) -> bool:
    """Corta y recodifica un segmento individual con filtros de color, slow motion y boomerang si aplica."""
    filtros_v = []

    # 1. Color automático suave (Orden 298 - Bloque 4)
    filtros_v.append("eq=contrast=1.06:saturation=1.08:brightness=0.01")

    # 2. Boomerang para cortes cortos de pose
    es_pose_corta = (tipo == "pose" or bloque == "previa") and duracion <= 4.0
    aplicar_boomerang = boomerang or es_pose_corta

    # 3. Cámara lenta por partes en momentos de pose y baile (Orden 298 - Bloque 4)
    aplicar_slow_motion = not aplicar_boomerang and (tipo in ("pose", "pose_firmas") or bloque in ("previa", "baile"))

    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(segundo_inicio),
        "-t", str(duracion),
        "-i", ruta_origen,
    ]

    if aplicar_boomerang:
        # Ida y vuelta (boomerang) con reverse
        filtro_completo = f"{','.join(filtros_v)}[v0];[v0]split=2[f1][f2];[f2]reverse[f2rev];[f1][f2rev]concat=n=2:v=1:a=0[vout]"
        cmd.extend(["-filter_complex", filtro_completo, "-map", "[vout]"])
    elif aplicar_slow_motion:
        # Rampa de velocidad estilo 360: setpts=1.5*PTS para slow motion suave
        filtro_slow = f"{','.join(filtros_v)},setpts=1.4*PTS"
        cmd.extend(["-vf", filtro_slow])
    else:
        cmd.extend(["-vf", ",".join(filtros_v)])

    cmd.extend([
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        ruta_salida,
    ])
    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if res.returncode != 0:
        # Fallback a corte estándar si los filtros fallan por códec o dimensiones
        cmd_fallback = [
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
        res_fb = subprocess.run(cmd_fallback, capture_output=True, text=True, check=False)
        return res_fb.returncode == 0
    return True



def concatenar_videos(lista_rutas: List[str], ruta_salida_final: str) -> bool:
    """Concatena una lista de videos recodificados sin recodificar (copy)."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        for r in lista_rutas:
            ruta_unix = os.path.abspath(r).replace("\\", "/")
            linea = f"file '{ruta_unix}'\n"
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
    ruta_musica: Optional[str] = None,
) -> bool:
    """Procesa y une todos los cortes en un MP4 final, mezclando música de fondo si se provee."""
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
                    tipo=c.get("tipo", "general"),
                    bloque=c.get("bloque", "general"),
                    boomerang=bool(c.get("boomerang")),
                )
                if ok and os.path.exists(ruta_temp):
                    archivos_intermedios.append(ruta_temp)

            if not archivos_intermedios:
                return False

            if callback_progreso:
                callback_progreso(total, total, "Uniendo cortes en video final...")

            ruta_concat = ruta_destino_mp4 if not (ruta_musica and os.path.exists(ruta_musica)) else os.path.join(temp_dir, "concat_sin_musica.mp4")
            concat_ok = concatenar_videos(archivos_intermedios, ruta_concat)
            if not concat_ok:
                return False

            # Si hay música de fondo, mezclar atenuando según bloque (Orden 298 - Bloque 4)
            if ruta_musica and os.path.exists(ruta_musica):
                # Mezcla con amix atenuando música o ambiente
                cmd_musica = [
                    "ffmpeg",
                    "-y",
                    "-i", ruta_concat,
                    "-i", ruta_musica,
                    "-filter_complex",
                    "[0:a]volume=0.8[a0];[1:a]volume=0.3[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]",
                    "-map", "0:v",
                    "-map", "[aout]",
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-shortest",
                    ruta_destino_mp4,
                ]
                res_m = subprocess.run(cmd_musica, capture_output=True, text=True, check=False)
                if res_m.returncode != 0:
                    # Si falla amix (por falta de audio en origen), copiar el concat directo
                    if os.path.exists(ruta_concat) and ruta_concat != ruta_destino_mp4:
                        import shutil
                        shutil.copy2(ruta_concat, ruta_destino_mp4)
            return True

    except Exception as e:
        print(f"[Exportador Video] Error: {e}")
        return False


LIMITE_VIDEO_WFOLIO_BYTES = 500 * 1024 * 1024  # 500 MB


def _obtener_duracion_video_segundos(ruta_video: str, default_segundos: float = 30.0) -> float:
    """Consulta la duración de un video usando ffprobe con fallback seguro."""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            ruta_video,
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode == 0 and res.stdout.strip():
            dur = float(res.stdout.strip())
            if dur > 0:
                return dur
    except Exception:
        pass
    return default_segundos


def comprimir_video_para_wfolio(
    ruta_video: str,
    ruta_salida: Optional[str] = None,
    max_bytes: int = LIMITE_VIDEO_WFOLIO_BYTES,
    tamano_actual_bytes: Optional[int] = None,
    dry_run: bool = False,
    ejecutador_ffmpeg: Optional[Callable[[List[str], str, str], bool]] = None,
) -> Dict[str, Any]:
    """Comprime un video MP4/MOV a H.264 por debajo de 500 MB para que Wfolio lo reproduzca en la galería."""
    if not os.path.exists(ruta_video) and tamano_actual_bytes is None:
        return {
            "exito": False,
            "comprimido": False,
            "ruta": ruta_video,
            "error": f"No existe el video: {ruta_video}",
        }

    tamano_original = (
        int(tamano_actual_bytes)
        if tamano_actual_bytes is not None
        else os.path.getsize(ruta_video)
    )

    if tamano_original <= max_bytes:
        return {
            "exito": True,
            "comprimido": False,
            "ruta": ruta_video,
            "tamano_original_bytes": tamano_original,
            "tamano_bytes": tamano_original,
            "wfolio_compatible": True,
        }

    if ruta_salida is None:
        stem, _ = os.path.splitext(ruta_video)
        ruta_salida = f"{stem}_wfolio.mp4"

    carpeta_salida = os.path.dirname(ruta_salida)
    if carpeta_salida:
        os.makedirs(carpeta_salida, exist_ok=True)

    duracion = _obtener_duracion_video_segundos(ruta_video)
    objetivo_bytes = int(max_bytes * 0.88)
    bitrate_total_bps = max(500_000, int((objetivo_bytes * 8) / max(duracion, 1.0)))
    audio_bps = 128_000
    video_kbps = max(350, min(18_000, (bitrate_total_bps - audio_bps) // 1000))

    cmd = [
        "ffmpeg",
        "-y",
        "-i", ruta_video,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-b:v", f"{video_kbps}k",
        "-maxrate", f"{video_kbps}k",
        "-bufsize", f"{video_kbps * 2}k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "128k",
        ruta_salida,
    ]

    if dry_run:
        return {
            "exito": True,
            "comprimido": True,
            "ruta": ruta_salida,
            "tamano_original_bytes": tamano_original,
            "tamano_bytes": objetivo_bytes,
            "cmd": cmd,
            "wfolio_compatible": True,
        }

    if ejecutador_ffmpeg is not None:
        ok = bool(ejecutador_ffmpeg(cmd, ruta_video, ruta_salida))
    else:
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        ok = res.returncode == 0

    if not ok or not os.path.exists(ruta_salida):
        return {
            "exito": False,
            "comprimido": False,
            "ruta": ruta_video,
            "tamano_original_bytes": tamano_original,
            "error": "No se pudo comprimir el video a H.264 por debajo de 500 MB para Wfolio.",
            "wfolio_compatible": False,
        }

    tamano_final = os.path.getsize(ruta_salida)
    return {
        "exito": True,
        "comprimido": True,
        "ruta": ruta_salida,
        "tamano_original_bytes": tamano_original,
        "tamano_bytes": tamano_final,
        "wfolio_compatible": tamano_final <= max_bytes,
    }

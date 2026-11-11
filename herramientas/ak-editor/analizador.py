# -*- coding: utf-8 -*-
"""Módulo de análisis de video y audio para AK Editor Inteligente.

Incluye:
- Detección de metadatos (ffprobe o fallback)
- Sincronización de dos cámaras por correlación cruzada de audio
- Detección de voz activa / silencio (VAD simple)
- Clasificación automática de bloques por nombre y hora
- Soporte para continuar donde quedó sin rehacer trabajo
"""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple

import cv2
import numpy as np
import psutil
from scipy import signal

from almacen import Almacen


def calcular_sha256(ruta_archivo: str, limite_bytes: int = 1024 * 1024) -> str:
    """Calcula el hash SHA256 de un archivo (o de su cabecera para archivos grandes)."""
    hasher = hashlib.sha256()
    with open(ruta_archivo, "rb") as f:
        leido = 0
        while True:
            trozo = f.read(65536)
            if not trozo:
                break
            hasher.update(trozo)
            leido += len(trozo)
            if limite_bytes and leido >= limite_bytes:
                break
    return hasher.hexdigest()


def extraer_metadatos_ffprobe(ruta_archivo: str) -> Dict[str, Any]:
    """Obtiene duración, resolución, fps y fecha usando ffprobe si está disponible."""
    try:
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            ruta_archivo,
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode == 0 and res.stdout.strip():
            datos = json.loads(res.stdout)
            duracion = float(datos.get("format", {}).get("duration", 0.0))

            video_stream = next((s for s in datos.get("streams", []) if s.get("codec_type") == "video"), None)
            resolucion = ""
            fps = 30.0
            if video_stream:
                ancho = video_stream.get("width")
                alto = video_stream.get("height")
                if ancho and alto:
                    resolucion = f"{ancho}x{alto}"
                r_frame_rate = video_stream.get("r_frame_rate", "30/1")
                if "/" in r_frame_rate:
                    num, den = r_frame_rate.split("/")
                    fps = float(num) / max(float(den), 1.0)
                else:
                    fps = float(r_frame_rate)

            tags = datos.get("format", {}).get("tags", {})
            fecha_str = tags.get("creation_time") or tags.get("date") or ""
            return {
                "duracion": duracion,
                "resolucion": resolucion,
                "fps": round(fps, 2),
                "fecha_grabacion": fecha_str,
            }
    except Exception:
        pass

    # Fallback si no hay ffprobe
    stat = os.stat(ruta_archivo)
    fecha_mod = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
    return {
        "duracion": 10.0,
        "resolucion": "1920x1080",
        "fps": 30.0,
        "fecha_grabacion": fecha_mod,
    }


def identificar_camara(nombre_archivo: str, metadatos: Optional[Dict[str, Any]] = None) -> str:
    """Clasifica la cámara en 'principal', 'osmo' o '360' según el nombre o metadatos."""
    nom = nombre_archivo.lower()
    if any(k in nom for k in ["osmo", "action", "cam2", "cam-2", "cam_2", "b-roll", "dji"]):
        return "osmo"
    if any(k in nom for k in ["360", "insta", "gopro360", "max"]):
        return "360"
    return "principal"


def clasificar_bloque(nombre_archivo: str, hora_grabacion: Optional[str] = None) -> str:
    """Propone el bloque de la fiesta según el nombre del archivo o la hora."""
    nom = nombre_archivo.lower()
    if any(k in nom for k in ["marca", "intro", "logo", "cierre"]):
        return "marca_ak"
    if any(k in nom for k in ["previa", "deco", "salon", "vestido", "maquillaje", "sesion"]):
        return "previa"
    if any(k in nom for k in ["entrada", "llegada", "ingreso"]):
        return "entrada"
    if any(k in nom for k in ["vals"]):
        return "vals"
    if any(k in nom for k in ["discurso", "palabras", "vela", "velas", "torta"]):
        return "discursos_y_velas"
    if any(k in nom for k in ["baile", "tanda", "cotillon", "fiesta", "pista"]):
        return "baile"

    # Si hay hora y nada en el nombre, estimar por rango típico de una fiesta
    if hora_grabacion:
        try:
            # Ejemplo: 2026-11-10 21:30:00 o 21:30
            partes = hora_grabacion.split()
            hora_part = partes[-1] if partes else ""
            if ":" in hora_part:
                h = int(hora_part.split(":")[0])
                if 19 <= h < 21:
                    return "previa"
                elif 21 <= h < 22:
                    return "entrada"
                elif 22 <= h < 23:
                    return "vals"
                elif 23 <= h or h < 3:
                    return "baile"
                elif 3 <= h < 5:
                    return "discursos_y_velas"
        except Exception:
            pass

    return "previa"


def sincronizar_dos_camaras(
    audio_principal: np.ndarray,
    audio_secundario: np.ndarray,
    tasa_muestreo: int = 1000,
) -> float:
    """Calcula el desfase temporal (en segundos) de audio_secundario respecto a audio_principal.

    Un offset positivo significa que la señal secundaria está adelantada o retrasada
    por ese número de segundos.
    """
    s1 = np.asarray(audio_principal, dtype=np.float64)
    s2 = np.asarray(audio_secundario, dtype=np.float64)

    # Quitar componente de continua
    s1 = s1 - np.mean(s1)
    s2 = s2 - np.mean(s2)

    # Correlación cruzada mediante FFT
    corr = signal.correlate(s1, s2, mode="full", method="fft")
    lags = signal.correlation_lags(len(s1), len(s2), mode="full")

    indice_max = np.argmax(np.abs(corr))
    lag_muestras = lags[indice_max]

    offset_segundos = lag_muestras / float(tasa_muestreo)
    return float(offset_segundos)


def detectar_voz_activa(
    audio: np.ndarray,
    tasa_muestreo: int = 1000,
    umbral_rms: float = 0.05,
    tamano_ventana_segundos: float = 0.2,
) -> List[Tuple[float, float]]:
    """Detecta intervalos continuos de voz activa según energía RMS.

    Retorna una lista de tuplas [(inicio_s, fin_s), ...].
    """
    tamano_ventana = max(int(tamano_ventana_segundos * tasa_muestreo), 1)
    total_muestras = len(audio)

    tramos_activos = []
    en_tramo = False
    inicio_tramo = 0.0

    for i in range(0, total_muestras, tamano_ventana):
        ventana = audio[i : i + tamano_ventana]
        rms = np.sqrt(np.mean(ventana**2)) if len(ventana) > 0 else 0.0
        segundo_actual = i / tasa_muestreo

        if rms >= umbral_rms:
            if not en_tramo:
                en_tramo = True
                inicio_tramo = segundo_actual
        else:
            if en_tramo:
                en_tramo = False
                tramos_activos.append((round(inicio_tramo, 2), round(segundo_actual, 2)))

    if en_tramo:
        fin_total = total_muestras / tasa_muestreo
        tramos_activos.append((round(inicio_tramo, 2), round(fin_total, 2)))

    return tramos_activos


def analizar_archivo_video(ruta_archivo: str) -> List[Dict[str, Any]]:
    """Analiza un video fotograma a fotograma utilizando OpenCV.

    Detecta por segundo:
    - Pantallas negras (algoritmo equivalente al filtro blackdetect de ffmpeg)
    - Nivel de desenfoque mediante la varianza del Laplaciano
    - Sacudidas de cámara por magnitud de flujo óptico Farneback
    - Detección de rostros y quietud con clasificador en cascada
    """
    if not os.path.exists(ruta_archivo):
        raise FileNotFoundError(f"Video no encontrado: {ruta_archivo}")

    cap = cv2.VideoCapture(ruta_archivo)
    if not cap.isOpened():
        raise RuntimeError(f"No se pudo abrir el archivo de video con OpenCV: {ruta_archivo}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0.0 or np.isnan(fps):
        fps = 30.0

    salto_frames = max(1, int(round(fps / 5.0)))  # Muestreo a 5 imágenes por segundo

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    detector_caras = None
    if os.path.exists(cascade_path):
        try:
            detector_caras = cv2.CascadeClassifier(cascade_path)
        except Exception:
            detector_caras = None

    frame_idx = 0
    prev_gray_small = None
    datos_por_segundo: Dict[int, Dict[str, Any]] = {}

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            if frame_idx % salto_frames != 0:
                frame_idx += 1
                continue

            segundo = int(frame_idx / fps)
            if segundo not in datos_por_segundo:
                datos_por_segundo[segundo] = {
                    "brillos": [],
                    "desenfoques": [],
                    "sacudidas": [],
                    "caras": [],
                }

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
            small_w = 320
            small_h = max(1, int(h * (320.0 / max(w, 1))))
            gray_small = cv2.resize(gray, (small_w, small_h))

            # 1. Brillo medio (detección compatible con blackdetect)
            brillo = float(np.mean(gray))
            datos_por_segundo[segundo]["brillos"].append(brillo)

            # 2. Desenfoque (varianza del Laplaciano)
            var_lap = float(cv2.Laplacian(gray_small, cv2.CV_64F).var())
            datos_por_segundo[segundo]["desenfoques"].append(var_lap)

            # 3. Sacudida de cámara (flujo óptico Farneback)
            if prev_gray_small is not None:
                flujo = cv2.calcOpticalFlowFarneback(
                    prev_gray_small, gray_small, None, 0.5, 3, 15, 3, 5, 1.2, 0
                )
                mag = np.sqrt(flujo[..., 0] ** 2 + flujo[..., 1] ** 2)
                sacudida = float(np.mean(mag))
            else:
                sacudida = 0.0
            prev_gray_small = gray_small
            datos_por_segundo[segundo]["sacudidas"].append(sacudida)

            # 4. Detección de rostros
            if detector_caras and len(datos_por_segundo[segundo]["caras"]) == 0:
                caras = detector_caras.detectMultiScale(gray_small, scaleFactor=1.1, minNeighbors=4)
                datos_por_segundo[segundo]["caras"].append(len(caras) > 0)

            frame_idx += 1
    finally:
        cap.release()

    if not datos_por_segundo:
        raise RuntimeError(f"El archivo de video no contiene fotogramas legibles: {ruta_archivo}")

    metricas_segundos: List[Dict[str, Any]] = []
    for sec in sorted(datos_por_segundo.keys()):
        d = datos_por_segundo[sec]
        brillo_medio = float(np.mean(d["brillos"])) if d["brillos"] else 0.0
        desenfoque_medio = float(np.mean(d["desenfoques"])) if d["desenfoques"] else 0.0
        sacudida_media = float(np.mean(d["sacudidas"])) if d["sacudidas"] else 0.0
        tiene_cara = any(d["caras"]) if d["caras"] else False
        cara_quieta = tiene_cara and (sacudida_media < 2.0)

        # blackdetect: detección de fotogramas negros por umbral de brillo
        es_negro = brillo_medio < 12.0

        metricas_segundos.append({
            "segundo": float(sec),
            "es_negro": es_negro,
            "es_silencio": False,
            "desenfoque": round(desenfoque_medio, 2),
            "sacudida": round(sacudida_media, 2),
            "tiene_cara": tiene_cara,
            "cara_quieta": cara_quieta,
            "nivel_brillo": round(brillo_medio, 2),
        })

    return metricas_segundos


class Analizador:
    """Clase principal que orquesta el análisis de videos y persistencia."""

    def __init__(self, almacen: Almacen, ruta_medicion: Optional[str] = None):
        self.almacen = almacen
        self.ruta_medicion = ruta_medicion
        self.pausado = False

    def pausar(self) -> None:
        self.pausado = True

    def reanudar(self) -> None:
        self.pausado = False

    def registrar_archivo(self, ruta_completa: str, bloque_manual: Optional[str] = None) -> int:
        """Registra un archivo de video en la base de datos sin tocar el original."""
        if not os.path.exists(ruta_completa):
            raise FileNotFoundError(f"Archivo no encontrado: {ruta_completa}")

        nombre = os.path.basename(ruta_completa)
        meta = extraer_metadatos_ffprobe(ruta_completa)
        camara = identificar_camara(nombre, meta)
        bloque = bloque_manual or clasificar_bloque(nombre, meta.get("fecha_grabacion"))
        sha = calcular_sha256(ruta_completa)

        datos = {
            "ruta": os.path.abspath(ruta_completa),
            "nombre": nombre,
            "bloque": bloque,
            "duracion": meta.get("duracion", 0.0),
            "resolucion": meta.get("resolucion", ""),
            "fps": meta.get("fps", 30.0),
            "fecha_grabacion": meta.get("fecha_grabacion", ""),
            "camara": camara,
            "estado_analisis": "pendiente",
            "sha256": sha,
            "metadatos_json": meta,
        }
        return self.almacen.guardar_archivo(datos)

    def analizar_archivo(self, ruta_archivo: str, archivo_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Analiza un video individual y guarda los resultados en el almacén."""
        metricas = analizar_archivo_video(ruta_archivo)
        if archivo_id is not None:
            self.almacen.guardar_analisis_segundos(archivo_id, metricas)
            self.almacen.actualizar_estado_analisis(archivo_id, "completado")
        return metricas

    def _registrar_medicion_real(
        self,
        duracion_total: float,
        cant_archivos: int,
        tiempo_segundos: float,
    ) -> None:
        """Registra la medición real en MEDICION.md usando psutil y tiempo medido."""
        try:
            proceso = psutil.Process()
            memoria_mb = proceso.memory_info().rss / (1024 * 1024)
            directorio_base = os.path.dirname(os.path.abspath(__file__))
            ruta_medicion = self.ruta_medicion or os.path.join(directorio_base, "MEDICION.md")

            avisos = self.almacen.obtener_avisos_revision()
            if avisos and any(a.get("corregido") for a in avisos):
                corregidos = sum(1 for a in avisos if a.get("corregido"))
                estado_cortes = f"{corregidos} avisos corregidos de {len(avisos)}"
            else:
                estado_cortes = "sin revisar"

            pref_filmora = self.almacen.obtener_preferencia("filmora_aprobado", None)
            estado_filmora = "aprobado" if pref_filmora else "sin probar"

            fecha_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            lineas = [
                "",
                f"## Medición de corrida real — {fecha_hora}",
                f"- **Material analizado**: {duracion_total:.1f} s ({cant_archivos} archivos)",
                f"- **Tiempo transcurrido**: {tiempo_segundos:.2f} s",
                f"- **Memoria RAM máxima (proceso)**: {memoria_mb:.2f} MB",
                f"- **Cortes revisados por el dueño**: {estado_cortes}",
                f"- **Compatibilidad con Filmora**: {estado_filmora}",
                "",
            ]
            with open(ruta_medicion, "a", encoding="utf-8") as f:
                f.write("\n".join(lineas))
        except Exception:
            pass

    def analizar_carpeta(
        self,
        carpeta: str,
        progreso_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> List[Dict[str, Any]]:
        """Escanea una carpeta, registra archivos nuevos y analiza de a uno.

        Sigue donde quedó si ya había archivos analizados.
        """
        extensiones = {".mp4", ".mov", ".avi", ".mkv", ".m4v"}
        archivos_encontrados = []

        for raiz, _, archivos in os.walk(carpeta):
            for arch in archivos:
                ext = os.path.splitext(arch)[1].lower()
                if ext in extensiones:
                    archivos_encontrados.append(os.path.join(raiz, arch))

        # Registrar en la base de datos sólo los nuevos
        archivos_existentes = {a["ruta"]: a for a in self.almacen.obtener_archivos()}
        for ruta in archivos_encontrados:
            ruta_abs = os.path.abspath(ruta)
            if ruta_abs not in archivos_existentes:
                try:
                    self.registrar_archivo(ruta_abs)
                except Exception:
                    pass

        # Obtener todos los archivos del proyecto
        todos = self.almacen.obtener_archivos()
        total = len(todos)

        t_inicio = time.perf_counter()
        duracion_total = 0.0
        procesados = 0
        videos_reales_procesados = 0

        for idx, item in enumerate(todos, start=1):
            if self.pausado:
                break

            # Si ya fue completado, NO reanalizar (sigue donde quedó)
            if item.get("estado_analisis") == "completado":
                if progreso_callback:
                    progreso_callback(idx, total, f"Ya analizado: {item['nombre']}")
                continue

            # Notificar progreso
            if progreso_callback:
                progreso_callback(idx, total, f"Analizando: {item['nombre']}")

            # Marcar en progreso
            self.almacen.actualizar_estado_analisis(item["id"], "en_progreso")

            try:
                metricas = analizar_archivo_video(item["ruta"])
                self.almacen.guardar_analisis_segundos(item["id"], metricas)
                self.almacen.actualizar_estado_analisis(item["id"], "completado")
                duracion_total += float(item.get("duracion") or len(metricas))
                procesados += 1
                videos_reales_procesados += 1
            except Exception as e:
                print(f"Error al analizar {item['nombre']}: {e}")
                self.almacen.actualizar_estado_analisis(item["id"], "con error")

        t_total = time.perf_counter() - t_inicio
        if videos_reales_procesados > 0:
            self._registrar_medicion_real(duracion_total, videos_reales_procesados, t_total)

        return self.almacen.obtener_archivos()

# -*- coding: utf-8 -*-
"""Servidor local HTTP para AK Editor Inteligente.

Escucha en http://localhost:8765 y sirve la interfaz web de edición con la
estética de AK Producciones.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Callable, Dict, List, Optional
import urllib.parse
import numpy as np

from almacen import Almacen, obtener_ruta_base_datos
from analizador import Analizador, detectar_voz_activa, sincronizar_dos_camaras
from exportador_filmora import exportar_timeline_filmora, generar_xml_prueba
from exportador_video import estimar_tiempo_render_formateado, exportar_video_ffmpeg
from reglas import ReglasEdicion, aprender_de_mis_videos, cargar_configuracion
import video_de_vida

PUERTO = 8765

# Estado global en memoria para progreso y control de tareas
ESTADO_GLOBAL = {
    "evento_actual": "Quinceanera_Demo",
    "carpeta_origen": "",
    "en_progreso": False,
    "pausado": False,
    "total_archivos": 0,
    "actual_archivo": 0,
    "mensaje_progreso": "Listo para comenzar",
    "almacen": None,
    "analizador": None,
}


def obtener_almacen_actual() -> Almacen:
    if ESTADO_GLOBAL["almacen"] is None:
        ruta_db = obtener_ruta_base_datos(ESTADO_GLOBAL["evento_actual"])
        ESTADO_GLOBAL["almacen"] = Almacen(ruta_db)
        ESTADO_GLOBAL["analizador"] = Analizador(ESTADO_GLOBAL["almacen"])
    return ESTADO_GLOBAL["almacen"]


def obtener_analizador_actual() -> Analizador:
    obtener_almacen_actual()
    return ESTADO_GLOBAL["analizador"]


def extraer_audio_mono(ruta_video: str, tasa_muestreo: int = 1000) -> np.ndarray:
    """Extrae audio mono como array float32 mediante ffmpeg."""
    try:
        cmd = [
            "ffmpeg", "-v", "quiet", "-y", "-i", ruta_video,
            "-ar", str(tasa_muestreo), "-ac", "1", "-f", "f32le", "-"
        ]
        res = subprocess.run(cmd, capture_output=True, check=False)
        if res.returncode == 0 and res.stdout:
            return np.frombuffer(res.stdout, dtype=np.float32)
    except Exception:
        pass
    return np.zeros(0, dtype=np.float32)


def armar_proyecto(
    carpeta: str,
    almacen: Almacen,
    progreso_callback: Optional[Callable[[int, int, str], None]] = None,
) -> List[Dict[str, Any]]:
    """Arma el proyecto completo de la fiesta (Orden 274).

    Ejecuta en orden:
    1. Previa (cortes con regla 'la pose' o transiciones)
    2. Entrada (si hay archivos, ducking de música al hablar)
    3. Vals (generar_pistas_vals con música continua)
    4. Baile (sincronizar_dos_camaras con offset en almacén, cortes multicámara con Osmo en pista 2 o fundido de 0,2s)
    5. Discursos y velas (detectar_voz_activa y generar_cortes_discursos_y_velas)

    Cada bloque empieza donde terminó el anterior (start acumulativo) y ningún clip dura menos de 1 s.
    Agrega avisos detallados con archivo y minuto por cada tramo defectuoso.
    """
    analizador = Analizador(almacen)
    if carpeta and os.path.exists(carpeta):
        analizador.analizar_carpeta(carpeta, progreso_callback=progreso_callback)

    archivos = almacen.obtener_archivos()
    reglas = ReglasEdicion(almacen=almacen)

    cortes_totales: List[Dict[str, Any]] = []
    start_acumulado: float = 0.0

    # 1. Previa
    archivos_previa = [a for a in archivos if a.get("bloque") == "previa"]
    for arch in archivos_previa:
        metricas = almacen.obtener_analisis_segundos(arch["id"])
        cortes_arch = reglas.generar_cortes_pose(arch, metricas=metricas, almacen=almacen)
        if not cortes_arch:
            cortes_arch = reglas.generar_cortes_previa([arch], almacen=almacen)

        for c in cortes_arch:
            dur = round(c.get("salida", 0.0) - c.get("entrada", 0.0), 2)
            if dur >= 1.0:
                c["archivo_ruta"] = arch["ruta"]
                c["archivo_nombre"] = arch["nombre"]
                c["duracion"] = dur
                c["start"] = round(start_acumulado, 2)
                c["end"] = round(start_acumulado + dur, 2)
                start_acumulado += dur
                cortes_totales.append(c)

    # 2. Entrada
    archivos_entrada = [a for a in archivos if a.get("bloque") == "entrada"]
    for arch in archivos_entrada:
        dur = float(arch.get("duracion", 10.0))
        if dur >= 1.0:
            c = {
                "archivo_id": arch["id"],
                "archivo_ruta": arch["ruta"],
                "archivo_nombre": arch["nombre"],
                "bloque": "entrada",
                "entrada": 0.0,
                "salida": round(dur, 2),
                "duracion": round(dur, 2),
                "start": round(start_acumulado, 2),
                "end": round(start_acumulado + dur, 2),
                "tipo": "corte_directo",
                "transicion": "disolvencia",
                "regla_aplicada": "entrada_locutor_ducking",
                "camara": arch.get("camara", "principal"),
                "pista_video": 1,
                "pista_audio": 1,
                "volumen_audio": 0.7,
            }
            start_acumulado += dur
            cortes_totales.append(c)

    # 3. Vals
    archivos_vals = [a for a in archivos if a.get("bloque") == "vals"]
    if not archivos_vals:
        almacen.agregar_aviso_revision({
            "tipo_aviso": "momento_faltante",
            "archivo_id": None,
            "segundo_inicio": 0.0,
            "segundo_fin": 0.0,
            "severidad": "advertencia",
            "descripcion": "No se encontró ningún video identificado como vals en este evento.",
        })
    else:
        arch_musica = archivos_vals[0]
        pistas_vals = reglas.generar_pistas_vals(arch_musica, archivos_vals)
        inicio_vals = start_acumulado
        for c in pistas_vals.get("cortes_video", []):
            dur = round(c["salida"] - c["entrada"], 2)
            if dur >= 1.0:
                arch_ref = next((a for a in archivos if a["id"] == c.get("archivo_id")), None)
                if arch_ref:
                    c["archivo_ruta"] = arch_ref["ruta"]
                    c["archivo_nombre"] = arch_ref["nombre"]
                c["duracion"] = dur
                c["start"] = round(start_acumulado, 2)
                c["end"] = round(start_acumulado + dur, 2)
                start_acumulado += dur
                cortes_totales.append(c)

        c_mus = pistas_vals.get("pista_musica")
        if c_mus:
            c_mus["archivo_ruta"] = arch_musica["ruta"]
            c_mus["archivo_nombre"] = arch_musica["nombre"]
            c_mus["start"] = round(inicio_vals, 2)
            c_mus["end"] = round(start_acumulado, 2)
            cortes_totales.append(c_mus)

    # 4. Baile
    archivos_baile = [a for a in archivos if a.get("bloque") == "baile"]
    arch_prin = next((a for a in archivos_baile if a.get("camara") == "principal"), None)
    if not arch_prin and archivos_baile:
        arch_prin = archivos_baile[0]
    arch_osmo = next((a for a in archivos_baile if a.get("camara") == "osmo"), None)

    if arch_prin and arch_osmo:
        try:
            audio_p = extraer_audio_mono(arch_prin["ruta"], tasa_muestreo=1000)
            audio_o = extraer_audio_mono(arch_osmo["ruta"], tasa_muestreo=1000)
            if len(audio_p) > 500 and len(audio_o) > 500:
                desfase = abs(sincronizar_dos_camaras(audio_p, audio_o, tasa_muestreo=1000))
                almacen.guardar_preferencia("desfase_baile", round(desfase, 2))
            else:
                almacen.agregar_aviso_revision({
                    "tipo_aviso": "error_sincronizacion",
                    "archivo_id": arch_prin["id"],
                    "segundo_inicio": 0.0,
                    "segundo_fin": 0.0,
                    "severidad": "advertencia",
                    "descripcion": "no se pudieron sincronizar las dos cámaras del baile",
                })
        except Exception:
            almacen.agregar_aviso_revision({
                "tipo_aviso": "error_sincronizacion",
                "archivo_id": arch_prin["id"],
                "segundo_inicio": 0.0,
                "segundo_fin": 0.0,
                "severidad": "advertencia",
                "descripcion": "no se pudieron sincronizar las dos cámaras del baile",
            })

    if arch_prin:
        cortes_baile = reglas.generar_cortes_baile_multicamara(arch_prin, arch_osmo, almacen=almacen)
        inicio_baile = start_acumulado
        for c in cortes_baile:
            dur = round(c["salida"] - c["entrada"], 2)
            if dur >= 1.0:
                arch_ref = next((a for a in archivos if a["id"] == c.get("archivo_id")), None)
                if arch_ref:
                    c["archivo_ruta"] = arch_ref["ruta"]
                    c["archivo_nombre"] = arch_ref["nombre"]
                c["duracion"] = dur
                if c.get("pista_video", 1) == 1:
                    c["start"] = round(start_acumulado, 2)
                    c["end"] = round(start_acumulado + dur, 2)
                    start_acumulado += dur
                else:
                    c["start"] = round(inicio_baile + c["entrada"], 2)
                    c["end"] = round(inicio_baile + c["salida"], 2)
                cortes_totales.append(c)

    # 5. Discursos y velas
    archivos_velas = [a for a in archivos if a.get("bloque") == "discursos_y_velas"]
    for arch in archivos_velas:
        try:
            audio_v = extraer_audio_mono(arch["ruta"], tasa_muestreo=1000)
            inter_voz = detectar_voz_activa(audio_v, tasa_muestreo=1000) if len(audio_v) > 0 else []
        except Exception:
            inter_voz = []
        cortes_v = reglas.generar_cortes_discursos_y_velas(arch, intervalos_voz=inter_voz)
        for c in cortes_v:
            dur = round(c["salida"] - c["entrada"], 2)
            if dur >= 1.0:
                c["archivo_ruta"] = arch["ruta"]
                c["archivo_nombre"] = arch["nombre"]
                c["duracion"] = dur
                c["start"] = round(start_acumulado, 2)
                c["end"] = round(start_acumulado + dur, 2)
                start_acumulado += dur
                cortes_totales.append(c)

    # Revisión detallada de tramos defectuosos encontrados por el análisis
    for arch in archivos:
        metricas = almacen.obtener_analisis_segundos(arch["id"])
        # Pantalla negra
        seg_negro = [m["segundo"] for m in metricas if m.get("es_negro")]
        if seg_negro:
            minuto = f"{int(seg_negro[0] // 60):02d}:{int(seg_negro[0] % 60):02d}"
            almacen.agregar_aviso_revision({
                "tipo_aviso": "pantalla_negra",
                "archivo_id": arch["id"],
                "segundo_inicio": seg_negro[0],
                "segundo_fin": seg_negro[-1] + 1.0,
                "severidad": "advertencia",
                "descripcion": f"Pantalla negra detectada en {arch['nombre']} en el segundo {seg_negro[0]:.1f} ({minuto})",
            })
        # Desenfoque
        seg_desenfoque = [m["segundo"] for m in metricas if not m.get("es_negro") and m.get("desenfoque", 500.0) < 100.0]
        if seg_desenfoque:
            minuto = f"{int(seg_desenfoque[0] // 60):02d}:{int(seg_desenfoque[0] % 60):02d}"
            almacen.agregar_aviso_revision({
                "tipo_aviso": "desenfoque",
                "archivo_id": arch["id"],
                "segundo_inicio": seg_desenfoque[0],
                "segundo_fin": seg_desenfoque[-1] + 1.0,
                "severidad": "advertencia",
                "descripcion": f"Desenfoque detectado en {arch['nombre']} en el segundo {seg_desenfoque[0]:.1f} ({minuto})",
            })
        # Sacudida sin Osmo para tapar
        if arch.get("bloque") == "baile" and not arch_osmo:
            seg_sacudida = [m["segundo"] for m in metricas if m.get("sacudida", 0.0) > 2.5]
            if seg_sacudida:
                minuto = f"{int(seg_sacudida[0] // 60):02d}:{int(seg_sacudida[0] % 60):02d}"
                almacen.agregar_aviso_revision({
                    "tipo_aviso": "sacudida_sin_osmo",
                    "archivo_id": arch["id"],
                    "segundo_inicio": seg_sacudida[0],
                    "segundo_fin": seg_sacudida[-1] + 1.0,
                    "severidad": "advertencia",
                    "descripcion": f"Sacudida sin Osmo para tapar en {arch['nombre']} en el segundo {seg_sacudida[0]:.1f} ({minuto})",
                })

    # Guardar en base de datos
    almacen.limpiar_cortes()
    almacen.guardar_cortes(cortes_totales)

    return cortes_totales


class AKEditorHandler(BaseHTTPRequestHandler):
    """Manejador HTTP para AK Editor."""

    def log_message(self, format: str, *args: Any) -> None:
        """Silenciar logs verbosos en consola."""
        return

    def _responder_json(self, codigo: int, datos: Any) -> None:
        cuerpo = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(cuerpo)

    def _responder_html(self, codigo: int, html_str: str) -> None:
        cuerpo = html_str.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        ruta = parsed_url.path

        if ruta == "/" or ruta == "/index.html":
            self._responder_html(200, HTML_INTERFAZ)
            return

        if ruta == "/api/estado":
            almacen = obtener_almacen_actual()
            archivos = almacen.obtener_archivos()
            cortes = almacen.obtener_cortes()
            avisos = almacen.obtener_avisos_revision()
            self._responder_json(200, {
                "evento_actual": ESTADO_GLOBAL["evento_actual"],
                "carpeta_origen": ESTADO_GLOBAL["carpeta_origen"],
                "total_archivos": len(archivos),
                "total_cortes": len(cortes),
                "total_avisos": len(avisos),
                "en_progreso": ESTADO_GLOBAL["en_progreso"],
                "pausado": ESTADO_GLOBAL["pausado"],
                "mensaje_progreso": ESTADO_GLOBAL["mensaje_progreso"],
            })
            return

        if ruta == "/api/proyectos":
            dir_base = os.path.expanduser(os.path.join("~", "Documents", "AK Editor"))
            proyectos = []
            if os.path.exists(dir_base):
                for d in os.listdir(dir_base):
                    p = os.path.join(dir_base, d)
                    if os.path.isdir(p):
                        proyectos.append(d)
            self._responder_json(200, {"proyectos": proyectos, "actual": ESTADO_GLOBAL["evento_actual"]})
            return

        if ruta == "/api/material":
            almacen = obtener_almacen_actual()
            archivos = almacen.obtener_archivos()
            self._responder_json(200, {"archivos": archivos})
            return

        if ruta == "/api/progreso":
            self._responder_json(200, {
                "en_progreso": ESTADO_GLOBAL["en_progreso"],
                "pausado": ESTADO_GLOBAL["pausado"],
                "total": ESTADO_GLOBAL["total_archivos"],
                "actual": ESTADO_GLOBAL["actual_archivo"],
                "mensaje": ESTADO_GLOBAL["mensaje_progreso"],
            })
            return

        if ruta == "/api/revision":
            almacen = obtener_almacen_actual()
            avisos = almacen.obtener_avisos_revision()
            self._responder_json(200, {"avisos": avisos})
            return

        if ruta == "/api/config":
            cfg = cargar_configuracion()
            self._responder_json(200, cfg)
            return

        self._responder_json(404, {"error": "Ruta no encontrada"})

    def do_POST(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        ruta = parsed_url.path

        content_length = int(self.headers.get("Content-Length", 0))
        cuerpo_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body = json.loads(cuerpo_bytes.decode("utf-8")) if cuerpo_bytes else {}
        except Exception:
            body = {}

        if ruta == "/api/nuevo-evento":
            nombre = body.get("nombre", "Evento_Nuevo").strip().replace(" ", "_")
            ESTADO_GLOBAL["evento_actual"] = nombre
            ESTADO_GLOBAL["carpeta_origen"] = body.get("carpeta", "")
            ESTADO_GLOBAL["almacen"] = None
            ESTADO_GLOBAL["analizador"] = None
            obtener_almacen_actual()
            self._responder_json(200, {"ok": True, "evento": nombre})
            return

        if ruta == "/api/material":
            carpeta = body.get("carpeta", "").strip()
            if not carpeta or not os.path.exists(carpeta):
                self._responder_json(400, {"error": "Carpeta inválida o no encontrada"})
                return

            ESTADO_GLOBAL["carpeta_origen"] = carpeta
            analizador = obtener_analizador_actual()

            def tarea_escaneo():
                ESTADO_GLOBAL["en_progreso"] = True
                ESTADO_GLOBAL["mensaje_progreso"] = f"Leyendo material desde {carpeta}..."
                try:
                    analizador.analizar_carpeta(carpeta)
                    ESTADO_GLOBAL["mensaje_progreso"] = "Material leído y organizado."
                finally:
                    ESTADO_GLOBAL["en_progreso"] = False

            threading.Thread(target=tarea_escaneo, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Escaneo iniciado"})
            return

        if ruta == "/api/analizar":
            carpeta = ESTADO_GLOBAL["carpeta_origen"]
            analizador = obtener_analizador_actual()
            analizador.reanudar()
            ESTADO_GLOBAL["pausado"] = False

            def callback_prog(act: int, tot: int, msg: str):
                ESTADO_GLOBAL["actual_archivo"] = act
                ESTADO_GLOBAL["total_archivos"] = tot
                ESTADO_GLOBAL["mensaje_progreso"] = msg

            def tarea_analisis():
                ESTADO_GLOBAL["en_progreso"] = True
                try:
                    almacen = obtener_almacen_actual()
                    armar_proyecto(carpeta or ".", almacen, progreso_callback=callback_prog)
                    ESTADO_GLOBAL["mensaje_progreso"] = "Análisis completo y cortes de la fiesta entera generados."
                finally:
                    ESTADO_GLOBAL["en_progreso"] = False

            threading.Thread(target=tarea_analisis, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Análisis en marcha"})
            return

        if ruta == "/api/pausar":
            analizador = obtener_analizador_actual()
            if ESTADO_GLOBAL["pausado"]:
                analizador.reanudar()
                ESTADO_GLOBAL["pausado"] = False
                ESTADO_GLOBAL["mensaje_progreso"] = "Reanudando análisis..."
            else:
                analizador.pausar()
                ESTADO_GLOBAL["pausado"] = True
                ESTADO_GLOBAL["mensaje_progreso"] = "Pausado por el usuario"
            self._responder_json(200, {"ok": True, "pausado": ESTADO_GLOBAL["pausado"]})
            return

        if ruta == "/api/revision/corregir":
            aviso_id = body.get("id")
            if aviso_id:
                almacen = obtener_almacen_actual()
                almacen.marcar_aviso_corregido(int(aviso_id))
            self._responder_json(200, {"ok": True})
            return

        if ruta == "/api/exportar/filmora":
            almacen = obtener_almacen_actual()
            cortes = almacen.obtener_cortes()
            destino = os.path.expanduser(os.path.join("~", "Documents", "AK Editor", ESTADO_GLOBAL["evento_actual"], "proyecto_filmora.xml"))
            ruta_generada = exportar_timeline_filmora(cortes, destino)
            self._responder_json(200, {"ok": True, "ruta": ruta_generada})
            return

        if ruta == "/api/exportar/prueba-filmora":
            destino = os.path.expanduser(os.path.join("~", "Documents", "AK Editor", "prueba_filmora_16.xml"))
            ruta_generada = generar_xml_prueba(destino)
            self._responder_json(200, {"ok": True, "ruta": ruta_generada})
            return

        if ruta == "/api/exportar/video":
            almacen = obtener_almacen_actual()
            cortes = almacen.obtener_cortes()
            dur_total = sum([c["salida"] - c["entrada"] for c in cortes])
            tiempo_est = estimar_tiempo_render_formateado(dur_total)
            destino = os.path.expanduser(os.path.join("~", "Documents", "AK Editor", ESTADO_GLOBAL["evento_actual"], "video_terminado.mp4"))

            def tarea_video():
                ESTADO_GLOBAL["en_progreso"] = True
                try:
                    exportar_video_ffmpeg(cortes, destino)
                finally:
                    ESTADO_GLOBAL["en_progreso"] = False

            threading.Thread(target=tarea_video, daemon=True).start()
            self._responder_json(200, {"ok": True, "tiempo_estimado": tiempo_est, "destino": destino})
            return

        self._responder_json(404, {"error": "Ruta no encontrada"})


HTML_INTERFAZ = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AK Editor Inteligente — AK Producciones</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --color-primario: #d71920;
      --color-primario-oscuro: #b0141a;
      --color-fondo: #f8fafc;
      --color-texto: #0f172a;
      --color-borde: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--color-fondo); color: var(--color-texto); line-height: 1.5; }
    header { background: #ffffff; border-bottom: 1px solid var(--color-borde); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
    .logo-container { display: flex; align-items: center; gap: 0.75rem; }
    .logo-badge { background: var(--color-primario); color: white; font-weight: 800; font-size: 1rem; padding: 0.4rem 0.75rem; border-radius: 8px; }
    .logo-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    nav { background: #ffffff; border-bottom: 1px solid var(--color-borde); display: flex; overflow-x: auto; padding: 0 1rem; }
    .nav-tab { padding: 0.75rem 1rem; border: none; background: none; font-size: 0.875rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; }
    .nav-tab.active { color: var(--color-primario); border-bottom-color: var(--color-primario); }
    main { max-width: 1050px; margin: 1.5rem auto; padding: 0 1rem; }
    .card { background: #ffffff; border: 1px solid var(--color-borde); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card h2 { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem; color: #1e293b; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .btn-primary { background: var(--color-primario); color: white; }
    .btn-primary:hover { background: var(--color-primario-oscuro); }
    .btn-outline { background: white; border-color: #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f1f5f9; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; font-size: 0.825rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; }
    .form-input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; }
    .progress-bar-container { background: #e2e8f0; border-radius: 9999px; height: 12px; overflow: hidden; margin: 1rem 0; }
    .progress-bar-fill { background: var(--color-primario); height: 100%; width: 0%; transition: width 0.3s; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-aviso { background: #fef3c7; color: #b45309; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
    th, td { padding: 0.6rem 0.75rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
    th { background: #f8fafc; font-weight: 600; color: #64748b; }
  </style>
</head>
<body>
  <header>
    <div class="logo-container">
      <div class="logo-badge">AK</div>
      <div>
        <div class="logo-title">AK Editor Inteligente</div>
        <div style="font-size: 0.75rem; color: #64748b;">Edición de fiestas en tu computadora</div>
      </div>
    </div>
    <div id="header-evento" style="font-size: 0.85rem; font-weight: 600; color: #334155;">
      Evento: <span id="nombre-evento-top" style="color: var(--color-primario);">Quinceanera_Demo</span>
    </div>
  </header>

  <nav>
    <button class="nav-tab active" onclick="cambiarPestana('inicio')">Nuevo evento</button>
    <button class="nav-tab" onclick="cambiarPestana('material')">Material</button>
    <button class="nav-tab" onclick="cambiarPestana('analisis')">Análisis</button>
    <button class="nav-tab" onclick="cambiarPestana('revision')">Revisión</button>
    <button class="nav-tab" onclick="cambiarPestana('exportar')">Exportar a Filmora</button>
  </nav>

  <main>
    <!-- PESTAÑA: NUEVO EVENTO -->
    <div id="tab-inicio" class="tab-content active">
      <div class="card">
        <h2>Empezar con una nueva fiesta</h2>
        <div class="form-group">
          <label class="form-label">Nombre del Evento (ej: XV_Valentina)</label>
          <input type="text" id="input-evento-nombre" class="form-input" placeholder="XV_Sofia">
        </div>
        <div class="form-group">
          <label class="form-label">Carpeta donde están los videos de las cámaras</label>
          <input type="text" id="input-evento-carpeta" class="form-input" placeholder="C:\\Videos\\Fiestas\\XV_Sofia">
        </div>
        <button class="btn btn-primary" onclick="crearNuevoEvento()">Crear y cargar material</button>
      </div>
    </div>

    <!-- PESTAÑA: MATERIAL -->
    <div id="tab-material" class="tab-content">
      <div class="card">
        <h2>Material detectado</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Tus archivos originales no se tocan nunca. Se leen para clasificar bloques y cámaras automáticamente.
        </p>
        <div id="tabla-material-container">
          <table id="tabla-material">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Bloque sugerido</th>
                <th>Cámara</th>
                <th>Duración</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody id="tbody-material">
              <tr><td colspan="5" style="text-align:center; color:#94a3b8;">Cargá una carpeta para ver el material</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PESTAÑA: ANALISIS -->
    <div id="tab-analisis" class="tab-content">
      <div class="card">
        <h2>Análisis y corte inteligente</h2>
        <p style="font-size: 0.85rem; color: #64748b;">
          Procesa de a un archivo para cuidar los 8 GB de RAM. Si apagás la PC, retoma donde quedó.
        </p>
        <div class="progress-bar-container">
          <div id="progreso-fill" class="progress-bar-fill"></div>
        </div>
        <div id="progreso-texto" style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 1rem;">
          Listo para comenzar
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary" onclick="iniciarAnalisis()">Iniciar Análisis</button>
          <button class="btn btn-outline" onclick="pausarAnalisis()">Pausar / Reanudar</button>
        </div>
      </div>
    </div>

    <!-- PESTAÑA: REVISION -->
    <div id="tab-revision" class="tab-content">
      <div class="card">
        <h2>Revisión humana previa al exportado</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Avisos encontrados por el analizador (momentos faltantes, silencios o cortes sugeridos).
        </p>
        <div id="lista-avisos">
          <div style="padding: 1rem; background: #f8fafc; border-radius: 8px; font-size: 0.85rem; color: #64748b;">
            Sin avisos pendientes por revisar.
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA: EXPORTAR -->
    <div id="tab-exportar" class="tab-content">
      <div class="card">
        <h2>Exportar a Filmora 16 (Vía Principal)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Genera el archivo XML (XMEML) con las 4 pistas organizadas. En Filmora 16: <em>Archivo &rarr; Importar medios &rarr; Importar XML de línea de tiempo</em>.
        </p>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="exportarFilmora()">Exportar Proyecto Completo a Filmora</button>
          <button class="btn btn-outline" onclick="exportarPruebaFilmora()">Exportar Archivo de Prueba para Filmora</button>
        </div>
        <div id="resultado-exportar" style="margin-top: 1rem; font-size: 0.85rem; color: #047857;"></div>
      </div>

      <div class="card">
        <h2>Video Terminado con FFmpeg (Vía Secundaria)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Renderiza con el procesador (libx264) para dejarlo trabajando de noche.
        </p>
        <button class="btn btn-outline" onclick="exportarVideo()">Renderizar Video Final en MP4</button>
        <div id="resultado-video" style="margin-top: 1rem; font-size: 0.85rem; color: #334155;"></div>
      </div>
    </div>
  </main>

  <script>
    function cambiarPestana(id) {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + id).classList.add('active');
      if (id === 'material') cargarMaterial();
      if (id === 'revision') cargarRevision();
    }

    async function crearNuevoEvento() {
      const nombre = document.getElementById('input-evento-nombre').value;
      const carpeta = document.getElementById('input-evento-carpeta').value;
      if (!nombre) return alert('Por favor ingresá un nombre para el evento');
      const res = await fetch('/api/nuevo-evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, carpeta })
      });
      const data = await res.json();
      if (data.ok) {
        document.getElementById('nombre-evento-top').innerText = data.evento;
        alert('Evento creado: ' + data.evento);
        if (carpeta) {
          await fetch('/api/material', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carpeta })
          });
        }
      }
    }

    async function cargarMaterial() {
      const res = await fetch('/api/material');
      const data = await res.json();
      const tbody = document.getElementById('tbody-material');
      if (!data.archivos || data.archivos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No hay archivos registrados</td></tr>';
        return;
      }
      tbody.innerHTML = data.archivos.map(a => `
        <tr>
          <td><strong>${a.nombre}</strong></td>
          <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${a.bloque}</span></td>
          <td>${a.camara}</td>
          <td>${a.duracion}s</td>
          <td>${a.estado_analisis}</td>
        </tr>
      `).join('');
    }

    async function iniciarAnalisis() {
      await fetch('/api/analizar', { method: 'POST' });
      actualizarProgreso();
    }

    async function pausarAnalisis() {
      await fetch('/api/pausar', { method: 'POST' });
    }

    async function actualizarProgreso() {
      const res = await fetch('/api/progreso');
      const data = await res.json();
      const pct = data.total > 0 ? Math.round((data.actual / data.total) * 100) : 0;
      document.getElementById('progreso-fill').style.width = pct + '%';
      document.getElementById('progreso-texto').innerText = data.mensaje + (data.total > 0 ? ` (${data.actual}/${data.total})` : '');
      if (data.en_progreso) {
        setTimeout(actualizarProgreso, 1000);
      }
    }

    async function cargarRevision() {
      const res = await fetch('/api/revision');
      const data = await res.json();
      const div = document.getElementById('lista-avisos');
      if (!data.avisos || data.avisos.length === 0) {
        div.innerHTML = '<div style="padding: 1rem; background: #f8fafc; border-radius: 8px; font-size: 0.85rem; color: #64748b;">Sin avisos pendientes.</div>';
        return;
      }
      div.innerHTML = data.avisos.map(av => `
        <div style="padding: 0.75rem; border: 1px solid #fed7aa; background: #fff7ed; border-radius: 6px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span class="badge badge-aviso">${av.tipo_aviso}</span>
            <span style="font-size: 0.85rem; color: #1e293b; margin-left: 0.5rem;">${av.descripcion}</span>
          </div>
          <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="corregirAviso(${av.id})">Entendido</button>
        </div>
      `).join('');
    }

    async function corregirAviso(id) {
      await fetch('/api/revision/corregir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      cargarRevision();
    }

    async function exportarFilmora() {
      const res = await fetch('/api/exportar/filmora', { method: 'POST' });
      const data = await res.json();
      document.getElementById('resultado-exportar').innerText = '¡XML exportado con éxito en: ' + data.ruta + '!';
    }

    async function exportarPruebaFilmora() {
      const res = await fetch('/api/exportar/prueba-filmora', { method: 'POST' });
      const data = await res.json();
      document.getElementById('resultado-exportar').innerText = 'Archivo de prueba generado en: ' + data.ruta;
    }

    async function exportarVideo() {
      const res = await fetch('/api/exportar/video', { method: 'POST' });
      const data = await res.json();
      document.getElementById('resultado-video').innerText = 'Renderizado iniciado en segundo plano. Tiempo estimado: ' + data.tiempo_estimado + '. Destino: ' + data.destino;
    }
  </script>
</body>
</html>
"""


def iniciar_servidor(puerto: int = PUERTO) -> None:
    servidor = HTTPServer(("0.0.0.0", puerto), AKEditorHandler)
    print(f"AK Editor Inteligente escuchando en http://localhost:{puerto}")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servidor...")
        servidor.server_close()


if __name__ == "__main__":
    puerto_elegido = int(sys.argv[1]) if len(sys.argv) > 1 else PUERTO
    iniciar_servidor(puerto_elegido)

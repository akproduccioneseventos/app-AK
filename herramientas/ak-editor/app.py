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
import redes
import wfolio
import glob
from fotos import aprender_mi_estilo, procesar_seleccion_fotos

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

# Estado global para el módulo de Fotos (Orden 280)
ESTADO_FOTOS = {
    "carpeta": "",
    "en_progreso": False,
    "total": 0,
    "elegidas": 0,
    "rechazadas": 0,
    "detalles": [],
    "mensaje": "Listo para elegir fotos",
    "estilo_aprendido": None,
}

# Estado global para Video de Vida (Orden 288)
ESTADO_VIDA = {
    "en_progreso": False,
    "mensaje": "Listo para generar Video de Vida",
    "total": 0,
    "actual": 0,
    "ruta_salida": "",
}

# Estado global para Redes (Orden 288)
ESTADO_REDES = {
    "en_progreso": False,
    "mensaje": "Listo para generar videos para redes",
    "videos": [],
    "carpeta": "",
}

# Estado global para Wfolio (Orden 288)
ESTADO_WFOLIO = {
    "en_progreso": False,
    "mensaje": "Listo para sincronizar con Wfolio",
    "resumen": None,
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

        if ruta == "/api/fotos/estado":
            self._responder_json(200, ESTADO_FOTOS)
            return

        if ruta == "/api/vida/estado":
            self._responder_json(200, ESTADO_VIDA)
            return

        if ruta == "/api/redes/estado":
            self._responder_json(200, ESTADO_REDES)
            return

        if ruta == "/api/wfolio/estado":
            self._responder_json(200, ESTADO_WFOLIO)
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

        if ruta == "/api/fotos/procesar":
            carpeta = body.get("carpeta", "").strip()
            if not carpeta or not os.path.exists(carpeta):
                self._responder_json(400, {"error": "Carpeta inválida o no encontrada"})
                return

            ESTADO_FOTOS["carpeta"] = carpeta
            ESTADO_FOTOS["en_progreso"] = True
            ESTADO_FOTOS["mensaje"] = f"Buscando fotos en {carpeta}..."

            def tarea_fotos():
                try:
                    extensiones = ("*.nef", "*.NEF", "*.jpg", "*.JPG", "*.jpeg", "*.JPEG", "*.png", "*.PNG", "*.cr2", "*.CR2", "*.arw", "*.ARW", "*.dng", "*.DNG")
                    rutas = []
                    for ext in extensiones:
                        rutas.extend(glob.glob(os.path.join(carpeta, ext)))
                    rutas = sorted(list(set(rutas)))

                    if not rutas:
                        ESTADO_FOTOS["mensaje"] = "No se encontraron fotos en la carpeta."
                        ESTADO_FOTOS["total"] = 0
                        ESTADO_FOTOS["elegidas"] = 0
                        ESTADO_FOTOS["rechazadas"] = 0
                        ESTADO_FOTOS["detalles"] = []
                        return

                    ESTADO_FOTOS["total"] = len(rutas)

                    def prog_cb(act, tot, msg):
                        ESTADO_FOTOS["mensaje"] = f"Procesando {act}/{tot}: {msg}"

                    res = procesar_seleccion_fotos(rutas, progreso_callback=prog_cb)
                    ESTADO_FOTOS["elegidas"] = res["elegidas"]
                    ESTADO_FOTOS["rechazadas"] = res["rechazadas"]
                    ESTADO_FOTOS["detalles"] = res["detalles"]
                    ESTADO_FOTOS["mensaje"] = f"Selección completa: {res['elegidas']} elegidas, {res['rechazadas']} rechazadas."
                except Exception as e:
                    ESTADO_FOTOS["mensaje"] = f"Error al procesar fotos: {str(e)}"
                finally:
                    ESTADO_FOTOS["en_progreso"] = False

            threading.Thread(target=tarea_fotos, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Procesamiento de fotos iniciado"})
            return

        if ruta == "/api/fotos/aprender-estilo":
            lrcat = body.get("lrcat", "").strip() or None
            fotos_editadas = body.get("fotos_editadas", "").strip() or None
            salida = body.get("salida", "").strip() or None

            try:
                res = aprender_mi_estilo(ruta_lrcat=lrcat, ruta_fotos_editadas=fotos_editadas, carpeta_salida=salida)
                ESTADO_FOTOS["estilo_aprendido"] = res
                self._responder_json(200, {"ok": True, "resultado": res})
            except Exception as e:
                self._responder_json(500, {"error": str(e)})
            return

        if ruta == "/api/vida/generar":
            carpeta = body.get("carpeta", "").strip()
            if not carpeta or not os.path.exists(carpeta):
                self._responder_json(400, {"error": "Carpeta inválida o no encontrada"})
                return

            modo = body.get("modo", "xv").strip()
            plantilla = body.get("plantilla", "clasica-dorada").strip()
            audio = body.get("audio", "").strip() or None

            def tarea_vida():
                ESTADO_VIDA["en_progreso"] = True
                ESTADO_VIDA["mensaje"] = "Leyendo y clasificando fotos para Video de Vida..."
                try:
                    cargadas = video_de_vida.cargar_fotos(carpeta, modo=modo)
                    fotos = cargadas.get("fotos", [])
                    if not fotos:
                        ESTADO_VIDA["mensaje"] = "No se encontraron fotos en la carpeta seleccionada."
                        return

                    ESTADO_VIDA["total"] = len(fotos)
                    ESTADO_VIDA["mensaje"] = f"Ordenando {len(fotos)} fotos cronológicamente..."
                    ordenadas = video_de_vida.ordenar_fotos_vida(fotos)

                    destino_dir = os.path.expanduser(
                        os.path.join("~", "Documents", "AK Editor", ESTADO_GLOBAL["evento_actual"])
                    )
                    os.makedirs(destino_dir, exist_ok=True)
                    salida_mp4 = os.path.join(destino_dir, "video_de_vida.mp4")

                    def cb_prog(act, tot, msg):
                        ESTADO_VIDA["actual"] = act
                        ESTADO_VIDA["total"] = tot
                        ESTADO_VIDA["mensaje"] = f"Video de Vida ({act}/{tot}): {msg}"

                    res_mp4 = video_de_vida.exportar_video_de_vida(
                        ordenadas,
                        salida_mp4,
                        ruta_audio=audio,
                        plantilla_id=plantilla,
                        progreso_callback=cb_prog,
                    )
                    ESTADO_VIDA["ruta_salida"] = res_mp4
                    ESTADO_VIDA["mensaje"] = f"¡Video de Vida generado con éxito! Destino: {res_mp4}"
                except Exception as e:
                    ESTADO_VIDA["mensaje"] = f"Error al generar Video de Vida: {str(e)}"
                finally:
                    ESTADO_VIDA["en_progreso"] = False

            threading.Thread(target=tarea_vida, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Generación de Video de Vida iniciada"})
            return

        if ruta == "/api/redes/generar":
            origen = body.get("origen", "").strip()
            if not origen or not os.path.exists(origen):
                self._responder_json(400, {"error": "Carpeta de origen inválida o no encontrada"})
                return

            destino = body.get("destino", "").strip()
            if not destino:
                destino = os.path.expanduser(
                    os.path.join("~", "Documents", "AK Editor", ESTADO_GLOBAL["evento_actual"], "redes")
                )

            musica = body.get("musica", "").strip() or None

            def tarea_redes():
                ESTADO_REDES["en_progreso"] = True
                ESTADO_REDES["carpeta"] = destino
                ESTADO_REDES["mensaje"] = "Generando videos en los 3 formatos para redes..."
                try:
                    def cb_prog(act, tot, msg):
                        ESTADO_REDES["mensaje"] = f"Redes ({act}/{tot}): {msg}"

                    res = redes.generar_videos_redes(
                        origen=origen,
                        carpeta_destino=destino,
                        ruta_musica=musica,
                        progreso_callback=cb_prog,
                    )
                    ESTADO_REDES["videos"] = res.get("videos", [])
                    ESTADO_REDES["mensaje"] = (
                        f"¡Videos de redes listos! Se generaron {len(res.get('videos', []))} videos en {destino}."
                    )
                except Exception as e:
                    ESTADO_REDES["mensaje"] = f"Error al generar videos para redes: {str(e)}"
                finally:
                    ESTADO_REDES["en_progreso"] = False

            threading.Thread(target=tarea_redes, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Generación de videos para redes iniciada"})
            return

        if ruta == "/api/wfolio/subir":
            carpeta = body.get("carpeta", "").strip()
            if not carpeta or not os.path.exists(carpeta):
                self._responder_json(400, {"error": "Carpeta inválida o no encontrada"})
                return

            fiesta = body.get("fiesta", ESTADO_GLOBAL["evento_actual"]).strip()

            def tarea_wfolio():
                ESTADO_WFOLIO["en_progreso"] = True
                ESTADO_WFOLIO["mensaje"] = f"Iniciando subida y comprobación en Wfolio para {fiesta}..."
                try:
                    resumen = wfolio.subir_a_wfolio(
                        ruta_carpetas=carpeta,
                        fiesta_nombre=fiesta,
                    )
                    ESTADO_WFOLIO["resumen"] = resumen
                    ESTADO_WFOLIO["mensaje"] = resumen.get("mensaje", "Sincronización finalizada")
                except Exception as e:
                    ESTADO_WFOLIO["mensaje"] = f"Error al sincronizar con Wfolio: {str(e)}"
                finally:
                    ESTADO_WFOLIO["en_progreso"] = False

            threading.Thread(target=tarea_wfolio, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Subida a Wfolio iniciada"})
            return

        if ruta == "/api/wfolio/login":
            threading.Thread(target=wfolio.abrir_navegador_para_login, daemon=True).start()
            self._responder_json(200, {"ok": True, "mensaje": "Navegador abierto para iniciar sesión en Wfolio"})
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
    <button class="nav-tab" onclick="cambiarPestana('fotos')">Fotos</button>
    <button class="nav-tab" onclick="cambiarPestana('vida')">Video de Vida</button>
    <button class="nav-tab" onclick="cambiarPestana('redes')">Redes</button>
    <button class="nav-tab" onclick="cambiarPestana('wfolio')">Wfolio</button>
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

    <!-- PESTAÑA: FOTOS -->
    <div id="tab-fotos" class="tab-content">
      <div class="card">
        <h2>Elegir y enderezar fotos (Orden 280)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Descarta automáticamente fotos borrosas, repetidas, oscuras o con ojos cerrados. Endereza y recorta en 3:2 respetando caras.
          <strong>Tus archivos originales (NEF/JPG) no se tocan ni se borran nunca.</strong>
        </p>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem; font-size: 0.825rem; color: #1e40af;">
          <strong>Aviso para Lightroom Classic:</strong> Si las fotos ya estaban importadas en Lightroom, elegí todas &rarr; <em>Metadatos &rarr; Leer metadatos de los archivos</em>. Lo ideal es correr este proceso antes de importar.
        </div>

        <div class="form-group">
          <label class="form-label">Carpeta donde están las fotos (NEF crudos o JPG)</label>
          <input type="text" id="input-fotos-carpeta" class="form-input" placeholder="C:\\Fotos\\Quince_Sofia\\Crudos">
        </div>

        <button class="btn btn-primary" onclick="procesarFotos()">Elegir fotos y enderezar</button>

        <div id="progreso-fotos-texto" style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-top: 1rem;">
          Listo para comenzar
        </div>

        <!-- Resumen de resultados -->
        <div id="resumen-fotos" style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <div style="background: #f1f5f9; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 140px;">
            <div style="font-size: 0.75rem; color: #64748b;">Total Analizadas</div>
            <div id="stat-fotos-total" style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">0</div>
          </div>
          <div style="background: #ecfdf5; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 140px;">
            <div style="font-size: 0.75rem; color: #047857;">Elegidas (Rating 5)</div>
            <div id="stat-fotos-elegidas" style="font-size: 1.5rem; font-weight: 700; color: #059669;">0</div>
          </div>
          <div style="background: #fef2f2; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 140px;">
            <div style="font-size: 0.75rem; color: #b91c1c;">Rechazadas (Rating 0)</div>
            <div id="stat-fotos-rechazadas" style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">0</div>
          </div>
        </div>

        <!-- Guía de 3 pasos para retoque en Lightroom -->
        <div style="margin-top: 1.5rem; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 1rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; color: #292524;">Retoque de piel y pelo en Lightroom Classic (Guía en 3 pasos)</h3>
          <ol style="font-size: 0.85rem; color: #57534e; padding-left: 1.25rem; line-height: 1.6;">
            <li>En la biblioteca de Lightroom, filtrá por la palabra clave <strong>"con personas"</strong>.</li>
            <li>Seleccioná todas las fotos filtradas (<code>Ctrl + A</code>).</li>
            <li>Aplicá tu preset de retoque (que tiene la máscara de Personas de Lightroom Classic) para dejar piel, ojos y dientes impecables.</li>
          </ol>
        </div>

        <!-- Tabla de fotos analizadas -->
        <div id="tabla-fotos-container" style="margin-top: 1.5rem;">
          <table id="tabla-fotos">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Motivo / Razón</th>
                <th>Personas</th>
                <th>Enderezado</th>
              </tr>
            </thead>
            <tbody id="tbody-fotos">
              <tr><td colspan="5" style="text-align:center; color:#94a3b8;">Cargá una carpeta para procesar fotos</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Card: Aprender mi estilo -->
      <div class="card">
        <h2>Aprender mi estilo (Bloque 3)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Analiza tus fotos editadas previas o tu catálogo .lrcat de Lightroom Classic para generar tus presets .xmp personalizados (AK Salón noche, AK Exterior día, AK Torta y velas) y el archivo estilo-ak.json.
        </p>

        <div class="form-group">
          <label class="form-label">Ruta al catálogo de Lightroom (.lrcat)</label>
          <input type="text" id="input-estilo-lrcat" class="form-input" placeholder="C:\\Fotos\\Lightroom\\Catalogo_AK.lrcat">
        </div>

        <div class="form-group">
          <label class="form-label">Carpeta con fotos ya editadas (JPG opcional)</label>
          <input type="text" id="input-estilo-jpgs" class="form-input" placeholder="C:\\Fotos\\Editadas_Exportadas">
        </div>

        <button class="btn btn-outline" onclick="aprenderEstiloFotos()">Aprender mi estilo y armar presets</button>
        <div id="resultado-aprender-estilo" style="margin-top: 1rem; font-size: 0.85rem; color: #047857;"></div>
      </div>
    </div>

    <!-- PESTAÑA: VIDEO DE VIDA -->
    <div id="tab-vida" class="tab-content">
      <div class="card">
        <h2>Video de Vida Inteligente (Orden 273 / 288)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Crea el video cronológico de la homenajeada (300+ fotos sin límite). Encuadre inteligente que <strong>nunca corta caras</strong>, fondo desenfocado 16:9 sin franjas negras, sincronización a los golpes de la música y modo Boda con pantalla partida paralela.
        </p>

        <div class="form-group">
          <label class="form-label">Carpeta donde están las fotos</label>
          <input type="text" id="input-vida-carpeta" class="form-input" placeholder="C:\\Fotos\\Quince_Sofia\\Vida">
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">Modo de Evento</label>
            <select id="select-vida-modo" class="form-input">
              <option value="xv">15 Años (Línea cronológica)</option>
              <option value="boda">Boda (Pantalla partida / Paralelo novio y novia)</option>
            </select>
          </div>

          <div class="form-group" style="flex: 1; min-width: 200px;">
            <label class="form-label">Plantilla Visual</label>
            <select id="select-vida-plantilla" class="form-input">
              <option value="clasica-dorada">Clásica Dorada (Elegante)</option>
              <option value="moderna-minimalista">Moderna Minimalista</option>
              <option value="romantica-floral">Romántica Floral</option>
              <option value="neon-fiesta">Neón Fiesta</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Archivo de música / audio (opcional, para ritmo automático)</label>
          <input type="text" id="input-vida-audio" class="form-input" placeholder="C:\\Musica\\tema_vida.mp3">
        </div>

        <button class="btn btn-primary" onclick="generarVideoVida()">Generar Video de Vida en MP4</button>

        <div class="progress-bar-container" style="margin-top: 1rem;">
          <div id="progreso-vida-fill" class="progress-bar-fill"></div>
        </div>
        <div id="progreso-vida-texto" style="font-size: 0.85rem; font-weight: 600; color: #334155;">
          Listo para comenzar
        </div>
        <div id="resultado-vida" style="margin-top: 0.75rem; font-size: 0.85rem; color: #047857; font-weight: 600;"></div>
      </div>
    </div>

    <!-- PESTAÑA: REDES -->
    <div id="tab-redes" class="tab-content">
      <div class="card">
        <h2>Videos para Redes Sociales (Orden 275 / 288)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Genera automáticamente los 3 formatos exactos para cada estación y para la noche completa:
          <strong>Reel 9:16 (1080×1920)</strong>, <strong>Cuadrado 1:1 (1080×1080)</strong> y <strong>Vertical 4:5 (1080×1350)</strong> con placa de cierre de AK Producciones.
        </p>

        <div class="form-group">
          <label class="form-label">Carpeta con fotos o estaciones de la fiesta</label>
          <input type="text" id="input-redes-origen" class="form-input" placeholder="C:\\Fotos\\Quince_Sofia\\Estaciones">
        </div>

        <div class="form-group">
          <label class="form-label">Carpeta de destino (opcional)</label>
          <input type="text" id="input-redes-destino" class="form-input" placeholder="C:\\Fotos\\Quince_Sofia\\Videos_Redes">
        </div>

        <div class="form-group">
          <label class="form-label">Pista de música (opcional)</label>
          <input type="text" id="input-redes-musica" class="form-input" placeholder="C:\\Musica\\cancion_redes.mp3">
        </div>

        <button class="btn btn-primary" onclick="generarVideosRedes()">Generar Videos en los 3 Formatos</button>

        <div id="progreso-redes-texto" style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-top: 1rem;">
          Listo para comenzar
        </div>

        <div id="lista-redes-container" style="margin-top: 1rem;">
          <table id="tabla-redes">
            <thead>
              <tr>
                <th>Estación</th>
                <th>Formato</th>
                <th>Archivo</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody id="tbody-redes">
              <tr><td colspan="4" style="text-align:center; color:#94a3b8;">No hay videos generados aún</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PESTAÑA: WFOLIO -->
    <div id="tab-wfolio" class="tab-content">
      <div class="card">
        <h2>Sincronización con Wfolio Disk (Orden 281 / 288)</h2>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
          Sube tus fotos organizadas en carpetas al disco privado de Wfolio.
          <strong>Verificación estricta:</strong> sólo se marca 'subido' tras comprobar la presencia del archivo remoto (nombre y tamaño). Si no se puede comprobar, queda 'pendiente' con el motivo para reanudar donde quedó.
        </p>

        <div class="form-group">
          <label class="form-label">Nombre del Evento / Álbum en Wfolio</label>
          <input type="text" id="input-wfolio-fiesta" class="form-input" placeholder="XV_Sofia">
        </div>

        <div class="form-group">
          <label class="form-label">Carpeta con fotos organizadas por entrega</label>
          <input type="text" id="input-wfolio-carpeta" class="form-input" placeholder="C:\\Fotos\\Quince_Sofia\\Entrega">
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="subirWfolio()">Subir a Wfolio (con verificación)</button>
          <button class="btn btn-outline" onclick="loginWfolio()">Iniciar sesión en Wfolio</button>
        </div>

        <div id="progreso-wfolio-texto" style="font-size: 0.85rem; font-weight: 600; color: #334155; margin-top: 1rem;">
          Listo para sincronizar
        </div>

        <div id="resumen-wfolio" style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <div style="background: #f1f5f9; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 130px;">
            <div style="font-size: 0.75rem; color: #64748b;">Total Fotos</div>
            <div id="stat-wfolio-total" style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">0</div>
          </div>
          <div style="background: #ecfdf5; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 130px;">
            <div style="font-size: 0.75rem; color: #047857;">Comprobadas / Subidas</div>
            <div id="stat-wfolio-subidas" style="font-size: 1.5rem; font-weight: 700; color: #059669;">0</div>
          </div>
          <div style="background: #fffbeb; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 130px;">
            <div style="font-size: 0.75rem; color: #b45309;">Pendientes</div>
            <div id="stat-wfolio-pendientes" style="font-size: 1.5rem; font-weight: 700; color: #d97706;">0</div>
          </div>
          <div style="background: #fef2f2; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; min-width: 130px;">
            <div style="font-size: 0.75rem; color: #b91c1c;">Fallidas</div>
            <div id="stat-wfolio-fallidas" style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">0</div>
          </div>
        </div>

        <div id="enlace-wfolio-box" style="margin-top: 1rem; display: none; padding: 0.75rem 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 0.85rem;">
          <strong>Enlace privado del álbum:</strong> <a id="enlace-wfolio-link" href="#" target="_blank" style="color: var(--color-primario); font-weight: 600; text-decoration: underline;"></a>
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
      if (id === 'fotos') cargarFotos();
      if (id === 'vida') cargarVida();
      if (id === 'redes') cargarRedes();
      if (id === 'wfolio') cargarWfolio();
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

    async function procesarFotos() {
      const carpeta = document.getElementById('input-fotos-carpeta').value.trim();
      if (!carpeta) return alert('Por favor ingresá la carpeta con las fotos');
      document.getElementById('progreso-fotos-texto').innerText = 'Iniciando procesamiento de fotos...';
      const res = await fetch('/api/fotos/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carpeta })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Error al iniciar fotos');
      actualizarProgresoFotos();
    }

    async function actualizarProgresoFotos() {
      const res = await fetch('/api/fotos/estado');
      const data = await res.json();
      document.getElementById('progreso-fotos-texto').innerText = data.mensaje;
      document.getElementById('stat-fotos-total').innerText = data.total;
      document.getElementById('stat-fotos-elegidas').innerText = data.elegidas;
      document.getElementById('stat-fotos-rechazadas').innerText = data.rechazadas;

      if (data.detalles && data.detalles.length > 0) {
        const tbody = document.getElementById('tbody-fotos');
        tbody.innerHTML = data.detalles.map(f => `
          <tr>
            <td><strong>${f.nombre}</strong></td>
            <td>
              <span class="badge" style="background:${f.estado === 'elegida' ? '#dcfce7' : '#fee2e2'}; color:${f.estado === 'elegida' ? '#15803d' : '#b91c1c'};">
                ${f.estado === 'elegida' ? '★ Elegida (5)' : 'Rechazada'}
              </span>
            </td>
            <td>${f.motivo_rechazo || 'Excelente nitidez y exposición'}</td>
            <td>${f.tiene_personas ? 'Con personas' : 'Sin personas'}</td>
            <td>${f.crop_angle ? f.crop_angle + '°' : 'No requirió'}</td>
          </tr>
        `).join('');
      }

      if (data.en_progreso) {
        setTimeout(actualizarProgresoFotos, 1000);
      }
    }

    async function cargarFotos() {
      actualizarProgresoFotos();
    }

    async function aprenderEstiloFotos() {
      const lrcat = document.getElementById('input-estilo-lrcat').value.trim();
      const fotos_editadas = document.getElementById('input-estilo-jpgs').value.trim();
      if (!lrcat && !fotos_editadas) {
        return alert('Por favor ingresá la ruta al catálogo .lrcat o la carpeta de JPGs editados');
      }
      document.getElementById('resultado-aprender-estilo').innerText = 'Analizando ajustes y aprendiendo estilo...';
      const res = await fetch('/api/fotos/aprender-estilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lrcat, fotos_editadas })
      });
      const data = await res.json();
      if (!res.ok) {
        document.getElementById('resultado-aprender-estilo').innerText = 'Error: ' + (data.error || 'desconocido');
        return;
      }
      const p = data.resultado.presets || {};
      const nombres = Object.keys(p);
      if (nombres.length === 0) {
        document.getElementById('resultado-aprender-estilo').innerText = 'El catálogo está vacío o no contiene fotos editadas. No se generaron presets.';
      } else {
        document.getElementById('resultado-aprender-estilo').innerText = '¡Estilo aprendido! Presets generados: ' + nombres.join(', ') + ' y archivo estilo-ak.json.';
      }
    }

    // Video de Vida
    async function generarVideoVida() {
      const carpeta = document.getElementById('input-vida-carpeta').value.trim();
      if (!carpeta) return alert('Por favor ingresá la carpeta con las fotos para el Video de Vida');
      const modo = document.getElementById('select-vida-modo').value;
      const plantilla = document.getElementById('select-vida-plantilla').value;
      const audio = document.getElementById('input-vida-audio').value.trim();

      document.getElementById('progreso-vida-texto').innerText = 'Iniciando generación de Video de Vida...';
      document.getElementById('resultado-vida').innerText = '';

      const res = await fetch('/api/vida/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carpeta, modo, plantilla, audio })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Error al iniciar Video de Vida');
      actualizarProgresoVida();
    }

    async function actualizarProgresoVida() {
      const res = await fetch('/api/vida/estado');
      const data = await res.json();
      const pct = data.total > 0 ? Math.round((data.actual / data.total) * 100) : 0;
      document.getElementById('progreso-vida-fill').style.width = pct + '%';
      document.getElementById('progreso-vida-texto').innerText = data.mensaje;
      if (data.ruta_salida) {
        document.getElementById('resultado-vida').innerText = 'Video listo: ' + data.ruta_salida;
      }
      if (data.en_progreso) {
        setTimeout(actualizarProgresoVida, 1000);
      }
    }

    async function cargarVida() {
      actualizarProgresoVida();
    }

    // Redes Sociales
    async function generarVideosRedes() {
      const origen = document.getElementById('input-redes-origen').value.trim();
      if (!origen) return alert('Por favor ingresá la carpeta de origen con las fotos/estaciones');
      const destino = document.getElementById('input-redes-destino').value.trim();
      const musica = document.getElementById('input-redes-musica').value.trim();

      document.getElementById('progreso-redes-texto').innerText = 'Iniciando generación de videos para redes...';

      const res = await fetch('/api/redes/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origen, destino, musica })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Error al iniciar videos de redes');
      actualizarProgresoRedes();
    }

    async function actualizarProgresoRedes() {
      const res = await fetch('/api/redes/estado');
      const data = await res.json();
      document.getElementById('progreso-redes-texto').innerText = data.mensaje;

      if (data.videos && data.videos.length > 0) {
        const tbody = document.getElementById('tbody-redes');
        tbody.innerHTML = data.videos.map(v => `
          <tr>
            <td><strong>${v.estacion}</strong></td>
            <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${v.formato}</span></td>
            <td>${v.archivo}</td>
            <td>${v.duracion}s</td>
          </tr>
        `).join('');
      }

      if (data.en_progreso) {
        setTimeout(actualizarProgresoRedes, 1000);
      }
    }

    async function cargarRedes() {
      actualizarProgresoRedes();
    }

    // Wfolio Disk
    async function subirWfolio() {
      const carpeta = document.getElementById('input-wfolio-carpeta').value.trim();
      const fiesta = document.getElementById('input-wfolio-fiesta').value.trim();
      if (!carpeta) return alert('Por favor ingresá la carpeta con las fotos a subir');

      document.getElementById('progreso-wfolio-texto').innerText = 'Iniciando subida y verificación en Wfolio...';

      const res = await fetch('/api/wfolio/subir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carpeta, fiesta })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Error al iniciar subida a Wfolio');
      actualizarProgresoWfolio();
    }

    async function loginWfolio() {
      const res = await fetch('/api/wfolio/login', { method: 'POST' });
      const data = await res.json();
      alert(data.mensaje || 'Navegador iniciado para iniciar sesión');
    }

    async function actualizarProgresoWfolio() {
      const res = await fetch('/api/wfolio/estado');
      const data = await res.json();
      document.getElementById('progreso-wfolio-texto').innerText = data.mensaje;

      if (data.resumen) {
        const r = data.resumen;
        document.getElementById('stat-wfolio-total').innerText = r.total_fotos || 0;
        document.getElementById('stat-wfolio-subidas').innerText = r.total_subidas || 0;
        document.getElementById('stat-wfolio-pendientes').innerText = r.total_pendientes || 0;
        document.getElementById('stat-wfolio-fallidas').innerText = r.total_fallidas || 0;

        if (r.enlace_privado) {
          const box = document.getElementById('enlace-wfolio-box');
          const link = document.getElementById('enlace-wfolio-link');
          box.style.display = 'block';
          link.href = r.enlace_privado;
          link.innerText = r.enlace_privado;
        }
      }

      if (data.en_progreso) {
        setTimeout(actualizarProgresoWfolio, 1000);
      }
    }

    async function cargarWfolio() {
      actualizarProgresoWfolio();
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


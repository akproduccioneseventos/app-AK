# -*- coding: utf-8 -*-
"""Pruebas de regresión Orden 336 Bloque 5 (AK Editor)."""

import os
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

import app as ak_app
import exportador_filmora
import fotos
import video_de_vida
import wfolio


def test_app_usa_threading_http_server_y_existe_login_wfolio():
    assert callable(getattr(wfolio, "abrir_navegador_para_login", None))
    assert ak_app.ThreadingHTTPServer.__name__ == "ThreadingHTTPServer"


def test_fotos_aprende_estilo_con_ruta_unicode_windows():
    with tempfile.TemporaryDirectory() as tmp:
        carpeta_unicode = os.path.join(tmp, "Salón_Niña_Cumpleaños_Año")
        os.makedirs(carpeta_unicode, exist_ok=True)
        foto_path = os.path.join(carpeta_unicode, "foto_salón_01.jpg")
        img = np.zeros((240, 300, 3), dtype=np.uint8)
        img[:80, :, :] = (25, 25, 25)      # sombras (L < 85)
        img[80:160, :, :] = (125, 130, 135)  # medios (85 <= L <= 170)
        img[160:, :, :] = (240, 240, 240)  # altas (L > 170)
        ok, buf = cv2.imencode(".jpg", img)
        assert ok
        with open(foto_path, "wb") as f:
            f.write(buf.tobytes())

        salida = os.path.join(tmp, "salida_presets")
        res = fotos.aprender_mi_estilo(
            ruta_lrcat=None,
            ruta_fotos_editadas=carpeta_unicode,
            carpeta_salida=salida,
        )
        assert res["archivos_generados"], "Debe leer fotos en rutas Unicode y generar presets"


def test_exportador_filmora_no_repite_file_ids_ni_clip_ids():
    with tempfile.TemporaryDirectory() as tmp:
        intro_nombre = os.path.join(tmp, "intro_nombre.mp4")
        with open(intro_nombre, "wb") as f:
            f.write(b"dummy")
        logo = os.path.join(tmp, "logo.png")
        with open(logo, "wb") as f:
            f.write(b"dummy")

        cortes = [
            {
                "archivo_ruta": os.path.join(tmp, "cam1.mp4"),
                "archivo_nombre": "cam1.mp4",
                "entrada": 0.0,
                "salida": 4.0,
                "duracion": 4.0,
                "pista_video": 1,
                "pista_audio": 1,
            },
            {
                "archivo_ruta": os.path.join(tmp, "cam1.mp4"),
                "archivo_nombre": "cam1.mp4",
                "entrada": 6.0,
                "salida": 10.0,
                "duracion": 4.0,
                "pista_video": 1,
                "pista_audio": 1,
            },
        ]
        xml_path = os.path.join(tmp, "salida.xml")
        exportador_filmora.exportar_timeline_filmora(
            cortes=cortes,
            ruta_destino_xml=xml_path,
            ruta_logo_ak=logo,
            ruta_intro_nombre=intro_nombre,
        )

        raiz = ET.parse(xml_path).getroot()
        file_ids = [el.attrib.get("id") for el in raiz.findall(".//file")]
        clip_ids = [el.attrib.get("id") for el in raiz.findall(".//clipitem")]
        assert len(file_ids) == len(set(file_ids)), f"IDs de <file> repetidos: {file_ids}"
        assert len(clip_ids) == len(set(clip_ids)), f"IDs de <clipitem> repetidos: {clip_ids}"


def test_video_de_vida_boda_usa_pantalla_paralela_al_exportar():
    with tempfile.TemporaryDirectory() as tmp:
        el_path = os.path.join(tmp, "el_01.jpg")
        ella_path = os.path.join(tmp, "ella_01.jpg")
        juntos_path = os.path.join(tmp, "juntos_01.jpg")

        # Él: azul, Ella: verde, Juntos: rojo
        cv2.imwrite(el_path, np.full((120, 160, 3), (220, 40, 40), dtype=np.uint8))
        cv2.imwrite(ella_path, np.full((120, 160, 3), (40, 220, 40), dtype=np.uint8))
        cv2.imwrite(juntos_path, np.full((120, 160, 3), (40, 40, 220), dtype=np.uint8))

        fotos_ord = [
            {"ruta": el_path, "rol_boda": "el", "capitulo": "Él", "orientacion": 1},
            {"ruta": ella_path, "rol_boda": "ella", "capitulo": "Ella", "orientacion": 1},
            {"ruta": juntos_path, "rol_boda": None, "capitulo": "Juntos", "orientacion": 1},
        ]
        emparejadas = video_de_vida._emparejar_fotos_boda_paralelo(fotos_ord)
        assert len(emparejadas) == 2
        assert emparejadas[0]["ruta_paralelo_ella"] == ella_path

        out_mp4 = os.path.join(tmp, "boda_test.mp4")
        res = video_de_vida.exportar_video_de_vida(
            fotos_ordenadas=fotos_ord,
            ruta_salida_mp4=out_mp4,
            fps=4,
            es_vista_previa=True,
        )
        assert os.path.exists(res) and os.path.getsize(res) > 0


def test_wfolio_no_saltea_archivo_cambiado_al_reanudar_y_reutiliza_sesion(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / "entrega"
        carpeta = root / "Fiesta"
        carpeta.mkdir(parents=True, exist_ok=True)
        f1 = carpeta / "foto_01.jpg"
        f2 = carpeta / "foto_02.jpg"
        Image.new("RGB", (50, 50), (10, 20, 30)).save(f1)
        Image.new("RGB", (50, 50), (40, 50, 60)).save(f2)
        db = str(Path(tmp) / "proyecto.sqlite")

        subidas_1 = []

        def ep_ok(foto_path, carp, fiesta):
            subidas_1.append(os.path.basename(foto_path))
            return {"status": "ok", "url": "https://wfolio.com/my/disk/privado/test"}

        wfolio.subir_a_wfolio(root, "TestBoda", endpoint_simulado=ep_ok, ruta_db=db)
        assert subidas_1 == ["foto_01.jpg", "foto_02.jpg"]

        # Reemplazar foto_01 con otro tamaño -> al reanudar NO debe saltearla
        Image.new("RGB", (300, 300), (200, 100, 50)).save(f1)
        subidas_2 = []

        def ep_resume(foto_path, carp, fiesta):
            subidas_2.append(os.path.basename(foto_path))
            return {"status": "ok", "url": "https://wfolio.com/my/disk/privado/test"}

        wfolio.subir_a_wfolio(root, "TestBoda", endpoint_simulado=ep_resume, ruta_db=db)
        assert subidas_2 == ["foto_01.jpg"]

        # Verificar que un archivo RAW no pasa crudo a <img> sino convertido a JPG
        raw_f = Path(tmp) / "DSC_999.nef"
        raw_f.write_bytes(b"fake_raw")
        called = {}

        def fake_leer(path_str):
            called["leer"] = path_str
            return np.full((40, 40, 3), (100, 120, 140), dtype=np.uint8)

        monkeypatch.setattr(fotos, "leer_foto", fake_leer)
        out_web = wfolio._preparar_jpg_para_navegador(raw_f, Path(tmp))
        assert called.get("leer") == str(raw_f)
        assert out_web.suffix.lower() == ".jpg"
        assert out_web.is_file()

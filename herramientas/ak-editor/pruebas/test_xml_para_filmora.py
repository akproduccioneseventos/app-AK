# -*- coding: utf-8 -*-
"""Prueba: XML compatible con Filmora 16 (XMEML).

Comprueba que el XML exportado sea XMEML válido (versión 5), tenga las 4 pistas
organizadas, y los clips apunten a los originales con in y out correctos.
"""

import os
import sys
import tempfile
import xml.etree.ElementTree as ET
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from exportador_filmora import exportar_timeline_filmora


def test_xml_para_filmora():
    with tempfile.TemporaryDirectory() as temp_dir:
        xml_salida = os.path.join(temp_dir, "proyecto_test.xml")
        logo_png = os.path.join(temp_dir, "logo_ak.png")
        with open(logo_png, "wb") as f:
            f.write(b"LOGO_PNG_DUMMY")

        cortes = [
            {
                "archivo_ruta": "C:/Eventos/XV_Maria/cam1_baile.mp4",
                "archivo_nombre": "cam1_baile.mp4",
                "entrada": 10.0,
                "salida": 20.0,
                "duracion": 10.0,
                "pista_video": 1,
                "pista_audio": 1,
            },
            {
                "archivo_ruta": "C:/Eventos/XV_Maria/cam2_osmo.mp4",
                "archivo_nombre": "cam2_osmo.mp4",
                "entrada": 2.5,
                "salida": 7.5,
                "duracion": 5.0,
                "pista_video": 2,
                "pista_audio": 1,
            },
            {
                "archivo_ruta": "C:/Eventos/XV_Maria/musica_fondo.mp3",
                "archivo_nombre": "musica_fondo.mp3",
                "entrada": 0.0,
                "salida": 30.0,
                "duracion": 30.0,
                "pista_video": 0,
                "pista_audio": 2,
            },
        ]

        ruta_generada = exportar_timeline_filmora(
            cortes=cortes,
            ruta_destino_xml=xml_salida,
            fps=30,
            ruta_logo_ak=logo_png,
        )

        assert os.path.exists(ruta_generada), "El archivo XML no se generó en disco"

        # Parsear con ElementTree para validar formato XML bien estructurado
        tree = ET.parse(ruta_generada)
        raiz = tree.getroot()

        # 1. Etiqueta raíz xmeml versión 5
        assert raiz.tag == "xmeml"
        assert raiz.get("version") == "5"

        secuencia = raiz.find("sequence")
        assert secuencia is not None

        media = secuencia.find("media")
        video = media.find("video")
        audio = media.find("audio")

        # 2. Comprobar pistas requeridas:
        # Pistas de video (al menos 3: Principal, Osmo, Logo)
        pistas_video = video.findall("track")
        assert len(pistas_video) >= 3, f"Se esperaban 3 pistas de video, hay {len(pistas_video)}"

        # Pistas de audio (al menos 2: Original, Música)
        pistas_audio = audio.findall("track")
        assert len(pistas_audio) >= 2, f"Se esperaban 2 pistas de audio, hay {len(pistas_audio)}"

        # 3. Comprobar que los clips apuntan a los originales con in y out correctos
        clips_v1 = pistas_video[0].findall("clipitem")
        assert len(clips_v1) >= 1
        clip1 = clips_v1[0]

        # 10.0s * 30fps = 300 frames; 20.0s * 30fps = 600 frames
        assert clip1.find("in").text == "300"
        assert clip1.find("out").text == "600"

        file_elem = clip1.find("file")
        assert file_elem is not None
        pathurl = file_elem.find("pathurl").text
        assert "cam1_baile.mp4" in pathurl

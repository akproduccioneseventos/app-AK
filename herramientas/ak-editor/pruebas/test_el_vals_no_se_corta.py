# -*- coding: utf-8 -*-
"""Prueba: En el vals la música nunca se corta.

Comprueba que en el bloque de vals la pista de música sea un bloque continuo
sin interrupciones.
"""

import os
import sys
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from reglas import ReglasEdicion


def test_el_vals_no_se_corta():
    reglas = ReglasEdicion()

    archivo_musica = {
        "id": 10,
        "nombre": "vals_de_las_mariposas.mp3",
        "duracion": 210.0,
        "bloque": "vals",
        "camara": "audio_master",
    }

    archivos_video = [
        {"id": 11, "nombre": "vals_cam1_parte1.mp4", "duracion": 60.0, "bloque": "vals", "camara": "principal"},
        {"id": 12, "nombre": "vals_cam1_parte2.mp4", "duracion": 90.0, "bloque": "vals", "camara": "principal"},
        {"id": 13, "nombre": "vals_cam2_osmo.mp4", "duracion": 80.0, "bloque": "vals", "camara": "osmo"},
    ]

    resultado = reglas.generar_pistas_vals(
        archivo_musica=archivo_musica,
        archivos_video=archivos_video,
    )

    pista_musica = resultado["pista_musica"]

    # 1. La música debe ser un único bloque continuo
    assert isinstance(pista_musica, dict), "La pista de música no es un bloque único"
    assert pista_musica["bloque"] == "vals"
    assert pista_musica["pista_audio"] == 2
    assert pista_musica["entrada"] == 0.0
    assert pista_musica["salida"] == 210.0
    assert pista_musica["duracion"] == 210.0
    assert pista_musica["tipo"] == "musica_continua"

    # 2. El video sí tiene cortes para acompañar la música
    cortes_video = resultado["cortes_video"]
    assert len(cortes_video) >= 3, "No se generaron los cortes de video necesarios"
    for c in cortes_video:
        assert c["pista_video"] == 1

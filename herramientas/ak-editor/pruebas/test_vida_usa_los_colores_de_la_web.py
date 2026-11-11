# -*- coding: utf-8 -*-
"""Prueba Orden 273: Usa los colores de la web de la fiesta (estilo.json).

Con un estilo.json de colores rosa, los títulos del video salen con ese color
(se mide el color de los píxeles del título en un cuadro), y sin estilo.json
sale la plantilla elegida.
"""

import os
import sys
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import cargar_plantilla, hex_a_bgr, renderizar_cuadro_titulo


def test_vida_usa_los_colores_de_la_web():
    # 1. Con estilo.json definiendo color rosa fuerte (#FF1493)
    color_rosa_hex = "#FF1493"
    bgr_rosa_esperado = hex_a_bgr(color_rosa_hex)  # B: 147, G: 20, R: 255

    estilo_rosa = {
        "plantilla": "rosa-pastel",
        "paletaColores": {
            "primary": color_rosa_hex,
            "secondary": "#050505",
            "accent": "#F0E68C",
        },
        "protagonista1": "Julieta",
        "fechaEvento": "2026-11-20",
    }

    plantilla = cargar_plantilla("rosa-pastel")
    cuadro_con_estilo = renderizar_cuadro_titulo(
        texto_principal="Mis XV Anos",
        texto_secundario="2026",
        plantilla=plantilla,
        config_estilo=estilo_rosa,
        ancho=800,
        alto=450,
    )

    # El fondo es #050505 (BGR 5,5,5).
    # Encontrar píxeles del texto (aquellos notablemente distintos del fondo)
    mascara_texto = np.any(cuadro_con_estilo > 30, axis=2)
    assert np.any(mascara_texto), "No se renderizó ningún texto en el cuadro"

    pixeles_texto = cuadro_con_estilo[mascara_texto]
    # El color predominante del texto principal debe coincidir con el rosa BGR (147, 20, 255)
    # Verificamos que existen píxeles con el color exacto o muy cercano
    distancias_rosa = np.linalg.norm(pixeles_texto - np.array(bgr_rosa_esperado), axis=1)
    min_dist_rosa = np.min(distancias_rosa)
    assert min_dist_rosa < 10.0, (
        f"El color del título con estilo.json no coincide con el rosa esperado {bgr_rosa_esperado}. "
        f"Distancia mínima encontrada: {min_dist_rosa}"
    )

    # 2. Sin estilo.json (debe salir la plantilla clásica dorada #D4AF37)
    plantilla_dorada = cargar_plantilla("clasica-dorada")
    bgr_dorado_esperado = hex_a_bgr(plantilla_dorada["paletaColores"]["primary"])  # B: 55, G: 175, R: 212

    cuadro_sin_estilo = renderizar_cuadro_titulo(
        texto_principal="Mis XV Anos",
        texto_secundario="2026",
        plantilla=plantilla_dorada,
        config_estilo=None,
        ancho=800,
        alto=450,
    )

    mascara_dorada = np.any(cuadro_sin_estilo > 50, axis=2)
    pixeles_dorado = cuadro_sin_estilo[mascara_dorada]
    distancias_dorado = np.linalg.norm(pixeles_dorado - np.array(bgr_dorado_esperado), axis=1)
    min_dist_dorado = np.min(distancias_dorado)
    assert min_dist_dorado < 10.0, (
        f"El color del título sin estilo.json no coincide con la plantilla dorada {bgr_dorado_esperado}. "
        f"Distancia mínima encontrada: {min_dist_dorado}"
    )

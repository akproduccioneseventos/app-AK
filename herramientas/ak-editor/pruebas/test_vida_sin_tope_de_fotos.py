# -*- coding: utf-8 -*-
"""Prueba Orden 273: Sin tope de 50 fotos (soporta 300+ fotos).

300 fotos se cargan, ordenan y arman la línea de tiempo sin error y sin
frenarse en el límite de 50 de Filmora.
"""

import os
import sys
import tempfile
import cv2
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import cargar_fotos, ordenar_fotos_vida


def test_vida_sin_tope_de_fotos():
    with tempfile.TemporaryDirectory() as temp_dir:
        cant_fotos = 300
        # Imagen mínima para que sea veloz la creación
        img_mini = np.full((16, 16, 3), 100, dtype=np.uint8)

        # Generar 300 fotos con nombres que incluyen fecha incremental
        for i in range(cant_fotos):
            # Años entre 2010 y 2025
            anio = 2010 + (i % 15)
            mes = 1 + (i % 12)
            dia = 1 + (i % 28)
            nom = f"foto_{i:04d}_{anio:04d}-{mes:02d}-{dia:02d}.jpg"
            ruta = os.path.join(temp_dir, nom)
            cv2.imwrite(ruta, img_mini)

        # Cargar y ordenar las 300 fotos
        datos = cargar_fotos(temp_dir)
        assert len(datos["fotos"]) == cant_fotos, (
            f"Se esperaban {cant_fotos} fotos cargadas, se obtuvieron {len(datos['fotos'])}"
        )

        res = ordenar_fotos_vida(datos["fotos"], anio_nacimiento=2010)
        fotos_ordenadas = res["fotos_ordenadas"]

        # Comprobar que no hay tope de 50: se procesaron las 300
        assert len(fotos_ordenadas) == cant_fotos
        assert len(fotos_ordenadas) > 50

        # Verificar que los capítulos tienen fotos distribuidas
        caps = res["capitulos"]
        total_en_caps = sum(len(lista) for lista in caps.values())
        assert total_en_caps == cant_fotos

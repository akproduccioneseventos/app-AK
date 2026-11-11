# -*- coding: utf-8 -*-
"""Prueba Orden 273: Las fotos originales no se tocan nunca.

Después de cargar, ordenar, corregir orientación en memoria y exportar
el video de vida, las fotos originales mantienen intacta su huella SHA256.
"""

import hashlib
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

from video_de_vida import cargar_fotos, exportar_video_de_vida, ordenar_fotos_vida


def calcular_sha256(ruta: str) -> str:
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def test_vida_no_toca_las_originales():
    with tempfile.TemporaryDirectory() as temp_dir:
        rutas_fotos = []
        hashes_iniciales = {}

        # Crear 5 fotos con distintas orientaciones y contenidos
        for i in range(5):
            ruta = os.path.join(temp_dir, f"foto_original_{i:02d}.jpg")
            img = np.full((120, 160, 3), 40 + i * 35, dtype=np.uint8)
            cv2.imwrite(ruta, img)
            rutas_fotos.append(ruta)
            hashes_iniciales[ruta] = calcular_sha256(ruta)

        # Ejecutar todo el proceso del Video de Vida
        datos = cargar_fotos(temp_dir)
        res = ordenar_fotos_vida(datos["fotos"], anio_nacimiento=2010)

        ruta_video_salida = os.path.join(temp_dir, "video_salida.mp4")
        exportar_video_de_vida(
            fotos_ordenadas=res["fotos_ordenadas"],
            ruta_salida_mp4=ruta_video_salida,
            fps=10,
            es_vista_previa=True,
        )

        assert os.path.exists(ruta_video_salida)

        # Comprobar que NINGUNA foto original sufrió la más mínima modificación
        for ruta in rutas_fotos:
            hash_final = calcular_sha256(ruta)
            assert hash_final == hashes_iniciales[ruta], (
                f"La foto original {os.path.basename(ruta)} fue alterada en disco. "
                f"Hash inicial: {hashes_iniciales[ruta]} != Hash final: {hash_final}"
            )

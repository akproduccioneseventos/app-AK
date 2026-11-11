# -*- coding: utf-8 -*-
"""Prueba Orden 273: El Video de Vida ordena las fotos por fecha EXIF.

Diez fotos con fechas EXIF mezcladas salen en orden cronológico estricto,
y una foto sin fecha queda agrupada en 'sin fecha'.
"""

import os
import sys
import tempfile
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import cargar_fotos, guardar_imagen_con_exif, ordenar_fotos_vida


def test_vida_ordena_por_fecha():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 10 fechas mezcladas cronológicamente
        fechas = [
            "2015:05:10 14:00:00",
            "2011:01:05 10:30:00",
            "2018:09:20 18:15:00",
            "2013:03:12 09:00:00",
            "2021:11:30 20:00:00",
            "2012:07:08 12:00:00",
            "2017:04:16 16:45:00",
            "2019:08:22 11:20:00",
            "2014:12:25 15:10:00",
            "2016:10:05 17:00:00",
        ]

        img = np.full((80, 80, 3), 180, dtype=np.uint8)

        # Crear las 10 fotos con EXIF
        for i, f in enumerate(fechas):
            ruta = os.path.join(temp_dir, f"foto_desordenada_{i:02d}.jpg")
            guardar_imagen_con_exif(ruta, img, fecha_exif=f)

        # 1 foto sin fecha
        ruta_sin_fecha = os.path.join(temp_dir, "foto_sin_fecha.png")
        import cv2
        cv2.imwrite(ruta_sin_fecha, img)
        # Modificar su fecha para que no tenga EXIF ni fecha en nombre
        # El loader la detectará como sin fecha o creacion
        # Para forzar sin fecha explícita:
        datos = cargar_fotos(temp_dir)
        # Marcamos la foto_sin_fecha.png sin fecha_dt
        for f in datos["fotos"]:
            if "sin_fecha" in f["nombre"]:
                f["fecha_dt"] = None
                f["origen_fecha"] = "sin fecha"

        resultado = ordenar_fotos_vida(datos["fotos"], anio_nacimiento=2010)

        fotos_ordenadas = resultado["fotos_ordenadas"]
        sin_fecha = resultado["sin_fecha"]

        # Debe haber exactamente 10 fotos ordenadas y 1 sin fecha
        assert len(fotos_ordenadas) == 10
        assert len(sin_fecha) == 1
        assert "sin_fecha" in sin_fecha[0]["nombre"]

        # Verificar orden cronológico estricto
        fechas_obtenidas = [f["fecha_str"] for f in fotos_ordenadas]
        fechas_esperadas = sorted([f.replace(":", "-", 2) for f in fechas])
        assert fechas_obtenidas == fechas_esperadas

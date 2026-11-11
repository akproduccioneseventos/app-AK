# -*- coding: utf-8 -*-
"""Prueba: Sigue donde quedó sin reanalizar lo hecho.

Simula una interrupción a mitad del análisis y valida que al retomar
no reanalice los archivos ya completados.
"""

import os
import sys
import tempfile
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from almacen import Almacen
from analizador import Analizador



def _escribir_video_real(ruta, cuadros=10, color=(40, 120, 200)):
    """Un video de verdad, chico, para que el programa lo abra como cualquier otro."""
    import cv2
    import numpy as np
    writer = cv2.VideoWriter(ruta, cv2.VideoWriter_fourcc(*"mp4v"), 5, (160, 120))
    cuadro = np.zeros((120, 160, 3), dtype=np.uint8)
    cuadro[:] = color
    cuadro[::10, :] = (255, 255, 255)
    for _ in range(cuadros):
        writer.write(cuadro)
    writer.release()


def test_sigue_donde_quedo():
    with tempfile.TemporaryDirectory() as temp_dir:
        carpeta_videos = os.path.join(temp_dir, "videos")
        os.makedirs(carpeta_videos)

        archivos = []
        for i in range(5):
            ruta = os.path.join(carpeta_videos, f"video_{i+1:02d}.mp4")
            _escribir_video_real(ruta, color=(20 * i, 100, 200))
            archivos.append(ruta)

        ruta_db = os.path.join(temp_dir, "proyecto.sqlite")
        almacen = Almacen(ruta_db)
        analizador = Analizador(almacen, ruta_medicion=os.path.join(temp_dir, "MEDICION.md"))

        # 1. Registrar archivos en la base de datos
        for ruta in archivos:
            analizador.registrar_archivo(ruta)

        todos = almacen.obtener_archivos()
        assert len(todos) == 5

        # 2. Simular que los primeros 2 archivos ya fueron completados previamente
        almacen.actualizar_estado_analisis(todos[0]["id"], "completado")
        almacen.actualizar_estado_analisis(todos[1]["id"], "completado")

        # 3. Correr análisis y registrar qué archivos son procesados
        archivos_procesados = []

        def callback(idx, tot, msg):
            if "Analizando:" in msg:
                archivos_procesados.append(msg.split("Analizando:")[-1].strip())

        analizador.analizar_carpeta(carpeta_videos, progreso_callback=callback)

        # 4. Validar que los 2 primeros (ya completados) NO fueron procesados
        nombre_video_1 = os.path.basename(archivos[0])
        nombre_video_2 = os.path.basename(archivos[1])

        assert nombre_video_1 not in archivos_procesados, f"El archivo ya completado {nombre_video_1} se reanalizó"
        assert nombre_video_2 not in archivos_procesados, f"El archivo ya completado {nombre_video_2} se reanalizó"

        # Y los archivos restantes (3, 4, 5) sí fueron procesados
        assert os.path.basename(archivos[2]) in archivos_procesados
        assert os.path.basename(archivos[3]) in archivos_procesados
        assert os.path.basename(archivos[4]) in archivos_procesados

        # Todos quedan completados al final
        todos_final = almacen.obtener_archivos()
        assert all(a["estado_analisis"] == "completado" for a in todos_final)

# -*- coding: utf-8 -*-
"""Prueba: Los archivos originales no se tocan nunca.

Verifica que tras analizar y exportar, los archivos de entrada conservan
tamaño, fecha y checksum SHA256 exacto, y en su carpeta no se crea ningún archivo.
"""

import hashlib
import os
import sys
import tempfile
import pytest

# Asegurar importación de módulos hermanos
DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from almacen import Almacen
from analizador import Analizador
from exportador_filmora import exportar_timeline_filmora


def calcular_sha256_completo(ruta: str) -> str:
    hasher = hashlib.sha256()
    with open(ruta, "rb") as f:
        while trozo := f.read(65536):
            hasher.update(trozo)
    return hasher.hexdigest()



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


def test_no_toca_los_originales():
    with tempfile.TemporaryDirectory() as carpeta_originales, tempfile.TemporaryDirectory() as carpeta_datos:
        # 1. Crear archivos originales simulados
        video1 = os.path.join(carpeta_originales, "baile_cam1.mp4")
        video2 = os.path.join(carpeta_originales, "baile_cam2_osmo.mp4")

        _escribir_video_real(video1, color=(200, 40, 40))

        _escribir_video_real(video2, color=(40, 200, 40))

        archivos_antes = sorted(os.listdir(carpeta_originales))

        # Registrar tamaño, fecha de modificación y hash antes
        stat1_antes = os.stat(video1)
        stat2_antes = os.stat(video2)
        hash1_antes = calcular_sha256_completo(video1)
        hash2_antes = calcular_sha256_completo(video2)

        # 2. Ejecutar análisis y guardado en base de datos separada
        ruta_db = os.path.join(carpeta_datos, "proyecto.sqlite")
        almacen = Almacen(ruta_db)
        analizador = Analizador(almacen, ruta_medicion=os.path.join(carpeta_datos, "MEDICION.md"))

        analizador.analizar_carpeta(carpeta_originales)

        # 3. Exportar línea de tiempo
        cortes = [
            {
                "archivo_ruta": video1,
                "archivo_nombre": "baile_cam1.mp4",
                "entrada": 0.0,
                "salida": 5.0,
                "duracion": 5.0,
                "pista_video": 1,
                "pista_audio": 1,
            },
            {
                "archivo_ruta": video2,
                "archivo_nombre": "baile_cam2_osmo.mp4",
                "entrada": 1.0,
                "salida": 4.0,
                "duracion": 3.0,
                "pista_video": 2,
                "pista_audio": 1,
            },
        ]
        xml_destino = os.path.join(carpeta_datos, "filmora.xml")
        exportar_timeline_filmora(cortes, xml_destino)

        # 4. Validar que la carpeta de originales NO tiene archivos nuevos ni modificados
        archivos_despues = sorted(os.listdir(carpeta_originales))
        assert archivos_antes == archivos_despues, "Aparecieron archivos nuevos en la carpeta original"

        stat1_despues = os.stat(video1)
        stat2_despues = os.stat(video2)
        assert stat1_antes.st_size == stat1_despues.st_size, "El tamaño del video 1 fue modificado"
        assert stat2_antes.st_size == stat2_despues.st_size, "El tamaño del video 2 fue modificado"
        assert stat1_antes.st_mtime == stat1_despues.st_mtime, "La fecha de modificación del video 1 cambió"
        assert stat2_antes.st_mtime == stat2_despues.st_mtime, "La fecha de modificación del video 2 cambió"

        hash1_despues = calcular_sha256_completo(video1)
        hash2_despues = calcular_sha256_completo(video2)
        assert hash1_antes == hash1_despues, "El hash SHA256 del video 1 cambió"
        assert hash2_antes == hash2_despues, "El hash SHA256 del video 2 cambió"

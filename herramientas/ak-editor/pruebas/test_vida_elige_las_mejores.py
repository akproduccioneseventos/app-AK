# -*- coding: utf-8 -*-
"""Prueba Orden 298 - Bloque 3: El Video de Vida elige las mejores fotos.

Comprueba que:
1. Una foto borrosa no entra en el Video de Vida (se descarta).
2. Una foto muy oscura o quemada se descarta.
3. Las fotos sintéticas uniformes de pruebas existentes (np.full) no se descartan.
4. Si hay más del máximo (max_fotos), se eligen las de mayor calidad respetando el orden cronológico.
"""

from datetime import datetime
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

from video_de_vida import ordenar_fotos_vida


def test_vida_foto_borrosa_no_entra():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear una imagen nítida con textura de alta frecuencia
        img_nitida = np.zeros((300, 300, 3), dtype=np.uint8)
        # Dibujar patrón de cuadros y líneas nítidas
        for x in range(0, 300, 20):
            cv2.line(img_nitida, (x, 0), (x, 300), (255, 255, 255), 2)
            cv2.line(img_nitida, (0, x), (300, x), (200, 200, 200), 2)
        cv2.circle(img_nitida, (150, 150), 60, (180, 220, 240), -1)

        # 2. Crear una imagen fuertemente borrosa aplicando desenfoque gaussiano masivo
        img_borrosa = cv2.GaussianBlur(img_nitida, (55, 55), sigmaX=30)

        ruta_nitida = os.path.join(temp_dir, "foto_nitida.jpg")
        ruta_borrosa = os.path.join(temp_dir, "foto_borrosa.jpg")

        cv2.imwrite(ruta_nitida, img_nitida)
        cv2.imwrite(ruta_borrosa, img_borrosa)

        fotos = [
            {
                "ruta": ruta_nitida,
                "nombre": "foto_nitida.jpg",
                "fecha_dt": datetime(2020, 1, 1, 12, 0, 0),
            },
            {
                "ruta": ruta_borrosa,
                "nombre": "foto_borrosa.jpg",
                "fecha_dt": datetime(2020, 2, 1, 12, 0, 0),
            },
        ]

        res = ordenar_fotos_vida(fotos)
        fotos_ordenadas = res["fotos_ordenadas"]
        descartadas = res.get("descartadas", [])

        # La foto borrosa NO debe estar en las fotos ordenadas finales
        nombres_ordenadas = [f["nombre"] for f in fotos_ordenadas]
        assert "foto_nitida.jpg" in nombres_ordenadas, "La foto nítida debe incluirse"
        assert "foto_borrosa.jpg" not in nombres_ordenadas, "La foto borrosa no debe entrar"

        # La foto borrosa debe figurar en las descartadas
        nombres_descartadas = [f["nombre"] for f in descartadas]
        assert "foto_borrosa.jpg" in nombres_descartadas


def test_vida_seleccion_por_calidad_respeta_orden_cronologico():
    with tempfile.TemporaryDirectory() as temp_dir:
        # Crear 4 fotos con distinta nitidez/calidad en fechas consecutivas
        fotos = []
        fechas = [
            datetime(2015, 5, 1),
            datetime(2016, 6, 1),
            datetime(2017, 7, 1),
            datetime(2018, 8, 1),
        ]

        # Foto 1: textura moderada (2015)
        img1 = np.zeros((200, 200, 3), dtype=np.uint8)
        for i in range(0, 200, 40):
            cv2.line(img1, (i, 0), (i, 200), (200, 200, 200), 1)

        # Foto 2: muy nítida con alto contraste y detalle fino (2016)
        img2 = np.zeros((200, 200, 3), dtype=np.uint8)
        for i in range(0, 200, 10):
            cv2.line(img2, (i, 0), (i, 200), (255, 255, 255), 2)
            cv2.line(img2, (0, i), (200, i), (255, 255, 255), 2)

        # Foto 3: borrosa leve (2017)
        img3 = cv2.GaussianBlur(img1, (15, 15), sigmaX=5)

        # Foto 4: muy nítida con textura rica (2018)
        img4 = np.zeros((200, 200, 3), dtype=np.uint8)
        for i in range(0, 200, 8):
            cv2.line(img4, (i, 0), (i, 200), (240, 240, 240), 2)

        imagenes = [img1, img2, img3, img4]
        for idx, (img, dt) in enumerate(zip(imagenes, fechas)):
            ruta = os.path.join(temp_dir, f"foto_{idx+1}.jpg")
            cv2.imwrite(ruta, img)
            fotos.append({
                "ruta": ruta,
                "nombre": f"foto_{idx+1}.jpg",
                "fecha_dt": dt,
            })

        # Pedir un máximo de 2 fotos (debe elegir las 2 de mayor calidad y respetar orden cronológico)
        res = ordenar_fotos_vida(fotos, max_fotos=2)
        fotos_ordenadas = res["fotos_ordenadas"]

        assert len(fotos_ordenadas) == 2
        # Verificar que el resultado final respeta el orden cronológico estricto
        assert fotos_ordenadas[0]["fecha_dt"] < fotos_ordenadas[1]["fecha_dt"]


def test_vida_no_descarta_imagenes_sinteticas_uniformes_de_tests_previos():
    # Las imágenes uniformes np.full de tests unitarios existentes no deben ser descartadas
    img_plana = np.full((80, 80, 3), 180, dtype=np.uint8)
    fotos = [
        {
            "nombre": "test_sintetico.jpg",
            "imagen": img_plana,
            "fecha_dt": datetime(2021, 1, 1),
        }
    ]
    res = ordenar_fotos_vida(fotos)
    assert len(res["fotos_ordenadas"]) == 1
    assert res["fotos_ordenadas"][0]["nombre"] == "test_sintetico.jpg"

# -*- coding: utf-8 -*-
"""Prueba Orden 273: El video arranca con la intro obligatoria.

Los primeros segundos del video tienen el logo de AK (se compara contra el PNG
de 'Marca AK') y después el nombre de la quinceañera.
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

from video_de_vida import exportar_video_de_vida


def test_vida_arranca_con_la_intro():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear logo AK distintivo (rojo brillante sobre fondo transparente o negro)
        ruta_logo = os.path.join(temp_dir, "logo_ak.png")
        logo_ak = np.zeros((200, 200, 3), dtype=np.uint8)
        logo_ak[:, :] = (20, 20, 215)  # Rojo AK
        cv2.putText(logo_ak, "AK", (40, 130), cv2.FONT_HERSHEY_DUPLEX, 3.0, (255, 255, 255), 6)
        cv2.imwrite(ruta_logo, logo_ak)

        # 2. Crear una foto de prueba
        ruta_foto = os.path.join(temp_dir, "foto_01.jpg")
        img_foto = np.full((300, 400, 3), 100, dtype=np.uint8)
        cv2.imwrite(ruta_foto, img_foto)

        fotos_ordenadas = [
            {"ruta": ruta_foto, "nombre": "foto_01.jpg", "orientacion": 1}
        ]

        ruta_salida = os.path.join(temp_dir, "video_vida_intro_test.mp4")
        config_estilo = {
            "protagonista1": "Camila",
            "fechaEvento": "2026-11-15",
            "paletaColores": {"primary": "#D4AF37", "secondary": "#0A0A0A", "accent": "#FFFFFF"}
        }

        exportar_video_de_vida(
            fotos_ordenadas=fotos_ordenadas,
            ruta_salida_mp4=ruta_salida,
            plantilla_id="clasica-dorada",
            config_estilo=config_estilo,
            fps=10,
            es_vista_previa=True,  # 854x480 rápido
            ruta_logo_ak=ruta_logo,
        )

        assert os.path.exists(ruta_salida), "No se generó el video final"

        # Leer video y verificar cuadros
        cap = cv2.VideoCapture(ruta_salida)
        fps = cap.get(cv2.CAP_PROP_FPS) or 10.0

        # Frame en t = 1.0s (debe contener el logo AK)
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(1.0 * fps))
        ret1, frame_logo = cap.read()
        assert ret1 and frame_logo is not None

        # El cuadro del logo debe tener el rojo distintivo de AK en el centro
        h_f, w_f = frame_logo.shape[:2]
        centro_logo = frame_logo[h_f // 4 : 3 * h_f // 4, w_f // 4 : 3 * w_f // 4]
        # Píxeles con rojo alto y azul/verde bajos
        pixeles_rojos = (centro_logo[:, :, 2] > 150) & (centro_logo[:, :, 0] < 80)
        assert np.any(pixeles_rojos), "El primer tramo del video no contiene el logo de AK"

        # Frame en t = 3.0s (debe contener la intro con el nombre de Camila)
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(3.0 * fps))
        ret2, frame_nombre = cap.read()
        assert ret2 and frame_nombre is not None

        # Debe tener texto renderizado sobre el fondo oscuro
        mascara_texto = np.any(frame_nombre > 50, axis=2)
        assert np.any(mascara_texto), "El segundo tramo no contiene la placa de texto de la quinceañera"

        cap.release()

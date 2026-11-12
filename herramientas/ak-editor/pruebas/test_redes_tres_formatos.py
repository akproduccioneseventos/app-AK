# -*- coding: utf-8 -*-
"""Prueba Orden 275: Modo Redes — Tres formatos exactos por estación y la noche completa.

Con fotos de dos estaciones arma los videos de cada una más 'la noche completa',
cada uno en sus tres medidas exactas:
- 1080x1920 (Reel 9:16)
- 1080x1080 (Cuadrado 1:1)
- 1080x1350 (Vertical de muro 4:5)
con el logo de AK en el último segundo y genera redes.json.
"""

import json
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

from redes import FORMATOS_REDES, generar_videos_redes


def test_redes_tres_formatos():
    with tempfile.TemporaryDirectory() as temp_dir:
        dir_origen = os.path.join(temp_dir, "material_redes")
        dir_salida = os.path.join(temp_dir, "salida_redes")

        # 1. Crear fotos de dos estaciones: 'fotocabina' y 'plataforma-360'
        dir_fotocabina = os.path.join(dir_origen, "fotocabina")
        dir_360 = os.path.join(dir_origen, "plataforma-360")
        os.makedirs(dir_fotocabina, exist_ok=True)
        os.makedirs(dir_360, exist_ok=True)

        img_sample = np.full((300, 300, 3), 150, dtype=np.uint8)
        cv2.imwrite(os.path.join(dir_fotocabina, "foto_fc_01.jpg"), img_sample)
        cv2.imwrite(os.path.join(dir_fotocabina, "foto_fc_02.jpg"), img_sample)

        cv2.imwrite(os.path.join(dir_360, "foto_360_01.jpg"), img_sample)
        cv2.imwrite(os.path.join(dir_360, "foto_360_02.jpg"), img_sample)

        # Crear logo AK distintivo
        ruta_logo = os.path.join(temp_dir, "logo_ak.png")
        logo_ak = np.zeros((150, 150, 3), dtype=np.uint8)
        logo_ak[:, :] = (20, 20, 220)  # Rojo AK
        cv2.putText(logo_ak, "AK", (25, 105), cv2.FONT_HERSHEY_DUPLEX, 2.5, (255, 255, 255), 5)
        cv2.imwrite(ruta_logo, logo_ak)

        # 2. Ejecutar generador de redes (3 segundos por video a 10 fps para prueba veloz)
        res = generar_videos_redes(
            origen=dir_origen,
            carpeta_destino=dir_salida,
            ruta_logo_ak=ruta_logo,
            duracion_seg=3.0,
            fps=10,
        )

        assert res["ok"] is True
        assert os.path.exists(res["redes_json"]), "No se generó el archivo redes.json"

        with open(res["redes_json"], "r", encoding="utf-8") as f:
            datos_redes = json.load(f)

        assert len(datos_redes) >= 9, (
            f"Se esperaban al menos 9 videos (3 estaciones x 3 formatos), se obtuvieron {len(datos_redes)}"
        )

        # Verificar que están las dos estaciones más 'la noche completa'
        estaciones_registradas = set(d["estacion"].lower() for d in datos_redes)
        assert "fotocabina" in estaciones_registradas
        assert "plataforma-360" in estaciones_registradas
        assert any("noche completa" in e for e in estaciones_registradas)

        # 3. Comprobar que cada video existe y tiene sus tres medidas EXACTAS:
        # 1080x1920 (9:16), 1080x1080 (1:1), 1080x1350 (4:5)
        medidas_esperadas = {
            "9:16": (1080, 1920),
            "1:1": (1080, 1080),
            "4:5": (1080, 1350),
        }

        for item in datos_redes:
            fmt = item["formato"]
            nom_arch = item["archivo"]
            ruta_v = os.path.join(dir_salida, nom_arch)
            assert os.path.exists(ruta_v), f"No existe el archivo {nom_arch} en disco"

            cap = cv2.VideoCapture(ruta_v)
            ancho_real = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            alto_real = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 20.0
            total_f = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

            ancho_esp, alto_esp = medidas_esperadas[fmt]
            assert (ancho_real, alto_real) == (ancho_esp, alto_esp), (
                f"Video {nom_arch} ({fmt}) tiene resolución {ancho_real}x{alto_real}, "
                f"se esperaba exactamente {ancho_esp}x{alto_esp}"
            )

            # 4. Comprobar que en el último segundo aparece el logo de AK
            # Leer el cuadro a 0.5s antes del final
            frame_cierre_idx = max(0, total_f - int(fps * 0.5))
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_cierre_idx)
            ret, frame_ultimo = cap.read()
            assert ret and frame_ultimo is not None, f"No se pudo leer el último cuadro de {nom_arch}"

            # La placa de cierre contiene el rojo característico de AK Producciones
            h_u, w_u = frame_ultimo.shape[:2]
            centro = frame_ultimo[h_u // 4 : 3 * h_u // 4, w_u // 4 : 3 * w_u // 4]
            pixeles_rojo_ak = (centro[:, :, 2] > 140) & (centro[:, :, 0] < 80)
            assert np.any(pixeles_rojo_ak), (
                f"El último segundo de {nom_arch} no contiene el logo de AK Producciones"
            )

            cap.release()

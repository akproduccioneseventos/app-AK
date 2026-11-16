import os
import sys
import tempfile
import json
import pytest
import numpy as np
import cv2

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from app import ejecutar_modo_automatico, ESTADO_AUTOMATICO

def test_modo_automatico_sin_intervencion(tmp_path):
    carpeta_in = str(tmp_path / "entrada")
    os.makedirs(carpeta_in, exist_ok=True)

    # Crear video de muestra
    ruta_v = os.path.join(carpeta_in, "muestra_previa.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(ruta_v, fourcc, 30.0, (320, 240))
    for i in range(60):  # 2 seg
        frame = np.full((240, 320, 3), 120, dtype=np.uint8)
        vw.write(frame)
    vw.release()

    # Crear foto de muestra
    ruta_f = os.path.join(carpeta_in, "foto1.jpg")
    cv2.imwrite(ruta_f, np.full((300, 300, 3), 140, dtype=np.uint8))

    carpeta_out = str(tmp_path / "salida")
    res = ejecutar_modo_automatico(
        carpeta_entrada=carpeta_in,
        carpeta_salida=carpeta_out,
        fiesta_nombre="Fiesta_Auto",
    )

    assert res["ok"] is True
    assert res["fiesta"] == "Fiesta_Auto"
    assert os.path.exists(os.path.join(carpeta_out, "resumen_automatico.json"))

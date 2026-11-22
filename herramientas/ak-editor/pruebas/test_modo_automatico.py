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

    # Crear video de muestra válido (5 seg con detalles nítidos)
    ruta_v = os.path.join(carpeta_in, "muestra_previa.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(ruta_v, fourcc, 30.0, (320, 240))
    frame = np.full((240, 320, 3), 40, dtype=np.uint8)
    cv2.rectangle(frame, (40, 40), (280, 200), (255, 255, 255), 4)
    for _ in range(150):  # 5 seg
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
    assert res["video_final_mp4"] is not None
    assert os.path.exists(os.path.join(carpeta_out, "resumen_automatico.json"))


def test_modo_automatico_avisa_si_no_pudo_armar_video(tmp_path):
    carpeta_in = str(tmp_path / "entrada_vacia")
    os.makedirs(carpeta_in, exist_ok=True)
    carpeta_out = str(tmp_path / "salida_vacia")

    res = ejecutar_modo_automatico(
        carpeta_entrada=carpeta_in,
        carpeta_salida=carpeta_out,
        fiesta_nombre="Fiesta_Vacia",
    )

    assert res["ok"] is False
    assert "No se pudo armar el video" in ESTADO_AUTOMATICO["mensaje"]
    assert len(res["errores"]) > 0

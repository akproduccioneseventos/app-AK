import os
import sys
import subprocess
import tempfile
import pytest
import numpy as np
import cv2

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from exportador_video import renderizar_corte_individual, exportar_video_ffmpeg

@pytest.fixture
def video_muestra(tmp_path):
    ruta = str(tmp_path / "muestra.mp4")
    cuatro_cc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(ruta, cuatro_cc, 30.0, (320, 240))
    for i in range(90):  # 3 segundos
        frame = np.full((240, 320, 3), (i * 2) % 255, dtype=np.uint8)
        vw.write(frame)
    vw.release()
    return ruta

def test_cortes_editados_slow_motion_y_audio(video_muestra, tmp_path):
    salida_slow = str(tmp_path / "corte_slow.mp4")
    # Corte de tipo pose aplica cámara lenta
    ok = renderizar_corte_individual(
        ruta_origen=video_muestra,
        segundo_inicio=0.0,
        duracion=2.0,
        ruta_salida=salida_slow,
        tipo="pose",
        bloque="previa",
    )
    assert ok is True
    assert os.path.exists(salida_slow)

    # Verificar que el corte existe y se puede leer
    cap = cv2.VideoCapture(salida_slow)
    assert cap.isOpened()
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    assert frames > 0

    # Exportar video con música y verificar que se genera MP4 final
    salida_final = str(tmp_path / "final.mp4")
    cortes = [
        {
            "ruta": video_muestra,
            "entrada": 0.0,
            "salida": 1.5,
            "tipo": "pose",
            "bloque": "previa",
        }
    ]
    ok_final = exportar_video_ffmpeg(cortes, salida_final)
    assert ok_final is True
    assert os.path.exists(salida_final)

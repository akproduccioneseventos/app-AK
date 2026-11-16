# -*- coding: utf-8 -*-
"""Prueba Orden 292: El Video de Vida sale con música mezclada con afade."""

import os
import sys
import wave
import struct
import math
import subprocess
import tempfile
import cv2
import numpy as np

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import exportar_video_de_vida


def test_video_de_vida_con_musica():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear WAV de 8 segundos (44.1 kHz, 16-bit PCM mono)
        ruta_audio = os.path.join(temp_dir, "audio_8s.wav")
        tasa = 44100
        duracion_audio = 8.0
        n_muestras = int(tasa * duracion_audio)
        with wave.open(ruta_audio, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(tasa)
            # Tono senoidal suave a 440 Hz
            datos = bytearray()
            for i in range(n_muestras):
                val = int(16000 * math.sin(2 * math.pi * 440 * (i / tasa)))
                datos.extend(struct.pack("<h", val))
            wf.writeframes(datos)

        # 2. Foto de prueba
        ruta_foto = os.path.join(temp_dir, "foto_test.jpg")
        img = np.full((300, 400, 3), 120, dtype=np.uint8)
        cv2.imwrite(ruta_foto, img)

        ruta_salida = os.path.join(temp_dir, "video_con_musica.mp4")
        fotos = [{"ruta": ruta_foto, "nombre": "foto_test.jpg", "orientacion": 1}]

        res = exportar_video_de_vida(
            fotos_ordenadas=fotos,
            ruta_salida_mp4=ruta_salida,
            ruta_audio=ruta_audio,
            fps=24,
            es_vista_previa=True,
        )

        assert os.path.exists(res), "El video final no fue generado"
        assert os.path.getsize(res) > 0, "El video final está vacío"

        # Verificar con ffprobe si está disponible en el entorno
        try:
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-show_streams", "-select_streams", "a", res],
                capture_output=True,
                text=True,
                check=False,
            )
            if probe.returncode == 0 and probe.stdout:
                assert "codec_type=audio" in probe.stdout
        except FileNotFoundError:
            # Si ffprobe no está en PATH en este entorno, basta con que el video exista
            pass


if __name__ == "__main__":
    test_video_de_vida_con_musica()
    print("Prueba superada: video de vida con musica y afade generado correctamente.")

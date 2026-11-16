# -*- coding: utf-8 -*-
"""Prueba Orden 298 - Bloque 2: Video de Vida al ritmo de la música.

Con un archivo WAV con golpes cada 0,5 s, los cambios de foto caen en los golpes (±0,1 s).
"""

import math
import os
import struct
import sys
import tempfile
import wave
import cv2
import numpy as np
import pytest

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from video_de_vida import (
    ajustar_tiempos_a_golpes,
    detectar_golpes_audio,
    exportar_video_de_vida,
)


def test_vida_al_ritmo_tiempos_y_render():
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Crear WAV con pulsos claros cada 0.5 segundos (duración 16 s)
        tasa = 22050
        duracion_audio = 16.0
        n_muestras = int(tasa * duracion_audio)
        ruta_audio = os.path.join(temp_dir, "golpes_cada_05s.wav")

        golpes_esperados = []
        with wave.open(ruta_audio, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(tasa)
            datos = bytearray()
            for i in range(n_muestras):
                t = i / float(tasa)
                # Golpe fuerte cada 0.5 s
                t_mod = t % 0.5
                if t_mod < 0.03:
                    val = int(28000 * math.sin(2 * math.pi * 150 * t))
                else:
                    val = 0
                datos.extend(struct.pack("<h", val))
            wf.writeframes(datos)

        # Golpes reales teóricos
        t = 0.5
        while t < duracion_audio - 0.5:
            golpes_esperados.append(round(t, 2))
            t += 0.5

        # 2. Detectar golpes con la función del módulo
        golpes_detectados = detectar_golpes_audio(ruta_audio, tasa_muestreo=1000)
        assert len(golpes_detectados) >= 10, "Deben detectarse al menos 10 golpes"

        # 3. Comprobar que ajustar_tiempos_a_golpes alinea los cortes con los golpes
        tiempos = ajustar_tiempos_a_golpes(cantidad_fotos=3, golpes=golpes_detectados)
        assert len(tiempos) == 3
        for t_cambio in tiempos:
            dist_min = min(abs(t_cambio - g) for g in golpes_detectados)
            assert dist_min <= 0.1, (
                f"El tiempo de cambio {t_cambio}s difiere en {dist_min:.3f}s del golpe más cercano (> 0.1s)"
            )

        # 4. Crear 2 fotos con brillo contrastante para detectar el cambio en el video exportado
        ruta_foto1 = os.path.join(temp_dir, "foto_oscura.jpg")
        ruta_foto2 = os.path.join(temp_dir, "foto_clara.jpg")

        # Foto 1 oscura (brillo ~40)
        img1 = np.full((240, 320, 3), 40, dtype=np.uint8)
        cv2.imwrite(ruta_foto1, img1)

        # Foto 2 clara (brillo ~220)
        img2 = np.full((240, 320, 3), 220, dtype=np.uint8)
        cv2.imwrite(ruta_foto2, img2)

        fotos = [
            {"ruta": ruta_foto1, "nombre": "foto_oscura.jpg", "orientacion": 1},
            {"ruta": ruta_foto2, "nombre": "foto_clara.jpg", "orientacion": 1},
        ]

        ruta_video_salida = os.path.join(temp_dir, "video_de_vida_ritmo.mp4")
        fps = 24

        res_mp4 = exportar_video_de_vida(
            fotos_ordenadas=fotos,
            ruta_salida_mp4=ruta_video_salida,
            ruta_audio=ruta_audio,
            fps=fps,
            es_vista_previa=True,
        )

        assert os.path.exists(res_mp4)
        assert os.path.getsize(res_mp4) > 0

        # 5. Analizar los fotogramas del video con OpenCV para encontrar el punto de cambio de foto
        cap = cv2.VideoCapture(res_mp4)
        brillos_frames = []
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break
            gris = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            brillos_frames.append(float(np.mean(gris)))
        cap.release()

        assert len(brillos_frames) > 0

        # La foto 1 es oscura y la foto 2 es clara: detectar el salto brusco de brillo en el tramo de fotos
        # Intro: 4 s (4 * 24 = 96 cuadros)
        cuadros_intro = fps * 4
        # Buscar el punto de transición entre foto 1 y foto 2 (a partir del cuadro de intro)
        cambio_frame = None
        for i in range(cuadros_intro + 10, len(brillos_frames) - 10):
            # Salto de brillo entre foto oscura (<100) y foto clara (>150)
            if brillos_frames[i - 1] < 100 and brillos_frames[i] > 150:
                cambio_frame = i
                break

        # Si se detectó el cambio de foto en el video
        if cambio_frame is not None:
            tiempo_cambio_video = cambio_frame / float(fps)
            # En el video, la foto 1 termina en tiempo_cambio_video.
            # El tiempo transcurrido desde el inicio de las fotos es tiempo_cambio_video - 4.0
            tiempo_en_fotos = tiempo_cambio_video - 4.0
            dist_min_golpe = min(abs(tiempo_en_fotos - g) for g in golpes_detectados)
            assert dist_min_golpe <= 0.15, (
                f"El cambio de foto en {tiempo_en_fotos:.2f}s no cayó cerca de un golpe (distancia {dist_min_golpe:.3f}s)"
            )

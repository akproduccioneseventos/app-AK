# -*- coding: utf-8 -*-
"""Pruebas unitarias Bloque 2 Orden 330 — Fotos del fotógrafo al índice de caras (@vladmandic/face-api)."""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
DIR_HERRAMIENTA = os.path.abspath(os.path.join(DIR_ACTUAL, ".."))
if DIR_HERRAMIENTA not in sys.path:
    sys.path.insert(0, DIR_HERRAMIENTA)

from wfolio import (
    DIMENSION_VECTOR_FACE_API,
    MODELO_FACE_API,
    armar_paquete_caras_fotografo,
    extraer_vectores_caras_face_api,
    generar_miniatura_wfolio,
    subir_a_wfolio,
)


def _crear_foto_pil(ruta: Path, ancho: int = 1600, alto: int = 1200, color=(150, 170, 210)) -> Path:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (ancho, alto), color=color)
    img.save(ruta, format="JPEG", quality=90)
    return ruta


def _vector_simulado(semilla: float) -> list[float]:
    return [round(semilla + (i * 0.001), 6) for i in range(DIMENSION_VECTOR_FACE_API)]


class _WfolioEndpointBasico:
    def __init__(self):
        self.archivos_por_carpeta = {}

    def configurar_proyecto(self, config):
        return {"url": "https://wfolio.com/my/disk/privado/fiesta-orden-330", "acepta_videos": True}

    def subir(self, foto_path, carpeta, fiesta_nombre):
        nombre = os.path.basename(foto_path)
        tam = os.path.getsize(foto_path) if os.path.exists(foto_path) else 0
        self.archivos_por_carpeta.setdefault(carpeta, {})[nombre] = tam
        return {
            "status": "ok",
            "comprobado": True,
            "url": "https://wfolio.com/my/disk/privado/fiesta-orden-330",
        }

    def listar_carpeta(self, carpeta, fiesta_nombre):
        return self.archivos_por_carpeta.get(carpeta, {})


class TestCarasFotografoOrden330(unittest.TestCase):
    def test_tres_fotos_genera_miniaturas_y_paquete_compatible_con_face_api(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            foto_exterior = _crear_foto_pil(base / "album" / "exterior_01.jpg", 1800, 1200, (190, 200, 210))
            foto_torta = _crear_foto_pil(base / "album" / "torta_01.jpg", 1200, 1600, (140, 120, 100))
            foto_fiesta = _crear_foto_pil(base / "album" / "fiesta_01.jpg", 640, 480, (120, 160, 200))

            llamadas_extractor = []

            def extractor_simulado(ruta_foto: str):
                llamadas_extractor.append(ruta_foto)
                nombre = os.path.basename(ruta_foto)
                if "exterior" in nombre:
                    return [_vector_simulado(0.1), _vector_simulado(0.2)]
                if "torta" in nombre:
                    return [_vector_simulado(0.3)]
                return [_vector_simulado(0.4)]

            fotos_subidas = [
                {
                    "ruta": str(foto_exterior),
                    "wfolioUrl": "https://wfolio.com/my/disk/privado/album/ext-01",
                },
                {
                    "ruta": str(foto_torta),
                    "wfolio_url": "https://wfolio.com/my/disk/privado/album/torta-01",
                },
                {
                    "ruta": str(foto_fiesta),
                    "wfolioUrl": "https://wfolio.com/my/disk/privado/album/fiesta-01",
                },
            ]

            salida = base / "salida_caras"
            resultado = armar_paquete_caras_fotografo(
                fotos_subidas=fotos_subidas,
                carpeta_salida=salida,
                extractor_fn=extractor_simulado,
            )

            self.assertEqual(len(llamadas_extractor), 3)
            self.assertEqual(resultado["modelo"], MODELO_FACE_API)
            self.assertEqual(resultado["dimension"], 128)
            self.assertEqual(resultado["total_fotos"], 3)
            self.assertEqual(resultado["total_caras"], 4)

            ruta_json = Path(resultado["archivo_json"])
            self.assertTrue(ruta_json.is_file())
            self.assertEqual(ruta_json.name, "caras_fotografo.json")

            with open(ruta_json, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.assertEqual(data["modelo"], "@vladmandic/face-api")
            self.assertEqual(data["totalFotos"], 3)
            self.assertEqual(data["totalCaras"], 4)
            self.assertEqual(len(data["fotos"]), 3)

            momentos_esperados = ["Exterior", "Torta", "Fiesta"]
            urls_esperadas = [
                "https://wfolio.com/my/disk/privado/album/ext-01",
                "https://wfolio.com/my/disk/privado/album/torta-01",
                "https://wfolio.com/my/disk/privado/album/fiesta-01",
            ]

            for entrada, momento_esp, url_esp in zip(data["fotos"], momentos_esperados, urls_esperadas):
                self.assertEqual(entrada["wfolioUrl"], url_esp)
                self.assertEqual(entrada["momentTag"], momento_esp)
                self.assertTrue(entrada["fotoId"])
                self.assertTrue(entrada["archivo"])

                ruta_mini = Path(entrada["miniatura"])
                self.assertTrue(ruta_mini.is_file())
                with Image.open(ruta_mini) as mini_img:
                    self.assertLessEqual(max(mini_img.size), 800)

                self.assertGreaterEqual(len(entrada["vectores"]), 1)
                self.assertEqual(len(entrada["vectores"]), len(entrada["caras"]))
                for vec, cara_obj in zip(entrada["vectores"], entrada["caras"]):
                    self.assertEqual(len(vec), 128)
                    self.assertTrue(all(isinstance(n, float) for n in vec))
                    self.assertEqual(cara_obj["vector"], vec)

    def test_normaliza_todos_los_momentos_via_clasificar_escena(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            rutas = [
                (_crear_foto_pil(base / "exterior_01.jpg", 900, 600), "Exterior"),
                (_crear_foto_pil(base / "entrada_01.jpg", 900, 600), "Entrada"),
                (_crear_foto_pil(base / "vals_01.jpg", 900, 600), "Vals"),
                (_crear_foto_pil(base / "torta_01.jpg", 900, 600), "Torta"),
                (_crear_foto_pil(base / "fiesta_01.jpg", 900, 600), "Fiesta"),
                (_crear_foto_pil(base / "sin_etiqueta_99.jpg", 900, 600, (130, 140, 150)), "Fiesta"),
            ]

            res = armar_paquete_caras_fotografo(
                fotos_subidas=[
                    {"ruta": str(r), "wfolioUrl": f"https://wfolio.com/f/{i}"}
                    for i, (r, _) in enumerate(rutas)
                ],
                carpeta_salida=base / "out",
                extractor_fn=lambda _ruta: [_vector_simulado(0.5)],
            )

            obtenidos = [f["momentTag"] for f in res["fotos"]]
            esperados = [esp for _, esp in rutas]
            self.assertEqual(obtenidos, esperados)

    def test_descarta_vectores_que_no_miden_128_floats(self):
        with tempfile.TemporaryDirectory() as tmp:
            foto = _crear_foto_pil(Path(tmp) / "exterior_test.jpg", 1000, 800)
            vector_valido = _vector_simulado(0.25)

            def extractor_con_invalidos(_ruta: str):
                return [
                    [0.1] * 64,              # Muy corto -> descartar
                    [0.2] * 129,             # Muy largo -> descartar
                    ["no-num"] * 128,        # No numérico -> descartar
                    [float("nan")] * 128,    # NaN -> descartar
                    [True] * 128,            # Booleanos -> descartar
                    vector_valido,           # Válido (128 floats)
                ]

            vectores = extraer_vectores_caras_face_api(foto, extractor_fn=extractor_con_invalidos)
            self.assertEqual(len(vectores), 1)
            self.assertEqual(len(vectores[0]), 128)
            self.assertEqual(vectores[0], vector_valido)

            paquete = armar_paquete_caras_fotografo(
                fotos_subidas=[{"ruta": str(foto), "wfolioUrl": "https://wfolio.com/x"}],
                carpeta_salida=Path(tmp) / "out",
                extractor_fn=extractor_con_invalidos,
            )
            self.assertEqual(paquete["total_caras"], 1)
            self.assertEqual(len(paquete["fotos"][0]["vectores"]), 1)

    def test_generar_miniatura_respeta_exif_orientation(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            origen = base / "vertical_exif.jpg"
            # Imagen 1600x800 con etiqueta EXIF Orientation=6 (rotada 90° -> al transponer pasa a 800x1600)
            img = Image.new("RGB", (1600, 800), color=(200, 100, 50))
            exif = img.getexif()
            exif[274] = 6  # Orientation: Rotate 90 CW
            img.save(origen, format="JPEG", exif=exif)

            mini = generar_miniatura_wfolio(origen, base / "minis", max_lado=800)
            self.assertTrue(mini.is_file())
            with Image.open(mini) as out_img:
                ancho, alto = out_img.size
                self.assertLessEqual(max(ancho, alto), 800)
                self.assertEqual((ancho, alto), (400, 800))

    def test_subir_a_wfolio_no_cae_si_falla_indice_caras(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            carpeta_album = base / "album"
            _crear_foto_pil(carpeta_album / "Exterior" / "ext_01.jpg", 1000, 800)
            _crear_foto_pil(carpeta_album / "Fiesta" / "fiesta_01.jpg", 1000, 800)

            def extractor_que_falla(_ruta: str):
                raise RuntimeError("Sin modelos locales")

            res = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Valentina",
                endpoint_simulado=_WfolioEndpointBasico(),
                ruta_db=str(base / "proyecto.sqlite"),
                generar_indice_caras=True,
                extractor_caras_fn=extractor_que_falla,
            )

            self.assertTrue(res["exito"])
            self.assertEqual(res["total_subidas"], 2)
            self.assertIsNone(res["caras_fotografo"])
            self.assertTrue(any("Índice de caras del fotógrafo omitido" in a for a in res["avisos"]))
            self.assertIn("Índice de caras del fotógrafo omitido", res["mensaje"])

    def test_subir_a_wfolio_genera_paquete_caras_cuando_se_solicita(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            carpeta_album = base / "album"
            _crear_foto_pil(carpeta_album / "Exterior" / "ext_01.jpg", 1200, 900)
            _crear_foto_pil(carpeta_album / "Torta y velas" / "torta_01.jpg", 1200, 900)
            _crear_foto_pil(carpeta_album / "Fiesta" / "fiesta_01.jpg", 1200, 900)

            res = subir_a_wfolio(
                ruta_carpetas=carpeta_album,
                fiesta_nombre="Valentina",
                endpoint_simulado=_WfolioEndpointBasico(),
                ruta_db=str(base / "proyecto.sqlite"),
                generar_indice_caras=True,
                extractor_caras_fn=lambda _ruta: [_vector_simulado(0.7)],
            )

            self.assertTrue(res["exito"])
            self.assertEqual(res["total_subidas"], 3)
            paquete = res["caras_fotografo"]
            self.assertIsNotNone(paquete)
            self.assertEqual(paquete["total_fotos"], 3)
            self.assertEqual(paquete["total_caras"], 3)
            self.assertTrue(os.path.isfile(paquete["archivo_json"]))
            momentos = {f["momentTag"] for f in paquete["fotos"]}
            self.assertEqual(momentos, {"Exterior", "Torta", "Fiesta"})
            for foto in paquete["fotos"]:
                self.assertEqual(foto["wfolioUrl"], "https://wfolio.com/my/disk/privado/fiesta-orden-330")
                with Image.open(foto["miniatura"]) as mini:
                    self.assertLessEqual(max(mini.size), 800)


if __name__ == "__main__":
    unittest.main()

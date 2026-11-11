"""Todo el programa tiene que abrir con el Python que instala `instalar.bat` (3.11).

Pasó el 11/11/2026: una f-string con barra invertida (válida recién en Python 3.12) hacía que el programa no
arrancara, y las pruebas daban verde porque ninguna importaba ese archivo. Esta prueba compila todos.
"""
import os
import py_compile

DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_todos_los_modulos_compilan():
    modulos = [f for f in os.listdir(DIR) if f.endswith(".py")]
    assert "app.py" in modulos
    for nombre in modulos:
        py_compile.compile(os.path.join(DIR, nombre), doraise=True)


def test_la_app_importa_entera():
    import importlib
    import sys
    sys.path.insert(0, DIR)
    importlib.import_module("app")

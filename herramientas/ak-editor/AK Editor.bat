@echo off
chcp 65001 >nul
title AK Editor Inteligente

echo ========================================================
echo           AK PRODUCCIONES - AK Editor Inteligente
echo ========================================================
echo.
echo Iniciando el editor local...

cd /d "%~dp0"

set PYTHON_CMD=python
if exist ".venv\Scripts\python.exe" (
    set PYTHON_CMD=".venv\Scripts\python.exe"
)

start "" http://localhost:8765
%PYTHON_CMD% app.py

if errorlevel 1 (
    echo.
    echo [!] Hubo un problema al arrancar AK Editor.
    echo Probá ejecutar instalar.bat de nuevo.
    pause
)

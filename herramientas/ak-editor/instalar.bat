@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Instalador de AK Editor Inteligente

echo ========================================================
echo        INSTALADOR DE AK EDITOR INTELIGENTE - AK
echo ========================================================
echo.
echo Che, vamos a dejar todo listo para editar tus fiestas en un toque.
echo.

cd /d "%~dp0"

:: 1. Verificar Python
echo [1/4] Comprobando Python...
where python >nul 2>&1
if errorlevel 1 (
    echo No encontramos Python en tu equipo. Bajando e instalando con winget...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo.
        echo [ERROR] No se pudo bajar Python: revisá que haya internet en la máquina.
        pause
        exit /b 1
    )
    echo Python instalado joya.
) else (
    echo Python ya está instalado.
)

:: 2. Verificar FFmpeg
echo.
echo [2/4] Comprobando FFmpeg para procesar videos...
where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo No encontramos FFmpeg en tu equipo. Bajando con winget...
    winget install Gyan.FFmpeg --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo.
        echo [ERROR] No se pudo bajar FFmpeg: revisá que haya internet en la máquina.
        pause
        exit /b 1
    )
    echo FFmpeg instalado con éxito.
) else (
    echo FFmpeg ya está listo.
)

:: 3. Instalar librerías
echo.
echo [3/4] Instalando paquetes y librerías necesarias...
if not exist ".venv" (
    echo Creando entorno virtual aislado...
    python -m venv .venv
)

if exist ".venv\Scripts\python.exe" (
    set "PY_EXE=.venv\Scripts\python.exe"
) else (
    set "PY_EXE=python"
)

%PY_EXE% -m pip install --upgrade pip >nul 2>&1
%PY_EXE% -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] No se pudieron instalar las librerías: revisá que haya internet.
    pause
    exit /b 1
)

:: 4. Crear acceso directo en el escritorio
echo.
echo [4/4] Creando el acceso directo en tu Escritorio...
set "SCRIPT_BAT=%~dp0AK Editor.bat"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP_DIR%\AK Editor.lnk"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%SCRIPT_BAT%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'AK Editor Inteligente - AK Producciones'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo ¡Acceso directo "AK Editor" creado en el Escritorio!
) else (
    echo No se pudo crear el ícono en el escritorio, pero podés abrirlo desde AK Editor.bat.
)

echo.
echo ========================================================
echo           ¡TODO LISTO Y PRONTO PARA USAR!
echo ========================================================
echo Ya podés abrir "AK Editor" desde tu escritorio.
echo Presioná cualquier tecla para salir...
pause >nul

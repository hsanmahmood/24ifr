@echo off
setlocal

set "ROOT=%~dp0"
set "PYTHON=%ROOT%.venv\Scripts\python.exe"

if exist "%PYTHON%" (
    set "PYEXE=%PYTHON%"
) else (
    set "PYEXE=python"
)

cd /d "%ROOT%backend"
"%PYEXE%" -m waitress --port=5000 app.app:app
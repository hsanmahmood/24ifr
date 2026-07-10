@echo off
setlocal

set "ROOT=%~dp0"
set "LOGDIR=%ROOT%.dev-logs"

if not exist "%LOGDIR%" (
    mkdir "%LOGDIR%"
)

start "24ifr" /b /D "%ROOT%frontend\24ifr" cmd /c ""npm run dev > "%LOGDIR%\frontend-main.log" 2>&1""
start "admin" /b /D "%ROOT%frontend\admin" cmd /c ""npm run dev > "%LOGDIR%\frontend-admin.log" 2>&1""

echo Frontends started.
echo Logs: %LOGDIR%
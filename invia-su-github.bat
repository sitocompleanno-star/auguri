@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Invio su GitHub
cd /d "%~dp0"

echo ============================================
echo   Invio modifiche su GitHub
echo ============================================
echo.

where git >nul 2>&1
if errorlevel 1 goto nogitinstallato

if not exist ".git" goto norepo

echo Cartella: %cd%
echo.
echo Modifiche trovate:
git status --short
echo.

set "CAMBI="
for /f "delims=" %%i in ('git status --porcelain') do set "CAMBI=1"
if not defined CAMBI goto nessunacosa

rem Fase 7: se Node c'e, controlla foto e frasi prima di inviare (un errore bloccherebbe la pubblicazione)
where npm >nul 2>&1
if errorlevel 1 goto saltacontrollo
if not exist "node_modules" goto saltacontrollo
echo Controllo foto e frasi...
call npm run --silent contenuti
if errorlevel 1 goto contenutisbagliati
echo.
:saltacontrollo

set "MSG="
set /p "MSG=Descrizione delle modifiche (invio per messaggio automatico): "
if not defined MSG set "MSG=Aggiornamento %date% %time:~0,5%"
set "MSG=!MSG:"='!"

echo.
echo [1/3] Preparo i file...
git add -A
if errorlevel 1 goto errore

echo [2/3] Salvo le modifiche...
git commit -m "!MSG!"
if errorlevel 1 goto errore

echo [3/3] Invio a GitHub...
git push
if errorlevel 1 goto pushrifiutato
goto ok

:pushrifiutato
echo.
echo Push rifiutato: provo ad allinearmi con GitHub e riprovo...
git pull --rebase
if errorlevel 1 goto errore
git push
if errorlevel 1 goto errore
goto ok

:ok
echo.
echo ============================================
echo   Fatto! Tra circa un minuto il sito si aggiorna.
echo   Puoi controllare lo stato nella scheda Actions del repository.
echo ============================================
pause
exit /b 0

:nessunacosa
echo Nessuna modifica da inviare.
pause
exit /b 0

:contenutisbagliati
echo.
echo Foto o frasi da correggere (vedi sopra): non invio niente, cosi il sito resta com'e.
pause
exit /b 1

:nogitinstallato
echo Git non risulta installato oppure non e nel PATH.
echo Installalo da https://git-scm.com e riapri questo file.
pause
exit /b 1

:norepo
echo Questa cartella non e un repository Git.
echo Metti questo file nella cartella principale del progetto, quella che contiene la cartella nascosta .git
pause
exit /b 1

:errore
echo.
echo ERRORE: l'operazione si e fermata. Leggi il messaggio qui sopra.
echo Se serve, copialo e incollalo nella chat.
pause
exit /b 1

@echo off
setlocal
chcp 65001 >nul
title Aggiungi foto e frasi
cd /d "%~dp0"

echo ============================================
echo   Aggiungi foto e frasi al sito
echo ============================================
echo.
echo  Foto:  mettile nella cartella  foto-da-aggiungere
echo  Frasi: scrivile nel file       frasi-da-aggiungere.txt  (testo ^| autore)
echo.

where npm >nul 2>&1
if errorlevel 1 goto nonode
if not exist "node_modules" (
  echo Installo le dipendenze, solo la prima volta...
  call npm install
  if errorlevel 1 goto errore
)

echo [1/3] Foto
call npm run --silent foto
if errorlevel 1 goto errore
echo.
echo [2/3] Frasi
call npm run --silent frasi
if errorlevel 1 goto errore
echo.
echo [3/3] Controllo
call npm run --silent contenuti
if errorlevel 1 goto errore

echo.
echo ============================================
echo   Fatto. Per pubblicare: invia-su-github.bat
echo ============================================
pause
exit /b 0

:nonode
echo Node.js non risulta installato: scaricalo da https://nodejs.org e riapri questo file.
pause
exit /b 1

:errore
echo.
echo Qualcosa va corretto: leggi il messaggio qui sopra, sistema e rilancia.
pause
exit /b 1

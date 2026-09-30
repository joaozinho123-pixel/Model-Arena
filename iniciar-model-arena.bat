@echo off
setlocal
chcp 65001 >nul
title Model Arena - Servidor local

REM Roda na pasta do projeto (este .bat fica ao lado do package.json)
cd /d "%~dp0"

if not exist "package.json" (
  echo [ERRO] package.json nao encontrado em: %CD%
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js/npm nao encontrado. Instale o Node.js LTS em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias - primeira execucao, pode demorar...
  call npm install
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando o Model Arena em http://localhost:3000 ...
echo Nao feche esta janela enquanto usar o site. Pressione Ctrl+C para parar.
start "" "http://localhost:3000"
call npm run dev -- --port 3000
pause

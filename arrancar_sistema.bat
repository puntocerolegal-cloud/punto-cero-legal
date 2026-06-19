@echo off
echo ============================================
echo   Iniciando Punto Cero System OS...
echo ============================================

:: -------------------------------------------------------------
:: 1) MongoDB: si el servicio existe, lo arranca (o ya esta activo).
::    Si NO esta instalado como servicio, advierte y CONTINUA.
::    Se usan operadores &&/|| para evitar el bug de %errorlevel%
::    dentro de bloques entre parentesis.
:: -------------------------------------------------------------
echo.
echo [1/3] Verificando MongoDB...
sc query MongoDB >nul 2>&1 && (
    net start MongoDB >nul 2>&1
    echo     MongoDB disponible ^(iniciado o ya en ejecucion^).
) || (
    echo     [ADVERTENCIA] El servicio "MongoDB" no esta instalado.
    echo                   El sistema continuara sin base de datos local
    echo                   ^(arranca Mongo manualmente o por Docker si la necesitas^).
)

:: -------------------------------------------------------------
:: 2) Backend FastAPI (entrypoint real: server.py -> app)
:: -------------------------------------------------------------
echo.
echo [2/3] Iniciando Backend FastAPI (puerto 8000)...
start "Backend FastAPI" cmd /k "cd /d C:\Users\darwi\Documents\punto-cero-legal\backend && .venv\Scripts\activate && uvicorn server:app --reload --port 8000"

:: -------------------------------------------------------------
:: 3) Frontend React: si NO existe node_modules, instala antes de arrancar.
:: -------------------------------------------------------------
echo.
echo [3/3] Iniciando Frontend React (puerto 3000)...
start "Frontend React" cmd /k "cd /d C:\Users\darwi\Documents\punto-cero-legal\frontend && (if not exist node_modules (echo Instalando dependencias por primera vez... && npm install)) && npm start"

echo.
echo ============================================
echo   Sistema iniciado.
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo ============================================
pause

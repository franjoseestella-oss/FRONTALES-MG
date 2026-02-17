@echo off
TITLE Roboflow Application Launcher
CLS
ECHO.
ECHO ========================================================
ECHO    INITIATING ROBOFLOW APPLICATION
ECHO ========================================================
ECHO.

:: Ensure we are in the correct directory (where the bat file is)
PUSHD "%~dp0"

:: 1. START BACKEND PYTHON SERVER
ECHO [1/3] Starting Python Inference Server...
IF EXIST "run_backend.bat" (
    START "Roboflow Backend" /D "%~dp0" cmd /k "run_backend.bat"
) ELSE (
    ECHO ERROR: run_backend.bat not found!
    PAUSE
    EXIT
)

:: Wait 3 seconds for backend to init
TIMEOUT /T 3 /NOBREAK > NUL

:: 2. START FRONTEND VITE SERVER
ECHO [2/3] Starting Frontend React Server...
IF EXIST "package.json" (
    :: Check if node_modules exists, otherwise install
    IF NOT EXIST "node_modules" (
        ECHO Installing dependencies (first run)...
        CALL npm install
    )
    :: Start specific command in new window, ensuring dependencies run
    START "Roboflow Frontend" /D "%~dp0" cmd /k "npm run dev || PAUSE"
) ELSE (
    ECHO ERROR: package.json not found! Are you in the right directory?
    PAUSE
    EXIT
)

:: Wait 10 seconds for frontend to build
TIMEOUT /T 10 /NOBREAK > NUL

:: 3. OPEN BROWSER
ECHO [3/3] Opening Application in Browser...
:: Use specific command to ensure default browser opens
START "" "http://127.0.0.1:3000"

ECHO.
ECHO ========================================================
ECHO    APPLICATION RUNNING SUCCESSFULLY
ECHO    Do not close the console windows.
ECHO ========================================================
TIMEOUT /T 5 > NUL

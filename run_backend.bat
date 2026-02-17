@echo off
TITLE Roboflow Backend Server
COLOR 0A
ECHO.
ECHO ========================================================
ECHO    STARTING BACKEND SERVER
ECHO ========================================================
ECHO.

:: Ensure we are in the correct directory
CD /D "%~dp0"

:: Check dependencies
ECHO [1/3] Checking Python Dependencies...
python local_inference/check_imports.py
IF %ERRORLEVEL% NEQ 0 (
    ECHO ERROR: Missing dependencies!
    PAUSE
    EXIT /B
)

:: Test Database Connection
ECHO.
ECHO [2/3] Testing Database Connection...
python local_inference/check_db.py
IF %ERRORLEVEL% NEQ 0 (
    ECHO ERROR: Database Check Failed!
    PAUSE
    EXIT /B
)

:: Start Server
ECHO.
ECHO [3/3] Starting Flask Server...
python local_inference/server.py

:: If server crashes, keep window open
ECHO.
ECHO SERVER CRASHED OR STOPPED
PAUSE

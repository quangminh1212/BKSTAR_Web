@echo off
setlocal ENABLEDELAYEDEXPANSION

title "BKSTAR_Web - Development Server"
echo ==============================================
echo   BKSTAR_Web - Development Environment
echo ==============================================
echo.
echo Preparing development environment...
echo.
set "mode=1"

echo.
echo ==============================================

REM Detect Node
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Please install Node.js >= 18.18.0 then run this script again.
  echo.
  pause
  exit /b 1
)

REM Show Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js version: %NODE_VERSION%

REM Always install/update dependencies
echo [1/2] Installing dependencies...
call npm install --include=dev || (
  echo [WARN] npm install failed, trying again with npm ci...
  call npm ci --no-audit --no-fund || (
    echo [ERROR] Failed to install dependencies.
    echo.
    pause
    exit /b 1
  )
)
echo [INFO] Dependencies are up to date!

REM Always start quick dev mode
goto QUICK_DEV

:QUICK_DEV
echo [INFO] Starting Quick Development Mode...
echo [2/2] Checking port availability...

REM Check if port 5173 is available
netstat -an | find "127.0.0.1:5173" >nul 2>nul
if not errorlevel 1 (
  echo [WARN] Port 5173 is already in use!
  echo [INFO] Vite will automatically find an available port...
)

echo.
echo ==============================================
echo   🚀 STARTING DEVELOPMENT SERVER
echo ==============================================
echo [INFO] Mode: Quick Development
echo [INFO] URL will be displayed below...
echo [INFO] Press Ctrl+C to stop the server
echo.


REM Auto sync latest content (non-blocking)
echo [SYNC] Syncing latest content to local...
call npm run sync:wp || (
  echo [WARN] Content sync failed. Continuing with existing local content...
)

echo Launching development server...
echo.
call npm run dev -- --open

goto END

:FULL_BUILD
echo [INFO] Starting Full Build Mode...
echo [2/3] Creating snapshot and building...

REM Create fresh snapshot and inject theme/dark mode override
if exist public\snapshot (
  echo   Cleaning old snapshot directory...
  attrib -R -A -S -H /S /D public\snapshot\* >nul 2>nul
  del /f /s /q public\snapshot\* >nul 2>nul
  rmdir /s /q public\snapshot >nul 2>nul
  powershell -NoProfile -Command "Try { Remove-Item -LiteralPath 'public/snapshot' -Recurse -Force -ErrorAction Stop } Catch { }" >nul 2>nul
)

call npm run snapshot || (
  echo [ERROR] Snapshot step failed.
  echo.
  pause
  exit /b 1
)

node scripts/preview-inject-override.js || (
  echo [ERROR] Inject override failed.
  echo.
  pause
  exit /b 1
)

REM Build
call npm run build || (
  echo [ERROR] Build failed.
  echo.
  pause
  exit /b 1
)

REM Install Playwright Chromium quietly (optional)
npm run playwright:install >nul 2>nul

echo.
echo ==============================================
echo   🚀 STARTING PREVIEW SERVER
echo ==============================================
echo [INFO] Mode: Full Build + Preview
echo [INFO] URL: http://127.0.0.1:5173/snapshot/index-snapshot.html
echo [INFO] Press Ctrl+C to stop the server
echo.

echo [3/3] Launching preview server...
call npm start

:END
echo.
echo ==============================================
echo   ✅ Server stopped
echo ==============================================
echo.
endlocal
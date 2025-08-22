@echo off
setlocal ENABLEDELAYEDEXPANSION

title BKSTAR_Web - Setup & Preview
echo ==============================================
echo   BKSTAR_Web - Install, Snapshot, Build, Preview
echo ==============================================

REM Detect Node
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Please install Node.js >= 18.18.0 then run this script again.
  pause
  exit /b 1
)

REM Use CI-friendly install to match lockfile
echo [1/5] Installing dependencies (including dev)...
npm install --include=dev || (
  echo [WARN] npm install failed, trying again with npm ci...
  npm ci --no-audit --no-fund || (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
  )
)

REM Create fresh snapshot and inject theme/dark mode override
echo [2/5] Creating snapshot and injecting theme override...
call npm run snapshot || (
  echo [ERROR] Snapshot step failed.
  pause
  exit /b 1
)
node scripts/preview-inject-override.js || (
  echo [ERROR] Inject override failed.
  pause
  exit /b 1
)

REM Build
echo [3/5] Building project...
call npm run build || (
  echo [ERROR] Build failed.
  pause
  exit /b 1
)

REM Install Playwright Chromium quietly (optional)
echo [4/5] (Optional) Installing Playwright Chromium...
call npm run playwright:install >nul 2>nul

REM Preview on strict port 5173
echo [5/5] Starting preview at http://127.0.0.1:5173/snapshot/index-snapshot.html
echo Press Ctrl+C in this window to stop the server.
call npm run preview -- --strictPort --host 127.0.0.1 --port 5173

endlocal


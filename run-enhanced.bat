@echo off
setlocal ENABLEDELAYEDEXPANSION

title "BKSTAR_Web - Enhanced Dev Server"
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    BKSTAR_Web Enhanced Server                 ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  [1] Quick Start Dev Server (Recommended)                    ║
echo ║  [2] Dev Server with Port Detection                          ║
echo ║  [3] Dev Server with Auto Browser Open                       ║
echo ║  [4] Full Build + Preview Mode                               ║
echo ║  [5] Server Status Monitor                                   ║
echo ║  [6] Check Port Availability Only                            ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

set /p "choice=👉 Enter your choice (1-6, default: 1): "
if "%choice%"=="" set choice=1

echo.
echo ═══════════════════════════════════════════════════════════════

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo ❌ Node.js not found in PATH!
  echo 📥 Please install Node.js >= 18.18.0 from https://nodejs.org
  echo.
  pause
  exit /b 1
)

REM Show Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ℹ️  Node.js Version: %NODE_VERSION%
echo ℹ️  Working Directory: %CD%
echo.

REM Install dependencies if needed
if not exist "node_modules" (
  echo 📦 Installing dependencies...
  call npm install --silent || (
    echo ❌ Failed to install dependencies
    echo 💡 Try running: npm install --force
    pause
    exit /b 1
  )
  echo ✅ Dependencies installed successfully
  echo.
) else (
  echo ✅ Dependencies already available
)

REM Execute based on choice
if "%choice%"=="1" goto QUICK_START
if "%choice%"=="2" goto DEV_WITH_DETECTION
if "%choice%"=="3" goto DEV_WITH_BROWSER
if "%choice%"=="4" goto FULL_BUILD
if "%choice%"=="5" goto MONITOR_SERVER
if "%choice%"=="6" goto CHECK_PORT
goto QUICK_START

:QUICK_START
echo 🚀 Starting Quick Development Server...
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                        SERVER STARTING                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo 🌐 Default URL: http://localhost:5173
echo 🔥 Hot reload: Enabled
echo ⏹️  Stop server: Ctrl+C
echo.
call npm run dev
goto END_SUCCESS

:DEV_WITH_DETECTION
echo 🔍 Starting Development Server with Port Detection...
echo.
call node scripts/detect-server.js info
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                        SERVER STARTING                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
call npm run dev
goto END_SUCCESS

:DEV_WITH_BROWSER
echo 🌐 Starting Development Server with Auto Browser Open...
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                        SERVER STARTING                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo 🌐 Browser will open automatically...
echo ⏹️  Stop server: Ctrl+C
echo.
call npm run dev:open
goto END_SUCCESS

:FULL_BUILD
echo 🏗️  Starting Full Build + Preview Mode...
echo.
echo 📸 Creating snapshot...
if exist public\snapshot (
  echo 🧹 Cleaning old snapshot...
  rmdir /s /q public\snapshot >nul 2>nul
)

call npm run snapshot || (
  echo ❌ Snapshot creation failed
  pause
  exit /b 1
)

echo 🔧 Processing files...
node scripts/preview-inject-override.js || (
  echo ❌ File processing failed
  pause
  exit /b 1
)

echo 📦 Building project...
call npm run build || (
  echo ❌ Build failed
  pause
  exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                       PREVIEW SERVER                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo 🌐 Preview URL: http://localhost:5173/snapshot/index-snapshot.html
echo 📸 Mode: Snapshot Preview
echo ⏹️  Stop server: Ctrl+C
echo.
call npm start
goto END_SUCCESS

:MONITOR_SERVER
echo 👁️  Starting Server Status Monitor...
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                       SERVER MONITOR                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo 📊 Monitoring localhost:5173
echo ⏹️  Stop monitoring: Ctrl+C
echo.
call npm run server:monitor
goto END

:CHECK_PORT
echo 🔍 Checking Port Availability...
echo.
call npm run server:check
echo.
echo 💡 Port check completed!
echo 🔄 Run this script again to start the server
pause
goto END

:END_SUCCESS
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                       SERVER STOPPED                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo ✅ Server stopped successfully
echo 👋 Thank you for using BKSTAR_Web!

:END
echo.
pause
endlocal

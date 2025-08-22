@echo off
setlocal ENABLEDELAYEDEXPANSION

title "BKSTAR_Web - Quick Dev Server"
color 0A

echo.
echo ████████████████████████████████████████████
echo █          BKSTAR_Web Dev Server           █
echo ████████████████████████████████████████████
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo ❌ Node.js not found! Please install Node.js >= 18.18.0
  pause
  exit /b 1
)

REM Show system info
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ℹ️  Node.js: %NODE_VERSION%
echo ℹ️  Project: BKSTAR_Web
echo ℹ️  Mode: Development
echo.

REM Install dependencies if needed
if not exist "node_modules" (
  echo 📦 Installing dependencies...
  call npm install --silent || (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
  )
  echo ✅ Dependencies installed
  echo.
)

REM Check port availability
echo 🔍 Checking port availability...
netstat -an | find ":5173 " >nul 2>nul
if not errorlevel 1 (
  echo ⚠️  Port 5173 is busy - Vite will find another port
) else (
  echo ✅ Port 5173 is available
)

echo.
echo ████████████████████████████████████████████
echo █              STARTING SERVER             █
echo ████████████████████████████████████████████
echo.
echo 🌐 Server will start at: http://localhost:5173
echo 🔥 Hot reload enabled
echo 🛠️  Press Ctrl+C to stop
echo.

REM Start development server
call npm run dev

REM Cleanup message
echo.
echo ████████████████████████████████████████████
echo █              SERVER STOPPED              █
echo ████████████████████████████████████████████
echo.
echo 👋 Thanks for using BKSTAR_Web dev server!
echo.
pause

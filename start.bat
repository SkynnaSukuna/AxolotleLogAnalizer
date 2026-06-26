@echo off
chcp 65001 >nul
title AxolotleLogAnalyzer Launcher

echo ============================================
echo AxolotleLogAnalyzer
echo Desktop Log Analyzer
echo ============================================
echo.

cd /d "%~dp0app"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust not found!
    echo Install: https://rustup.rs/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo Rust version:
cargo --version
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
    echo Dependencies installed.
) else (
    echo Dependencies already installed.
)

echo.
echo Starting Tauri app...
echo First launch may take 30-90 seconds...
echo.

call npm run tauri dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start!
    pause
)

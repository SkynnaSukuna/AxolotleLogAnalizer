@echo off
cd /d "%~dp0..\.."
echo Starting AxolotleLogAnalyzer in dev mode...
start "AxolotleLogAnalyzer" cmd /c "cd /d "%~dp0.." && npm run tauri:dev"
timeout /t 3 >nul
exit

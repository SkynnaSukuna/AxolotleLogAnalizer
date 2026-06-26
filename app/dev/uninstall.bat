@echo off
chcp 65001 >nul
title AxolotleLogAnalyzer — Uninstaller

echo ============================================
echo   AxolotleLogAnalyzer — Полное удаление
echo ============================================
echo.
echo Будет удалено:
echo   ^(весь проект, включая:^)
echo     app\           — исходники и конфиги
echo     app\src-tauri\ — Rust бэкенд
echo     logs\          — файлы логов
echo     start.bat      — лаунчер
echo.
echo Сборки и кеш:
echo     target\        — Rust build cache
echo     node_modules\  — npm зависимости
echo     dist\          — фронтенд сборка
echo.
echo ВНИМАНИЕ: Это действие НЕОБРАТИМО!
echo.

set /p CONFIRM=Вы точно хотите удалить AxolotleLogAnalyzer? (y/n): 
if /i not "%CONFIRM%"=="y" (
    echo Отмена.
    pause
    exit /b 0
)

echo.
echo Завершаю процессы...
taskkill /f /im "axolotle_log_analyzer.exe" >nul 2>&1
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "cargo.exe" >nul 2>&1
timeout /t 2 >nul

echo Очищаю сборки Rust...
cd /d "%~dp0..\src-tauri"
cargo clean >nul 2>&1

echo Удаляю node_modules...
cd /d "%~dp0.."
if exist node_modules rmdir /s /q node_modules >nul 2>&1

echo Удаляю dist...
if exist dist rmdir /s /q dist >nul 2>&1

echo Удаляю кеш Vite...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite" >nul 2>&1

echo Удаляю logs...
cd /d "%~dp0..\.."
if exist logs rmdir /s /q logs >nul 2>&1

echo.
echo ============================================
echo  Удаление завершено. Папка будет удалена...
echo ============================================
echo.

cd /d %TEMP%

:: Создаём временный bat, который удалит корень проекта и сам удалится
set PROJECT_ROOT=%~dp0..\..
set CLEANUP_BAT=%TEMP%\axolotle_rm_%RANDOM%.bat

> "%CLEANUP_BAT%" echo @echo off
>>"%CLEANUP_BAT%" echo timeout /t 1 ^>nul
>>"%CLEANUP_BAT%" echo rmdir /s /q "%PROJECT_ROOT%\app"
>>"%CLEANUP_BAT%" echo del /q "%PROJECT_ROOT%\start.bat" 2^>nul
>>"%CLEANUP_BAT%" echo rmdir "%PROJECT_ROOT%" 2^>nul
>>"%CLEANUP_BAT%" echo del /q "%%~f0"

start /min "" "%CLEANUP_BAT%"

exit

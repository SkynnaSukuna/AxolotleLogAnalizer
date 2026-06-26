@echo off
cd /d "%~dp0.."
echo === TypeScript check ===
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo FAIL: TypeScript errors found
    pause
    exit /b %errorlevel%
)
echo OK
echo === Vite build ===
call npx vite build
if %errorlevel% neq 0 (
    echo FAIL: Vite build failed
    pause
    exit /b %errorlevel%
)
echo === All checks passed ===
pause

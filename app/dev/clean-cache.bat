@echo off
cd /d "%~dp0.."
echo === Cleaning Rust build cache ===
cd src-tauri
cargo clean
cd ..

echo === Cleaning Vite cache ===
if exist node_modules\.vite rmdir /s /q node_modules\.vite

echo === Cleaning dist ===
if exist dist rmdir /s /q dist

echo === Done ===
echo To rebuild: npm run tauri:build
echo To dev:     npm run tauri:dev
pause
